import { signIn, getUser } from './auth';

async function init() {
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');

  loginBtn.onclick = () => {
    signIn();
  };

  const user = await getUser();
  if (!user) return;

  userSection.hidden = false;
  userSection.querySelector('.username').innerText = user.username;
  loginBtn.disabled = true;
}

addEventListener('DOMContentLoaded', init);
