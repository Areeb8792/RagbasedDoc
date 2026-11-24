from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings

from documents.models import KnowledgeCollection, Document, DocumentChunk
from rag.services.retriever import retriever
from rag.services.pipeline import RAGPipeline
from rag.services.gemini_service import gemini_service
from rag.services.embeddings import embedding_service

User = get_user_model()

class RAGPipelineComprehensiveTests(TestCase):
    def setUp(self):
        self.alice = User.objects.create_user(
            email='alice_rag@college.edu',
            username='alice_rag',
            password='password123',
            first_name='Alice',
            last_name='Researcher',
            role='student'
        )
        self.bob = User.objects.create_user(
            email='bob_rag@college.edu',
            username='bob_rag',
            password='password123',
            first_name='Bob',
            last_name='Student',
            role='student'
        )

        # Alice's Collections
        self.ml_collection = KnowledgeCollection.objects.create(
            name='Machine Learning & Neural Nets',
            description='Deep learning and optimization',
            owner=self.alice,
            color='#EA7957'
        )
        self.bio_collection = KnowledgeCollection.objects.create(
            name='Molecular Biology',
            description='Genetics and cellular processes',
            owner=self.alice,
            color='#BDD9B0'
        )

        # Alice's Document in ML Collection
        self.ml_doc = Document.objects.create(
            title='Neural Networks Fundamentals',
            original_filename='nn_fundamentals.txt',
            file_type='txt',
            is_personal=True,
            collection=self.ml_collection,
            uploaded_by=self.alice,
            document_status='indexed'
        )
        self.ml_chunk_1 = DocumentChunk.objects.create(
            document=self.ml_doc,
            collection=self.ml_collection,
            chunk_index=0,
            content=(
                "Backpropagation is an algorithm that calculates the gradient of the loss function with respect to "
                "each weight by the chain rule, computing the gradient one layer at a time, iterating backward from the output."
            ),
            page_number=1,
            section_title="Backpropagation Algorithm",
            embedding=embedding_service.embed_text("Backpropagation calculates the gradient using chain rule iterating backward.")
        )
        self.ml_chunk_2 = DocumentChunk.objects.create(
            document=self.ml_doc,
            collection=self.ml_collection,
            chunk_index=1,
            content=(
                "Convolutional layers use spatial filters with weight sharing to detect local visual features. "
                "Pooling layers perform spatial downsampling to reduce parameters."
            ),
            page_number=2,
            section_title="Convolutional Layers",
            embedding=embedding_service.embed_text("Convolutional layers use spatial filters with weight sharing.")
        )

        # Alice's Document in Biology Collection
        self.bio_doc = Document.objects.create(
            title='Cellular Respiration Notes',
            original_filename='respiration.txt',
            file_type='txt',
            is_personal=True,
            collection=self.bio_collection,
            uploaded_by=self.alice,
            document_status='indexed'
        )
        self.bio_chunk = DocumentChunk.objects.create(
            document=self.bio_doc,
            collection=self.bio_collection,
            chunk_index=0,
            content=(
                "Glycolysis is the metabolic pathway that converts glucose into pyruvate. The free energy released in this "
                "process is used to form high-energy molecules ATP and NADH."
            ),
            page_number=1,
            section_title="Glycolysis",
            embedding=embedding_service.embed_text("Glycolysis metabolic pathway converts glucose into pyruvate.")
        )

    def test_embedding_generation_consistency(self):
        """Verify embedding dimension and vector generation."""
        vec = embedding_service.embed_text("Machine learning optimization")
        self.assertIsNotNone(vec)
        self.assertEqual(len(vec), 384)

    def test_single_collection_scope_isolation(self):
        """Queries scoped to ML collection must NOT retrieve from Biology collection."""
        results = retriever.retrieve(
            query="Explain the chain rule in backpropagation",
            user=self.alice,
            scope="collection",
            collection_id=str(self.ml_collection.id)
        )
        self.assertGreater(len(results), 0)
        self.assertEqual(results[0]['document_id'], str(self.ml_doc.id))

        # Ensure no biology chunk leaked
        for r in results:
            self.assertNotEqual(r['document_id'], str(self.bio_doc.id))

    def test_cross_user_isolation(self):
        """Bob must NEVER retrieve Alice's personal documents even with the same query."""
        results = retriever.retrieve(
            query="Backpropagation chain rule",
            user=self.bob,
            scope="collection",
            collection_id=str(self.ml_collection.id)
        )
        self.assertEqual(len(results), 0)

        results_personal_all = retriever.retrieve(
            query="Backpropagation chain rule",
            user=self.bob,
            scope="personal_all"
        )
        self.assertEqual(len(results_personal_all), 0)

    def test_single_document_pinned_scope(self):
        """Queries pinned to a single document must only retrieve from that document."""
        results = retriever.retrieve(
            query="What do convolutional layers do?",
            user=self.alice,
            scope="document",
            document_id=str(self.ml_doc.id)
        )
        self.assertGreater(len(results), 0)
        for r in results:
            self.assertEqual(r['document_id'], str(self.ml_doc.id))

    def test_no_evidence_abstention(self):
        """When query is irrelevant to all documents, pipeline must report insufficient evidence."""
        output = RAGPipeline.execute(
            query="What is the recipe for chocolate chip cookies?",
            user=self.alice,
            scope="collection",
            collection_id=str(self.ml_collection.id)
        )
        self.assertTrue(output['insufficient_evidence'])
        self.assertEqual(len(output['citations']), 0)
        self.assertIn("could not find sufficient information", output['answer'].lower())

    def test_citation_validation_and_grounding(self):
        """Valid query must produce citations mapping directly to existing chunks."""
        output = RAGPipeline.execute(
            query="How does backpropagation calculate gradients?",
            user=self.alice,
            scope="collection",
            collection_id=str(self.ml_collection.id)
        )
        self.assertFalse(output['insufficient_evidence'])
        self.assertGreater(len(output['citations']), 0)
        top_citation = output['citations'][0]
        self.assertEqual(top_citation['document_id'], str(self.ml_doc.id))
        self.assertEqual(top_citation['page_number'], 1)
        self.assertEqual(top_citation['section_title'], "Backpropagation Algorithm")

    def test_gemini_json_safe_parser(self):
        """Test JSON cleaner handles markdown wrapping."""
        raw_json_wrapped = '```json\n{"answer": "Verified content", "cited_sources": ["source_1"]}\n```'
        parsed = gemini_service._safe_parse_json(raw_json_wrapped)
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed.get('answer'), 'Verified content')
