import os
import json
from google import genai
from google.genai import types

key = os.getenv('GEMINI_API_KEY')
if not key:
    print("GEMINI_API_KEY environment variable is not set. Please set it in .env or the shell.")
    exit(1)
print(f"Connecting with API Key prefix: {key[:8]}... (length: {len(key)})", flush=True)

client = genai.Client(api_key=key)
print("Client initialized successfully.", flush=True)

models = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite']

for m in models:
    print(f"\n--- Testing model: {m} ---", flush=True)
    try:
        response = client.models.generate_content(
            model=m,
            contents='Return a JSON object with key "status" having value "verified" and key "model" having value your model name.',
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        print(f"HTTP 200 SUCCESS with {m}!")
        print("Response text:", response.text.strip(), flush=True)
        break
    except Exception as e:
        print(f"Error with {m}: {e}", flush=True)
