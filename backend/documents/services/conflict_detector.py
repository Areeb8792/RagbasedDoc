import re
from typing import Dict, Any, List
from documents.models import Document, DocumentChunk

class PolicyConflictDetector:
    """
    Compares document versions to highlight shifts in percentages,
    dates, numerical criteria, or rule clauses for administrative review.
    """

    @classmethod
    def compare_versions(cls, doc_v1: Document, doc_v2: Document) -> Dict[str, Any]:
        chunks_v1 = list(doc_v1.chunks.all().order_by('chunk_index'))
        chunks_v2 = list(doc_v2.chunks.all().order_by('chunk_index'))

        text_v1 = "\n".join([c.content for c in chunks_v1])
        text_v2 = "\n".join([c.content for c in chunks_v2])

        # Extract percentages
        pct_regex = r'\b(\d+(?:\.\d+)?%)\b'
        v1_percentages = set(re.findall(pct_regex, text_v1))
        v2_percentages = set(re.findall(pct_regex, text_v2))

        # Extract dates / years
        date_regex = r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}|\b\d{1,2}/\d{1,2}/\d{2,4}|\b(?:19|20)\d{2}\b'
        v1_dates = set(re.findall(date_regex, text_v1))
        v2_dates = set(re.findall(date_regex, text_v2))

        # Extract clauses / policy section markers
        clause_regex = r'(?:Section|Clause|Rule|Regulation|Policy)\s*[\d\.\(\)]+'
        v1_clauses = set(re.findall(clause_regex, text_v1, re.IGNORECASE))
        v2_clauses = set(re.findall(clause_regex, text_v2, re.IGNORECASE))

        conflicts = []

        # Check percentage differences
        added_pcts = v2_percentages - v1_percentages
        removed_pcts = v1_percentages - v2_percentages
        if added_pcts or removed_pcts:
            conflicts.append({
                'type': 'numerical_percentage_change',
                'severity': 'high',
                'description': f"Percentage values changed between v{doc_v1.version} and v{doc_v2.version}.",
                'v1_values': list(removed_pcts),
                'v2_values': list(added_pcts)
            })

        # Check date differences
        added_dates = v2_dates - v1_dates
        removed_dates = v1_dates - v2_dates
        if added_dates or removed_dates:
            conflicts.append({
                'type': 'date_or_deadline_change',
                'severity': 'medium',
                'description': f"Dates or deadlines modified between versions.",
                'v1_values': list(removed_dates)[:10],
                'v2_values': list(added_dates)[:10]
            })

        # Check clause differences
        added_clauses = v2_clauses - v1_clauses
        removed_clauses = v1_clauses - v2_clauses
        if added_clauses or removed_clauses:
            conflicts.append({
                'type': 'clauses_modified',
                'severity': 'medium',
                'description': "Clauses or regulation numbers added or removed.",
                'v1_values': list(removed_clauses)[:10],
                'v2_values': list(added_clauses)[:10]
            })

        return {
            'doc_v1_id': str(doc_v1.id),
            'doc_v1_title': doc_v1.title,
            'doc_v1_version': doc_v1.version,
            'doc_v2_id': str(doc_v2.id),
            'doc_v2_title': doc_v2.title,
            'doc_v2_version': doc_v2.version,
            'has_potential_conflicts': len(conflicts) > 0,
            'conflicts': conflicts
        }
