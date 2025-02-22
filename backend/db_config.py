import firebase_admin
from firebase_admin import credentials, firestore


def get_db():
    try:
        firebase_admin.get_app()
    except ValueError:
        # If not, initialize the app.
        cred = credentials.Certificate('firebase_config.json')
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    return db