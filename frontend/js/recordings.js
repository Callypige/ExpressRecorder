// Recordings list management

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
        'Êtes-vous sûr de vouloir supprimer cet enregistrement ? ATTENTION, cette action est irréversible.'
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
