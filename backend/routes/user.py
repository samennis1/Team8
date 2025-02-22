import jwt
import bcrypt
import datetime
from flask import Blueprint, request, jsonify
from db_config import get_db
import os
from dotenv import load_dotenv

load_dotenv()

user_bp = Blueprint("user", __name__)
db = get_db()

# Secret key for JWT signing – in production, load this from an environment variable
SECRET_KEY = os.getenv("JWT_KEY")

@user_bp.route('/signup', methods=['POST'])
def signup():
    """
    Create a new user account.
    Expects a JSON payload with 'email' and 'password'.
    Uses the email (converted to lowercase) as the unique identifier.
    """
    user_data = request.get_json()
    if not user_data:
        return jsonify({"error": "No user data provided"}), 400

    email = user_data.get("email")
    password = user_data.get("password")
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    
    # Use email (in lowercase) as the unique identifier
    user_id = email.lower()
    user_ref = db.collection("user").document(user_id)

    # Check if the user already exists
    if user_ref.get().exists:
        return jsonify({"error": "User already exists"}), 400
    
    # Hash the password using bcrypt
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    # Decode to store as a string in Firestore
    hashed_pw_str = hashed_pw.decode('utf-8')
    user_data["password"] = hashed_pw_str
    user_data["email"] = email.lower()  # Ensure email is stored consistently

    # Create the new user document in Firestore
    try:
        user_ref.set(user_data)
        return jsonify({"message": "User created successfully", "user_id": user_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@user_bp.route('/login', methods=['POST'])
def login():
    """
    Log in a user by verifying email and password.
    On successful authentication, returns a JWT token.
    Expects a JSON payload with 'email' and 'password'.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No login data provided"}), 400

    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user_id = email.lower()
    user_doc = db.collection("user").document(user_id).get()
    if not user_doc.exists:
        return jsonify({"error": "User does not exist"}), 404

    user = user_doc.to_dict()
    stored_hashed_pw = user.get("password")
    # Compare the provided password with the stored hashed password
    if bcrypt.checkpw(password.encode('utf-8'), stored_hashed_pw.encode('utf-8')):
        # Create a JWT payload with an expiration time (e.g., 2 hour)
        payload = {
            "sub": user_id,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
        return jsonify({"message": "Login successful", "token": token}), 200
    else:
        # Password does not match
        return jsonify({"error": "Invalid credentials"}), 401

    
@user_bp.route('/logout', methods=['POST'])
def logout():
    """
    Log out a user.
    """
    return jsonify({"message": "Logout successful. Please discard your token on the client side."}), 200
