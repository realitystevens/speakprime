
import asyncio
import os
import traceback
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
load_dotenv("backend/.env")

api_key = os.getenv("GOOGLE_API_KEY")
model_id = os.getenv("GEMINI_LIVE_MODEL",
                     "gemini-2.5-flash-native-audio-preview-12-2025")
if not model_id.startswith("models/"):
    model_id = f"models/{model_id}"

print(f"Using API Key: {api_key[:5]}... (len={len(api_key)})")
print(f"Using Model: {model_id}")

client = genai.Client(api_key=api_key)


async def main():
    config = types.LiveConnectConfig(
        response_modalities=["AUDIO"],
        system_instruction="You are a helpful assistant.",
    )

    print("Connecting...")
    try:
        async with client.aio.live.connect(model=model_id, config=config) as session:
            print("Connected!")
            await session.send(input="Hello", end_of_turn=True)
            async for response in session.receive():
                print("Received response chunk")
                if response.server_content:
                    print("Server content:", response.server_content)
                if response.data:
                    print(f"Audio data: {len(response.data)} bytes")
                break  # Just test one response
    except Exception as e:
        print("Error details:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
