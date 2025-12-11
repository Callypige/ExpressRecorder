// Audio recording functionality

let mediaRecorder;
let audioChunks = [];
let recordingStartTime;
let timerInterval;
let currentRecordingBlob;

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
        uploadStatus.textContent = 'Chargement...';
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
        uploadStatus.textContent = 'Bientôt terminé...';
        
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
                cleanupRecording();
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
async function discardRecording() {
    const confirmed = await showModal(
        'Annuler l\'enregistrement',
        'Êtes-vous sûr de vouloir annuler cet enregistrement ? Il sera définitivement perdu.'
    );
    
    if (confirmed) {
        cleanupRecording();
    }
}

function cleanupRecording() {
    currentRecordingBlob = null;
    document.getElementById('preview-section').classList.add('hidden');
    document.getElementById('preview-audio').src = '';
}
