// src/app.js

import { signIn, getUser } from './auth';
import { getUserFragments } from './api'; // Import the function to fetch fragments

async function init() {
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');

  // Set up login button action
  loginBtn.onclick = () => {
    signIn();
  };

  // Get the authenticated user
  const user = await getUser();
  if (!user) return;

  // If user is authenticated, show their username
  userSection.hidden = false;
  userSection.querySelector('.username').innerText = user.username;
  loginBtn.disabled = true;

  // Request the user's fragments from the microservice
  const userFragments = await getUserFragments(user);

  // Log the user's fragments to the console (you can modify this later to display on the page)
  console.log('User Fragments:', userFragments);
}

// Initialize the app once the DOM is ready
addEventListener('DOMContentLoaded', init);
