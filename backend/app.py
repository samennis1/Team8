from flask import Flask
from routes import register_blueprints

app = Flask(__name__)
register_blueprints(app)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True) # allow the server and client running on different machine
    # app.run(debug=True)