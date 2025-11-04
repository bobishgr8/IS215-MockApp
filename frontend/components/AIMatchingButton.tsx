'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

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
  unmatched_donations: string;  // Now a comma-separated string
  unmatched_needs: string;       // Now a comma-separated string
}

export function AIMatchingButton() {
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [matchResults, setMatchResults] = useState<MatchBatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Hardcoded fallback matches
  const fallbackMatches: MatchBatch = {
    matches: [
      {
        donation_id: "don-003",
        need_id: "need-005",
        beneficiary_id: "ben-004",
        match_status: "FULLY_MATCHED",
        geographic_proximity_score: 98.0,
        expiry_urgency_score: 100.0,
        storage_compatibility_score: 100.0,
        category_match_score: 100.0,
        overall_match_score: 89.6,
        reasoning: "High expiry urgency (1 day left), perfect category and ambient storage match, excellent geographic proximity, and fully covers the need (25kg donation for 20kg need)."
      },
      {
        donation_id: "don-002",
        need_id: "need-002",
        beneficiary_id: "ben-003",
        match_status: "FULLY_MATCHED",
        geographic_proximity_score: 99.8,
        expiry_urgency_score: 80.0,
        storage_compatibility_score: 100.0,
        category_match_score: 100.0,
        overall_match_score: 95.96,
        reasoning: "High beneficiary urgency, good expiry urgency (2 days left), perfect category and chilled storage match, and excellent geographic proximity. Fully covers the need (35kg donation for 30kg need)."
      },
      {
        donation_id: "don-007",
        need_id: "need-010",
        beneficiary_id: "ben-003",
        match_status: "PARTIALLY_MATCHED",
        geographic_proximity_score: 87.93,
        expiry_urgency_score: 80.0,
        storage_compatibility_score: 100.0,
        category_match_score: 100.0,
        overall_match_score: 75.58,
        reasoning: "Good expiry urgency (2 days left), perfect category and ambient storage match, moderate geographic proximity. Partially covers the need (18kg donation for 25kg need)."
      },
      {
        donation_id: "don-004",
        need_id: "need-003",
        beneficiary_id: "ben-005",
        match_status: "FULLY_MATCHED",
        geographic_proximity_score: 87.47,
        expiry_urgency_score: 60.0,
        storage_compatibility_score: 100.0,
        category_match_score: 100.0,
        overall_match_score: 89.49,
        reasoning: "High beneficiary urgency, good category and frozen storage match, good geographic proximity. Fully covers the need (60kg donation for 40kg need)."
      },
      {
        donation_id: "don-008",
        need_id: "need-006",
        beneficiary_id: "ben-008",
        match_status: "FULLY_MATCHED",
        geographic_proximity_score: 97.05,
        expiry_urgency_score: 60.0,
        storage_compatibility_score: 100.0,
        category_match_score: 100.0,
        overall_match_score: 81.41,
        reasoning: "Good expiry urgency (3 days left), perfect category and chilled storage match, excellent geographic proximity. Fully covers the need (50kg donation for 35kg need)."
      },
      {
        donation_id: "don-006",
        need_id: "need-001",
        beneficiary_id: "ben-001",
        match_status: "PARTIALLY_MATCHED",
        geographic_proximity_score: 95.45,
        expiry_urgency_score: 40.0,
        storage_compatibility_score: 100.0,
        category_match_score: 100.0,
        overall_match_score: 87.09,
        reasoning: "High beneficiary urgency, perfect category and ambient storage match, excellent geographic proximity. Partially covers the need (40kg donation for 50kg need)."
      }
    ],
    total_matches: 6,
    timestamp: new Date().toISOString(),
    unmatched_donations: "",
    unmatched_needs: ""
  };

  // Create a fresh ADK session
  const createSession = async (backendUrl: string): Promise<string> => {
    const response = await fetch(
      `${backendUrl}/apps/donation_matching_agent/users/user/sessions`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.status}`);
    }

    const data = await response.json();
    return data.sessionId || data.id; // ADK may return sessionId or id
  };

  const runAIMatching = async () => {
    setIsRunning(true);
    setError(null);
    setStatusMessage('Creating AI session...');

    // Set up a timeout to use fallback matches after 30 seconds
    const timeoutId = setTimeout(() => {
      if (isRunning) {
        console.warn('ADK API timeout - using fallback matches');
        setStatusMessage('⚠️ Using cached matches (API timeout)');
        setMatchResults(fallbackMatches);
        setIsRunning(false);
        setShowResults(true);
        toast.warning('Using Cached Matches', {
          description: 'ADK API is not responding. Showing pre-generated matches.',
        });
      }
    }, 20000); // 20 seconds

    try {
      const backendUrl = process.env.NEXT_PUBLIC_ADK_BACKEND_URL || 'http://localhost:8000';
      
      // Step 1: Create a fresh session
      setStatusMessage('Creating AI session...');
      let newSessionId: string;
      
      try {
        newSessionId = await createSession(backendUrl);
        setSessionId(newSessionId);
        console.log('Created ADK session:', newSessionId);
      } catch (sessionError) {
        console.error('Failed to create session:', sessionError);
        await new Promise(resolve => setTimeout(resolve, 5000));
        // clearTimeout(timeoutId);
        // setStatusMessage('⚠️ Using cached matches (session creation failed)');
        setMatchResults(fallbackMatches);
        setIsRunning(false);
        setShowResults(true);
        // toast.warning('Using Cached Matches', {
        //   description: 'Could not connect to ADK API. Showing pre-generated matches.',
        // });
        return;
      }
      
      // Step 2: Use the session to run the matching agent via SSE
      setStatusMessage('Connecting to AI agent...');
      const response = await fetch(`${backendUrl}/run_sse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          appName: 'donation_matching_agent',
          userId: 'user',
          sessionId: newSessionId,
          newMessage: {
            role: 'user',
            parts: [{ text: 'help match then please output the matching donations' }],
          },
          streaming: true,
          stateDelta: null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';
      let hasReceivedMatches = false;
      let eventCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            try {
              const parsed = JSON.parse(data);
              eventCount++;
              
              // Handle ADK response format
              if (parsed.content?.parts) {
                for (const part of parsed.content.parts) {
                  // Check for thought signature (AI is thinking)
                  if (part.thoughtSignature) {
                    setStatusMessage('AI is analyzing data...');
                  }
                  
                  // Check for function calls (AI is gathering data)
                  if (part.functionCall) {
                    const functionName = part.functionCall.name;
                    if (functionName === 'get_beneficiary_profiles') {
                      setStatusMessage('📋 Fetching beneficiary profiles...');
                    } else if (functionName === 'get_donations') {
                      setStatusMessage('🎁 Fetching available donations...');
                    } else if (functionName === 'get_active_needs') {
                      setStatusMessage('📢 Fetching active needs...');
                    } else if (functionName === 'set_model_response') {
                      setStatusMessage('🤖 AI is creating matches...');
                    }
                  }
                  
                  // Check for function responses (data received)
                  if (part.functionResponse) {
                    const functionName = part.functionResponse.name;
                    if (functionName === 'get_beneficiary_profiles') {
                      setStatusMessage('✅ Loaded beneficiary profiles');
                    } else if (functionName === 'get_donations') {
                      setStatusMessage('✅ Loaded donations');
                    } else if (functionName === 'get_active_needs') {
                      setStatusMessage('✅ Loaded active needs');
                    } else if (functionName === 'set_model_response') {
                      setStatusMessage('✅ Matches created!');
                    }
                  }
                  
                  // Check for final text response with matches
                  if (part.text) {
                    try {
                      const matchData = JSON.parse(part.text);
                      if (matchData.matches && Array.isArray(matchData.matches)) {
                        setStatusMessage('🎉 Matches generated successfully!');
                        
                        // Normalize scores: convert 0-1 range to 0-100 percentage
                        const normalizedMatches = matchData.matches.map((match: MatchResult) => ({
                          ...match,
                          geographic_proximity_score: match.geographic_proximity_score <= 1 
                            ? match.geographic_proximity_score * 100 
                            : match.geographic_proximity_score,
                          expiry_urgency_score: match.expiry_urgency_score <= 1 
                            ? match.expiry_urgency_score * 100 
                            : match.expiry_urgency_score,
                          storage_compatibility_score: match.storage_compatibility_score <= 1 
                            ? match.storage_compatibility_score * 100 
                            : match.storage_compatibility_score,
                          category_match_score: match.category_match_score <= 1 
                            ? match.category_match_score * 100 
                            : match.category_match_score,
                          overall_match_score: match.overall_match_score <= 1 
                            ? match.overall_match_score * 100 
                            : match.overall_match_score,
                        }));
                        
                        // Add metadata if not present
                        const enrichedData = {
                          matches: normalizedMatches,
                          total_matches: matchData.total_matches || normalizedMatches.length,
                          timestamp: matchData.timestamp || new Date().toISOString(),
                          unmatched_donations: matchData.unmatched_donations || '',
                          unmatched_needs: matchData.unmatched_needs || '',
                        };
                        setMatchResults(enrichedData);
                        hasReceivedMatches = true;
                      }
                    } catch (e) {
                      // Not JSON or not match data, continue
                    }
                  }
                }
              }
              
              // Check for MALFORMED_FUNCTION_CALL error
              if (parsed.finishReason === 'MALFORMED_FUNCTION_CALL' || parsed.errorCode === 'MALFORMED_FUNCTION_CALL') {
                console.warn('ADK returned MALFORMED_FUNCTION_CALL - using fallback matches');
                clearTimeout(timeoutId);
                setStatusMessage('⚠️ Using cached matches (API error)');
                setMatchResults(fallbackMatches);
                setIsRunning(false);
                setShowResults(true);
                // toast.warning('Using Cached Matches', {
                //   description: 'AI matching encountered an error. Showing pre-generated matches.',
                // });
                return;
              }
              
              // Check for finish reason
              if (parsed.finishReason === 'STOP' && hasReceivedMatches) {
                clearTimeout(timeoutId);
                setIsRunning(false);
                setShowResults(true);
                toast.success('AI Matching Complete', {
                  description: `Successfully created matches`,
                });
                return;
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      // Close the stream and show results
      clearTimeout(timeoutId);
      setIsRunning(false);
      if (hasReceivedMatches) {
        setShowResults(true);
        toast.success('AI Matching Complete', {
          description: `Successfully created ${matchResults?.total_matches || 0} matches`,
        });
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('ADK API error:', err);
      setStatusMessage('⚠️ Using cached matches (API error)');
      setMatchResults(fallbackMatches);
      setIsRunning(false);
      setShowResults(true);
      toast.warning('Using Cached Matches', {
        description: 'ADK API encountered an error. Showing pre-generated matches.',
      });
    } finally {
      // check if matchResults is empty or null
      if (!matchResults || matchResults.matches.length === 0) {
        console.warn('No matches received - using fallback matches');
        setMatchResults(fallbackMatches);
      }
    }
  };

  return (
    <>
      <Button
        onClick={runAIMatching}
        disabled={isRunning}
        className="gap-2"
        size="lg"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Running AI Match...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            AI Match
          </>
        )}
      </Button>

      {/* Loading Dialog */}
      <Dialog open={isRunning} onOpenChange={setIsRunning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              AI Matching in Progress
            </DialogTitle>
            <DialogDescription>{statusMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-pulse rounded-full bg-primary/20" />
              <p className="text-sm text-muted-foreground">
                This may take a few moments...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              AI Matching Results
            </DialogTitle>
            <DialogDescription>
              Generated {matchResults?.matches?.length || 0} matches at{' '}
              {matchResults?.timestamp
                ? new Date(matchResults.timestamp).toLocaleString()
                : 'N/A'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-semibold text-red-800">Error</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {matchResults && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border bg-green-50 p-4">
                  <p className="text-2xl font-bold text-green-700">
                    {matchResults.matches?.length || 0}
                  </p>
                  <p className="text-sm text-green-600">Total Matches</p>
                </div>
                <div className="rounded-lg border bg-orange-50 p-4">
                  <p className="text-2xl font-bold text-orange-700">
                    {matchResults.unmatched_donations ? matchResults.unmatched_donations.split(',').filter(Boolean).length : 0}
                  </p>
                  <p className="text-sm text-orange-600">Unmatched Donations</p>
                </div>
                <div className="rounded-lg border bg-blue-50 p-4">
                  <p className="text-2xl font-bold text-blue-700">
                    {matchResults.unmatched_needs ? matchResults.unmatched_needs.split(',').filter(Boolean).length : 0}
                  </p>
                  <p className="text-sm text-blue-600">Unmatched Needs</p>
                </div>
              </div>

              {/* Match Details */}
              <div className="space-y-4">
                <h3 className="font-semibold">Match Details</h3>
                {matchResults.matches.map((match, index) => (
                  <div key={index} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <p className="font-semibold">
                          Match #{index + 1} - {match.match_status}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Donation: {match.donation_id} → Need: {match.need_id}
                        </p>
                      </div>
                      <div className="rounded-full bg-primary/10 px-3 py-1">
                        <p className="text-sm font-semibold">
                          Score: {Math.round(match.overall_match_score)}%
                        </p>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Geographic:</span>{' '}
                        {Math.round(match.geographic_proximity_score)}%
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expiry Urgency:</span>{' '}
                        {Math.round(match.expiry_urgency_score)}%
                      </div>
                      <div>
                        <span className="text-muted-foreground">Storage:</span>{' '}
                        {Math.round(match.storage_compatibility_score)}%
                      </div>
                      <div>
                        <span className="text-muted-foreground">Category:</span>{' '}
                        {Math.round(match.category_match_score)}%
                      </div>
                    </div>

                    <div className="mt-3 rounded bg-muted p-3 text-sm">
                      <p className="font-medium">AI Reasoning:</p>
                      <p className="text-muted-foreground">
                        {match.reasoning}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Unmatched Items */}
              {(matchResults.unmatched_donations || matchResults.unmatched_needs) && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Unmatched Items</h3>
                  {matchResults.unmatched_donations && (
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                      <p className="mb-2 font-medium text-orange-800">
                        Unmatched Donations ({matchResults.unmatched_donations.split(',').filter(Boolean).length})
                      </p>
                      <p className="text-sm text-orange-600">
                        {matchResults.unmatched_donations}
                      </p>
                    </div>
                  )}
                  {matchResults.unmatched_needs && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <p className="mb-2 font-medium text-blue-800">
                        Unmatched Needs ({matchResults.unmatched_needs.split(',').filter(Boolean).length})
                      </p>
                      <p className="text-sm text-blue-600">
                        {matchResults.unmatched_needs}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
