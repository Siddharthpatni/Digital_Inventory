// Authentication JavaScript for main application
// Handles session validation and redirects

(function () {
    'use strict';

    // Check if user is authenticated
    async function checkAuth() {
        try {
            const response = await fetch('/api/auth/session');
            const data = await response.json();

            if (!data.authenticated) {
                // Not authenticated, redirect to login
                window.location.href = '/login.html';
                return false;
            }

            // User is authenticated, store user info
            if (data.user) {
                sessionStorage.setItem('user', JSON.stringify(data.user));
                updateUserUI(data.user);
            }

            return true;
        } catch (error) {
            console.error('Authentication check failed:', error);
            window.location.href = '/login.html';
            return false;
        }
    }

    // Update UI with user information
    function updateUserUI(user) {
        // Update any user-specific UI elements
        const userElements = document.querySelectorAll('[data-user-name]');
        userElements.forEach(el => {
            el.textContent = user.fullName || user.username;
        });

        const roleElements = document.querySelectorAll('[data-user-role]');
        roleElements.forEach(el => {
            el.textContent = user.role;
        });

        // Show/hide admin features based on role
        if (user.role !== 'admin') {
            const adminElements = document.querySelectorAll('[data-admin-only]');
            adminElements.forEach(el => {
                el.style.display = 'none';
            });
        }
    }

    // Handle logout
    async function handleLogout() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                sessionStorage.clear();
                localStorage.removeItem('user');
                window.location.href = '/login.html';
            }
        } catch (error) {
            console.error('Logout failed:', error);
            // Force redirect to login even if logout request fails
            sessionStorage.clear();
            localStorage.removeItem('user');
            window.location.href = '/login.html';
        }
    }

    // Initialize authentication on page load
    window.addEventListener('DOMContentLoaded', async () => {
        // Only check auth if not on login page
        if (!window.location.pathname.includes('login.html')) {
            const isAuthenticated = await checkAuth();

            if (!isAuthenticated) {
                return; // Will redirect to login
            }

            // Setup logout button
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    handleLogout();
                });
            }
        }
    });

    // Export functions for use in other scripts
    window.authModule = {
        checkAuth,
        handleLogout,
        updateUserUI
    };
})();
