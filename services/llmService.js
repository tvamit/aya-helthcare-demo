const llmConfig = require('../config/llm.config');

/**
 * Ask LLM for a response based on user query and hospital context
 * @param {string} userText - User's question
 * @param {object} hospitalContext - Hospital information context
 * @param {string} lang - Language code (hi or en)
 * @returns {Promise<string>} - AI-generated response
 */
async function askLLM(userText, hospitalContext, lang = 'en') {
  try {
    console.log('\n🤖 Querying LLM...');
    console.log('Provider:', llmConfig.provider);
    console.log('Model:', llmConfig.model);
    console.log('User query:', userText);

    // Build the prompt with context
    const prompt = buildPrompt(userText, hospitalContext, lang);

    // Route to appropriate provider
    let response;
    switch (llmConfig.provider) {
      case 'ollama':
        response = await queryOllama(prompt);
        break;
      case 'openai':
        response = await queryOpenAI(prompt);
        break;
      case 'anthropic':
        response = await queryAnthropic(prompt);
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${llmConfig.provider}`);
    }

    console.log('✅ LLM response received');
    console.log('Response:', response);

    return response;
  } catch (error) {
    console.error('❌ LLM Error:', error.message);

    // Fallback response
    return lang === 'hi'
      ? 'क्षमा करें, मुझे तकनीकी समस्या हो रही है। कृपया रिसेप्शन से संपर्क करें।'
      : 'Sorry, I\'m experiencing technical difficulties. Please contact reception.';
  }
}

/**
 * Build prompt with system instructions and context
 */
function buildPrompt(userText, hospitalContext, lang) {
  return `${llmConfig.systemPrompt}

Hospital Information:
${JSON.stringify(hospitalContext, null, 2)}

Language: ${lang === 'hi' ? 'Hindi' : 'English'}
${lang === 'hi' ? 'Respond in Hindi (Devanagari script).' : 'Respond in English.'}

User Question:
${userText}

Answer (short and conversational):`;
}

/**
 * Query Ollama API
 */
async function queryOllama(prompt) {
  const url = `${llmConfig.baseUrl}/api/generate`;
  console.log('→ Ollama URL:', url);
  console.log('→ Sending request to Ollama...');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: llmConfig.model,
        prompt: prompt,
        temperature: llmConfig.temperature,
        num_predict: llmConfig.maxTokens,
        stream: false
      }),
      signal: AbortSignal.timeout(llmConfig.timeout)
    });

    console.log('→ Ollama response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('→ Ollama error response:', errorText);
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('→ Ollama response data:', data);
    return data.response.trim();
  } catch (error) {
    console.error('→ Ollama fetch error:', error.message);
    console.error('→ Error stack:', error.stack);
    throw error;
  }
}

/**
 * Query OpenAI API
 */
async function queryOpenAI(prompt) {
  const response = await fetch(`${llmConfig.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: llmConfig.model,
      messages: [
        { role: 'system', content: llmConfig.systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: llmConfig.temperature,
      max_tokens: llmConfig.maxTokens
    }),
    signal: AbortSignal.timeout(llmConfig.timeout)
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/**
 * Query Anthropic (Claude) API
 */
async function queryAnthropic(prompt) {
  const response = await fetch(`${llmConfig.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: llmConfig.model,
      max_tokens: llmConfig.maxTokens,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: llmConfig.temperature
    }),
    signal: AbortSignal.timeout(llmConfig.timeout)
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

/**
 * Test LLM connection
 */
async function testLLMConnection() {
  try {
    console.log('\n🧪 Testing LLM connection...');
    const testResponse = await askLLM('Hello', { test: true }, 'en');
    console.log('✅ LLM connection successful');
    return true;
  } catch (error) {
    console.error('❌ LLM connection failed:', error.message);
    return false;
  }
}

module.exports = {
  askLLM,
  testLLMConnection
};
