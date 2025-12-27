import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.tree import DecisionTreeClassifier
import pickle

# Load data
data = pd.read_csv("crop_data.csv")

# Encode text to numbers
le_soil = LabelEncoder()
le_season = LabelEncoder()
le_rain = LabelEncoder()
le_crop = LabelEncoder()

data['soil'] = le_soil.fit_transform(data['soil'])
data['season'] = le_season.fit_transform(data['season'])
data['rainfall'] = le_rain.fit_transform(data['rainfall'])
data['crop'] = le_crop.fit_transform(data['crop'])

X = data[['soil', 'season', 'rainfall', 'temp']]
y = data['crop']

# Train model
model = DecisionTreeClassifier()
model.fit(X, y)

# Save model
pickle.dump(model, open("crop_model.pkl", "wb"))
pickle.dump(le_soil, open("soil.pkl", "wb"))
pickle.dump(le_season, open("season.pkl", "wb"))
pickle.dump(le_rain, open("rain.pkl", "wb"))
pickle.dump(le_crop, open("crop.pkl", "wb"))

print("Model trained successfully")
