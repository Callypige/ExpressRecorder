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

// Login function
async function login() {
    const username = document.getElementById('username').value.trim();
    
    if (!username) {
        alert('Veuillez entrer un nom d\'utilisateur');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });

        const data = await response.json();

        if (response.ok) {
            showApp(data.user);
        } else {
            alert(data.error || 'Erreur de connexion');
        }
    } catch (error) {
        alert('Erreur de connexion au serveur');
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
    document.getElementById('login-section').classList.add('hidden');
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

    const recordingType = document.querySelector('input[name="recordingType"]:checked').value;
    const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
    
    const formData = new FormData();
    formData.append('recording', currentRecordingBlob, `recording-${Date.now()}.webm`);
    formData.append('type', recordingType);
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
                    ${recording.type === 'voice' ? '🎤' : '🥁'}
                </div>
                <div class="recording-info">
                    <div class="recording-title">
                        ${recording.type === 'voice' ? 'Enregistrement vocal' : 'Enregistrement batterie'}
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

// Handle Enter key in login form
document.addEventListener('DOMContentLoaded', () => {
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
});
