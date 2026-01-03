import { Injectable, OnModuleInit } from '@nestjs/common';
import { VectorStoreService } from './vector-store.service';
import { DocumentProcessorService } from './document-processor.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class KnowledgeLoaderService implements OnModuleInit {
  constructor(
    private vectorStoreService: VectorStoreService,
    private documentProcessorService: DocumentProcessorService,
  ) {}

  async onModuleInit() {
    // Wait for vector store to be fully initialized
    await this.waitForVectorStore();
    console.log('📚 Loading knowledge base into vector store...');
    await this.loadVisitorPolicy();
    console.log(
      `✅ Knowledge base loaded. Total documents: ${this.vectorStoreService.getDocumentCount()}`,
    );
  }

  private async waitForVectorStore(maxWait = 30000) {
    const startTime = Date.now();
    while (!this.vectorStoreService['isInitialized']) {
      if (Date.now() - startTime > maxWait) {
        throw new Error('Vector store initialization timeout');
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  private async loadVisitorPolicy() {
    try {
      const policyPath = path.join(__dirname, 'data', 'visitor-policy.txt');

      if (!fs.existsSync(policyPath)) {
        console.warn(`⚠️ Visitor policy file not found at ${policyPath}`);
        return;
      }

      const policyContent = fs.readFileSync(policyPath, 'utf-8');

      // Split into Q&A pairs
      const documents =
        this.documentProcessorService.splitQAPairs(policyContent);

      console.log(
        `📄 Processing ${documents.length} visitor policy Q&A pairs...`,
      );

      // Add to vector store
      await this.vectorStoreService.addDocuments(documents);

      console.log(`✅ Visitor policy loaded successfully`);
    } catch (error) {
      console.error('❌ Error loading visitor policy:', error);
    }
  }

  async addCustomDocument(content: string, metadata?: Record<string, any>) {
    const documents = this.documentProcessorService.chunkText(content);
    documents.forEach((doc) => {
      doc.metadata = { ...doc.metadata, ...metadata };
    });
    await this.vectorStoreService.addDocuments(documents);
  }
}
