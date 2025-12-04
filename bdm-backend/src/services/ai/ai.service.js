// ============================================
// FILE: src/services/ai/ai.service.js
// Main AI orchestrator with fallback (~200 lines)
// ============================================

const axios = require('axios');
const OpenAI = require('openai');
const config = require('../../config/ai.config');
const ollamaService = require('./ollama.service');
const promptBuilder = require('./prompt.builder');
const responseParser = require('./response.parser');

class AIService {
  
  constructor() {
    this.openai = config.openai.apiKey 
      ? new OpenAI({ apiKey: config.openai.apiKey })
      : null;
  }
  
  // ============================================
  // MAIN REQUEST HANDLER (with automatic fallback)
  // ============================================
  
  async makeRequest(messages, temperature = 0.7) {
    const providers = config.getActiveProviders();
    
    if (providers.length === 0) {
      throw new Error('No AI providers configured. Set OLLAMA, OPENROUTER, or OPENAI in .env');
    }
    
    let lastError = null;
    
    // Try each provider in priority order
    for (const provider of providers) {
      try {
        console.log(`🤖 Trying provider: ${provider}`);
        
        let result;
        
        if (provider === 'ollama') {
          result = await ollamaService.call(messages, temperature);
        } else if (provider === 'openrouter') {
          result = await this.callOpenRouter(messages, temperature);
        } else if (provider === 'openai') {
          result = await this.callOpenAI(messages, temperature);
        }
        
        console.log(`✅ Success with ${provider}`);
        return result;
        
      } catch (error) {
        lastError = error;
        console.log(`⚠️ ${provider} failed: ${error.message}`);
        console.log(`   Trying next provider...`);
      }
    }
    
    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
  }
  
  // ============================================
  // OPENROUTER (with model fallback)
  // ============================================
  
  async callOpenRouter(messages, temperature) {
    if (!config.openrouter.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }
    
    const modelsToTry = [
      config.openrouter.model,
      ...config.openrouter.fallbackModels
    ];
    
    let lastError = null;
    
    for (const model of modelsToTry) {
      try {
        console.log(`  → Trying model: ${model}`);
        
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: model,
            messages: messages,
            temperature: temperature
          },
          {
            headers: {
              'Authorization': `Bearer ${config.openrouter.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:5000',
              'X-Title': 'BDM System V2'
            },
            timeout: config.openrouter.timeout
          }
        );
        
        return {
          content: response.data.choices[0].message.content,
          tokensUsed: response.data.usage?.total_tokens || 0,
          model: model,
          provider: 'openrouter'
        };
        
      } catch (error) {
        lastError = error;
        const msg = error.message || JSON.stringify(error);
        
        if (msg.includes('rate-limited') || msg.includes('429')) {
          console.log(`  ⚠️ Rate limited, trying next model...`);
          continue;
        }
        
        if (msg.includes('404') || msg.includes('not found')) {
          console.log(`  ⚠️ Model not found, trying next...`);
          continue;
        }
        
        throw error;
      }
    }
    
    throw lastError || new Error('All OpenRouter models failed');
  }
  
  // ============================================
  // OPENAI (fallback)
  // ============================================
  
  async callOpenAI(messages, temperature) {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }
    
    console.log('  → Using OpenAI');
    
    const completion = await this.openai.chat.completions.create({
      model: config.openai.model,
      messages: messages,
      temperature: temperature
    });
    
    return {
      content: completion.choices[0].message.content,
      tokensUsed: completion.usage.total_tokens,
      model: config.openai.model,
      provider: 'openai'
    };
  }
  
  // ============================================
  // HIGH-LEVEL GENERATION METHODS
  // ============================================
  
  async generateClauses(documentType, context = {}) {
    try {
      const prompt = promptBuilder.buildClausePrompt(documentType, context);
      
      const messages = [
        {
          role: 'system',
          content: 'You are a professional document generator. Generate structured, professional document clauses in JSON format with HTML content. Return ONLY valid JSON, nothing else.'
        },
        { role: 'user', content: prompt }
      ];
      
      const result = await this.makeRequest(messages, 0.7);
      const response = responseParser.parse(result.content);
      responseParser.validateClauses(response);
      
      // Log HTML clauses
      console.log('\n' + '='.repeat(80));
      console.log(`✅ Generated ${response.clauses.length} clauses using ${result.provider}/${result.model}`);
      console.log('='.repeat(80));
      
      return {
        success: true,
        clauses: response.clauses,
        tokensUsed: result.tokensUsed,
        model: result.model,
        provider: result.provider
      };
      
    } catch (error) {
      console.error('❌ Clause generation error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  async generateSingleClause(clauseType, category, context = {}) {
    try {
      const prompt = promptBuilder.buildSingleClausePrompt(clauseType, category, context);
      
      const messages = [
        {
          role: 'system',
          content: 'Return ONLY valid JSON starting with { and ending with }. No explanations.'
        },
        { role: 'user', content: prompt }
      ];
      
      const result = await this.makeRequest(messages, 0.7);
      const response = responseParser.parse(result.content);
      responseParser.validateClause(response);
      
      console.log(`✅ Generated single clause [${clauseType}] using ${result.provider}`);
      
      return {
        success: true,
        clause: response.clause,
        tokensUsed: result.tokensUsed,
        model: result.model,
        provider: result.provider
      };
      
    } catch (error) {
      console.error('❌ Single clause error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  async translateText(text, targetLang) {
    try {
      const prompt = promptBuilder.buildTranslationPrompt(text, targetLang);
      
      const isHTML = /<[a-z][\s\S]*>/i.test(text);
      
      const messages = [
        {
          role: 'system',
          content: isHTML
            ? 'You are an HTML-aware translator. Preserve ALL HTML tags while translating text content. Return ONLY the translated HTML.'
            : 'You are a professional translator. Preserve placeholders and formatting. Return ONLY the translated text.'
        },
        { role: 'user', content: prompt }
      ];
      
      const result = await this.makeRequest(messages, 0.3);
      
      console.log(`🌐 Translated (${text.length} → ${result.content.length} chars) using ${result.provider}`);
      
      return {
        success: true,
        translated: result.content.trim(),
        tokensUsed: result.tokensUsed,
        model: result.model,
        provider: result.provider,
        isHTML: isHTML
      };
      
    } catch (error) {
      console.error('❌ Translation error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  getConfig() {
    const providers = config.getActiveProviders();
    return {
      providers: providers,
      primary: providers[0] || 'none',
      models: {
        ollama: config.ollama.model,
        openrouter: config.openrouter.model,
        openai: config.openai.model
      },
      output_format: 'HTML'
    };
  }
}

module.exports = new AIService();