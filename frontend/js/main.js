// Main initialization and event handlers

// Check for user session on page load
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/user');
        if (response.ok) {
            const data = await response.json();
            showApp(data.user);
        } else {
            // No session, show auth
            document.getElementById('auth-section').classList.remove('hidden');
            document.getElementById('app-section').classList.add('hidden');
        }
    } catch (error) {
        console.log('No active session');
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('app-section').classList.add('hidden');
    }
});

// Handle Enter key in forms
document.addEventListener('DOMContentLoaded', () => {
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const registerUsername = document.getElementById('register-username');
    const registerEmail = document.getElementById('register-email');
    const registerPassword = document.getElementById('register-password');
    
    if (loginEmail && loginPassword) {
        loginEmail.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') login();
        });
        loginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') login();
        });
    }
    
    if (registerUsername && registerEmail && registerPassword) {
        registerUsername.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') register();
        });
        registerEmail.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') register();
        });
        registerPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') register();
        });
    }
});
