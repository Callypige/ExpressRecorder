// Global variables
let mediaRecorder;
let audioChunks = [];
let recordingStartTime;
let timerInterval;
let currentRecordingBlob;

// Check for user session on page load
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/user');
        if (response.ok) {
            const data = await response.json();
            showApp(data.user);
        }
    } catch (error) {
        console.log('No active session');
    }
});

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

// Start recording
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.addEventListener('dataavailable', event => {
            audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener('stop', () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            currentRecordingBlob = audioBlob;
            const audioUrl = URL.createObjectURL(audioBlob);
            
            const previewAudio = document.getElementById('preview-audio');
            previewAudio.src = audioUrl;
            
            document.getElementById('preview-section').classList.remove('hidden');
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
        });

        mediaRecorder.start();
        
        // Update UI
        document.getElementById('start-recording').classList.add('hidden');
        document.getElementById('stop-recording').classList.remove('hidden');
        document.getElementById('recording-status').classList.remove('hidden');
        document.getElementById('preview-section').classList.add('hidden');
        
        // Start timer
        recordingStartTime = Date.now();
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
        
    } catch (error) {
        alert('Erreur d\'accès au microphone. Veuillez autoriser l\'accès au microphone.');
        console.error('Error accessing microphone:', error);
    }
}

// Stop recording
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        
        // Update UI
        document.getElementById('start-recording').classList.remove('hidden');
        document.getElementById('stop-recording').classList.add('hidden');
        document.getElementById('recording-status').classList.add('hidden');
        
        // Stop timer
        clearInterval(timerInterval);
    }
}

// Update recording timer
function updateTimer() {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('recording-timer').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Save recording
async function saveRecording() {
    if (!currentRecordingBlob) {
        alert('Aucun enregistrement à sauvegarder');
        return;
    }

    const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
    
    const formData = new FormData();
    formData.append('recording', currentRecordingBlob, `recording-${Date.now()}.webm`);
    formData.append('duration', duration);

    try {
        const response = await fetch('/api/recordings', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            alert('Enregistrement sauvegardé avec succès!');
            discardRecording();
            loadRecordings();
        } else {
            const data = await response.json();
            alert(data.error || 'Erreur lors de la sauvegarde');
        }
    } catch (error) {
        alert('Erreur de connexion au serveur');
        console.error(error);
    }
}

// Discard recording
function discardRecording() {
    currentRecordingBlob = null;
    document.getElementById('preview-section').classList.add('hidden');
    document.getElementById('preview-audio').src = '';
}

// Load recordings
async function loadRecordings() {
    try {
        const response = await fetch('/api/recordings');
        const data = await response.json();

        const recordingsList = document.getElementById('recordings-list');
        
        if (!data.recordings || data.recordings.length === 0) {
            recordingsList.innerHTML = '<p class="empty-state">Aucun enregistrement pour le moment</p>';
            return;
        }

        recordingsList.innerHTML = data.recordings.map(recording => `
            <div class="recording-item">
                <div class="recording-icon">
                    🎤
                </div>
                <div class="recording-info">
                    <div class="recording-title">
                        Enregistrement vocal
                    </div>
                    <div class="recording-meta">
                        ${formatDate(recording.created_at)} • 
                        ${formatSize(recording.size)}
                        ${recording.duration ? ` • ${formatDuration(recording.duration)}` : ''}
                    </div>
                </div>
                <div class="recording-actions">
                    <audio controls src="/uploads/${recording.filename}"></audio>
                    <button class="btn-delete" onclick="deleteRecording(${recording.id})">
                        🗑️ Supprimer
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading recordings:', error);
    }
}

// Delete recording
async function deleteRecording(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement?')) {
        return;
    }

    try {
        const response = await fetch(`/api/recordings/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadRecordings();
        } else {
            const data = await response.json();
            alert(data.error || 'Erreur lors de la suppression');
        }
    } catch (error) {
        alert('Erreur de connexion au serveur');
        console.error(error);
    }
}

// Helper functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

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
