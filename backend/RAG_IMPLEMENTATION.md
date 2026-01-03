# RAG (Retrieval Augmented Generation) Implementation

## Overview

This healthcare demo now includes a **Retrieval Augmented Generation (RAG)** system that enables the AI to answer questions based on hospital visitor policies using semantic search.

## Architecture

### Components

1. **VectorStoreService** ([vector-store.service.ts](src/ai/vector-store.service.ts))
   - In-memory vector database
   - Uses `@xenova/transformers` with `Xenova/all-MiniLM-L6-v2` model for embeddings
   - Implements cosine similarity search
   - No external services required - runs locally!

2. **DocumentProcessorService** ([document-processor.service.ts](src/ai/document-processor.service.ts))
   - Splits text into Q&A pairs
   - Chunks large documents with overlap
   - Prepares documents for vector storage

3. **KnowledgeLoaderService** ([knowledge-loader.service.ts](src/ai/knowledge-loader.service.ts))
   - Loads visitor policy on startup
   - Initializes vector store with knowledge base
   - Currently loads **47 Q&A pairs** from visitor-policy.txt

4. **AI Service Integration**
   - Modified `searchVectorDB()` method to use local vector store
   - Semantic search retrieves top 7 relevant Q&A pairs
   - Results are injected into AI prompt for context-aware responses

## How It Works

### 1. Document Loading (on server startup)
```
📚 Loading knowledge base into vector store...
📄 Processing 47 visitor policy Q&A pairs...
✅ Visitor policy loaded successfully
✅ Knowledge base loaded. Total documents: 47
```

### 2. Query Processing Flow

```
User Question
    ↓
Embedding Generation (user query → vector)
    ↓
Similarity Search (find top 7 relevant Q&A pairs)
    ↓
Context Injection (add relevant Q&As to AI prompt)
    ↓
AI Response Generation (Groq LLM with context)
    ↓
Answer to User
```

### 3. Example

**User asks:** "Can I visit ICU patients?"

**Vector Search finds:**
```
Q: Are visitors allowed in the ICU?
A: Visitors are allowed in the ICU but only during designated hours...

Q: Are visiting hours different for ICU patients?
A: Yes, ICU visiting hours are more restricted to ensure the patient's safety...
```

**AI Response:**
> "Yes, visitors are allowed in ICU, but only during designated hours.
> Please visit 3rd floor, ICU between 11am-12pm or 4pm-5pm.
> Strict safety protocols must be followed."

## Files Structure

```
backend/
├── src/ai/
│   ├── vector-store.service.ts          # Vector database
│   ├── document-processor.service.ts    # Document chunking
│   ├── knowledge-loader.service.ts      # Knowledge base loader
│   ├── ai.service.ts                    # AI service (updated)
│   ├── ai.module.ts                     # Module registration
│   └── data/
│       └── visitor-policy.txt           # Visitor policy FAQ (47 Q&As)
├── test-rag.js                          # Test script
└── RAG_IMPLEMENTATION.md                # This file
```

## Adding New Knowledge

### Option 1: Add to Visitor Policy File

Edit `src/ai/data/visitor-policy.txt`:

```
Q: Your question here?
A: Your answer here.
```

### Option 2: Add Custom Documents Programmatically

```typescript
import { KnowledgeLoaderService } from './ai/knowledge-loader.service';

// In your service
await knowledgeLoaderService.addCustomDocument(
  'Your document content here',
  { category: 'medical', department: 'cardiology' }
);
```

## Testing

Run the included test script:

```bash
node test-rag.js
```

This tests 7 visitor policy questions and displays AI responses.

## Key Features

✅ **Local embeddings** - No external API calls for embeddings
✅ **Fast semantic search** - Cosine similarity with optimized vector operations
✅ **Automatic loading** - Knowledge base loads on server startup
✅ **Bilingual support** - Works with Hindi and English queries
✅ **Context-aware** - AI responses grounded in actual policy documents
✅ **Scalable** - Easy to add more documents and knowledge

## Performance

- **Embedding Model**: all-MiniLM-L6-v2 (lightweight, fast)
- **Document Count**: 47 Q&A pairs currently loaded
- **Search Results**: Top 7 most relevant documents per query
- **Response Time**: ~1-2 seconds including embedding + search + AI generation

## Future Enhancements

Potential improvements:

1. **Persistent Storage**: Save embeddings to disk (avoid re-embedding on restart)
2. **External Vector DB**: Integrate with Pinecone, Weaviate, or Qdrant for scale
3. **More Documents**: Add medical FAQs, treatment procedures, department info
4. **Hybrid Search**: Combine keyword search with semantic search
5. **Metadata Filtering**: Filter by department, category, urgency level
6. **Analytics**: Track which questions are asked most frequently

## Dependencies

```json
{
  "@xenova/transformers": "^2.x.x"  // Local embeddings
}
```

## Environment Variables

No additional environment variables needed! The RAG system works out-of-the-box with local embeddings.

## Troubleshooting

### Documents not loading?

Check logs for:
```
📚 Loading knowledge base into vector store...
✅ Knowledge base loaded. Total documents: 47
```

If you see `Total documents: 0`, verify:
- File exists at `src/ai/data/visitor-policy.txt`
- Build process copies files (check `nest-cli.json` assets config)
- Run `npm run build` to copy data files to dist folder

### Vector search not working?

Check logs for:
```
🔍 Local vector search found X results for: "query"
```

If you see errors:
- Verify embeddings model downloaded correctly
- Check internet connection (first run downloads model)
- Verify VectorStoreService is initialized

## Summary

The RAG implementation enables your healthcare AI to:
- Answer visitor policy questions accurately
- Provide consistent, policy-grounded responses
- Handle both English and Hindi queries
- Scale to more knowledge domains easily

All running **locally** without external vector database services!
