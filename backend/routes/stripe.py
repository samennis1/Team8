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
            country='IE',
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

        item = line_items[0]
        amount = item['price_data']['unit_amount'] * item.get('quantity', 1)
        currency = item['price_data']['currency']
        application_fee_amount = int(amount * 0.1)

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






