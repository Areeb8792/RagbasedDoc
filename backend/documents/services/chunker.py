import re
from typing import List, Dict, Any

class DocumentChunker:
    """
    Splits cleaned text blocks into coherent chunks with target size 400-600 tokens
    (~1500-2400 characters) and 60-100 token overlap, respecting paragraph and
    clause boundaries.
    """

    def __init__(self, target_chunk_chars: int = 1600, overlap_chars: int = 300):
        self.target_chunk_chars = target_chunk_chars
        self.overlap_chars = overlap_chars

    def estimate_tokens(self, text: str) -> int:
        # A standard heuristic: ~4 characters per token in English text
        return max(1, len(text) // 4)

    def chunk_extracted_units(self, units: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Takes raw extracted units (pages, docx sections, pptx slides) and yields
        discrete chunks with source page and section metadata.
        """
        all_chunks = []
        global_chunk_idx = 0

        for unit in units:
            content = unit.get('content', '').strip()
            if not content:
                continue

            page_num = unit.get('page_number')
            section_title = unit.get('section_title', '')
            method = unit.get('extraction_method', 'direct_text')
            unit_meta = unit.get('metadata', {})

            # If unit fits within target size, keep it as a clean single chunk
            if len(content) <= self.target_chunk_chars:
                all_chunks.append({
                    'chunk_index': global_chunk_idx,
                    'content': content,
                    'page_number': page_num,
                    'page_start': page_num,
                    'page_end': page_num,
                    'section_title': section_title,
                    'token_count': self.estimate_tokens(content),
                    'extraction_method': method,
                    'metadata': unit_meta
                })
                global_chunk_idx += 1
                continue

            # Unit is larger: split by paragraphs, headings, or clauses
            paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
            if not paragraphs:
                paragraphs = [p.strip() for p in content.split('\n') if p.strip()]

            current_chunk_paragraphs = []
            current_len = 0

            for para in paragraphs:
                para_len = len(para)

                if current_len + para_len > self.target_chunk_chars and current_chunk_paragraphs:
                    chunk_text = "\n\n".join(current_chunk_paragraphs)
                    all_chunks.append({
                        'chunk_index': global_chunk_idx,
                        'content': chunk_text,
                        'page_number': page_num,
                        'page_start': page_num,
                        'page_end': page_num,
                        'section_title': section_title,
                        'token_count': self.estimate_tokens(chunk_text),
                        'extraction_method': method,
                        'metadata': unit_meta
                    })
                    global_chunk_idx += 1

                    # Retain last paragraph for overlap if it doesn't dominate the chunk
                    if len(current_chunk_paragraphs[-1]) <= self.overlap_chars:
                        current_chunk_paragraphs = [current_chunk_paragraphs[-1]]
                        current_len = len(current_chunk_paragraphs[0])
                    else:
                        current_chunk_paragraphs = []
                        current_len = 0

                current_chunk_paragraphs.append(para)
                current_len += para_len + 2

            if current_chunk_paragraphs:
                chunk_text = "\n\n".join(current_chunk_paragraphs)
                all_chunks.append({
                    'chunk_index': global_chunk_idx,
                    'content': chunk_text,
                    'page_number': page_num,
                    'page_start': page_num,
                    'page_end': page_num,
                    'section_title': section_title,
                    'token_count': self.estimate_tokens(chunk_text),
                    'extraction_method': method,
                    'metadata': unit_meta
                })
                global_chunk_idx += 1

        return all_chunks
