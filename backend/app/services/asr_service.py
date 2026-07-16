from faster_whisper import WhisperModel

_model = WhisperModel("base", device="cpu", compute_type="int8")


def transcribe_audio(file_path: str) -> dict:
    """
    Transcribes an audio/video file into text using faster-whisper.
    """
    segments, info = _model.transcribe(file_path, beam_size=5)

    full_text = ""
    segment_list = []

    for segment in segments:
        full_text += segment.text + " "
        segment_list.append({
            "start": segment.start,
            "end": segment.end,
            "text": segment.text
        })

    return {
        "text": full_text.strip(),
        "language": info.language,
        "segments": segment_list
    }