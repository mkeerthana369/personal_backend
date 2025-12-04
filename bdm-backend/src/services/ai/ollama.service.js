// ============================================
// FILE: src/services/ai/ollama.service.js
// NEW: Ollama Local LLM Service (~100 lines)
// ============================================

const axios = require('axios');
const config = require('../../config/ai.config');

class OllamaService {
  
  async isAvailable() {
    if (!config.ollama.enabled) return false;
    
    try {
      const response = await axios.get(`${config.ollama.host}/api/tags`, {
        timeout: 3000
      });
      return response.status === 200;
    } catch (error) {
      console.log('⚠️ Ollama not available:', error.message);
      return false;
    }
  }
  
  async call(messages, temperature = 0.7) {
    if (!await this.isAvailable()) {
      throw new Error('Ollama is not available');
    }
    
    try {
      console.log(`🦙 Calling Ollama: ${config.ollama.model}`);
      
      // Convert messages to Ollama format
      const prompt = this.formatMessages(messages);
      
      const response = await axios.post(
        `${config.ollama.host}/api/generate`,
        {
          model: config.ollama.model,
          prompt: prompt,
          temperature: temperature,
          stream: false,
          options: {
            temperature: temperature,
            num_predict: 2000
          }
        },
        {
          timeout: config.ollama.timeout
        }
      );
      
      console.log('✅ Ollama response received');
      
      return {
        content: response.data.response,
        tokensUsed: response.data.eval_count || 0,
        model: config.ollama.model,
        provider: 'ollama'
      };
      
    } catch (error) {
      console.error('❌ Ollama error:', error.message);
      throw new Error(`Ollama failed: ${error.message}`);
    }
  }
  
  formatMessages(messages) {
    return messages.map(msg => {
      if (msg.role === 'system') {
        return `System: ${msg.content}\n\n`;
      } else if (msg.role === 'user') {
        return `User: ${msg.content}\n\n`;
      } else {
        return `${msg.content}\n\n`;
      }
    }).join('') + 'Assistant:';
  }
}

module.exports = new OllamaService();
