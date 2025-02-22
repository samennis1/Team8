import firebase_admin
from firebase_admin import credentials, firestore


def get_db():
    cred = credentials.Certificate('team8-c4beb-firebase-adminsdk-fbsvc-e87c98049e.json')
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    return db