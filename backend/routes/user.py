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
    print(request)
    user_data = request.get_json()
    if not user_data:
        return jsonify({"error": "No user data provided"}), 400

    email = user_data.get("email")
    password = user_data.get("password")
    location = user_data.get("location")

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
    user_data["location"] = location
    user_data["chats"] = []
    user_data["isSeller"] = False
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
    location = data.get("location")
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user_id = email.lower()
    user_ref = db.collection("user").document(user_id)
    user_doc = user_ref.get()
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
        
        # If location data is provided, update the user's location in Firestore
        if location and isinstance(location, dict):
            lat = location.get("latitude")
            lon = location.get("longitude")
            if lat is not None and lon is not None:
                try:
                    db.collection("user").document(user_id).update({
                        "location": {
                            "lattitude": lat,
                            "longitude": lon
                        }
                    })
                except Exception as e:
                    return jsonify({"error": f"Failed to update location: {str(e)}"}), 500
        
        return jsonify({"message": "Login successful", "token": token, "isSeller": user_doc.to_dict()["isSeller"]}), 200
    else:
        # Password does not match
        return jsonify({"error": "Invalid credentials"}), 401

    
@user_bp.route('/logout', methods=['POST'])
def logout():
    """
    Log out a user.
    """
    return jsonify({"message": "Logout successful. Please discard your token on the client side."}), 200

# Get user location by id
@user_bp.route("/api/users/<user_id>/location", methods=["GET"])
def get_user(user_id):
    user_ref = db.collection("user").document(user_id)
    user_doc = user_ref.get()
    
    if user_doc.exists:
        return jsonify(user_doc.to_dict()["location"]), 200
    else:
        return jsonify({"error": f"Chat with id {user_id} not found"}), 404