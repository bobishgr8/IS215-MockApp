# ADK Agent Flow Diagram

## Request → Response Flow

```
┌─────────────────┐
│   Frontend      │
│  (React/Next)   │
└────────┬────────┘
         │
         │ POST /run_sse
         │ {
         │   "appName": "donation_matching_agent",
         │   "userId": "user",
         │   "sessionId": "session-xxx",
         │   "newMessage": {
         │     "role": "user",
         │     "parts": [{"text": "run match"}]
         │   }
         │ }
         │
         ▼
┌─────────────────────────────────────────────┐
│         ADK Runtime (port 8000)             │
│  ┌───────────────────────────────────────┐  │
│  │  donation_matching_agent              │  │
│  │  - model: gemini-2.5-flash            │  │
│  │  - output_schema: MatchBatch          │  │
│  │  - tools: [get_beneficiary_profiles,  │  │
│  │            get_donations,              │  │
│  │            get_active_needs]           │  │
│  └───────────────────────────────────────┘  │
└─────────────────┬───────────────────────────┘
                  │
                  │ SSE Stream (text/event-stream)
                  │
                  ├─► data: {"content": {"parts": [{"functionCall": {"name": "get_beneficiary_profiles"}}]}}
                  │   Status: "Fetching beneficiary profiles..."
                  │
                  ├─► data: {"content": {"parts": [{"functionResponse": {"result": [...]}}]}}
                  │   Tool returned beneficiary data
                  │
                  ├─► data: {"content": {"parts": [{"functionCall": {"name": "get_donations"}}]}}
                  │   Status: "Fetching available donations..."
                  │
                  ├─► data: {"content": {"parts": [{"functionResponse": {"result": [...]}}]}}
                  │   Tool returned donation data
                  │
                  ├─► data: {"content": {"parts": [{"functionCall": {"name": "get_active_needs"}}]}}
                  │   Status: "Fetching active needs..."
                  │
                  ├─► data: {"content": {"parts": [{"functionResponse": {"result": [...]}}]}}
                  │   Tool returned needs data
                  │
                  ├─► data: {"content": {"parts": [{"functionCall": {"name": "set_model_response", "args": {MatchBatch}}}]}}
                  │   Agent preparing structured output
                  │
                  └─► data: {"content": {"parts": [{"text": "{\"matches\": [...], \"total_matches\": 10, ...}"}]}}
                      ✅ Final MatchBatch JSON output
                  
                  ▼
         ┌────────────────┐
         │   Frontend     │
         │   Parses JSON  │
         │   Shows Results│
         └────────────────┘
```

## Data Flow Detail

### 1. Tool Execution Phase
```
Agent → get_beneficiary_profiles() → Returns 8 beneficiary profiles
      → get_donations() → Returns 15 available donations  
      → get_active_needs() → Returns 10 active needs
```

### 2. AI Processing Phase
```
Gemini 2.5 Flash analyzes:
- Geographic distances (lat/lng calculations)
- Expiry urgency (date comparisons)
- Storage compatibility (Ambient/Chilled/Frozen matching)
- Category matching (Produce/Dairy/Meat/etc)
- Urgency levels (High/Medium/Low priority)
```

### 3. Structured Output Phase
```
Agent calls set_model_response with MatchBatch schema:
{
  "matches": [
    {
      "donation_id": "don-015",
      "need_id": "need-001",
      "beneficiary_id": "ben-001",
      "match_status": "Matched",
      "geographic_proximity_score": 7.0,
      "expiry_urgency_score": 8.0,
      "storage_compatibility_score": 10.0,
      "category_match_score": 10.0,
      "overall_match_score": 8.0,
      "reasoning": "High urgency need for Produce..."
    },
    // ... 9 more matches
  ],
  "total_matches": 10,
  "timestamp": "2025-10-27T19:00:00.000000",
  "unmatched_donations": "don-001, don-007, don-010, don-011, don-014",
  "unmatched_needs": ""
}
```

## Frontend State Management

```typescript
// State transitions
isRunning: false → true (when button clicked)
statusMessage: "" → "Connecting..." → "Fetching profiles..." → "Fetching donations..." 
              → "Fetching needs..." → "Matches generated!"
matchResults: null → MatchBatch object
showResults: false → true (when matches received)
isRunning: true → false (when complete)
```

## UI Components Flow

```
┌──────────────────────────────────────┐
│  AI Match Button (Header)           │
│  - Sparkles icon                     │
│  - onClick: runAIMatching()          │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Loading Dialog (Modal)              │
│  - Shows statusMessage               │
│  - Animated spinner                  │
│  - "AI Matching in Progress"         │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Results Dialog (Modal)              │
│  ┌────────────────────────────────┐  │
│  │ Summary Stats                  │  │
│  │ - Total Matches: 10            │  │
│  │ - Unmatched Donations: 5       │  │
│  │ - Unmatched Needs: 0           │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Match Details (Cards)          │  │
│  │ - donation_id → need_id        │  │
│  │ - Score Breakdown              │  │
│  │ - AI Reasoning                 │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Unmatched Items                │  │
│  │ - Donations: don-001, ...      │  │
│  │ - Needs: (none)                │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

## Key Implementation Details

### Why `output_schema` instead of `response_schema`?
ADK uses `output_schema` parameter to enforce Pydantic models in the Agent constructor.

### Why no nested objects?
ADK's structured output works best with flat schemas. Nested objects can cause parsing issues with automatic function calling.

### Why comma-separated strings?
Lists of primitives work, but comma-separated strings are even simpler and avoid any list parsing edge cases.

### Why parse JSON twice?
ADK returns: `{"content": {"parts": [{"text": "{...MatchBatch JSON...}"}]}}`
- First parse: Extract the SSE message structure
- Second parse: Extract the MatchBatch data from the text field

## Performance Characteristics

- **Latency**: ~3-5 seconds for full matching process
- **Tool Calls**: 3 (get_beneficiary_profiles, get_donations, get_active_needs)
- **Token Usage**: ~18k tokens total (includes thinking tokens)
- **Stream Messages**: ~10-15 SSE events per request
- **Cache Hit**: Subsequent requests use cached beneficiary/donation data (saves ~60% tokens)

## Error Handling

```typescript
try {
  // Parse each SSE message
  const parsed = JSON.parse(data);
  
  if (parsed.content?.parts) {
    // Extract MatchBatch from text field
    for (const part of parsed.content.parts) {
      if (part.text) {
        const matchData = JSON.parse(part.text);
        // Validate it's actually MatchBatch
        if (matchData.matches && matchData.total_matches !== undefined) {
          setMatchResults(matchData);
        }
      }
    }
  }
} catch (e) {
  console.error('Parse error:', e);
  // Continue processing other messages
}
```
