# Donation Matching Agent Backend

## Built with Google ADK (Agent Development Kit)

This backend is powered by **Google ADK v1.17.0+**, Google's cutting-edge framework for building intelligent, agentic systems. ADK enables:

- **Multi-Agent Architectures**: Seamlessly orchestrate multiple AI agents working together to solve complex problems
- **Agentic Workflows**: Leverage function calling, tool usage, and structured outputs for reliable, production-ready AI systems
- **Best-in-Class Extensibility**: Easily extend with custom tools, integrate external APIs, and scale your agent ecosystem
- **Advanced Features**: Built-in support for streaming responses (SSE), session management, state persistence, and thought signatures for transparent AI reasoning
- **Production-Ready**: Enterprise-grade reliability with Google's Gemini models (gemini-2.5-pro) for intelligent donation matching

### Why ADK?

ADK represents the future of building AI-powered applications with autonomous agents that can:
- Call multiple tools/functions in parallel
- Maintain conversation context and state
- Stream real-time responses for better UX
- Return structured, type-safe outputs via Pydantic models
- Make intelligent decisions based on complex, multi-dimensional data

## Quickstart

```bash
cd backend

# 1. Install dependencies
uv sync

# 2. Add GOOGLE_API_KEY to .env under backend/donation_matching_agent/
# Note to prof, if you would like to test this locally, you can ask the team for our API_KEY or you may create your own free-tier API key

# 3. run adk web server locally
uv run adk web --allow_origins='*'
# For local testing, access at http://127.0.0.1:8000. 
```

## Architecture

The donation matching agent uses ADK's agentic workflow pattern:

1. **Tool Calling**: Agent calls `get_beneficiary_profiles()`, `get_donations()`, and `get_active_needs()` to gather data
2. **Intelligent Analysis**: Gemini 2.5 Pro analyzes compatibility across multiple dimensions (geography, expiry urgency, storage, category)
3. **Structured Output**: Returns type-safe `MatchBatch` with detailed scoring and reasoning via `set_model_response()` tool

This architecture ensures extensibility - new tools, data sources, or matching criteria can be added without modifying core logic.