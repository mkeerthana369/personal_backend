// ============================================
// FILE: scripts/test-ollama.js
// Test Ollama connectivity
// ============================================

const axios = require('axios');
require('dotenv').config();

async function testOllama() {
  const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.2:3b';
  
  console.log('🦙 Testing Ollama connection...');
  console.log(`📍 Host: ${host}`);
  console.log(`🤖 Model: ${model}`);
  console.log('');
  
  try {
    // Test 1: Check if Ollama is running
    console.log('1️⃣ Checking if Ollama is running...');
    const tagsResponse = await axios.get(`${host}/api/tags`, { timeout: 5000 });
    console.log('   ✅ Ollama is running');
    
    // Test 2: Check if model exists
    const models = tagsResponse.data.models || [];
    const modelExists = models.some(m => m.name === model);
    
    if (modelExists) {
      console.log(`   ✅ Model "${model}" is installed`);
    } else {
      console.log(`   ⚠️  Model "${model}" not found`);
      console.log(`   📥 Available models:`);
      models.forEach(m => console.log(`      - ${m.name}`));
      console.log('');
      console.log(`   💡 To install: ollama pull ${model}`);
      return;
    }
    
    // Test 3: Test generation
    console.log('');
    console.log('2️⃣ Testing generation...');
    const testPrompt = 'Say "Hello from Ollama!" and nothing else.';
    
    const generateResponse = await axios.post(
      `${host}/api/generate`,
      {
        model: model,
        prompt: testPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 50
        }
      },
      { timeout: 30000 }
    );
    
    console.log('   ✅ Generation successful!');
    console.log(`   📝 Response: ${generateResponse.data.response.substring(0, 100)}`);
    console.log('');
    console.log('🎉 All tests passed! Ollama is ready to use.');
    console.log('');
    console.log('📚 Next steps:');
    console.log('   1. Ensure USE_OLLAMA=true in .env');
    console.log('   2. Run: npm run dev');
    console.log('   3. Try: POST http://localhost:5000/api/clauses/generate-ai');
    
  } catch (error) {
    console.error('');
    console.error('❌ Test failed:', error.message);
    console.error('');
    console.error('💡 Troubleshooting:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   ⚠️  Cannot connect to Ollama');
      console.error('   📥 Install: winget install Ollama.Ollama');
      console.error('   🔄 Then restart your system');
      console.error('   ✅ Verify: ollama --version');
    } else if (error.response?.status === 404) {
      console.error('   ⚠️  Model not found');
      console.error(`   📥 Install model: ollama pull ${model}`);
    } else {
      console.error('   ⚠️  Unexpected error');
      console.error(`   📋 Details: ${error.message}`);
    }
    
    console.error('');
    console.error('   📖 Check: https://ollama.com/download');
  }
}

testOllama();