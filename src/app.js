import { signIn, getUser } from './auth';
import { getUserFragments, getFragmentById_API, postFragment_API } from './api';

async function init() {
  // Get UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const getFragmentByIdForm = document.querySelector('#getFragmentById');
  const getFragmentsBtn = document.querySelector('#getFragments');
  const getContainer = document.querySelector('#getContainer');
  const fragmentContainer = document.querySelector('#fragmentContainer');
  // Post Fragments UI Elements
  const postFragmentTxt = document.querySelector('#postFragmentTxt');
  const postContainer = document.querySelector('#postContainer');

  // Handle login
  loginBtn.onclick = () => signIn();

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

  // Fetch user fragments on button click
  getFragmentsBtn.onclick = async () => {
    let data = await getUserFragments(user);
    getContainer.innerText = data ? JSON.stringify(data, null, 2) : 'No fragments found';
  };

  // Handle fetching a fragment by ID
  if (getFragmentByIdForm) {
    getFragmentByIdForm.onsubmit = async (event) => {
      event.preventDefault();
      const fragmentId = event.target.elements[0].value;
      const data = await getFragmentById_API(user, fragmentId);
      fragmentContainer.innerText = data ? JSON.stringify(data, null, 2) : 'No fragments found';
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

      // Validate and map MIME type
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
      postContainer.innerText = response ? JSON.stringify(response.data.fragment.id, null, 2) : 'Error posting fragment';
    };
  }
}

// Wait for the DOM to be ready
addEventListener('DOMContentLoaded', init);
