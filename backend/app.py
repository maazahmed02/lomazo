from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Database URI configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(basedir, 'instance', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# Initialize Migrate (for handling database migrations)
migrate = Migrate(app, db)

# Import models (will use models from the models.py file)
from models import *

@app.route('/api/lifestyle', methods=['POST'])
def lifestyle():
    data = request.json
    print('Received form data:', data)
    return jsonify({'received': data}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5050)