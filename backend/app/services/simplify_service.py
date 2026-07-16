from transformers import T5Tokenizer, T5ForConditionalGeneration

_MODEL_NAME = "mrm8488/t5-small-finetuned-text-simplification"

_tokenizer = T5Tokenizer.from_pretrained(_MODEL_NAME)
_model = T5ForConditionalGeneration.from_pretrained(_MODEL_NAME)


def simplify_text(text: str) -> str:
    """
    Simplifies academic/complex text into easier-to-read language.
    """
    prompt = f"simplify: {text}"

    input_ids = _tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=512
    ).input_ids

    output_ids = _model.generate(
        input_ids,
        max_length=512,
        num_beams=4,
        early_stopping=True
    )

    return _tokenizer.decode(output_ids[0], skip_special_tokens=True)