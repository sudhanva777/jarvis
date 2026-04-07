"""
Flask server for personal model API
Runs on port 5051
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import threading
from inference import predict_signals, add_training_sample, run_incremental_training

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load config
config_path = os.path.join(os.path.dirname(__file__), 'config.json')
with open(config_path, 'r') as f:
    config = json.load(f)

print(f"[PERSONAL_MODEL_SERVER] Server starting...")
print(f"[PERSONAL_MODEL_SERVER] Using device: {'cuda' if __import__('torch').cuda.is_available() else 'cpu'}")


@app.route('/personal_model/predict', methods=['POST'])
def predict():
    """Predict emotion, command, and tone from text"""
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({
                'success': False,
                'message': 'No text provided'
            }), 400
        
        result = predict_signals(text, config)
        
        print(f"[PERSONAL_MODEL] Prediction: emotion={result['emotion']}, command={result['command_hint']}, tone={result['tone_pref']}")
        
        return jsonify({
            'success': True,
            **result
        })
    except Exception as e:
        print(f"[PERSONAL_MODEL] Prediction error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/personal_model/add_sample', methods=['POST'])
def add_sample():
    """Add training sample and optionally trigger training"""
    try:
        data = request.json
        
        required_fields = ['input_text', 'emotion_label', 'command_label', 'tone_label']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Add sample
        success = add_training_sample(data, config)
        
        if not success:
            return jsonify({
                'success': False,
                'message': 'Failed to add sample'
            }), 500
        
        # Optionally trigger incremental training in background
        trigger_training = data.get('trigger_training', True)
        if trigger_training:
            # Run training in background thread
            def train_async():
                try:
                    num_steps = config.get('train_steps_per_update', 20)
                    run_incremental_training(config, num_steps)
                except Exception as e:
                    print(f"[PERSONAL_MODEL] Background training error: {e}")
            
            thread = threading.Thread(target=train_async)
            thread.daemon = True
            thread.start()
        
        return jsonify({
            'success': True,
            'message': 'Sample added successfully'
        })
    except Exception as e:
        print(f"[PERSONAL_MODEL] Add sample error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/personal_model/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'online',
        'device': 'cuda' if __import__('torch').cuda.is_available() else 'cpu'
    })


if __name__ == '__main__':
    # Create checkpoints directory if needed
    os.makedirs('checkpoints', exist_ok=True)
    
    port = 5051
    print(f"[PERSONAL_MODEL_SERVER] Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)

