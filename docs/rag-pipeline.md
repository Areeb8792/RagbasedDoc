# Retrieval-Augmented Generation (RAG) Pipeline

The G38 RAG pipeline is designed to eliminate LLM hallucinations by enforcing strict evidence grounding, hybrid search, citation tracking, and automatic knowledge gap logging.

---

## 1. Pipeline Stages

```text
STUDENT QUERY
       │
       ▼
AUTHENTICATION & VALIDATION
       │
       ▼
QUERY PREPROCESSING
       │
       ▼
QUESTION EMBEDDING
(sentence-transformers/all-MiniLM-L6-v2)
       │
       ▼
HYBRID RETRIEVAL
Vector Cosine Similarity (pgvector) + Sparse Lexical Filtering
       │
       ▼
DOCUMENT ACCESS & FRESHNESS FILTERING
(Only active, published, non-expired documents)
       │
       ▼
RECIPROCAL RANK FUSION (RRF)
RRF_score(d) = 1/(60 + r_dense) + 1/(60 + r_sparse)
       │
       ▼
CONTEXT CONSTRUCTION
(Bounded context with source IDs [source_1], [source_2])
       │
       ▼
GOOGLE GEMINI API (Official SDK)
Strict Grounding System Prompt + Temperature 0.1
       │
       ▼
STRUCTURED RESPONSE PARSING & CITATION VALIDATION
(Verify cited sources against actual database records)
       │
       ▼
KNOWLEDGE GAP LOGGING
(If insufficient evidence: record query in KnowledgeGap table)
       │
       ▼
RETURN GROUNDED RESPONSE + VERIFIED CITATIONS
```

---

## 2. Ingestion & Chunking Architecture

1. **Extraction:**
   - **PDF:** PyMuPDF extracts text per page, preserving exact page numbers and tables. Scanned PDFs are flagged.
   - **DOCX:** python-docx extracts heading structures (Heading 1, 2) and tables, using section titles as references instead of inventing false page numbers.
   - **PPTX:** python-pptx extracts slide shapes with slide numbers.

2. **Cleaning:**
   - Normalizes unicode whitespace, quotes, dashes.
   - Preserves numbered policy clauses (`Section 1.1`, `Rule 4(a)`), exact percentages (`75%`, `40%`), dates, and dollar amounts.

3. **Recursive Chunking:**
   - Target chunk size: **400–600 tokens** (~1600 characters).
   - Overlap: **60–100 tokens** (~300 characters).
   - Splits on natural paragraph and section boundaries.

4. **Embedding Generation:**
   - Model: `sentence-transformers/all-MiniLM-L6-v2`
   - Output: 384-dimensional normalized vectors.
   - Pre-computed and indexed in PostgreSQL via `pgvector` cosine similarity.

---

## 3. Grounding & Anti-Hallucination Guarantees

- **No Unsupported Assertions:** If the retrieved evidence does not contain the answer, G38 returns an honest *"I could not find sufficient information regarding this in the available official college documents"*.
- **Verified Citations Only:** Every citation card rendered in the frontend matches a real chunk verified from the database. Gemini cannot invent false citation IDs or document names.
- **Simplification without Deviation:** The "Simplify this Answer" feature transforms already-retrieved evidence into simple language, bullet points, or step-by-step formats without altering factual criteria or policy terms.
