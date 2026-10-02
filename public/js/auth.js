/**
 * CivicPulse — Authentication Controller (Matching Screenshot Reference UI)
 * Pure Plain JavaScript (Zero external libraries)
 */

let activeSignInRole = 'Admin';
let activeSignUpRole = 'Resident';

document.addEventListener('DOMContentLoaded', () => {
  initAuthPage();
});

function initAuthPage() {
  // Sync Theme
  const themeBtn = document.getElementById('btn-auth-theme');
  if (themeBtn) {
    updateThemeIcon(themeBtn);
    themeBtn.addEventListener('click', () => {
      state.toggleTheme();
      updateThemeIcon(themeBtn);
    });
  }

  // Parse URL search params (e.g. ?mode=signup&role=Moderator)
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode') || 'signin';
  const roleParam = params.get('role');

  if (mode === 'signup') {
    switchAuthView('signup');
  } else {
    switchAuthView('signin');
  }

  if (roleParam) {
    selectSignInRole(roleParam);
    selectSignUpRole(roleParam);
  } else {
    // Default to Admin role on login for instant convenience
    selectSignInRole('Admin');
  }

  if (typeof hydrateIcons === 'function') {
    hydrateIcons();
  }
}

function updateThemeIcon(btn) {
  const isDark = document.documentElement.classList.contains('dark') || state.theme === 'dark';
  btn.innerHTML = icon(isDark ? 'sun' : 'moon', 'md');
}

function switchAuthView(view, event) {
  if (event) event.preventDefault();

  const viewSignin = document.getElementById('view-signin');
  const viewSignup = document.getElementById('view-signup');

  if (view === 'signup') {
    viewSignin.classList.add('hidden');
    viewSignup.classList.remove('hidden');
    document.getElementById('signup-name')?.focus();
  } else {
    viewSignup.classList.add('hidden');
    viewSignin.classList.remove('hidden');
    document.getElementById('signin-email')?.focus();
  }
}

function selectSignInRole(role) {
  activeSignInRole = role;
  const tabs = document.querySelectorAll('#signin-role-tabs .ref-role-tab');
  tabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.role.toLowerCase() === role.toLowerCase());
  });

  // Prefill realistic demo credentials for seamless zero-friction testing
  const emailInput = document.getElementById('signin-email');
  const passwordInput = document.getElementById('signin-password');

  if (emailInput && passwordInput) {
    if (role.toLowerCase() === 'admin') {
      emailInput.value = 'admin@civicpulse.org';
    } else if (role.toLowerCase() === 'moderator') {
      emailInput.value = 'priya@civicpulse.org';
    } else {
      emailInput.value = 'rahul@civicpulse.org';
    }
    passwordInput.value = 'password123';
  }
}

function selectSignUpRole(role) {
  activeSignUpRole = role;
  const tabs = document.querySelectorAll('#signup-role-tabs .ref-role-tab');
  tabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.role.toLowerCase() === role.toLowerCase());
  });
}

function showPasswordHint(event) {
  if (event) event.preventDefault();
  showAlert('signin', 'Demo password is: password123', 'success');
}

function showAlert(view, message, type = 'danger') {
  const alertEl = document.getElementById(`auth-alert-${view}`);
  if (!alertEl) return;
  alertEl.className = `ref-alert ${type}`;
  alertEl.textContent = message;
  alertEl.classList.remove('hidden');
}

function handleRefLoginSubmit(event) {
  event.preventDefault();
  const email = document.getElementById('signin-email')?.value.trim();
  const password = document.getElementById('signin-password')?.value;

  if (!email) {
    showAlert('signin', 'Please enter your email address.', 'danger');
    return;
  }

  try {
    const user = state.login(email, password, activeSignInRole);
    showAlert('signin', `Signed in as ${user.name} (${user.role}). Redirecting...`, 'success');

    setTimeout(() => {
      if (user.role === 'Admin' || user.role === 'Moderator') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'index.html';
      }
    }, 500);
  } catch (err) {
    showAlert('signin', err.message, 'danger');
  }
}

function handleRefSignupSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('signup-name')?.value.trim();
  const email = document.getElementById('signup-email')?.value.trim();
  const password = document.getElementById('signup-password')?.value;

  if (!name) {
    showAlert('signup', 'Please enter your full name.', 'danger');
    return;
  }
  if (!email) {
    showAlert('signup', 'Please enter a valid email address.', 'danger');
    return;
  }
  if (!password || password.length < 6) {
    showAlert('signup', 'Password must be at least 6 characters.', 'danger');
    return;
  }

  try {
    const newUser = state.signup({
      name,
      email,
      password,
      role: activeSignUpRole,
      locality: 'Andheri East, Mumbai',
    });

    showAlert('signup', `Account created for ${newUser.name}! Redirecting...`, 'success');
    setTimeout(() => {
      if (activeSignUpRole === 'Admin' || activeSignUpRole === 'Moderator') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'index.html';
      }
    }, 600);
  } catch (err) {
    showAlert('signup', err.message, 'danger');
  }
}
