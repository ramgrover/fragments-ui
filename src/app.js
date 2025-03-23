import { signIn, getUser } from './auth';
import { getUserFragments, getFragmentById_API, postFragment_API } from './api';

async function init() {
  // Get UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');
  const getFragmentByIdForm = document.querySelector('#getFragmentById');
  const getFragmentsBtn = document.querySelector('#getFragments');
  const getContainer = document.querySelector('#getContainer');
  const fragmentContainer = document.querySelector('#fragmentContainer');
  const postFragmentTxt = document.querySelector('#postFragmentTxt');
  const postContainer = document.querySelector('#postContainer');

  // Handle login
  loginBtn.onclick = () => signIn();

  // Handle logout (clears session storage & reloads)
  logoutBtn.onclick = () => {
    sessionStorage.clear();
    location.reload();
  };

  // Authenticate user
  const user = await getUser();
  if (!user) {
    getFragmentsBtn.disabled = true;
    if (getFragmentByIdForm) getFragmentByIdForm.querySelector('button').disabled = true;
    if (postFragmentTxt) postFragmentTxt.querySelector('button').disabled = true;
    return;
  }

  // Update UI for authenticated user
  userSection.hidden = false;
  userSection.querySelector('.username').innerText = user.username;
  loginBtn.disabled = true;
  logoutBtn.hidden = false;

  // Fetch user fragments on button click
  getFragmentsBtn.onclick = async () => {
    let data = await getUserFragments(user);
    getContainer.innerText = data.fragments 
      ? JSON.stringify(data.fragments, null, 2) 
      : 'No fragments found';
  };

  // Handle fetching a fragment by ID
  if (getFragmentByIdForm) {
    getFragmentByIdForm.onsubmit = async (event) => {
      event.preventDefault();
      const fragmentId = event.target.elements[0].value;
      const data = await getFragmentById_API(user, fragmentId);

      if (data) {
        const fragmentData = data.fragment || data;
        // Show the expanded fragment with all metadata
        fragmentContainer.innerHTML = `
          <div><strong>Fragment ID:</strong> ${fragmentData.id}</div>
          <div><strong>Name:</strong> ${fragmentData.name || 'Unnamed'}</div>
          <div><strong>Type:</strong> ${fragmentData.type}</div>
          <div><strong>Content:</strong> <pre>${fragmentData.value}</pre></div>
        `;
      } else {
        fragmentContainer.innerText = 'No fragment found for the given ID';
      }
    };
  }

  // Handle posting a new fragment
  if (postFragmentTxt) {
    postFragmentTxt.onsubmit = async (event) => {
      event.preventDefault();
      const fragmentText = event.target.querySelector('input').value;
      const fragmentType = event.target.querySelector('select').value;

      // Map known content types
      const mimeTypeMap = {
        text: 'text/plain',
        json: 'application/json',
        markdown: 'text/markdown',
        binary: 'application/octet-stream',
      };

      const validType = mimeTypeMap[fragmentType] || fragmentType;
      const validMimeTypes = Object.values(mimeTypeMap);
      if (!validMimeTypes.includes(validType)) {
        console.error('Invalid content type:', validType);
        postContainer.innerText = 'Error: Invalid content type!';
        return;
      }

      const toSend = { value: fragmentText, type: validType };
      console.log('Posting Fragment:', toSend);

      let response = await postFragment_API(user, toSend);

      // ✅ Check if response structure is correct
      if (response && response.data && response.data.id) {
        postContainer.innerText = `Fragment created with ID: ${response.data.id} and Name: ${response.data.name || 'Unnamed'}`;
      } else {
        postContainer.innerText = 'Error posting fragment';
      }
    };
  }
}

// Wait for the DOM to be ready
addEventListener('DOMContentLoaded', init);
