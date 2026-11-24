import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class DocumentExtractor:
    """
    Extracts text and structural metadata (page numbers, section headings, slides)
    from PDF, DOCX, and PPTX documents.
    """

    @classmethod
    def extract(cls, file_path, original_filename=""):
        ext = Path(original_filename or file_path).suffix.lower()

        if ext == '.pdf':
            return cls.extract_pdf(file_path)
        elif ext in ('.docx', '.doc'):
            return cls.extract_docx(file_path)
        elif ext in ('.pptx', '.ppt'):
            return cls.extract_pptx(file_path)
        elif ext in ('.txt', '.md'):
            return cls.extract_txt(file_path)
        else:
            raise ValueError(f"Unsupported file format: {ext}")

    @classmethod
    def extract_pdf(cls, file_path):
        import fitz  # PyMuPDF

        doc = fitz.open(file_path)
        extracted_pages = []
        total_text_chars = 0

        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_num = page_idx + 1
            text = page.get_text("text").strip()
            total_text_chars += len(text)

            if text:
                extracted_pages.append({
                    'content': text,
                    'page_number': page_num,
                    'section_title': f"Page {page_num}",
                    'extraction_method': 'pymupdf_pdf',
                    'metadata': {
                        'page': page_num,
                        'total_pages': len(doc),
                        'width': page.rect.width,
                        'height': page.rect.height
                    }
                })

        # Check for scanned/empty PDF
        if len(doc) > 0 and total_text_chars < 50:
            logger.warning(f"PDF {file_path} appears to be a scanned document or has minimal selectable text.")
            if not extracted_pages:
                extracted_pages.append({
                    'content': "[Scanned Document / Non-selectable text detected. OCR recommended for full extraction]",
                    'page_number': 1,
                    'section_title': "Notice",
                    'extraction_method': 'scanned_fallback',
                    'metadata': {'scanned': True, 'total_pages': len(doc)}
                })

        doc.close()
        return extracted_pages

    @classmethod
    def extract_docx(cls, file_path):
        from docx import Document

        doc = Document(file_path)
        extracted_sections = []
        current_section_title = "Introduction"
        current_buffer = []

        for para in doc.paragraphs:
            text = para.text.strip()
            if not text:
                continue

            # Detect headings
            if para.style and para.style.name and 'Heading' in para.style.name:
                if current_buffer:
                    extracted_sections.append({
                        'content': "\n".join(current_buffer),
                        'page_number': None,
                        'section_title': current_section_title,
                        'extraction_method': 'docx_structure',
                        'metadata': {'section': current_section_title}
                    })
                    current_buffer = []
                current_section_title = text
            else:
                current_buffer.append(text)

        # Extract tables as structured text
        for table_idx, table in enumerate(doc.tables):
            table_rows = []
            for row in table.rows:
                cells = [cell.text.strip() for cell in row.cells]
                table_rows.append(" | ".join(cells))
            if table_rows:
                table_text = f"Table {table_idx + 1}:\n" + "\n".join(table_rows)
                current_buffer.append(table_text)

        if current_buffer:
            extracted_sections.append({
                'content': "\n".join(current_buffer),
                'page_number': None,
                'section_title': current_section_title,
                'extraction_method': 'docx_structure',
                'metadata': {'section': current_section_title}
            })

        return extracted_sections

    @classmethod
    def extract_pptx(cls, file_path):
        from pptx import Presentation

        prs = Presentation(file_path)
        extracted_slides = []

        for slide_idx, slide in enumerate(prs.slides):
            slide_num = slide_idx + 1
            slide_texts = []
            slide_title = f"Slide {slide_num}"

            for shape in slide.shapes:
                if hasattr(shape, "text") and shape.text.strip():
                    text = shape.text.strip()
                    if shape == slide.shapes[0] and len(text) < 100:
                        slide_title = text
                    slide_texts.append(text)

            if slide_texts:
                extracted_slides.append({
                    'content': "\n".join(slide_texts),
                    'page_number': slide_num,
                    'section_title': slide_title,
                    'extraction_method': 'pptx_slide',
                    'metadata': {'slide_number': slide_num, 'slide_title': slide_title}
                })

        return extracted_slides

    @classmethod
    def extract_txt(cls, file_path):
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read().strip()
        return [{
            'content': content,
            'page_number': 1,
            'section_title': "General",
            'extraction_method': 'plain_text',
            'metadata': {}
        }]
