import yaml from 'js-yaml';
import { signIn, getUser } from './auth';
import {
  createNewFragment,
  getFragmentsExpanded,
  fetchFragmentById,
  deleteFragmentById,
  updateFragmentById,
  fetchConvertedFragmentById,
} from './api';

async function init() {
  // Get UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');
  const createForm = document.querySelector('#create-fragment-form');
  const fileInput = document.getElementById('fragment_file');
  const fragmentContentTextarea = document.getElementById('fragment-content');
  const fragmentTypeSelect = document.getElementById('fragment-type');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const refreshButton = document.querySelector('#refresh-fragments');
  const fragmentSelect = document.getElementById('fragmentSelect');
  const viewFragmentBtn = document.getElementById('viewFragmentBtn');
  const deleteFragmentBtn = document.getElementById('deleteFragmentBtn');
  const fragmentDisplay = document.getElementById('fragment-display');
  const fragmentsContainer = document.querySelector('#fragments-container');
  const editConvertContainer = document.getElementById('edit-convert-container');
  const editFragmentBtn = document.getElementById('editFragmentBtn');
  const convertFragmentBtn = document.getElementById('convertFragmentBtn');

  const fileState = { selectedFile: null, selectedType: 'text/plain' };

  // Handle login
  loginBtn.onclick = () => signIn();

  // Handle logout (clears session storage & reloads)
  logoutBtn.onclick = () => {
    sessionStorage.clear();
    location.reload();
  };


  const user = await getUser();
  if (!user) {
    console.log('No user is authenticated');
    if (logoutBtn) logoutBtn.disabled = true;
    return;
  }

  userSection.hidden = false;
  userSection.querySelector('.username').innerText = user.username;
  loginBtn.disabled = true;

  // Populate fragment list and dropdown
  async function updateFragmentsList() {
    try {
      const { fragments } = await getFragmentsExpanded(user);
      fragmentsContainer.innerHTML = fragments
        .map(
          (fragment) => `
          <div class="fragment" data-id="${fragment.id}">
            <div><b>ID:</b> ${fragment.id}</div>
            <div><b>Type:</b> ${fragment.type}</div>
            <div><b>Size:</b> ${fragment.size} bytes</div>
            <div><b>Created:</b> ${new Date(fragment.created).toLocaleString()}</div>
            <div><b>Updated:</b> ${new Date(fragment.updated).toLocaleString()}</div>
          </div><br/>
        `
        )
        .join('');
      populateFragmentDropdown(fragments);
    } catch (err) {
      console.error('Unable to update fragments list:', err);
    }
  }
  // Populate fragment list and dropdown
  async function populateFragmentDropdown(fragments) {
    fragmentSelect.innerHTML = '';
    fragments.forEach((fragment) => {
      const option = document.createElement('option');
      option.value = fragment.id;
      option.textContent = `${fragment.id} (${fragment.type}, ${fragment.size} bytes)`;
      fragmentSelect.appendChild(option);
    });
  }

  // Initial population of fragments
  await updateFragmentsList();

  // View fragment logic
  if (viewFragmentBtn) {
    //   viewFragmentBtn.addEventListener('click', async () => {
    //     const selectedFragmentId = fragmentSelect?.value;
    //     if (!selectedFragmentId) {
    //       alert('Please select a fragment to view.');
    //       return;
    //     }

    //     try {
    //       const { data, fragmentType } = await fetchFragmentById(user, selectedFragmentId);

    //       if (fragmentType.startsWith('image/')) {
    //         fragmentDisplay.innerHTML = `<img src="${data}" style="max-width: 100%; height: auto;" alt="Fragment Image">`;
    //       } else if (fragmentType === 'application/json') {
    //         fragmentDisplay.textContent = JSON.stringify(data, null, 2);
    //       } else {
    //         fragmentDisplay.textContent = data;
    //       }
    //     } catch (err) {
    //       console.error('Error fetching fragment:', err);
    //       alert('Failed to fetch fragment.');
    //     }
    //   });
    // }
    viewFragmentBtn.addEventListener('click', async () => {
      const selectedFragmentId = fragmentSelect.value;
      if (!selectedFragmentId) {
        alert('Please select a fragment to view.');
        return;
      }

      try {
        const response = await fetchFragmentById(user, selectedFragmentId);

        // Debugging log
        console.log('API Response:', response);

        if (!response || !response.data || !response.fragmentType) {
          throw new Error('Invalid response format from API');
        }

        const { data, fragmentType } = response;

        if (fragmentType.startsWith('application/json')) {
          try {
            // Extract the actual JSON data (response.data.data)
            console.log('Raw JSON Data:', data); // Debugging log
            const actualJsonData = data.data; // Extract nested JSON
            fragmentDisplay.innerHTML = `<pre>${JSON.stringify(actualJsonData, null, 2)}</pre>`;
          } catch (err) {
            console.error('Failed to display JSON:', err);
            fragmentDisplay.textContent = 'Invalid JSON data.';
          }
        } else if (fragmentType === 'application/yaml') {
          try {
            // Handle YAML data
            console.log('Raw YAML Data:', data); // Debugging log
            const yamlObject = yaml.load(data);
            fragmentDisplay.innerHTML = `<pre>${JSON.stringify(yamlObject, null, 2)}</pre>`;
          } catch (err) {
            console.error('Failed to parse YAML:', err);
            fragmentDisplay.textContent = 'Invalid YAML data.';
          }
        } else if (fragmentType === 'text/plain') {
          fragmentDisplay.innerHTML = `<textarea readonly style="width: 100%; height: 200px;">${data}</textarea>`;
        } else if (fragmentType.startsWith('image/')) {
          fragmentDisplay.innerHTML = `<img src="${data}" style="max-width: 100%; height: auto;" alt="Fragment Image">`;
        } else {
          fragmentDisplay.textContent = data;
        }
      } catch (err) {
        console.error('Error fetching fragment:', err);
        fragmentDisplay.textContent = `Error: ${err.message}`;
      }
    });
  }

  // Edit button listener
  if (editFragmentBtn) {
    editFragmentBtn.addEventListener('click', async () => {
      const selectedFragmentId = fragmentSelect?.value;
      if (!selectedFragmentId) {
        alert('Please select a fragment to edit.');
        return;
      }
      await handleEditFragment(user, selectedFragmentId);
    });
  }

  async function handleEditFragment(user, fragmentId) {
    try {
      // Fetch fragment data and type asynchronously
      const { data, fragmentType } = await fetchFragmentById(user, fragmentId);
      console.log('API Response:', data);
      // Clear the container for new content
      editConvertContainer.innerHTML = '';

      // Create a form dynamically
      const updateForm = document.createElement('form');
      updateForm.id = 'update-fragment-form';

      if (fragmentType.startsWith('image/')) {
        // Handle image fragments
        const img = document.createElement('img');
        img.src = data; // Use the data as the image source
        img.style.width = '100%';
        img.id = `${fragmentId}-image`;
        updateForm.appendChild(img);

        // Create file input for replacing the image
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.id = 'update-image-file';
        updateForm.appendChild(fileInput);
      } else {
        // Handle text or JSON fragments
        const textarea = document.createElement('textarea');
        textarea.id = 'update-fragment-content';
        textarea.value =
          fragmentType === 'application/json'
            ? JSON.stringify(data, null, 2) // Format JSON data
            : data; // Use plain text or other types
        updateForm.appendChild(textarea);
      }

      // Add a submit button
      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.textContent = 'Update Fragment';
      updateForm.appendChild(submitButton);

      // Append the form to the edit container
      editConvertContainer.appendChild(updateForm);

      // Handle form submission
      updateForm.onsubmit = async (event) => {
        event.preventDefault(); // Prevent default form submission
        try {
          if (fragmentType.startsWith('image/')) {
            // Update image fragment
            const fileInput = document.getElementById('update-image-file');
            const file = fileInput.files[0];

            if (!file) {
              alert('Please select a file to upload.');
              return;
            }

            // Update the fragment with the file
            await updateFragmentById(user, file, fragmentId, file.type);
          } else {
            // Update text or JSON fragment
            const textarea = document.getElementById('update-fragment-content');
            const content =
              fragmentType === 'application/json'
                ? JSON.stringify(JSON.parse(textarea.value)) // Validate and stringify JSON
                : textarea.value;

            await updateFragmentById(user, content, fragmentId, fragmentType);
          }

          alert('Fragment updated successfully.');
          // Clear the fragment display and edit/convert container
          fragmentDisplay.innerHTML = '';
          editConvertContainer.innerHTML = '';
          await updateFragmentsList();
          editConvertContainer.innerHTML = ''; // Clear the container
        } catch (err) {
          console.error('Failed to update fragment:', err);
          alert('Failed to update fragment. Please try again.');
        }
      };
    } catch (err) {
      console.error('Failed to fetch fragment for editing:', err);
      alert('Failed to fetch fragment for editing.');
    }
  }

  // Convert button listener
  if (convertFragmentBtn) {
    convertFragmentBtn.addEventListener('click', async () => {
      const selectedFragmentId = fragmentSelect?.value;
      if (!selectedFragmentId) {
        alert('Please select a fragment to convert.');
        return;
      }
      await handleConvertFragment(user, selectedFragmentId);
    });
  }

  async function handleConvertFragment(user, fragmentId) {
    editConvertContainer.innerHTML = ''; // Clear UI
    const form = document.createElement('form');
    form.id = 'convert-fragment-form';

    // Create dropdown for selecting the new file extension
    const select = document.createElement('select');
    select.id = 'convert-extension';
    ['txt', 'md', 'html', 'json', 'yaml', 'png', 'jpg', 'webp', 'gif', 'avif'].forEach((ext) => {
      const option = document.createElement('option');
      option.value = ext;
      option.textContent = ext.toUpperCase();
      select.appendChild(option);
    });
    form.appendChild(select);

    // Add Convert button
    const convertButton = document.createElement('button');
    convertButton.type = 'submit';
    convertButton.textContent = 'Convert';
    form.appendChild(convertButton);

    // Add Download button
    const downloadButton = document.createElement('button');
    downloadButton.type = 'button';
    downloadButton.textContent = 'Download Converted';
    downloadButton.classList.add('download-converted-button');
    downloadButton.hidden = true;
    form.appendChild(downloadButton);

    editConvertContainer.appendChild(form);

    form.onsubmit = async (event) => {
      event.preventDefault();
      try {
        const extension = select.value; // Get the selected new extension
        const response = await fetchConvertedFragmentById(user, fragmentId, extension);

        // Show the converted fragment in the display area
        if (
          extension === 'png' ||
          extension === 'jpg' ||
          extension === 'webp' ||
          extension === 'gif' ||
          extension === 'avif'
        ) {
          // Handle image data properly
          const blob = await (await fetch(response.data)).blob();
          const imageUrl = URL.createObjectURL(blob);
          fragmentDisplay.innerHTML = `<img src="${imageUrl}" alt="Converted Fragment" style="max-width: 100%; height: auto;">`;

          // Show the Download button and handle its click
          downloadButton.hidden = false;
          downloadButton.onclick = () => {
            const a = document.createElement('a');
            a.href = imageUrl;
            a.download = `converted_fragment.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(imageUrl); // Clean up
          };
        } else {
          // Handle text-based formats
          const content = await (await fetch(response.data)).text();
          fragmentDisplay.innerHTML = `<textarea readonly style="width: 100%; height: 200px;">${content}</textarea>`;

          // Show the Download button and handle its click
          downloadButton.hidden = false;
          downloadButton.onclick = () => {
            const blob = new Blob([content], { type: 'text/plain' });
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `converted_fragment.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl); // Clean up
          };
        }
        alert('Fragment converted successfully. You can now download it.');
      } catch (err) {
        console.error('Error converting fragment:', err);
        alert('Failed to convert fragment.');
      }
    };
  }

  // Delete fragment logic
  if (deleteFragmentBtn) {
    deleteFragmentBtn.addEventListener('click', async () => {
      const selectedFragmentId = fragmentSelect?.value;
      if (!selectedFragmentId) {
        alert('Please select a fragment to delete.');
        return;
      }

      if (confirm('Are you sure you want to delete this fragment?')) {
        try {
          // Call delete API
          await deleteFragmentById(user, selectedFragmentId);
          alert('Fragment deleted successfully.');
          // Clear the fragment display and edit/convert container
          fragmentDisplay.innerHTML = '';
          editConvertContainer.innerHTML = '';
          // Refresh the list and dropdown
          await updateFragmentsList();
        } catch (err) {
          console.error('Error deleting fragment:', err);
          alert('Failed to delete fragment.');
        }
      }
    });
  }

  // Form submission logic
  if (createForm) {
    createForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      try {
        const content = fileState.selectedFile || fragmentContentTextarea.value;
        if (!content) {
          alert('Please provide content or select a file.');
          return;
        }

        const type = fragmentTypeSelect.value || 'text/plain';
        await createNewFragment(content, type, user);
        createForm.reset();
        fileNameDisplay.textContent = '';
        await updateFragmentsList();
      } catch (err) {
        console.error('Error creating fragment:', err);
        alert('Failed to create fragment.');
      }
    });
  }

  // File input handler
  if (fileInput) {
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;

      fileState.selectedFile = file;
      fileNameDisplay.textContent = `Selected file: ${file.name}`;
    });
  }

  // Refresh button
  if (refreshButton) {
    refreshButton.addEventListener('click', updateFragmentsList);
  }
}

document.addEventListener('DOMContentLoaded', init);