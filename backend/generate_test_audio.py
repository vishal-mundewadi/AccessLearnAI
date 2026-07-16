import asyncio
import edge_tts

TEXT = """
Welcome to this lecture on cell biology. Today we will discuss the structure
and function of the mitochondria, which is often called the powerhouse of the cell.
Mitochondria generate energy through a process called cellular respiration.
"""

VOICE = "en-US-GuyNeural"
OUTPUT_FILE = "test_lecture.mp3"


async def main():
    communicate = edge_tts.Communicate(TEXT, VOICE)
    await communicate.save(OUTPUT_FILE)
    print(f"Saved to {OUTPUT_FILE}")


if __name__ == "__main__":
    asyncio.run(main())