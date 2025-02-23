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
    return result, 200

@service_bp.route('/evaluate-price', methods=['POST'])
def call_evaluate_price():
    # Get parameters from the JSON body
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON payload provided"}), 400

    desc = data.get("desc")
    price = data.get("price")
    seller_name = data.get("seller")
    image_urls = data.get("image_urls")
    # image_urls = [
    #     "https://forums.macrumors.com/attachments/1721668/",
    #     "https://www.thesun.co.uk/wp-content/uploads/2020/11/IMG_0577-2.jpg?strip=all&w=960",
    # ]

    # Validate that required parameters are provided
    if desc is None or price is None or image_urls is None:
        return jsonify({"error": "Missing parameters"}), 400

    result = evaluate_price(desc, price, seller_name, image_urls)
    return result, 200