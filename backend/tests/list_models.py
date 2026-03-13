import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    # Try looking in backend/.env if running from root
    load_dotenv("backend/.env")
    api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("GOOGLE_API_KEY not found.")
    exit(1)

genai.configure(api_key=api_key)

print("Listing supported models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"Model: {m.name}")
            print(f"  Methods: {m.supported_generation_methods}")
            print("-" * 20)
except Exception as e:
    print(f"Error listing models: {e}")
