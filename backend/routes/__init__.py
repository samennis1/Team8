from flask import Blueprint

# Import individual route modules
from .chat import chat_bp
from .user import user_bp

# Define a function to register Blueprints
def register_blueprints(app):
    app.register_blueprint(chat_bp, url_prefix="/api")
    app.register_blueprint(user_bp)