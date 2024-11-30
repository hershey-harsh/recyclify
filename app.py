from flask import Flask, render_template, request, jsonify
import requests
from keras.models import load_model
from keras.layers import DepthwiseConv2D
from PIL import Image, ImageOps
import numpy as np
import recycle_data

app = Flask(__name__)

items_real_names = {
    "cardboard_boxes": "Cardboard Boxes",
    "cardboard_packaging": "Cardboard Packaging",
    "magazines": "Magazines",
    "newspaper": "Newspaper",
    "office_paper": "Office Paper",
    "aluminum_food_cans": "Aluminum Food Cans",
    "aluminum_soda_cans": "Aluminum Soda Cans",
    "metal_food_cans": "Metal Food Cans",
    "metal_food_containers": "Metal Food Containers",
    "glass_beverage_bottles": "Glass Beverage Bottles",
    "glass_cosmetic_containers": "Glass Cosmetic Containers",
    "glass_food_jars": "Glass Food Jars",
    "plastic_detergent_bottles": "Plastic Detergent Bottles",
    "plastic_soda_bottles": "Plastic Soda Bottles",
    "plastic_cup_lids": "Plastic Cup Lids",
    "plastic_straws": "Plastic Straws",
    "plastic_shopping_bags": "Plastic Shopping Bags",
    "plastic_food_containers": "Plastic Food Containers",
    "coffee_grounds": "Coffee Grounds",
    "eggshells": "Eggshells",
    "food_waste": "Food Waste",
    "clothing": "Clothing",
    "paper_cups": "Paper Cups",
    "aerosol_cans": "Aerosol Cans",
    "disposable_plastic_cutlery": "Plastic Cutlery",
    "plastic_cup_lids": "Plastic Cup Lids",
    "plastic_straws": "Plastic Straws",
}

recyclable_paper_items = [
    "cardboard_boxes",
    "cardboard_packaging",
    "magazines",
    "newspaper",
    "office_paper",
    "paper_cups",
]

recyclable_metal_items = [
    "aluminum_food_cans",
    "aluminum_soda_cans",
    "metal_food_cans",
    "metal_food_containers",
]

recyclable_glass_items = [
    "glass_beverage_bottles",
    "glass_cosmetic_containers",
    "glass_food_jars",
]

recyclable_plastic_items_1_2 = [
    "plastic_detergent_bottles",
    "plastic_soda_bottles",
    'plastic_cup_lids',
    'plastic_straws',
]

recyclable_plastic_items_3 = [
]

recyclable_plastic_items_4 = [
    "plastic_shopping_bags",
]

recyclable_plastic_items_5 = [
]

recyclable_plastic_items_6 = [
    "plastic_food_containers",
]

compostable_items = [
    'coffee_grounds',
    'eggshells',
    'food_waste',
]

reusable_items = [
    'clothing',
]

trash_items = [
    'aerosol_cans',
    'disposable_plastic_cutlery',
    'plastic_cup_lids',
    'plastic_straws',
]

recycle_paper = "Paper products like cardboard, newspapers, and office paper can be broken down into pulp and reformed into new products, conserving resources and energy."
recycle_metal = "Aluminum and steel cans can be melted and reshaped infinitely without quality loss, helping conserve raw materials and reduce pollution."
recycle_glass = "Glass bottles and jars can be melted and reformed without losing purity. Sorting by type improves recycling efficiency."
recycle_plastic_1_2 = "Plastics Type 1 and 2, like soda bottles and detergent containers, can be broken down and remade into new products."
recycle_plastic_any = "Plastics Types 3–6 are harder to recycle. Some, like plastic bags (Type 4), may be recyclable through special programs."
recycle_compost = "Food waste and organic materials decompose into compost, enriching soil and reducing methane emissions."
recycle_reusable = "Items like clothing can be reused, donated, or repurposed, reducing landfill waste and conserving resources."
recycle_trash = "Items that can’t be recycled or reused, like aerosol cans and plastic cutlery, must be disposed of safely to avoid contaminating recycling."

# Custom function to handle the 'groups' argument
class CustomDepthwiseConv2D(DepthwiseConv2D):
    def __init__(self, **kwargs):
        # Remove the 'groups' argument if present
        kwargs.pop('groups', None)
        super().__init__(**kwargs)

# Load the model with the custom layer
model = load_model("keras_model.h5", custom_objects={'DepthwiseConv2D': CustomDepthwiseConv2D}, compile=False)

class_names = open("labels.txt", "r").readlines()

data = np.ndarray(shape=(1, 224, 224, 3), dtype=np.float32)

# Mappings for category and explanation
def get_category_and_explanation(item):
    """Return the category and explanation for the given item."""
    
    # Check if the item is in any of the recyclable categories
    if item in recyclable_paper_items:
        return 'Recyclable Paper', recycle_paper
    elif item in recyclable_metal_items:
        return 'Recyclable Metal', recycle_metal
    elif item in recyclable_glass_items:
        return 'Recyclable Glass', recycle_glass
    elif item in recyclable_plastic_items_1_2:
        return 'Recyclable Plastic (1 & 2)', recycle_plastic_1_2
    elif item in recyclable_plastic_items_3:
        return 'Recyclable Plastic (3)', recycle_plastic_any
    elif item in recyclable_plastic_items_4:
        return 'Recyclable Plastic (4)', recycle_plastic_any
    elif item in recyclable_plastic_items_5:
        return 'Recyclable Plastic (5)', recycle_plastic_any
    elif item in recyclable_plastic_items_6:
        return 'Recyclable Plastic (6)', recycle_plastic_any
    elif item in compostable_items:
        return 'Compostable', recycle_compost
    elif item in reusable_items:
        return 'Reusable', recycle_reusable
    elif item in trash_items:
        return 'Trash', recycle_trash
    else:
        return 'Unknown', 'No information available for this item.'

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/predict', methods=['POST'])
def predict():
    # Check if a file was uploaded
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    
    if file:
        # Load and preprocess the image
        image = Image.open(file).convert('RGB')
        image = ImageOps.fit(image, (224, 224), Image.Resampling.LANCZOS)
        image_array = np.asarray(image) / 255.0  # Normalize to [0, 1]
        data[0] = image_array

        # Run prediction
        prediction = model.predict(data)
        predicted_index = np.argmax(prediction)
        confidence = float(prediction[0][predicted_index]) * 100  # Convert to native Python float
        category = class_names[predicted_index].strip()

        # Get category and explanation
        item_category, explanation = get_category_and_explanation(category)

        # Construct result
        result = {
            'item': items_real_names.get(category, category),  # Use real item name from the dictionary
            'confidence': confidence,
            'category': item_category,
            'explanation': explanation
        }

        return jsonify(result)

    return jsonify({'error': 'Invalid file'}), 400


if __name__ == "__main__":
    app.run(debug=True, port=5000)
