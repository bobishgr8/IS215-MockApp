# ADK SSE Integration Guide

## Overview
The frontend now calls ADK's built-in `/run_sse` endpoint instead of a custom FastAPI endpoint. This document explains how the integration works.

## ADK SSE Response Format

ADK streams messages in Server-Sent Events (SSE) format. Each message is prefixed with `data: ` and contains JSON.

### Message Types

1. **Function Call Messages** - When agent calls a tool
```json
{
  "content": {
    "parts": [{
      "functionCall": {
        "name": "get_beneficiary_profiles",
        "id": "adk-xxx",
        "args": {}
      }
    }],
    "role": "model"
  },
  "invocationId": "e-xxx",
  "author": "donation_matching_agent"
}
```

2. **Function Response Messages** - Results from tool execution
```json
{
  "content": {
    "parts": [{
      "functionResponse": {
        "id": "adk-xxx",
        "name": "get_beneficiary_profiles",
        "response": {
          "result": [/* array of data */]
        }
      }
    }],
    "role": "user"
  }
}
```

3. **Final Structured Output** - The MatchBatch result
```json
{
  "content": {
    "parts": [{
      "text": "{\"matches\": [...], \"total_matches\": 10, ...}"
    }],
    "role": "model"
  },
  "invocationId": "e-xxx",
  "author": "donation_matching_agent"
}
```

## Frontend Parsing Strategy

### 1. Parse SSE Stream
```typescript
for (const line of lines) {
  if (line.startsWith('data: ')) {
    const data = line.slice(6);
    const parsed = JSON.parse(data);
    // Process parsed message
  }
}
```

### 2. Extract Structured Output
Look for `content.parts[].text` containing JSON:
```typescript
if (parsed.content?.parts) {
  for (const part of parsed.content.parts) {
    if (part.text) {
      const matchData = JSON.parse(part.text);
      if (matchData.matches && matchData.total_matches !== undefined) {
        // This is our MatchBatch result!
        setMatchResults(matchData);
      }
    }
  }
}
```

### 3. Track Status Updates
Monitor function calls to show progress:
```typescript
if (parsed.content?.parts?.some((p: any) => p.functionCall)) {
  const functionName = parsed.content.parts.find((p: any) => p.functionCall)?.functionCall?.name;
  if (functionName === 'get_beneficiary_profiles') {
    setStatusMessage('Fetching beneficiary profiles...');
  }
  // ... etc
}
```

## Request Format

POST to `/run_sse` with:
```json
{
  "appName": "donation_matching_agent",
  "userId": "user",
  "sessionId": "session-1234567890",
  "newMessage": {
    "role": "user",
    "parts": [{"text": "run match"}]
  },
  "streaming": true,
  "stateDelta": null
}
```

## TypeScript Interface

```typescript
interface MatchResult {
  donation_id: string;
  need_id: string;
  beneficiary_id: string;
  match_status: string;
  geographic_proximity_score: number;
  expiry_urgency_score: number;
  storage_compatibility_score: number;
  category_match_score: number;
  overall_match_score: number;
  reasoning: string;
}

interface MatchBatch {
  matches: MatchResult[];
  total_matches: number;
  timestamp: string;
  unmatched_donations: string;  // Comma-separated
  unmatched_needs: string;       // Comma-separated
}
```

## Benefits of ADK SSE Endpoint

✅ **No Custom Backend** - Uses ADK's built-in routing  
✅ **Automatic Session Management** - ADK handles state  
✅ **Built-in Dev UI** - Available at `/dev-ui/`  
✅ **Streaming Updates** - See tool calls in real-time  
✅ **Type Safety** - Pydantic schemas enforced by ADK  

## Testing

1. Start ADK agent:
```bash
cd backend
adk start donation_matching_agent
```

2. Frontend will connect to `http://localhost:8000/run_sse`

3. Click "AI Match" button in ops console

4. Watch the SSE stream show:
   - Function calls (get_beneficiary_profiles, get_donations, get_active_needs)
   - Function responses with data
   - Final MatchBatch JSON output

## Troubleshooting

**Issue**: No matches received  
**Solution**: Check that `output_schema=MatchBatch` in agent.py

**Issue**: Can't parse JSON  
**Solution**: Look for `part.text` in final message, parse twice (outer JSON, then inner MatchBatch JSON)

**Issue**: Stream never ends  
**Solution**: Check for `finishReason: "STOP"` in final message to close stream
