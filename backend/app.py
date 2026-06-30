from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from parser import parse_and_validate_trades
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
        if not data or 'trades' not in data:
            return jsonify({"success": False, "error": "No trades provided"}), 400
        user_slab = float(data.get('user_slab', 0.0))
        validated, errors = parse_and_validate_trades(data['trades'])
        if errors: return jsonify({"success": False, "errors": errors}), 400
        if not validated: return jsonify({"success": False, "error": "No valid trades"}), 400
        summary, trades = calculate_tax(validated, user_slab)
        return jsonify({"success": True, "summary": summary, "trades": trades})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/health')
def health(): return jsonify({"status": "ok"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
