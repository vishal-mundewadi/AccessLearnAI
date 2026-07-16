import edge_tts
import os

OUTPUT_FOLDER = "outputs"
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

VOICE = "en-US-GuyNeural"


async def text_to_speech(text: str, filename: str) -> str:
    """
    Converts text into speech and saves as an mp3 file.
    Returns the path to the generated audio file.
    """
    output_path = os.path.join(OUTPUT_FOLDER, filename)
    communicate = edge_tts.Communicate(text, VOICE)
    await communicate.save(output_path)
    return output_path