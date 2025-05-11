from flask import Flask, request, jsonify
from flask_cors import CORS
from routes.documents import documents_bp
import os
from config import SECRET_KEY, DEBUG, PORT

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# App configuration
app.config['SECRET_KEY'] = SECRET_KEY

# Register blueprints
app.register_blueprint(documents_bp, url_prefix='/api/documents')

# Create temp directory if it doesn't exist
basedir = os.path.abspath(os.path.dirname(__file__))
os.makedirs(os.path.join(basedir, 'temp'), exist_ok=True)

@app.route('/api/lifestyle', methods=['POST'])
def lifestyle():
    data = request.json
    
    try:
        # Process the lifestyle data (without database)
        response_data = {
            'smoking_status': data.get('smoking_status'),
            'alcohol_use': data.get('alcohol_consumption'),
            'exercise_frequency': data.get('exercise_frequency'),
            'diet_type': data.get('diet_type')
        }

        return jsonify({
            'message': 'Form data received successfully',
            'data': response_data
        }), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to process data',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=DEBUG, port=PORT)