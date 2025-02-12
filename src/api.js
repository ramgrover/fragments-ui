// src/api.js

// Fragments microservice API to use, defaults to localhost:8080 if not set in env
const apiUrl = process.env.API_URL || 'http://localhost:8080';

/**
 * Given an authenticated user, request all fragments for this user from the
 * fragments microservice. We expect a user to have an idToken attached, so we can send that along with the request.
 */
export async function getUserFragments(user) {
  console.log('Requesting user fragments data...');
  try {
    const res = await fetch(`${apiUrl}/v1/fragments`, {
      headers: user.authorizationHeaders(),
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log('Successfully got user fragments data', { data });
    return data;
  } catch (err) {
    console.error('Unable to call GET /v1/fragments', { err });
    return { error: err.message };
  }
}

/**
 * Posts a new fragment for the authenticated user.
 *
 * @param {Object} user - The authenticated user.
 * @param {Object} text - The fragment text to be posted.
 * @returns {Object} - The response data from the API.
 */
export async function postFragment_API(user, text) {
  console.log('Posting fragment data...', text);
  try {
    // Validate Content-Type
    const validTypes = ['text/plain', 'application/json', 'text/markdown'];
    if (!validTypes.includes(text.type)) {
      throw new Error(`Invalid content type: ${text.type}`);
    }
    console.log(text);
    const res = await fetch(`${apiUrl}/v1/fragments`, {
      method: 'POST',
      headers: {
        ...user.authorizationHeaders(), // Corrected Authorization header
        'Content-Type': text.type, // Ensure valid Content-Type
      },
      body: Buffer.from(text.value), 
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`${res.status} ${res.statusText}: ${errorBody}`);
    }

    const data = await res.json();
    console.log('Got the Response.', data);
    return { data, type: 'json' };
  } catch (err) {
    console.error('Unable to call POST /v1/fragments', err);
    return { type: 'json', data: { error: err.message } };
  }
}

/**
 * Fetches a fragment by ID for the authenticated user.
 *
 * @param {Object} user - The authenticated user.
 * @param {string} id - The ID of the fragment.
 * @returns {string} - The full HTTP response format.
 */
export async function getFragmentById_API(user, id) {
  console.log('Requesting to get fragment data...');
  console.log(`Fetching fragment with ID: ${id}`);  

  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}`, {
      headers: user.authorizationHeaders(),
    }); 

    if (!res.ok) {
      const data = await res.json();
      return { data, type: 'json' };
    }

    const headers = [];
    res.headers.forEach((value, key) => {
      headers.push(`${key}: ${value}`);
    });

    const body = await res.text();
    const responseString = `HTTP/1.1 ${res.status} ${res.statusText}\n${headers.join('\n')}\n\n${body}`;

    console.log('Got user fragment', { responseString });
    return responseString;
  } catch (err) {
    console.error('Unable to call GET /v1/fragments', { err });
    return { type: 'json', data: { error: err.message } };
  }
}
