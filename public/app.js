// Global variables
let mediaRecorder;
let audioChunks = [];
let recordingStartTime;
let timerInterval;
let currentRecordingBlob;

// Utility functions for toast and modal
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showModal(title, message) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const cancelBtn = document.getElementById('modal-cancel');
        const confirmBtn = document.getElementById('modal-confirm');
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('show'), 10);
        
        const handleCancel = () => {
            cleanup();
            resolve(false);
        };
        
        const handleConfirm = () => {
            cleanup();
            resolve(true);
        };
        
        const cleanup = () => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.classList.add('hidden'), 300);
            cancelBtn.removeEventListener('click', handleCancel);
            confirmBtn.removeEventListener('click', handleConfirm);
        };
        
        cancelBtn.addEventListener('click', handleCancel);
        confirmBtn.addEventListener('click', handleConfirm);
    });
}

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
        showToast('Erreur d\'accès au microphone. Veuillez autoriser l\'accès.', 'error');
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
        showToast('Aucun enregistrement à sauvegarder', 'warning');
        return;
    }

    // Get actual audio duration from the preview element
    const previewAudio = document.getElementById('preview-audio');
    const duration = previewAudio.duration && !isNaN(previewAudio.duration) 
        ? Math.floor(previewAudio.duration) 
        : Math.floor((Date.now() - recordingStartTime) / 1000);
    
    // Show loading indicator
    const saveBtn = document.getElementById('save-btn');
    const discardBtn = document.getElementById('discard-btn');
    const btnText = document.getElementById('save-btn-text');
    const btnSpinner = document.getElementById('save-btn-spinner');
    const uploadProgress = document.getElementById('upload-progress');
    const uploadStatus = document.getElementById('upload-status');
    const progressFill = document.getElementById('progress-fill');

    saveBtn.disabled = true;
    discardBtn.disabled = true;
    btnText.textContent = 'Envoi en cours';
    btnSpinner.classList.remove('hidden');
    uploadProgress.classList.remove('hidden');
    uploadStatus.textContent = 'Upload vers Cloudinary...';
    
    // Progress bar animation
    let progress = 0;
    const progressInterval = setInterval(() => {
        if (progress < 90) {
            progress += Math.random() * 10;
            progressFill.style.width = Math.min(progress, 90) + '%';
        }
    }, 300);

    let uploadSuccess = false;

    try {
        // Step 1: Direct upload to Cloudinary
        uploadStatus.textContent = 'Uploading to Cloudinary...';
        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append('file', currentRecordingBlob);
        cloudinaryFormData.append('upload_preset', 'expressrecorder');
        cloudinaryFormData.append('folder', 'express-recorder');
        
        const cloudinaryResponse = await fetch(
            `https://api.cloudinary.com/v1_1/dgazl4xbo/auto/upload`,
            {
                method: 'POST',
                body: cloudinaryFormData
            }
        );

        console.log('Cloudinary response status:', cloudinaryResponse.status);

        if (!cloudinaryResponse.ok) {
            const errorText = await cloudinaryResponse.text();
            console.error('Cloudinary error:', errorText);
            throw new Error(`Cloudinary upload failed: ${cloudinaryResponse.status}`);
        }

        const cloudinaryData = await cloudinaryResponse.json();
        console.log('Cloudinary upload success:', cloudinaryData.secure_url);
        clearInterval(progressInterval);
        progressFill.style.width = '70%';

        // Step 2: Save metadata to database
        uploadStatus.textContent = 'Saving metadata...';
        
        const response = await fetch('/api/recordings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cloudinary_url: cloudinaryData.secure_url,
                cloudinary_public_id: cloudinaryData.public_id,
                original_name: `recording-${Date.now()}.webm`,
                size: currentRecordingBlob.size,
                duration: duration
            })
        });

        console.log('Server response status:', response.status);

        progressFill.style.width = '100%';

        if (response.ok) {
            uploadSuccess = true;
            uploadStatus.textContent = '✅ Enregistrement sauvegardé !';
            setTimeout(() => {
                showToast('Enregistrement sauvegardé avec succès!', 'success');
                discardRecording();
                loadRecordings();
            }, 500);
        } else {
            const data = await response.json();
            uploadStatus.textContent = '❌ Erreur lors de l\'enregistrement';
            showToast(data.error || 'Erreur lors de la sauvegarde', 'error');
        }
    } catch (error) {
        clearInterval(progressInterval);
        uploadStatus.textContent = '❌ Erreur d\'upload';
        showToast('Erreur lors de l\'upload : ' + error.message, 'error');
        console.error(error);
    } finally {
        setTimeout(() => {
            saveBtn.disabled = false;
            discardBtn.disabled = false;
            btnText.textContent = '💾 Sauvegarder';
            btnSpinner.classList.add('hidden');
            uploadProgress.classList.add('hidden');
            progressFill.style.width = '0%';
        }, uploadSuccess ? 1000 : 2000);
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
                    <div class="recording-title" id="title-${recording.id}">
                        <span id="title-text-${recording.id}">${recording.original_name || 'Enregistrement vocal'}</span>
                        <button class="btn-edit" onclick="editRecordingName(${recording.id})" title="Renommer">
                            ✏️
                        </button>
                    </div>
                    <div class="recording-meta">
                        ${formatDate(recording.created_at)} • 
                        ${formatSize(recording.size)}
                        ${recording.duration ? ` • ${formatDuration(recording.duration)}` : ''}
                    </div>
                </div>
                <div class="recording-actions">
                    <audio controls src="${recording.filename}"></audio>
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
    const confirmed = await showModal(
        'Supprimer l\'enregistrement',
        'Êtes-vous sûr de vouloir supprimer cet enregistrement? Cette action est irréversible.'
    );
    
    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`/api/recordings/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Enregistrement supprimé avec succès', 'success');
            loadRecordings();
        } else {
            const data = await response.json();
            showToast(data.error || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        showToast('Erreur de connexion au serveur', 'error');
        console.error(error);
    }
}

// Edit recording name
async function editRecordingName(id) {
    const titleElement = document.getElementById(`title-${id}`);
    const textElement = document.getElementById(`title-text-${id}`);
    const currentName = textElement.textContent;
    
    // Create input field
    titleElement.innerHTML = `
        <input type="text" id="input-${id}" value="${currentName}" class="edit-input" />
        <button class="btn-save" onclick="saveRecordingName(${id})" title="Sauvegarder">✅</button>
        <button class="btn-cancel" onclick="cancelEdit(${id}, '${currentName.replace(/'/g, "\\'")}')">❌</button>
    `;
    
    // Focus and select text
    const input = document.getElementById(`input-${id}`);
    input.focus();
    input.select();
    
    // Save on Enter key
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveRecordingName(id);
        } else if (e.key === 'Escape') {
            cancelEdit(id, currentName);
        }
    });
}

// Save recording name
async function saveRecordingName(id) {
    const input = document.getElementById(`input-${id}`);
    const newName = input.value.trim();
    
    if (!newName) {
        showToast('Le nom ne peut pas être vide', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`/api/recordings/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ original_name: newName })
        });
        
        if (response.ok) {
            showToast('Nom modifié avec succès', 'success');
            loadRecordings();
        } else {
            const data = await response.json();
            showToast(data.error || 'Erreur lors de la modification', 'error');
        }
    } catch (error) {
        showToast('Erreur de connexion au serveur', 'error');
        console.error(error);
    }
}

// Cancel edit
function cancelEdit(id, originalName) {
    const titleElement = document.getElementById(`title-${id}`);
    titleElement.innerHTML = `
        <span id="title-text-${id}">${originalName}</span>
        <button class="btn-edit" onclick="editRecordingName(${id})" title="Renommer">✏️</button>
    `;
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
