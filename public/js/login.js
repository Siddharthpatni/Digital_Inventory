// ===== Login Page JavaScript =====

const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('errorMessage');

// Fill credentials when demo card is clicked
function fillCredentials(username, password) {
    usernameInput.value = username;
    passwordInput.value = password;
    usernameInput.focus();

    // Add visual feedback
    usernameInput.style.borderColor = '#10B981';
    passwordInput.style.borderColor = '#10B981';

    setTimeout(() => {
        usernameInput.style.borderColor = '';
        passwordInput.style.borderColor = '';
    }, 1000);
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';

    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Set loading state
function setLoading(isLoading) {
    const buttonText = loginButton.querySelector('.button-text');
    const buttonLoader = loginButton.querySelector('.button-loader');

    if (isLoading) {
        buttonText.style.display = 'none';
        buttonLoader.style.display = 'inline-block';
        loginButton.disabled = true;
    } else {
        buttonText.style.display = 'inline';
        buttonLoader.style.display = 'none';
        loginButton.disabled = false;
    }
}

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
        showError('Please enter both username and password');
        return;
    }

    setLoading(true);
    errorMessage.style.display = 'none';

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Success! Redirect to dashboard
            window.location.href = '/';
        } else {
            showError(data.error || 'Invalid username or password');
            setLoading(false);
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('An error occurred. Please try again.');
        setLoading(false);
    }
});

// Check if already logged in
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/auth/session', {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.authenticated) {
            // Already logged in, redirect to dashboard
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Session check error:', error);
    }
});

// Auto-focus username field
usernameInput.focus();
