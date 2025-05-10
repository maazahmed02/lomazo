from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from extensions import db, migrate  # Import db and migrate from extensions.py
from create_app import create_app

# Create the Flask app instance
app = create_app()

@app.route('/api/lifestyle', methods=['POST'])
def lifestyle():
    data = request.json
    print('Received form data:', data)
    return jsonify({'received': data}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5050)