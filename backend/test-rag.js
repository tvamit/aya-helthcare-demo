const axios = require('axios');

const API_URL = 'http://localhost:3000/api/ai';

const testQueries = [
  'What are the visiting hours?',
  'Can I visit ICU patients?',
  'Can children visit the hospital?',
  'Is smoking allowed in the hospital?',
  'How many visitors are allowed per patient?',
  'Can I take photos during my visit?',
  'Are visitors required to wear masks?',
];

async function testRAG() {
  console.log('🧪 Testing RAG System with Visitor Policy Questions\n');
  console.log('='.repeat(60));

  for (const query of testQueries) {
    try {
      console.log(`\n❓ Question: ${query}`);

      const response = await axios.post(`${API_URL}/text-query`, {
        query,
        sessionId: 'test-rag-' + Date.now(),
      });

      if (response.data.success) {
        console.log(`✅ Answer: ${response.data.response}\n`);
      } else {
        console.log(`❌ Failed: ${response.data}\n`);
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}\n`);
    }

    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('='.repeat(60));
  console.log('\n✅ RAG Testing Complete!');
}

testRAG().catch(console.error);
