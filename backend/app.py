from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from calculator import calculate_tax

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

@app.route('/')
def index(): return send_from_directory(app.static_folder, 'index.html')

@app.route('/result')
def result(): return send_from_directory(app.static_folder, 'result.html')

@app.route('/calculate', methods=['POST'])
def calc():
    try:
        data = request.get_json()
        result = calculate_tax(data)
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/health')
def health(): return jsonify({"status": "ok"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
