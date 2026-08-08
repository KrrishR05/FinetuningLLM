import json
import os
import time
import requests
from typing import Dict, List, Any, Optional

DEFAULT_MODELS_JSON_PATH = os.path.join(os.path.dirname(__file__), "..", "models.json")
DEFAULT_GGUF_PATH = os.path.join(os.path.dirname(__file__), "..", "gemma-4-E2B-it-Q4_0.gguf")


class ModelAdapter:
    """
    Unified Model Adapter for local LLM runtimes.
    Supports Gemma-4 via Ollama, llama-server (llama.cpp HTTP server), and OpenAI-compatible endpoints.
    Handles model registry loading, offline health verification, and standardized text generation.
    """

    def __init__(self, config_path: str = DEFAULT_MODELS_JSON_PATH):
        self.config_path = os.path.abspath(config_path)
        self.models: List[Dict[str, Any]] = []
        self.default_model_id: str = "main"
        self.load_registry()

    def load_registry(self) -> List[Dict[str, Any]]:
        """Loads available models from models.json."""
        if not os.path.exists(self.config_path):
            self.models = [
                {
                    "id": "main",
                    "label": "Gemma 4 E2B (Google DeepMind) - Main Source",
                    "runtime": "local_llm",
                    "model_name": "gemma4-e2b:latest",
                    "gguf_filename": "gemma-4-E2B-it-Q4_0.gguf",
                    "endpoint": "http://127.0.0.1:11434",
                    "llama_server_endpoint": "http://127.0.0.1:8080",
                    "status": "ready",
                    "default": True,
                }
            ]
            return self.models

        try:
            with open(self.config_path, "r", encoding="utf-8-sig") as f:
                data = json.load(f)
                self.models = data.get("models", [])
                for m in self.models:
                    if m.get("default"):
                        self.default_model_id = m.get("id", "main")
        except Exception as e:
            print(f"[ModelAdapter Warning] Failed to parse models.json: {e}")
            self.models = []

        return self.models

    def get_available_models(self) -> List[Dict[str, Any]]:
        """Returns the list of configured model profiles."""
        if not self.models:
            self.load_registry()
        return self.models

    def get_model_config(self, model_id: Optional[str] = None) -> Dict[str, Any]:
        """Retrieves model configuration by ID, or returns default."""
        if not model_id:
            model_id = self.default_model_id

        for m in self.models:
            if m.get("id") == model_id:
                return m

        if self.models:
            return self.models[0]

        return {
            "id": "main",
            "label": "Gemma 4 E2B (Google DeepMind) - Main Source",
            "runtime": "local_llm",
            "model_name": "gemma4-e2b:latest",
            "gguf_filename": "gemma-4-E2B-it-Q4_0.gguf",
            "endpoint": "http://127.0.0.1:11434",
            "llama_server_endpoint": "http://127.0.0.1:8080",
            "default": True,
        }

    def check_health(self, model_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Verifies whether the local LLM runtime (Ollama or llama-server) is reachable offline.
        """
        config = self.get_model_config(model_id)
        ollama_endpoint = config.get("endpoint", "http://127.0.0.1:11434").rstrip("/")
        llama_endpoint = config.get("llama_server_endpoint", "http://127.0.0.1:8080").rstrip("/")

        # 1. Check llama-server endpoint (http://127.0.0.1:8080/health or /props)
        try:
            res_llama = requests.get(f"{llama_endpoint}/health", timeout=2)
            if res_llama.status_code == 200 or res_llama.status_code == 503:
                data = res_llama.json() if res_llama.headers.get("content-type", "").startswith("application/json") else {}
                return {
                    "status": "online",
                    "runtime": "llama-server",
                    "endpoint": llama_endpoint,
                    "model_name": config.get("model_name", "Gemma-4 E2B"),
                    "details": data,
                }
        except requests.exceptions.RequestException:
            pass

        # Also check /props for older llama.cpp server
        try:
            res_llama2 = requests.get(f"{llama_endpoint}/props", timeout=2)
            if res_llama2.status_code == 200:
                return {
                    "status": "online",
                    "runtime": "llama-server",
                    "endpoint": llama_endpoint,
                    "model_name": config.get("model_name", "Gemma-4 E2B"),
                }
        except requests.exceptions.RequestException:
            pass

        # 2. Check Ollama endpoint (http://127.0.0.1:11434/api/tags)
        try:
            res = requests.get(f"{ollama_endpoint}/api/tags", timeout=2)
            if res.status_code == 200:
                installed_models = [m.get("name") for m in res.json().get("models", [])]
                target_model = config.get("model_name", "gemma-4-E2B-it")
                is_available = any(target_model in m for m in installed_models) or len(installed_models) > 0
                return {
                    "status": "online",
                    "runtime": "ollama",
                    "endpoint": ollama_endpoint,
                    "target_model": target_model,
                    "target_model_installed": is_available,
                    "installed_models": installed_models,
                }
        except requests.exceptions.RequestException:
            pass

        # Check if local GGUF file exists on disk
        gguf_exists = os.path.exists(DEFAULT_GGUF_PATH)
        return {
            "status": "offline",
            "gguf_file_present": gguf_exists,
            "gguf_path": DEFAULT_GGUF_PATH if gguf_exists else None,
            "error": "No local server detected on port 8080 (llama-server) or 11434 (Ollama).",
        }

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model_id: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: Optional[int] = None,
        timeout: int = 120,
    ) -> Dict[str, Any]:
        """
        Sends a prompt to the local Gemma-4 LLM and returns a standardized response dict.
        Automatically routes to active runtime (llama-server or Ollama).
        """
        config = self.get_model_config(model_id)
        ollama_endpoint = config.get("endpoint", "http://127.0.0.1:11434").rstrip("/")
        llama_endpoint = config.get("llama_server_endpoint", "http://127.0.0.1:8080").rstrip("/")
        model_name = config.get("model_name", "gemma-4-E2B-it")

        start_time = time.time()

        # Try llama.cpp server completion endpoint first (http://127.0.0.1:8080/completion)
        try:
            llama_url = f"{llama_endpoint}/completion"
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"<start_of_turn>system\n{system_prompt}<end_of_turn>\n<start_of_turn>user\n{prompt}<end_of_turn>\n<start_of_turn>model\n"

            payload = {
                "prompt": full_prompt,
                "temperature": temperature,
                "n_predict": max_tokens if max_tokens else 1024,
                "stop": ["<end_of_turn>", "<eos>", "<|im_end|>"],
            }
            res = requests.post(llama_url, json=payload, timeout=timeout)
            latency = round(time.time() - start_time, 2)
            if res.status_code == 200:
                data = res.json()
                content = data.get("content", "").strip()
                return {
                    "status": "success",
                    "runtime": "llama-server",
                    "text": content,
                    "model_id": config.get("id"),
                    "model_name": "Gemma-4 E2B",
                    "latency_seconds": latency,
                    "raw": data,
                }
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            pass

        # Try Ollama endpoint (/api/generate)
        try:
            ollama_url = f"{ollama_endpoint}/api/generate"
            payload = {
                "model": model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                },
            }
            if system_prompt:
                payload["system"] = system_prompt
            if max_tokens:
                payload["options"]["num_predict"] = max_tokens

            res = requests.post(ollama_url, json=payload, timeout=timeout)
            latency = round(time.time() - start_time, 2)
            if res.status_code == 200:
                data = res.json()
                return {
                    "status": "success",
                    "runtime": "ollama",
                    "text": data.get("response", "").strip(),
                    "model_id": config.get("id"),
                    "model_name": model_name,
                    "latency_seconds": latency,
                    "raw": data,
                }
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            pass

        latency = round(time.time() - start_time, 2)
        return {
            "status": "error",
            "error": "Local Gemma-4 model runtime is offline. Please start llama-server or Ollama.",
            "model_id": config.get("id"),
            "model_name": "Gemma-4 E2B",
            "latency_seconds": latency,
            "text": "",
        }


# Direct smoke test
if __name__ == "__main__":
    adapter = ModelAdapter()
    print("Configured Model Profiles:")
    for m in adapter.get_available_models():
        clean_label = str(m.get('label', '')).encode('ascii', 'ignore').decode('ascii')
        print(f" - [{m['id']}] {clean_label} ({m.get('model_name')})")

    print("\nChecking Local LLM Health...")
    health = adapter.check_health()
    print("Health Status:", health)

