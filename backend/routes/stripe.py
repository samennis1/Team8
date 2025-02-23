from flask import Blueprint, jsonify, request
import stripe
import os

stripe_bp = Blueprint("stripe", __name__)

stripe.api_key = os.getenv('STRIPE_KEY')
deploy_url = os.getenv('DEPLOY_URL')

@stripe_bp.route('/create-connect-account', methods=['POST'])
def create_connect_account():
    try:
        account = stripe.Account.create(
            type='express',
            country='US',
            email=request.json['email'],
            capabilities={
                'transfers': {'requested': True},
            },
        )
        account_link = stripe.AccountLink.create(
            account=account.id,
            refresh_url=f'${deploy_url}/stripe/create-connect-account',
            return_url=f'${request.json["return_url"]}/',
            type='account_onboarding',
        )
        return jsonify({'url': account_link.url})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@stripe_bp.route('/create-payment-intent', methods=['POST'])
def create_payment_intent():
    try:
        data = request.json
        line_items = data.get('line_items', [])
        if not line_items:
            return jsonify({'error': 'No line items provided'}), 400

        # For simplicity, assume one line item; in production, sum up all items.
        item = line_items[0]
        amount = item['price_data']['unit_amount'] * item.get('quantity', 1)
        currency = item['price_data']['currency']

        # Create a PaymentIntent without specifying a customer.
        payment_intent = stripe.PaymentIntent.create(
            amount=amount,
            currency=currency,
            payment_method_types=['card'],
        )
        return jsonify({'clientSecret': payment_intent.client_secret})
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    
    
@stripe_bp.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        print("Running")
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=request.json['line_items'],
            mode='payment',
            success_url=f'{request.json["return_url"]}' + '?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=f'{request.json["return_url"]}',
        )
        return jsonify({'id': session.id})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# @stripe_bp.route('/webhook', methods=['POST'])
# def stripe_webhook():
#     payload = request.get_data(as_text=True)
#     sig_header = request.headers.get('Stripe-Signature')
#     endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')

#     try:
#         event = stripe.Webhook.construct_event(
#             payload, sig_header, endpoint_secret
#         )
#     except ValueError as e:
#         return jsonify({'error': 'Invalid payload'}), 400
#     except stripe.error.SignatureVerificationError as e:
#         return jsonify({'error': 'Invalid signature'}), 400

#     if event['type'] == 'checkout.session.completed':
#         session = event['data']['object']
#         handle_checkout_session(session)

#     return jsonify({'status': 'success'})

# def handle_checkout_session(session):
#     order_id = session['client_reference_id']
#     update_order_status(order_id, 'paid')

# def update_order_status(order_id, status):
#     pass