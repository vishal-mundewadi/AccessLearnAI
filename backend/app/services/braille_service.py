# Grade 1 Braille mapping (letter-by-letter, no contractions)
# Unicode Braille patterns: U+2800 to U+28FF

_BRAILLE_MAP = {
    'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
    'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
    'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
    'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
    'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
    '0': '⠴', '1': '⠂', '2': '⠆', '3': '⠒', '4': '⠲',
    '5': '⠢', '6': '⠖', '7': '⠶', '8': '⠦', '9': '⠔',
    '.': '⠲', ',': '⠂', '?': '⠦', '!': '⠖', "'": '⠄',
    '-': '⠤', ':': '⠒', ';': '⠆',
    ' ': ' ',
}


def text_to_braille(text: str) -> str:
    """
    Converts plain English text into Grade 1 Braille (Unicode braille patterns).
    Non-mapped characters are dropped silently.
    """
    text = text.lower()
    result = []

    for char in text:
        if char in _BRAILLE_MAP:
            result.append(_BRAILLE_MAP[char])
        elif char.isdigit():
            result.append(_BRAILLE_MAP.get(char, ''))
        # silently skip unmapped characters

    return ''.join(result)