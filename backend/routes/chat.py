from datetime import datetime
from flask import Blueprint, jsonify, request
from db_config import get_db
from firebase_admin import firestore
from utils import generate_otp_token

chat_bp = Blueprint("chat", __name__)

db = get_db()

# Get all chats
@chat_bp.route("/chats", methods=["GET"])
def get_all_chats():
    chats = []
    chat_docs = db.collection("chat").get()
    
    for doc in chat_docs:
        chat_data = doc.to_dict()
        chat_data['chat_id'] = doc.id
        chats.append(chat_data)
    
    return jsonify(chats), 200

# Get chat by id
@chat_bp.route("/chats/<chat_id>", methods=["GET"])
def get_chat(chat_id):
    chat_ref = db.collection("chat").document(chat_id)
    chat_doc = chat_ref.get()
    
    if chat_doc.exists:
        return jsonify(chat_doc.to_dict()), 200
    else:
        return jsonify({"error": f"Chat with id {chat_id} not found"}), 404

# Add message to a specific chat
@chat_bp.route("/chats/<chat_id>/message", methods=["PATCH"])
def add_message(chat_id):
    message_data = request.get_json()
    if not message_data:
        return jsonify({"error": "No message data provided"}), 400
    
    if "sender" not in message_data or "text" not in message_data:
        return jsonify({"error": "Missing required fields: 'sender' and 'text'"}), 400

    if "time" not in message_data:
        message_data["timestamp"] = datetime.utcnow()

    chat_ref = db.collection("chat").document(chat_id)
    
    try:
        chat_ref.update({
            "messages": firestore.ArrayUnion([message_data])
        })
        return jsonify({"message": "New message added successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Change meetup status
@chat_bp.route('/chats/<chat_id>/meetup/agree', methods=['PATCH'])
def agree_meetup(chat_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No meetup details provided"}), 400

    # Generate an OTP token automatically
    otp_token = generate_otp_token()

    # Build the update payload
    update_payload = {
        "meetup.agreed": True,
        "meetup.time": data.get("time"),
        "meetup.location": data.get("location"),
        "meetup.price": data.get("price"),
        "otp.token": otp_token,
        "otp.confirmed": False
    }
 
    # Reference the specific chat document
    chat_ref = db.collection("chat").document(chat_id)
    try:
        chat_ref.update(update_payload)
        return jsonify({
            "message": "Meetup agreed and document updated successfully.",
            "otp_token": otp_token  # Return OTP for reference (e.g., to send to the buyer)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chat_bp.route('/chats', methods=['POST'])
def create_chat():
    chat_data = {
        "meetup": {
            "agreed": False,
            "location": {
                "lat": "",
                "long": ""
            },
            "price": "",
            "time": ""
        },
        "messages": [],
        "otp": {
            "confirmed": False,
            "token": ""
        }
    }

    chat_ref = db.collection("chat").document()
    chat_ref.set(chat_data)

    return jsonify({"message": "Chat created successfully", "chat_id": chat_ref.id}), 201

# Update chat
@chat_bp.route('/chats/<chat_id>', methods=['PATCH'])
def update_chat(chat_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No chat data provided"}), 400
    
    update_payload = {}

    for field in data.keys():
        update_payload[field] = data.get(field)

    # Check if meetup.agreed is being set to true
    if data.get("meetup.agreed") == True:
        otp_token = generate_otp_token()
        update_payload["otp.token"] = otp_token
        update_payload["otp.confirmed"] = False

    chat_ref = db.collection("chat").document(chat_id)
    
    try:
        chat_ref.update(update_payload)
        return jsonify({"message": "Chat information updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chat_bp.route('/chats/<chat_id>/confirm-otp', methods=['PATCH'])
def confirm_otp(chat_id):
    data = request.get_json()
    if not data or 'otp' not in data:
        return jsonify({"error": "No OTP provided"}), 400

    chat_ref = db.collection("chat").document(chat_id)
    chat_doc = chat_ref.get()

    if not chat_doc.exists:
        return jsonify({"error": f"Chat with id {chat_id} not found"}), 404

    chat_data = chat_doc.to_dict()
    if chat_data['otp']['token'] == data['otp']:
        chat_ref.update({
            "otp.confirmed": True
        })
        return jsonify({"message": "OTP confirmed successfully"}), 200
    else:
        return jsonify({"error": "Invalid OTP"}), 400