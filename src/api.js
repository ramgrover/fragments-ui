const apiUrl = process.env.API_URL || 'http://localhost:8080';

/**
 * Fetch the list of fragments for an authenticated user.
 */
export async function getUserFragments(user) {
    try {
        const res = await fetch(`${apiUrl}/v1/fragments?expand=1`, {
            headers: user.authorizationHeaders(),
        });

        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

        return await res.json();
    } catch (err) {
        console.error('Error fetching fragments:', err);
        return { error: err.message };
    }
}

/**
 * Fetch a specific fragment by ID.
 */
export async function getFragmentById_API(user, fragmentId) {
    try {
        const res = await fetch(`${apiUrl}/v1/fragments/${fragmentId}`, {
            headers: user.authorizationHeaders(),
        });

        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

        return await res.text(); // Handling different content types
    } catch (err) {
        console.error('Error fetching fragment:', err);
        return { error: err.message };
    }
}

/**
 * Post a new fragment with specified type.
 */
export async function postFragment_API(user, fragmentData) {
    try {
        const res = await fetch(`${apiUrl}/v1/fragments`, {
            method: 'POST',
            headers: {
                ...user.authorizationHeaders(),
                'Content-Type': fragmentData.type,
            },
            body: fragmentData.value,
        });

        if (!res.ok) throw new Error(await res.text());

        return await res.json();
    } catch (err) {
        console.error('Error posting fragment:', err);
        return { error: err.message };
    }
}

/**
 * Delete a fragment by ID.
 */
export async function deleteFragment_API(user, fragmentId) {
    try {
        const res = await fetch(`${apiUrl}/v1/fragments/${fragmentId}`, {
            method: 'DELETE',
            headers: user.authorizationHeaders(),
        });

        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

        return { success: true };
    } catch (err) {
        console.error('Error deleting fragment:', err);
        return { error: err.message };
    }
}
