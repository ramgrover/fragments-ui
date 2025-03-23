// src/auth.js

import { UserManager } from 'oidc-client-ts';

const cognitoAuthConfig = {
  authority: `https://cognito-idp.us-east-1.amazonaws.com/${process.env.AWS_COGNITO_POOL_ID}`,
  client_id: process.env.AWS_COGNITO_CLIENT_ID,
  redirect_uri: process.env.OAUTH_SIGN_IN_REDIRECT_URL,
  response_type: 'code',
  scope: 'phone openid email',
  // No revoke of "access token" (https://github.com/authts/oidc-client-ts/issues/262)
  revokeTokenTypes: ['refresh_token'],
  // No silent renew via "prompt=none" (https://github.com/authts/oidc-client-ts/issues/366)
  automaticSilentRenew: false,
};

// Create a UserManager instance
const userManager = new UserManager({
  ...cognitoAuthConfig,
});

/**
 * Redirects user to the Cognito authentication page for sign-in.
 */
export async function signIn() {
  await userManager.signinRedirect();
}

/**
 * Redirects user to sign out from Cognito.
 */
export async function signOut() {
  await userManager.signoutRedirect();
}

/**
 * Creates a simplified view of the authenticated user with authorization headers.
 *
 * @param {Object} user - The authenticated user object.
 * @returns {Object} - Formatted user data.
 */
function formatUser(user) {
  console.log('User Authenticated', { user });
  return {
    username: user.profile['cognito:username'],
    email: user.profile.email,
    idToken: user.id_token,
    accessToken: user.access_token,
    authorizationHeaders: (type = 'application/json') => ({
      'Content-Type': type,
      Authorization: `Bearer ${user.id_token}`,
    }),
  };
}

/**
 * Retrieves the current authenticated user.
 *
 * @returns {Promise<Object|null>} - Formatted user object or null if not authenticated.
 */
export async function getUser() {
  try {
    // Check if handling a sign-in redirect callback (e.g., ?code=... in URL)
    if (window.location.search.includes('code=')) {
      const user = await userManager.signinCallback();
      // Remove the auth code from the URL without triggering a reload
      window.history.replaceState({}, document.title, window.location.pathname);
      return formatUser(user);
    }

    // Otherwise, get the current user
    const user = await userManager.getUser();
    return user ? formatUser(user) : null;
  } catch (err) {
    console.error('Error retrieving user:', err);
    return null;
  }
}