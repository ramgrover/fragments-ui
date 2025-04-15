// src/api.js

// fragments microservice API to use, defaults to localhost:8080 if not set in env
const apiUrl = process.env.API_URL || 'http://localhost:8080';

/**
 * Given an authenticated user, request all fragments for this user from the
 * fragments microservice (currently only running locally). We expect a user
 * to have an `idToken` attached, so we can send that along with the request.
 */
/**
 * Create users fragments
 */
export async function getUserFragments(user) {
  console.log('Requesting user fragments data...');
  try {
    const res = await fetch(`${apiUrl}/v1/fragments`, {
      // Generate headers with the proper Authorization bearer token to pass.
      // We are using the `authorizationHeaders()` helper method we defined
      // earlier, to automatically attach the user's ID token.
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('Successfully got user fragments data', { data });
    return data;
  } catch (err) {
    console.error('Unable to call GET /v1/fragment', { err });
  }
}

/**
 * Create New Fragment
 */
export async function createNewFragment(content, type, user) {
    console.log('Creating fragment:', { content, type });
  
    if (!user || !user.idToken) {
      throw new Error('No authenticated user or missing token');
    }
  
    try {
      let body = content;
      if (content instanceof File || content instanceof Blob) {
        body = await content.arrayBuffer();
      }
  
      const headers = {
        'Content-Type': type,
        Authorization: `Bearer ${user.idToken}`,
      };
  
      console.log('Request headers:', headers);
      console.log('Request body type:', typeof body);
  
      const res = await fetch(`${apiUrl}/v1/fragments`, {
        method: 'POST',
        headers,
        body,
      });
  
      if (!res.ok) {
        const errText = await res.text();
        console.error('Error response:', errText);
        throw new Error(`${res.status} ${res.statusText}`);
      }
  
      const data = await res.json();
      console.log('Fragment created successfully:', data);
      return data;
    } catch (err) {
      console.error('Error creating fragment:', err);
      throw err;
    }
  }
/**
 * Get expanded fragments
 */

export async function getFragmentsExpanded(user) {
  console.log('Getting expanded fragments list');
  try {
    const res = await fetch(`${apiUrl}/v1/fragments?expand=1`, {
      headers: {
        Authorization: `Bearer ${user.idToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log('Got expanded fragments:', data);
    return data;
  } catch (err) {
    console.error('Error getting expanded fragments:', err);
    throw err;
  }
}

/**
 * GET /v1/fragments/:id
 */
export async function fetchFragmentById(user, fragmentId) {
  console.log('Fetching user fragment by id');

  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${fragmentId}`, {
      method: 'GET',
      headers: user.authorizationHeaders(),
    });

    if (!res.ok) {
      console.error('Error fatching fragment');
      throw await res.json();
    }

    let data;
    const fragmentType = res.headers.get('Content-Type');

    if (fragmentType.startsWith('text/')) {
      data = await res.text();
    } else if (fragmentType.startsWith('application/')) {
      data = await res.json();
    } else if (fragmentType.startsWith('image/')) {
      const blob = await res.blob();
      data = URL.createObjectURL(blob);
    }

    console.log('Success in retrieving fragment data: ', { data });

    return { data, fragmentType };
  } catch (err) {
    console.error('Error fetching user fragment by id:', err);
  }
}

/**
 * DELETE /v1/fragments/:id
 */
export async function deleteFragmentById(user, id) {
  console.log('Attempting to delete fragment by ID:', id);

  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}`, {
      method: 'DELETE',
      headers: user.authorizationHeaders(),
    });

    if (!res.ok) {
      console.error('Error fatching fragment to delete');
      throw await res.json();
    }

    const data = await res.json();
    console.log('Fragment deleted successfully:', { data });
    return data;
  } catch (err) {
    console.error('Error deleting fragment by ID:', err);
    throw err;
  }
}

/**
 * PUT /v1/fragments/:id
 */

export async function updateFragmentById(user, content, fragmentId, fragmentType) {
  console.log('Updating fragment by ID:', { fragmentId, fragmentType, content });
  try {
    const headers = user.authorizationHeaders();
    headers['Content-Type'] = fragmentType.includes('charset')
      ? fragmentType.split(';')[0]
      : fragmentType;

    const response = await fetch(`${apiUrl}/v1/fragments/${fragmentId}`, {
      method: 'PUT',
      headers,
      body: content,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Update failed:', error);
      throw new Error(error.message || 'Unknown error occurred');
    }

    const data = await response.json();
    console.log('Fragment updated successfully:', data);
    return data;
  } catch (err) {
    console.error('Error updating fragment:', err);
    throw err;
  }
}

/**
 * Fetch converted fragment by id and extension
 */
export async function fetchConvertedFragmentById(user, fragmentId, extension) {
  const extensionToContentTypeMap = {
    txt: 'text/plain',
    md: 'text/markdown',
    csv: 'text/csv',
    html: 'text/html',
    json: 'application/json',
    yaml: 'application/yaml',
    png: 'image/png',
    jpg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    avif: 'image/avif',
  };

  const extensionType = extensionToContentTypeMap[extension];
  if (!extensionType) {
    throw new Error(`Unsupported extension: ${extension}`);
  }

  console.log(`Fetching from URL: ${apiUrl}/v1/fragments/${fragmentId}.${extension}`);

  try {
    const response = await fetch(`${apiUrl}/v1/fragments/${fragmentId}.${extension}`, {
      method: 'GET',
      headers: {
        Authorization: user.authorizationHeaders().Authorization,
        Accept: extensionType.split(';')[0],
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    let data;
    if (extensionType.startsWith('image/')) {
      const blob = await response.blob();
      data = URL.createObjectURL(blob);
    } else if (extensionType === 'application/json') {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return { data };
  } catch (error) {
    throw new Error(`Error retrieving converted fragment: ${error.message}`);
  }
}