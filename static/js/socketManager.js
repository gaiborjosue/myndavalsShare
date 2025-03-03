// Socket handling for real-time communication

let socket;
let sessionUpdateCallback;
let fileStatusUpdatedCallback;
let selectorJoinedCallback;

export function initializeSocket(onSessionUpdate, onFileStatusUpdated, onSelectorJoined) {
    sessionUpdateCallback = onSessionUpdate;
    fileStatusUpdatedCallback = onFileStatusUpdated;
    selectorJoinedCallback = onSelectorJoined;
    
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
    
    socket.on('error', (data) => {
        alert(data.message);
    });
    
    socket.on('selector_joined', (data) => {
        if (selectorJoinedCallback) {
            selectorJoinedCallback(data);
        }
    });
    
    socket.on('session_update', (data) => {
        if (sessionUpdateCallback) {
            sessionUpdateCallback(data);
        }
    });
    
    socket.on('file_status_updated', (data) => {
        if (fileStatusUpdatedCallback) {
            fileStatusUpdatedCallback(data);
        }
    });
    
    return socket;
}

export function joinSession(sessionCode, role) {
    if (!socket) {
        console.error('Socket not initialized');
        return;
    }
    
    socket.emit('join_session', {
        session_code: sessionCode,
        role: role
    });
}

export function updateFileStatus(sessionCode, fileId, status) {
    if (!socket) {
        console.error('Socket not initialized');
        return;
    }
    
    socket.emit('update_file_status', {
        session_code: sessionCode,
        file_id: fileId,
        status: status
    });
}