import { Injectable, OnModuleInit } from '@nestjs/common';
import { pipeline } from '@xenova/transformers';

export interface Document {
  id: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface VectorDocument extends Document {
  embedding: number[];
}

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private embedder: any;
  private documents: VectorDocument[] = [];
  private isInitialized = false;

  async onModuleInit() {
    console.log('Initializing embedding model...');
    try {
      this.embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
      );
      this.isInitialized = true;
      console.log('Embedding model initialized successfully');
    } catch (error) {
      console.error('Failed to initialize embedding model:', error);
    }
  }

  async addDocuments(documents: Document[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Vector store not initialized');
    }

    for (const doc of documents) {
      const embedding = await this.createEmbedding(doc.content);
      this.documents.push({
        ...doc,
        embedding,
      });
    }

    console.log(`Added ${documents.length} documents to vector store`);
  }

  async similaritySearch(
    query: string,
    topK: number = 3,
  ): Promise<Document[]> {
    if (!this.isInitialized) {
      throw new Error('Vector store not initialized');
    }

    if (this.documents.length === 0) {
      return [];
    }

    const queryEmbedding = await this.createEmbedding(query);

    const similarities = this.documents.map((doc) => ({
      doc,
      similarity: this.cosineSimilarity(queryEmbedding, doc.embedding),
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, topK).map((item) => ({
      id: item.doc.id,
      content: item.doc.content,
      metadata: item.doc.metadata,
    }));
  }

  private async createEmbedding(text: string): Promise<number[]> {
    const output = await this.embedder(text, {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(output.data);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  getDocumentCount(): number {
    return this.documents.length;
  }

  clear(): void {
    this.documents = [];
  }
}
