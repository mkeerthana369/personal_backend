// ============================================
// FILE: src/config/ai.config.js
// AI providers configuration with priority
// ============================================

require('dotenv').config();

class AIConfig {
  constructor() {
    // Ollama (Local LLM) - PRIORITY 1
    this.ollama = {
      enabled: process.env.USE_OLLAMA === 'true',
      host: process.env.OLLAMA_HOST || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
      timeout: 60000 // 60 seconds
    };
    
    // OpenRouter (Cloud) - PRIORITY 2
    this.openrouter = {
      enabled: process.env.USE_OPENROUTER === 'true',
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct',
      fallbackModels: process.env.OPENROUTER_FALLBACK_MODELS
        ? process.env.OPENROUTER_FALLBACK_MODELS.split(',')
        : [
            'google/gemini-flash-1.5',
            'qwen/qwen-2-7b-instruct',
            'mistralai/mistral-7b-instruct'
          ],
      timeout: 30000
    };
    
    // OpenAI (Fallback) - PRIORITY 3
    this.openai = {
      enabled: process.env.USE_OPENAI === 'true',
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      timeout: 30000
    };
  }
  
  // Get active providers in priority order
  getActiveProviders() {
    const providers = [];
    
    if (this.ollama.enabled && this.ollama.host) {
      providers.push('ollama');
    }
    
    if (this.openrouter.enabled && this.openrouter.apiKey) {
      providers.push('openrouter');
    }
    
    if (this.openai.enabled && this.openai.apiKey) {
      providers.push('openai');
    }
    
    return providers;
  }
  
  // Check if at least one provider is configured
  hasAnyProvider() {
    return this.getActiveProviders().length > 0;
  }
  
  // Get configuration for specific provider
  getProvider(name) {
    return this[name] || null;
  }
}

module.exports = new AIConfig();