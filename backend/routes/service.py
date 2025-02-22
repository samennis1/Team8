from flask import Blueprint, jsonify, request
from services import evaluate_price, generate_location

service_bp = Blueprint("service", __name__)

@service_bp.route('/generate-location', methods=['POST'])
def call_generate_location():
    # Get parameters from the JSON body
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON payload provided"}), 400

    lat1 = data.get("lat1")
    lon1 = data.get("lon1")
    lat2 = data.get("lat2")
    lon2 = data.get("lon2")

    # Validate that required parameters are provided
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return jsonify({"error": "Missing parameters"}), 400

    result = generate_location(lat1, lon1, lat2, lon2)
    return jsonify({"result": result}), 200

@service_bp.route('/evaluate-price', methods=['POST'])
def call_evaluate_price():
    # Get parameters from the JSON body
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON payload provided"}), 400

    desc = data.get("desc")
    price = data.get("price")

    # Validate that required parameters are provided
    if desc is None or price is None:
        return jsonify({"error": "Missing parameters"}), 400

    result = evaluate_price(desc, price)
    return jsonify({"result": result}), 200