"""
Camera-based Emotion Detection using MediaPipe and FER
Detects emotions from webcam feed
"""

import cv2
import numpy as np
import json
import time
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Try to import emotion detection libraries
try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except:
    MEDIAPIPE_AVAILABLE = False
    print("[CAMERA_EMOTION] MediaPipe not available")

try:
    from fer import FER
    FER_AVAILABLE = True
except:
    FER_AVAILABLE = False
    print("[CAMERA_EMOTION] FER not available")

# Emotion labels
EMOTION_LABELS = ["sad", "angry", "happy", "surprised", "neutral", "tired"]

# Global detector
emotion_detector = None
mp_face_detection = None

def init_detector():
    """Initialize emotion detector"""
    global emotion_detector, mp_face_detection
    
    if FER_AVAILABLE:
        try:
            emotion_detector = FER(mtcnn=True)
            print("[CAMERA_EMOTION] FER detector initialized")
            return True
        except Exception as e:
            print(f"[CAMERA_EMOTION] FER init error: {e}")
    
    if MEDIAPIPE_AVAILABLE:
        try:
            mp_face_detection = mp.solutions.face_detection
            print("[CAMERA_EMOTION] MediaPipe initialized")
            return True
        except Exception as e:
            print(f"[CAMERA_EMOTION] MediaPipe init error: {e}")
    
    return False

def detect_emotion_simple(frame):
    """Simple emotion detection (fallback)"""
    # Placeholder - returns neutral if no detector available
    return {
        "emotion": "neutral",
        "confidence": 0.5,
        "method": "fallback"
    }

def detect_emotion_fer(frame):
    """Detect emotion using FER"""
    try:
        if emotion_detector is None:
            return detect_emotion_simple(frame)
        
        emotions = emotion_detector.detect_emotions(frame)
        
        if emotions and len(emotions) > 0:
            # Get first face's emotions
            face_emotions = emotions[0]['emotions']
            
            # Map FER emotions to our labels
            emotion_map = {
                'sad': 'sad',
                'angry': 'angry',
                'happy': 'happy',
                'surprise': 'surprised',
                'neutral': 'neutral',
                'fear': 'stressed',
                'disgust': 'irritated'
            }
            
            # Find dominant emotion
            dominant_emotion = max(face_emotions.items(), key=lambda x: x[1])
            mapped_emotion = emotion_map.get(dominant_emotion[0], 'neutral')
            
            return {
                "emotion": mapped_emotion,
                "confidence": dominant_emotion[1],
                "method": "FER",
                "all_emotions": face_emotions
            }
        
        return detect_emotion_simple(frame)
    except Exception as e:
        print(f"[CAMERA_EMOTION] FER detection error: {e}")
        return detect_emotion_simple(frame)

@app.route('/camera/emotion', methods=['GET'])
def get_emotion():
    """Get current emotion from camera"""
    try:
        # Try to capture from webcam
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            return jsonify({
                "success": False,
                "emotion": "neutral",
                "message": "Camera not available"
            })
        
        ret, frame = cap.read()
        cap.release()
        
        if not ret:
            return jsonify({
                "success": False,
                "emotion": "neutral",
                "message": "Failed to capture frame"
            })
        
        # Detect emotion
        if FER_AVAILABLE and emotion_detector:
            result = detect_emotion_fer(frame)
        else:
            result = detect_emotion_simple(frame)
        
        return jsonify({
            "success": True,
            **result,
            "timestamp": time.time()
        })
    except Exception as e:
        print(f"[CAMERA_EMOTION] Error: {e}")
        return jsonify({
            "success": False,
            "emotion": "neutral",
            "message": str(e)
        })

@app.route('/camera/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        "status": "online",
        "fer_available": FER_AVAILABLE,
        "mediapipe_available": MEDIAPIPE_AVAILABLE
    })

if __name__ == '__main__':
    init_detector()
    port = 5052
    print(f"[CAMERA_EMOTION] Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)

