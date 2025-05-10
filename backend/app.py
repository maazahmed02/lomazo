from flask import Flask
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.create_app import create_app

# Create the Flask app instance
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5050)