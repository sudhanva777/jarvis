"""
Inference bridge for personal model
"""

import torch
import json
import os
from tiny_transformer import build_model, get_device, SimpleTokenizer
from train_step import load_or_init_model


def load_model_for_inference(config):
    """Load model for inference"""
    model, tokenizer, device = load_or_init_model(config)
    model.eval()  # Set to evaluation mode
    return model, tokenizer, device


def predict_signals(text, config=None):
    """
    Predict emotion, command hint, and tone preference
    Returns:
        {
            "emotion": "sad|angry|stressed|happy|neutral",
            "command_hint": "open_app|open_folder|none|...",
            "tone_pref": "very_soft|soft|neutral|slightly_firm",
            "raw": { ... logits or probabilities ... }
        }
    """
    try:
        if config is None:
            with open('config.json', 'r') as f:
                config = json.load(f)
        
        model, tokenizer, device = load_model_for_inference(config)
        
        # Tokenize input
        token_ids = tokenizer.encode(text).unsqueeze(0).to(device)
        
        # Forward pass
        with torch.no_grad():
            output = model(token_ids)
        
        # Get predictions (argmax)
        emotion_logits = output['emotion_logits'][0]
        command_logits = output['command_logits'][0]
        tone_logits = output['tone_logits'][0]
        
        emotion_id = torch.argmax(emotion_logits).item()
        command_id = torch.argmax(command_logits).item()
        tone_id = torch.argmax(tone_logits).item()
        
        # Convert to labels
        emotion = config['emotion_labels'][emotion_id]
        command_hint = config['command_labels'][command_id]
        tone_pref = config['tone_labels'][tone_id]
        
        # Get probabilities
        emotion_probs = torch.softmax(emotion_logits, dim=0).cpu().numpy().tolist()
        command_probs = torch.softmax(command_logits, dim=0).cpu().numpy().tolist()
        tone_probs = torch.softmax(tone_logits, dim=0).cpu().numpy().tolist()
        
        return {
            "emotion": emotion,
            "command_hint": command_hint,
            "tone_pref": tone_pref,
            "raw": {
                "emotion_probs": {
                    label: prob for label, prob in zip(config['emotion_labels'], emotion_probs)
                },
                "command_probs": {
                    label: prob for label, prob in zip(config['command_labels'], command_probs)
                },
                "tone_probs": {
                    label: prob for label, prob in zip(config['tone_labels'], tone_probs)
                }
            }
        }
    except Exception as e:
        print(f"[INFERENCE] Error during prediction: {e}")
        import traceback
        traceback.print_exc()
        # Return defaults on error
        return {
            "emotion": "neutral",
            "command_hint": "none",
            "tone_pref": "neutral",
            "raw": {}
        }


def add_training_sample(sample_dict, config=None):
    """Add a training sample to dataset.json"""
    try:
        if config is None:
            with open('config.json', 'r') as f:
                config = json.load(f)
        
        dataset_path = 'dataset.json'
        
        # Load existing dataset
        if os.path.exists(dataset_path):
            with open(dataset_path, 'r') as f:
                dataset = json.load(f)
        else:
            dataset = {"samples": []}
        
        # Append new sample
        dataset['samples'].append(sample_dict)
        
        # Trim to max size
        max_size = config.get('max_dataset_size', 2000)
        if len(dataset['samples']) > max_size:
            dataset['samples'] = dataset['samples'][-max_size:]
        
        # Save back
        with open(dataset_path, 'w') as f:
            json.dump(dataset, f, indent=2)
        
        print(f"[INFERENCE] Added training sample, dataset size: {len(dataset['samples'])}")
        return True
    except Exception as e:
        print(f"[INFERENCE] Error adding training sample: {e}")
        return False


def run_incremental_training(config, num_steps=20):
    """Run incremental training (wrapper for train_step function)"""
    from train_step import run_incremental_training as train_func
    train_func(config, num_steps)


if __name__ == "__main__":
    # Test inference
    with open('config.json', 'r') as f:
        config = json.load(f)
    
    test_text = "I'm feeling sad and want to open Chrome"
    result = predict_signals(test_text, config)
    print("Prediction result:")
    print(json.dumps(result, indent=2))

