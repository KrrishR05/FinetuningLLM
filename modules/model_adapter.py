import json
import os
import time
import requests
from typing import Dict, List, Any, Optional

DEFAULT_MODELS_JSON_PATH = os.path.join(os.path.dirname(__file__), "..", "models.json")

class ModelAdapter:
    """
    Unified Model Adapter for local LLM runtimes (Ollama / OpenAI-compatible local APIs).
    Handles model registry loading, offline health verification, and text generation.
    """

    def __init__(self, config_path: str = DEFAULT_MODELS_JSON_PATH):
        self.config_path = os.path.abspath(config_path)
        self.models: List[Dict[str, Any]] = []
        self.default_model_id: str = "main"
        self.load_registry()

    def load_registry(self) -> List[Dict[str, Any]]:
        """Loads available models from models.json."""
        if not os.path.exists(self.config_path):
            # Fallback default registry if file missing
            self.models = [
                {
                    "id": "main",
                    "label": "💎 Gemma 4 E2B (Google DeepMind) — Main Source",
                    "runtime": "ollama",
                    "model_name": "google/gemma-4-E2B-it",
                    "endpoint": "http://127.0.0.1:11434",
                    "status": "tested",
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
                        self.default_model_id = m.get("id", "balanced")
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
            if m["id"] == model_id:
                return m

        # If model_id not found, return first or fallback
        if self.models:
            return self.models[0]

        return {
            "id": "fallback",
            "label": "Gemma 4 E2B (Main Source)",
            "runtime": "ollama",
            "model_name": "google/gemma-4-E2B-it",
            "endpoint": "http://127.0.0.1:11434",
        }

    def check_health(self, model_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Verifies whether Ollama service is reachable offline
        and lists installed local models.
        """
        config = self.get_model_config(model_id)
        endpoint = config.get("endpoint", "http://127.0.0.1:11434")

        try:
            res = requests.get(f"{endpoint}/api/tags", timeout=3)
            if res.status_code == 200:
                installed_models = [m.get("name") for m in res.json().get("models", [])]
                target_model = config.get("model_name")
                is_available = any(target_model in m for m in installed_models)
                return {
                    "status": "online",
                    "endpoint": endpoint,
                    "target_model": target_model,
                    "target_model_installed": is_available,
                    "installed_models": installed_models,
                }
        except requests.exceptions.RequestException as e:
            return {
                "status": "offline",
                "error": f"Local endpoint {endpoint} is not responding. Ensure Ollama is running.",
            }

        return {"status": "unknown"}

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
        Sends a prompt to the local LLM endpoint and returns a standardized response dict.
        """
        config = self.get_model_config(model_id)
        endpoint = config.get("endpoint", "http://127.0.0.1:11434").rstrip("/")
        model_name = config.get("model_name", "google/gemma-4-E2B-it")

        url = f"{endpoint}/api/generate"
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

        start_time = time.time()

        try:
            response = requests.post(url, json=payload, timeout=timeout)
            latency = round(time.time() - start_time, 2)

            if response.status_code == 200:
                result_data = response.json()
                return {
                    "status": "success",
                    "text": result_data.get("response", "").strip(),
                    "model_id": config.get("id"),
                    "model_name": model_name,
                    "latency_seconds": latency,
                    "raw": result_data,
                }
            else:
                return {
                    "status": "error",
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "model_id": config.get("id"),
                    "latency_seconds": latency,
                    "text": "",
                }

        except requests.exceptions.Timeout:
            return {
                "status": "error",
                "error": f"Request timed out after {timeout} seconds.",
                "model_id": config.get("id"),
                "latency_seconds": round(time.time() - start_time, 2),
                "text": "",
            }
        except requests.exceptions.RequestException as e:
            return {
                "status": "error",
                "error": f"Failed to connect to local runtime: {str(e)}",
                "model_id": config.get("id"),
                "latency_seconds": round(time.time() - start_time, 2),
                "text": "",
            }


# Smoke test when executed directly
if __name__ == "__main__":
    adapter = ModelAdapter()
    print("Available Model Profiles:")
    for m in adapter.get_available_models():
        label = m.get('label', '').encode('ascii', 'ignore').decode('ascii')
        print(f" - [{m['id']}] {label} ({m['model_name']})")

    print("\nChecking Ollama Health...")
    health = adapter.check_health()
    print("Health Status:", health)

    if health.get("status") == "online":
        print("\nRunning smoke test query...")
        res = adapter.generate(
            prompt="Summarize in 10 words: India launched Chandrayaan-3 successfully to the Moon.",
            system_prompt="You are a helpful offline assistant.",
        )
        print("Response:", res.get("text"))
        print("Latency:", res.get("latency_seconds"), "seconds")

