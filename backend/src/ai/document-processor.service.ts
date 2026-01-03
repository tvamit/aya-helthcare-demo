import { Injectable } from '@nestjs/common';
import { Document } from './vector-store.service';

@Injectable()
export class DocumentProcessorService {
  /**
   * Splits text into Q&A pairs
   */
  splitQAPairs(text: string): Document[] {
    const documents: Document[] = [];
    const lines = text.split('\n').filter((line) => line.trim());

    let currentQuestion = '';
    let currentAnswer = '';
    let id = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('Q:')) {
        // Save previous Q&A pair if exists
        if (currentQuestion && currentAnswer) {
          documents.push({
            id: `qa-${id++}`,
            content: `${currentQuestion}\n${currentAnswer}`,
            metadata: {
              question: currentQuestion.replace('Q:', '').trim(),
              answer: currentAnswer.replace('A:', '').trim(),
            },
          });
        }

        currentQuestion = trimmed;
        currentAnswer = '';
      } else if (trimmed.startsWith('A:')) {
        currentAnswer = trimmed;
      } else if (trimmed && !trimmed.match(/^\d+\./)) {
        // Continue multi-line answer
        if (currentAnswer) {
          currentAnswer += ' ' + trimmed;
        }
      }
    }

    // Add the last Q&A pair
    if (currentQuestion && currentAnswer) {
      documents.push({
        id: `qa-${id++}`,
        content: `${currentQuestion}\n${currentAnswer}`,
        metadata: {
          question: currentQuestion.replace('Q:', '').trim(),
          answer: currentAnswer.replace('A:', '').trim(),
        },
      });
    }

    return documents;
  }

  /**
   * Chunks text by character count with overlap
   */
  chunkText(
    text: string,
    chunkSize: number = 500,
    overlap: number = 50,
  ): Document[] {
    const documents: Document[] = [];
    const words = text.split(/\s+/);
    let currentChunk: string[] = [];
    let currentLength = 0;
    let id = 0;

    for (const word of words) {
      currentChunk.push(word);
      currentLength += word.length + 1;

      if (currentLength >= chunkSize) {
        documents.push({
          id: `chunk-${id++}`,
          content: currentChunk.join(' '),
        });

        // Keep overlap
        const overlapWords = Math.floor(
          (overlap / currentLength) * currentChunk.length,
        );
        currentChunk = currentChunk.slice(-overlapWords);
        currentLength = currentChunk.join(' ').length;
      }
    }

    // Add remaining chunk
    if (currentChunk.length > 0) {
      documents.push({
        id: `chunk-${id++}`,
        content: currentChunk.join(' '),
      });
    }

    return documents;
  }
}
