// Authentication functions

// Show login or register form
function showLoginForm() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('tab-login').classList.add('active');
    document.getElementById('tab-register').classList.remove('active');
    document.getElementById('login-error').textContent = '';
}

function showRegisterForm() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
    document.getElementById('tab-login').classList.remove('active');
    document.getElementById('tab-register').classList.add('active');
    document.getElementById('register-error').textContent = '';
}

// Register function
async function register() {
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const errorElement = document.getElementById('register-error');
    
    errorElement.textContent = '';

    if (!username || !email || !password) {
        errorElement.textContent = 'Tous les champs sont requis';
        return;
    }

    if (password.length < 8) {
        errorElement.textContent = 'Le mot de passe doit contenir au moins 8 caractères';
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showApp(data.user);
        } else {
            errorElement.textContent = data.error || 'Erreur lors de l\'inscription';
        }
    } catch (error) {
        errorElement.textContent = 'Erreur de connexion au serveur';
        console.error(error);
    }
}

// Login function
async function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');
    
    errorElement.textContent = '';

    if (!email || !password) {
        errorElement.textContent = 'Email et mot de passe requis';
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showApp(data.user);
        } else {
            errorElement.textContent = data.error || 'Erreur de connexion';
        }
    } catch (error) {
        errorElement.textContent = 'Erreur de connexion au serveur';
        console.error(error);
    }
}

// Logout function
async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        location.reload();
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

// Show app after login
function showApp(user) {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('current-user').textContent = user.username;
    loadRecordings();
}
