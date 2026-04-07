"""
LLaMA 3.1 8B Runner using Ollama or Transformers
Supports RTX 3060 GPU with quantization
"""

import json
import os
import subprocess
import sys

def get_device():
    """Get available device"""
    try:
        import torch
        if torch.cuda.is_available():
            return "cuda"
    except:
        pass
    return "cpu"

def check_ollama_available():
    """Check if Ollama is installed and running"""
    try:
        result = subprocess.run(['ollama', 'list'], capture_output=True, timeout=2)
        return result.returncode == 0
    except:
        return False

def generate_with_ollama(model_name, prompt, config):
    """Generate using Ollama"""
    try:
        import requests
        
        ollama_url = os.getenv('OLLAMA_URL', 'http://localhost:11434')
        response = requests.post(
            f'{ollama_url}/api/generate',
            json={
                'model': model_name,
                'prompt': prompt,
                'stream': False,
                'options': {
                    'temperature': config.get('temperature', 0.7),
                    'num_predict': config.get('max_tokens', 2048)
                }
            },
            timeout=60
        )
        
        if response.status_code == 200:
            return response.json().get('response', '')
        return None
    except Exception as e:
        print(f"[LLAMA] Ollama error: {e}")
        return None

def generate_with_transformers(model_name, prompt, config):
    """Generate using Transformers (fallback)"""
    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
        
        device = get_device()
        
        # Setup quantization for GPU
        if device == "cuda":
            quantization_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16
            )
        else:
            quantization_config = None
        
        # Load model
        tokenizer = AutoTokenizer.from_pretrained(f"meta-llama/{model_name}")
        model = AutoModelForCausalLM.from_pretrained(
            f"meta-llama/{model_name}",
            quantization_config=quantization_config,
            device_map="auto" if device == "cuda" else None
        )
        
        # Set GPU memory limit
        if device == "cuda":
            torch.cuda.set_per_process_memory_fraction(0.50)
        
        # Generate
        inputs = tokenizer(prompt, return_tensors="pt").to(device)
        outputs = model.generate(
            **inputs,
            max_new_tokens=config.get('max_tokens', 2048),
            temperature=config.get('temperature', 0.7),
            do_sample=True
        )
        
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return response.replace(prompt, "").strip()
    except Exception as e:
        print(f"[LLAMA] Transformers error: {e}")
        return None

def generate(prompt, config_path='model_config.json'):
    """Main generation function"""
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        model_config = config['models']['llama3.1']
        model_name = model_config['name']
        
        # Try Ollama first
        if check_ollama_available():
            return generate_with_ollama(model_name, prompt, model_config)
        
        # Fallback to Transformers
        return generate_with_transformers(model_name, prompt, model_config)
    except Exception as e:
        print(f"[LLAMA] Generation error: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) > 1:
        prompt = sys.argv[1]
        result = generate(prompt)
        print(result if result else "Error generating response")

