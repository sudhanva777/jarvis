"""
Training step for continual learning
"""

import torch
import torch.nn as nn
import torch.optim as optim
import json
import os
from tiny_transformer import build_model, get_device, SimpleTokenizer


def load_or_init_model(config, tokenizer_path=None):
    """Load model from checkpoint or initialize new"""
    device = get_device()
    model, tokenizer = build_model(config, device)
    
    checkpoint_path = os.path.join('checkpoints', 'latest.pt')
    tokenizer_file = tokenizer_path or os.path.join('checkpoints', 'tokenizer.json')
    
    # Load tokenizer if exists
    if os.path.exists(tokenizer_file):
        tokenizer.load(tokenizer_file)
        print(f"[TRAIN] Loaded tokenizer from {tokenizer_file}")
    
    # Load model weights if exists
    if os.path.exists(checkpoint_path):
        checkpoint = torch.load(checkpoint_path, map_location=device)
        model.load_state_dict(checkpoint['model_state_dict'])
        print(f"[TRAIN] Loaded model from {checkpoint_path}")
    else:
        print("[TRAIN] Initializing new model")
    
    return model, tokenizer, device


def save_model(model, tokenizer, checkpoint_path=None, tokenizer_path=None):
    """Save model and tokenizer"""
    checkpoint_path = checkpoint_path or os.path.join('checkpoints', 'latest.pt')
    tokenizer_path = tokenizer_path or os.path.join('checkpoints', 'tokenizer.json')
    
    # Create checkpoints directory if needed
    os.makedirs('checkpoints', exist_ok=True)
    
    # Save model
    torch.save({
        'model_state_dict': model.state_dict(),
    }, checkpoint_path)
    
    # Save tokenizer
    tokenizer.save(tokenizer_path)
    
    print(f"[TRAIN] Saved model to {checkpoint_path}")


def train_step(config, model, optimizer, samples, device, tokenizer):
    """Single training step with multiple samples"""
    model.train()
    
    # Prepare labels
    emotion_labels = config['emotion_labels']
    command_labels = config['command_labels']
    tone_labels = config['tone_labels']
    
    # Create label mappings
    emotion_to_id = {label: i for i, label in enumerate(emotion_labels)}
    command_to_id = {label: i for i, label in enumerate(command_labels)}
    tone_to_id = {label: i for i, label in enumerate(tone_labels)}
    
    # Prepare batches
    batch_size = config.get('batch_size', 16)
    total_loss = 0.0
    num_batches = 0
    
    criterion_emotion = nn.CrossEntropyLoss()
    criterion_command = nn.CrossEntropyLoss()
    criterion_tone = nn.CrossEntropyLoss()
    
    # Process in batches
    for i in range(0, len(samples), batch_size):
        batch = samples[i:i + batch_size]
        
        # Tokenize inputs
        token_ids_list = []
        emotion_targets = []
        command_targets = []
        tone_targets = []
        
        for sample in batch:
            token_ids = tokenizer.encode(sample['input_text'])
            token_ids_list.append(token_ids)
            
            emotion_targets.append(emotion_to_id.get(sample['emotion_label'], 0))
            command_targets.append(command_to_id.get(sample['command_label'], 0))
            tone_targets.append(tone_to_id.get(sample['tone_label'], 0))
        
        # Stack into batch tensor
        token_ids_batch = torch.stack(token_ids_list).to(device)
        emotion_targets = torch.tensor(emotion_targets, dtype=torch.long).to(device)
        command_targets = torch.tensor(command_targets, dtype=torch.long).to(device)
        tone_targets = torch.tensor(tone_targets, dtype=torch.long).to(device)
        
        # Forward pass
        optimizer.zero_grad()
        output = model(token_ids_batch)
        
        # Calculate losses
        loss_emotion = criterion_emotion(output['emotion_logits'], emotion_targets)
        loss_command = criterion_command(output['command_logits'], command_targets)
        loss_tone = criterion_tone(output['tone_logits'], tone_targets)
        
        total_loss_batch = loss_emotion + loss_command + loss_tone
        
        # Backward pass
        total_loss_batch.backward()
        optimizer.step()
        
        total_loss += total_loss_batch.item()
        num_batches += 1
    
    avg_loss = total_loss / num_batches if num_batches > 0 else 0.0
    return avg_loss


def run_incremental_training(config, num_steps=20):
    """Run incremental training on dataset"""
    try:
        # Load dataset
        dataset_path = 'dataset.json'
        if not os.path.exists(dataset_path):
            print("[TRAIN] No dataset found, skipping training")
            return
        
        with open(dataset_path, 'r') as f:
            dataset = json.load(f)
        
        samples = dataset.get('samples', [])
        
        if len(samples) < config.get('min_samples_for_training', 20):
            print(f"[TRAIN] Not enough samples ({len(samples)}), need at least {config.get('min_samples_for_training', 20)}")
            return
        
        # Load model
        model, tokenizer, device = load_or_init_model(config)
        
        # Update tokenizer vocabulary
        texts = [s['input_text'] for s in samples]
        tokenizer.update_vocab(texts)
        
        # Setup optimizer
        learning_rate = config.get('learning_rate', 0.0001)
        optimizer = optim.Adam(model.parameters(), lr=learning_rate)
        
        # Train for limited steps
        print(f"[TRAIN] Starting incremental training with {len(samples)} samples, {num_steps} steps")
        
        for step in range(num_steps):
            # Shuffle samples
            import random
            random.shuffle(samples)
            
            # Train on batch
            loss = train_step(config, model, optimizer, samples, device, tokenizer)
            
            if (step + 1) % 5 == 0:
                print(f"[TRAIN] Step {step + 1}/{num_steps}, Loss: {loss:.4f}")
        
        # Save model
        save_model(model, tokenizer)
        print(f"[TRAIN] Training completed, final loss: {loss:.4f}")
        
    except Exception as e:
        print(f"[TRAIN] Error during training: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Test training
    with open('config.json', 'r') as f:
        config = json.load(f)
    
    # Create test samples
    test_samples = [
        {
            "input_text": "I'm feeling sad today",
            "emotion_label": "sad",
            "command_label": "none",
            "tone_label": "very_soft"
        },
        {
            "input_text": "open Chrome browser",
            "emotion_label": "neutral",
            "command_label": "open_app",
            "tone_label": "neutral"
        }
    ]
    
    # Add to dataset
    dataset_path = 'dataset.json'
    if os.path.exists(dataset_path):
        with open(dataset_path, 'r') as f:
            dataset = json.load(f)
    else:
        dataset = {"samples": []}
    
    dataset['samples'].extend(test_samples)
    
    with open(dataset_path, 'w') as f:
        json.dump(dataset, f, indent=2)
    
    # Run training
    run_incremental_training(config, num_steps=10)

