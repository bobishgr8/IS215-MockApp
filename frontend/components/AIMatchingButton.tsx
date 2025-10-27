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

  const runAIMatching = async () => {
    setIsRunning(true);
    setError(null);
    setStatusMessage('Connecting to AI agent...');

    try {
      // Use ADK's built-in /run_sse endpoint
      const backendUrl = process.env.NEXT_PUBLIC_ADK_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/run_sse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          appName: 'donation_matching_agent',
          userId: 'user',
          // sessionId: `session-${Date.now()}`,
          newMessage: {
            role: 'user',
            parts: [{ text: 'run match' }],
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsRunning(false);
              if (hasReceivedMatches) {
                setShowResults(true);
                toast.success('AI Matching Complete', {
                  description: `Successfully created ${matchResults?.total_matches || 0} matches`,
                });
              }
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              // Handle ADK response format
              // The final response has content.parts[].text with JSON string
              if (parsed.content?.parts) {
                for (const part of parsed.content.parts) {
                  if (part.text) {
                    try {
                      const matchData = JSON.parse(part.text);
                      if (matchData.matches && matchData.total_matches !== undefined) {
                        setStatusMessage('Matches generated successfully!');
                        setMatchResults(matchData);
                        hasReceivedMatches = true;
                      }
                    } catch (e) {
                      // Not JSON or not match data, continue
                    }
                  }
                }
              }
              
              // Handle status updates during processing
              if (parsed.content?.parts?.some((p: any) => p.functionCall)) {
                const functionName = parsed.content.parts.find((p: any) => p.functionCall)?.functionCall?.name;
                if (functionName === 'get_beneficiary_profiles') {
                  setStatusMessage('Fetching beneficiary profiles...');
                } else if (functionName === 'get_donations') {
                  setStatusMessage('Fetching available donations...');
                } else if (functionName === 'get_active_needs') {
                  setStatusMessage('Fetching active needs...');
                }
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      // Close the stream and show results
      setIsRunning(false);
      if (hasReceivedMatches) {
        setShowResults(true);
        toast.success('AI Matching Complete', {
          description: `Successfully created ${matchResults?.total_matches || 0} matches`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsRunning(false);
      toast.error('Error', {
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
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
              Generated {matchResults?.total_matches} matches at{' '}
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
                    {matchResults.total_matches}
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
