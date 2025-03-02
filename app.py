import uuid
import random
import string
import base64
import io
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_socketio import SocketIO, emit, join_room
from werkzeug.utils import secure_filename
from PIL import Image
import pillow_heif

# Initialize Flask app
app = Flask(__name__, static_folder='static')
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max upload
socketio = SocketIO(app, cors_allowed_origins="*")

# In-memory storage for sessions and images
sessions = {}
images = {}  # Store images in memory keyed by ID

# Register HEIF format with Pillow
pillow_heif.register_heif_opener()

def generate_session_code():
    """Generate a unique 4-digit session code"""
    while True:
        code = ''.join(random.choices(string.digits, k=4))
        if code not in sessions:
            return code

def allowed_file(filename):
    """Check if the file extension is allowed"""
    allowed_extensions = {'jpg', 'jpeg', 'png', 'heic', 'heif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

def process_image(file_stream, filename):
    """Process uploaded images, convert HEIC to JPEG if needed, and store in memory"""
    file_ext = filename.rsplit('.', 1)[1].lower()
    
    # Generate a unique ID for the image
    image_id = str(uuid.uuid4())
    
    # Convert HEIC/HEIF to JPEG or process other formats
    if file_ext in ['heic', 'heif']:
        image = Image.open(file_stream)
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='JPEG')
        img_byte_arr.seek(0)
        images[image_id] = img_byte_arr.getvalue()
    else:
        # For other formats, just read and store the image data
        image = Image.open(file_stream)
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format=image.format)
        img_byte_arr.seek(0)
        images[image_id] = img_byte_arr.getvalue()
    
    return image_id

@app.route('/api/upload', methods=['POST'])
def upload_files():
    """Handle file uploads and create a new session"""
    if 'files' not in request.files:
        return jsonify({'error': 'No files uploaded'}), 400
    
    files = request.files.getlist('files')
    if not files or files[0].filename == '':
        return jsonify({'error': 'No files selected'}), 400
    
    # Create a new session
    session_code = generate_session_code()
    session_id = str(uuid.uuid4())
    
    processed_files = []
    for file in files:
        if file and allowed_file(file.filename):
            try:
                filename = secure_filename(file.filename)
                image_id = process_image(file.stream, filename)
                processed_files.append({
                    'id': str(uuid.uuid4()),
                    'image_id': image_id,
                    'original_name': filename,
                    'status': 'undecided'  # undecided, favorite, discard
                })
            except Exception as e:
                return jsonify({'error': str(e)}), 500
    
    # Store session information
    sessions[session_code] = {
        'id': session_id,
        'code': session_code,
        'created_at': datetime.now().isoformat(),
        'files': processed_files,
        'uploader_connected': False,
        'selector_connected': False
    }
    
    return jsonify({
        'session_code': session_code,
        'session_id': session_id,
        'files_count': len(processed_files)
    }), 201

@app.route('/api/session/<session_code>', methods=['GET'])
def get_session(session_code):
    """Get session information"""
    if session_code not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    return jsonify({
        'session': {
            'code': session_code,
            'id': sessions[session_code]['id'],
            'files_count': len(sessions[session_code]['files']),
            'uploader_connected': sessions[session_code]['uploader_connected'],
            'selector_connected': sessions[session_code]['selector_connected']
        }
    }), 200

@app.route('/api/session/<session_code>/files', methods=['GET'])
def get_session_files(session_code):
    """Get files for a session"""
    if session_code not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    # Add base64 encoded image data to response
    files_with_data = []
    for file in sessions[session_code]['files']:
        file_copy = file.copy()
        image_data = images.get(file['image_id'])
        if image_data:
            file_copy['data_url'] = f"data:image/jpeg;base64,{base64.b64encode(image_data).decode('utf-8')}"
        files_with_data.append(file_copy)
    
    return jsonify({
        'files': files_with_data
    }), 200

@app.route('/api/images/<image_id>')
def get_image(image_id):
    """Serve images from memory"""
    if image_id not in images:
        return jsonify({'error': 'Image not found'}), 404
    
    return send_file(
        io.BytesIO(images[image_id]),
        mimetype='image/jpeg'
    )

@app.route('/api/session/<session_code>/favorites', methods=['GET'])
def get_favorites(session_code):
    """Get favorite images for a session"""
    if session_code not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    favorites = [f for f in sessions[session_code]['files'] if f['status'] == 'favorite']
    
    # Add base64 encoded image data to response
    favorites_with_data = []
    for favorite in favorites:
        favorite_copy = favorite.copy()
        image_data = images.get(favorite['image_id'])
        if image_data:
            favorite_copy['data_url'] = f"data:image/jpeg;base64,{base64.b64encode(image_data).decode('utf-8')}"
        favorites_with_data.append(favorite_copy)
    
    return jsonify({
        'favorites': favorites_with_data
    }), 200

@socketio.on('connect')
def on_connect():
    """Handle client connection"""
    print('Client connected', request.sid)

@socketio.on('disconnect')
def on_disconnect():
    """Handle client disconnection"""
    print('Client disconnected', request.sid)
    
    # Update connection status in sessions
    for code, session in sessions.items():
        if session.get('uploader_sid') == request.sid:
            session['uploader_connected'] = False
            emit('uploader_disconnected', {'session_code': code}, room=code)
        elif session.get('selector_sid') == request.sid:
            session['selector_connected'] = False
            emit('selector_disconnected', {'session_code': code}, room=code)

@socketio.on('join_session')
def on_join_session(data):
    """Join a session room"""
    session_code = data.get('session_code')
    role = data.get('role')  # 'uploader' or 'selector'
    
    if not session_code or session_code not in sessions:
        emit('error', {'message': 'Invalid session code'})
        return
    
    join_room(session_code)
    
    if role == 'uploader':
        sessions[session_code]['uploader_connected'] = True
        sessions[session_code]['uploader_sid'] = request.sid
        emit('uploader_joined', {'session_code': session_code}, room=session_code)
    elif role == 'selector':
        sessions[session_code]['selector_connected'] = True
        sessions[session_code]['selector_sid'] = request.sid
        emit('selector_joined', {'session_code': session_code}, room=session_code)
    
    # Prepare files with data URLs for sending over socket
    files_with_data = []
    for file in sessions[session_code]['files']:
        file_copy = file.copy()
        image_data = images.get(file['image_id'])
        if image_data:
            file_copy['data_url'] = f"data:image/jpeg;base64,{base64.b64encode(image_data).decode('utf-8')}"
        files_with_data.append(file_copy)
    
    # Send current session state
    emit('session_update', {
        'files': files_with_data,
        'uploader_connected': sessions[session_code]['uploader_connected'],
        'selector_connected': sessions[session_code]['selector_connected']
    }, room=session_code)

@socketio.on('update_file_status')
def on_update_file_status(data):
    """Update file status (favorite/discard)"""
    session_code = data.get('session_code')
    file_id = data.get('file_id')
    status = data.get('status')  # 'favorite' or 'discard'
    
    if not session_code or session_code not in sessions:
        emit('error', {'message': 'Invalid session code'})
        return
    
    # Find and update the file
    for file in sessions[session_code]['files']:
        if file['id'] == file_id:
            file['status'] = status
            break
    
    # Broadcast the update to all clients in the room
    emit('file_status_updated', {
        'file_id': file_id,
        'status': status
    }, room=session_code)
    
    # Prepare files with data URLs for sending over socket
    files_with_data = []
    for file in sessions[session_code]['files']:
        file_copy = file.copy()
        image_data = images.get(file['image_id'])
        if image_data:
            file_copy['data_url'] = f"data:image/jpeg;base64,{base64.b64encode(image_data).decode('utf-8')}"
        files_with_data.append(file_copy)
    
    # Send the updated files list
    emit('session_update', {
        'files': files_with_data,
        'uploader_connected': sessions[session_code]['uploader_connected'],
        'selector_connected': sessions[session_code]['selector_connected']
    }, room=session_code)

@app.route('/api/session/<session_code>/download_favorites', methods=['GET'])
def download_favorites_zip(session_code):
    """Create a zip file of favorite images for download"""
    import zipfile
    from io import BytesIO
    
    if session_code not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    favorites = [f for f in sessions[session_code]['files'] if f['status'] == 'favorite']
    
    if not favorites:
        return jsonify({'error': 'No favorite images found'}), 404
    
    # Create a zip file in memory
    memory_file = BytesIO()
    with zipfile.ZipFile(memory_file, 'w') as zf:
        for favorite in favorites:
            if favorite['image_id'] in images:
                # Use original filename if available
                arc_name = favorite.get('original_name', f"{favorite['id']}.jpg")
                zf.writestr(arc_name, images[favorite['image_id']])
    
    memory_file.seek(0)
    return send_file(
        memory_file,
        mimetype='application/zip',
        as_attachment=True,
        download_name=f"favorites_{session_code}.zip"
    )

@app.route('/')
def index():
    """Serve the main application page"""
    return app.send_static_file('index.html')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)