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
 * Optimized: Only send essential hospital info to reduce prompt size (~70% smaller)
 */
function buildPrompt(userText, hospitalContext, lang) {
  // Extract only essential information (reduces prompt size significantly)
  const essentialInfo = {
    name: hospitalContext.hospital?.name || 'Lifeline Multi-Specialty Hospital',
    contact: {
      phone: hospitalContext.hospital?.contact?.phone,
      emergency: hospitalContext.hospital?.contact?.emergency
    },
    availability: {
      opd: hospitalContext.availability?.opd,
      emergency: hospitalContext.availability?.emergency,
      pharmacy: hospitalContext.availability?.pharmacy,
      visitingHours: hospitalContext.availability?.visitingHours
    },
    departments: hospitalContext.departments?.slice(0, 8) || [], // Limit to 8 departments
    capacity: {
      totalBeds: hospitalContext.capacity?.totalBeds,
      icu: hospitalContext.capacity?.departments?.icu
    },
    floors: hospitalContext.floors
  };

  return `${llmConfig.systemPrompt}

Hospital Info:
${JSON.stringify(essentialInfo, null, 2)}

Language: ${lang === 'hi' ? 'Hindi' : 'English'}
Question: ${userText}
Answer (1-2 sentences, conversational):`;
}

/**
 * Query Ollama API with streaming for faster first token
 */
async function queryOllama(prompt) {
  const url = `${llmConfig.baseUrl}/api/generate`;
  console.log('→ Ollama URL:', url);
  console.log('→ Sending streaming request to Ollama...');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: llmConfig.model,
        prompt: prompt,
        temperature: llmConfig.temperature,
        num_predict: llmConfig.maxTokens,
        stream: true  // Enable streaming for faster response
      }),
      signal: AbortSignal.timeout(llmConfig.timeout)
    });

    console.log('→ Ollama response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('→ Ollama error response:', errorText);
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    // Stream response for faster first token
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let firstTokenReceived = false;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.response) {
            if (!firstTokenReceived) {
              firstTokenReceived = true;
              console.log('→ First token received (streaming working)');
            }
            fullResponse += data.response;
          }
          if (data.done) {
            console.log('→ Streaming complete');
            return fullResponse.trim();
          }
        } catch (e) {
          // Skip invalid JSON lines (common in streaming)
        }
      }
    }
    
    return fullResponse.trim();
  } catch (error) {
    // Fallback to non-streaming if streaming fails
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      console.log('→ Streaming timeout, trying non-streaming fallback...');
      return queryOllamaFallback(prompt);
    }
    console.error('→ Ollama fetch error:', error.message);
    throw error;
  }
}

/**
 * Fallback: Non-streaming Ollama query
 */
async function queryOllamaFallback(prompt) {
  const url = `${llmConfig.baseUrl}/api/generate`;
  console.log('→ Using non-streaming fallback...');

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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.response.trim();
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
