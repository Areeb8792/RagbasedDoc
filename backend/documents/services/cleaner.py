import re

class TextCleaner:
    """
    Cleans raw extracted document text while rigorously preserving
    clause numbering, percentages, dates, amounts, and critical formatting.
    """

    @classmethod
    def clean(cls, text: str) -> str:
        if not text:
            return ""

        # Normalize line endings
        text = text.replace('\r\n', '\n').replace('\r', '\n')

        # Replace non-breaking spaces and special unicode spaces
        text = re.sub(r'[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]', ' ', text)

        # Standardize quotation marks and dashes
        text = text.replace('“', '"').replace('”', '"')
        text = text.replace('‘', "'").replace('’', "'")
        text = text.replace('—', ' - ').replace('–', ' - ')

        # Remove hyphenation at line breaks (e.g. "com-\nmittee" -> "committee")
        text = re.sub(r'(\w+)-\n(\w+)', r'\1\2', text)

        # Standardize multiple consecutive blank lines to double newline
        text = re.sub(r'\n{3,}', '\n\n', text)

        # Clean excess horizontal whitespace while keeping single spaces
        lines = [re.sub(r'[ \t]+', ' ', line).strip() for line in text.split('\n')]

        return '\n'.join(lines).strip()
