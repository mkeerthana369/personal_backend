BDM Backend  - Setup Guide

1. Install Dependencies
   npm install

2. Setup Database
   mysql -u root -p < database/schema.sql
   or
   node scripts/setup-database.js

3. Create Environment File
   cp .env.example .env
   Edit the .env file with your database settings and AI preferences.

4. Install Ollama (Local AI)
   Required for free local AI models.

   4.1 Download and install Ollama for Windows using winget:
       winget install Ollama.Ollama
       Restart the system after installation.

   4.2 Verify installation:
       ollama --version

   4.3 Download recommended model:
       ollama pull llama3.2:3b

5. Start the Server
   npm run dev

6. Test AI Integration
   npm run test-ollama

7. AI Provider Order
   The system automatically selects AI providers in this order:
   1. Ollama (local, free)
   2. OpenRouter (cloud)
   3. OpenAI (fallback)

   Configure these in the .env:
   USE_OLLAMA=true
   USE_OPENROUTER=false
   USE_OPENAI=false

8. Project Structure
   src/
   ├── api/ (routes and controllers)
   ├── services/ (business logic)
   ├── database/ (models and queries)
   ├── config/ (configuration files)
   ├── middleware/ (express middleware)
   ├── utils/ (helper functions)
   └── constants/ (enums and constant values)

9. Features
   - AI-powered clause generation
   - Template-based document generation
   - Bulk Excel → Document generation
   - PDF generation (HTML based)
   - Multi-language translation
   - Clause merging
   - Bilingual PDF support

10. Database Safety
    This version uses a new database: bdm_system_v2
    It does not modify your old database.
