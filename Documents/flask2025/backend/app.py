from flask import Flask, request, jsonify, render_template
import pickle
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load ML models
model = pickle.load(open("ML/crop_model.pkl", "rb"))
le_soil = pickle.load(open("ML/soil.pkl", "rb"))
le_season = pickle.load(open("ML/season.pkl", "rb"))
le_rain = pickle.load(open("ML/rain.pkl", "rb"))
le_crop = pickle.load(open("ML/crop.pkl", "rb"))

# Home page (Frontend)
@app.route("/index1", methods=["GET"])
def home():
    return render_template("index.html")
# Home page (Frontend)
@app.route("/home", methods=["GET"])
def home1():
    return render_template("home.html")


# Prediction API
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    soil = le_soil.transform([data["soil"]])[0]
    season = le_season.transform([data["season"]])[0]
    rain = le_rain.transform([data["rainfall"]])[0]
    temp = data["temp"]

    result = model.predict([[soil, season, rain, temp]])
    crop = le_crop.inverse_transform(result)[0]

    return jsonify({"recommended_crop": crop})

if __name__ == "__main__":
    app.run(debug=True)
