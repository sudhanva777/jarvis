"""
Tiny Personal Transformer Model for Continual Learning
Small PyTorch model for emotion, command, and tone prediction
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import json
import os
from collections import Counter
import math


def get_device():
    """Get available device (CUDA if available, else CPU)"""
    return "cuda" if torch.cuda.is_available() else "cpu"


class SimpleTokenizer:
    """Simple whitespace-based tokenizer with vocabulary"""
    
    def __init__(self, vocab_size=10000, max_length=64):
        self.vocab_size = vocab_size
        self.max_length = max_length
        self.word_to_id = {}
        self.id_to_word = {}
        self.unk_id = 0
        self.pad_id = 1
        self._build_initial_vocab()
    
    def _build_initial_vocab(self):
        """Build initial vocabulary with special tokens"""
        self.word_to_id = {
            '<UNK>': 0,
            '<PAD>': 1,
        }
        self.id_to_word = {0: '<UNK>', 1: '<PAD>'}
        # Add common English words
        common_words = [
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
            'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
            'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
            'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
            'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
            'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
            'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
            'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
            'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
            'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day',
            'most', 'us', 'open', 'close', 'play', 'stop', 'start', 'help', 'please', 'thanks',
            'sad', 'happy', 'angry', 'stressed', 'tired', 'excited', 'worried', 'calm', 'okay', 'yes', 'no'
        ]
        for idx, word in enumerate(common_words, start=2):
            if idx < self.vocab_size:
                self.word_to_id[word] = idx
                self.id_to_word[idx] = word
    
    def update_vocab(self, texts):
        """Update vocabulary from texts"""
        word_counts = Counter()
        for text in texts:
            words = text.lower().split()
            word_counts.update(words)
        
        # Add most common words to vocab
        current_size = len(self.word_to_id)
        for word, count in word_counts.most_common(self.vocab_size - current_size):
            if word not in self.word_to_id:
                self.word_to_id[word] = current_size
                self.id_to_word[current_size] = word
                current_size += 1
                if current_size >= self.vocab_size:
                    break
    
    def encode(self, text):
        """Encode text to token IDs"""
        words = text.lower().split()
        token_ids = []
        for word in words:
            token_ids.append(self.word_to_id.get(word, self.unk_id))
        
        # Pad or truncate to max_length
        if len(token_ids) > self.max_length:
            token_ids = token_ids[:self.max_length]
        else:
            token_ids = token_ids + [self.pad_id] * (self.max_length - len(token_ids))
        
        return torch.tensor(token_ids, dtype=torch.long)
    
    def save(self, path):
        """Save tokenizer to file"""
        with open(path, 'w') as f:
            json.dump({
                'word_to_id': self.word_to_id,
                'id_to_word': self.id_to_word,
                'vocab_size': self.vocab_size,
                'max_length': self.max_length
            }, f)
    
    def load(self, path):
        """Load tokenizer from file"""
        if os.path.exists(path):
            with open(path, 'r') as f:
                data = json.load(f)
                self.word_to_id = data['word_to_id']
                self.id_to_word = {int(k): v for k, v in data['id_to_word'].items()}
                self.vocab_size = data['vocab_size']
                self.max_length = data['max_length']


class PositionalEncoding(nn.Module):
    """Positional encoding for transformer"""
    
    def __init__(self, d_model, max_len=64):
        super(PositionalEncoding, self).__init__()
        
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0).transpose(0, 1)
        self.register_buffer('pe', pe)
    
    def forward(self, x):
        return x + self.pe[:x.size(0), :]


class TinyPersonalModel(nn.Module):
    """Small transformer model for personal learning"""
    
    def __init__(self, config):
        super(TinyPersonalModel, self).__init__()
        
        self.vocab_size = config['vocab_size']
        self.d_model = config['d_model']
        self.num_heads = config['num_heads']
        self.num_layers = config['num_layers']
        self.ff_dim = config.get('ff_dim', self.d_model * 2)
        self.dropout = config.get('dropout', 0.1)
        self.max_length = config['max_length']
        
        # Embedding layer
        self.embedding = nn.Embedding(self.vocab_size, self.d_model, padding_idx=1)
        self.pos_encoder = PositionalEncoding(self.d_model, self.max_length)
        
        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=self.d_model,
            nhead=self.num_heads,
            dim_feedforward=self.ff_dim,
            dropout=self.dropout,
            batch_first=False
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=self.num_layers)
        
        # Output heads
        self.emotion_head = nn.Linear(self.d_model, len(config['emotion_labels']))
        self.command_head = nn.Linear(self.d_model, len(config['command_labels']))
        self.tone_head = nn.Linear(self.d_model, len(config['tone_labels']))
        
        self.dropout_layer = nn.Dropout(self.dropout)
        
        # Store labels for reference
        self.emotion_labels = config['emotion_labels']
        self.command_labels = config['command_labels']
        self.tone_labels = config['tone_labels']
    
    def forward(self, token_ids):
        """
        Forward pass
        Args:
            token_ids: (batch_size, seq_len) tensor of token IDs
        Returns:
            dict with emotion_logits, command_logits, tone_logits
        """
        # Embedding
        x = self.embedding(token_ids)  # (batch_size, seq_len, d_model)
        x = x.transpose(0, 1)  # (seq_len, batch_size, d_model) for transformer
        x = self.pos_encoder(x)
        x = self.dropout_layer(x)
        
        # Transformer encoder
        x = self.transformer(x)  # (seq_len, batch_size, d_model)
        
        # Use mean pooling over sequence length
        x = x.mean(dim=0)  # (batch_size, d_model)
        
        # Output heads
        emotion_logits = self.emotion_head(x)
        command_logits = self.command_head(x)
        tone_logits = self.tone_head(x)
        
        return {
            'emotion_logits': emotion_logits,
            'command_logits': command_logits,
            'tone_logits': tone_logits
        }


def build_model(config, device=None):
    """Build model and tokenizer"""
    if device is None:
        device = get_device()
    
    model = TinyPersonalModel(config).to(device)
    tokenizer = SimpleTokenizer(
        vocab_size=config['vocab_size'],
        max_length=config['max_length']
    )
    
    return model, tokenizer


if __name__ == "__main__":
    # Test model
    with open('config.json', 'r') as f:
        config = json.load(f)
    
    device = get_device()
    print(f"Using device: {device}")
    
    model, tokenizer = build_model(config, device)
    print(f"Model created with {sum(p.numel() for p in model.parameters())} parameters")
    
    # Test forward pass
    test_text = "I'm feeling sad and want to open Chrome"
    token_ids = tokenizer.encode(test_text).unsqueeze(0).to(device)
    output = model(token_ids)
    
    print("Test output shapes:")
    print(f"  Emotion logits: {output['emotion_logits'].shape}")
    print(f"  Command logits: {output['command_logits'].shape}")
    print(f"  Tone logits: {output['tone_logits'].shape}")

