from datetime import datetime
from flask import Blueprint, jsonify, request
from db_config import get_db
from firebase_admin import firestore
from utils import generate_otp_token

product_bp = Blueprint("product", __name__)

db = get_db()

# Get products
@product_bp.route("/products", methods=["GET"])
def get_all_products():
    products = []
    product_docs = db.collection("product").get()
    
    for doc in product_docs:
        product_data = doc.to_dict()
        product_data['product_id'] = doc.id
        products.append(product_data)
    
    return jsonify(products), 200

# Get product by id
@product_bp.route("/products/<product_id>", methods=["GET"])
def get_product(product_id):
    product_ref = db.collection("product").document(product_id)
    product_doc = product_ref.get()
    
    if product_doc.exists:
        return jsonify(product_doc.to_dict()), 200
    else:
        return jsonify({"error": f"Chat with id {product_id} not found"}), 404

# Update product
@product_bp.route("/products/<product_id>", methods=["PATCH"])
def update_product(product_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No product data provided"}), 400
    
    update_payload = {}

    for field in data.keys():
        update_payload[field] = data.get(field)

    product_ref = db.collection("product").document(product_id)
    
    try:
        product_ref.update(update_payload)
        return jsonify({"message": "Product information updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@product_bp.route('/products', methods=['POST'])
def create_chat():
    product_data = request.get_json()

    product_ref = db.collection("product").document()
    product_ref.set(product_data)

    return jsonify({"message": "Product created successfully", "product_id": product_ref.id}), 201