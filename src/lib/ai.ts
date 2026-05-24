// ===== CLIENT-SIDE AI API UTILITIES =====

interface JudgeResult {
  winner: string;
  verdict: string;
  damageScore: number;
}

interface ReactResult {
  reaction: string;
  score: number;
  damageLevel: 'light' | 'medium' | 'heavy' | 'critical';
}

interface CommentaryResult {
  commentary: string;
  hypeLevel: number;
}

interface VerdictResult {
  winner: string;
  verdict: string;
  psychEval: string;
  careerStatus: string;
  mostCookedMoment: string;
  clipTitle: string;
}

/**
 * Request AI to judge a round of roasts.
 */
export async function judgeRound(
  messages: { sender: string; text: string }[],
  videoId: string
): Promise<JudgeResult> {
  try {
    const res = await fetch('/api/ai/judge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, videoId }),
    });

    if (!res.ok) {
      throw new Error(`Judge API returned ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error('[AI] judgeRound failed:', error);
    // Fallback: pick a random winner from the senders
    const senders = [...new Set(messages.map((m) => m.sender))];
    return {
      winner: senders[Math.floor(Math.random() * senders.length)] || 'Unknown',
      verdict: 'The AI judge experienced an existential crisis. Round goes to whoever had more energy. 💀',
      damageScore: Math.floor(Math.random() * 40) + 30,
    };
  }
}

/**
 * Get an instant AI reaction to a single roast.
 */
export async function reactToRoast(
  roast: string,
  sender: string,
  context: string
): Promise<ReactResult> {
  try {
    const res = await fetch('/api/ai/react', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roast, sender, context }),
    });

    if (!res.ok) {
      throw new Error(`React API returned ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error('[AI] reactToRoast failed:', error);
    const fallbackReactions = [
      'The AI is speechless. That says something.',
      'Processing... nope, still confused.',
      'Interesting attempt. Very interesting.',
      'The AI neither confirms nor denies being impressed.',
    ];
    return {
      reaction: fallbackReactions[Math.floor(Math.random() * fallbackReactions.length)],
      score: Math.floor(Math.random() * 5) + 3,
      damageLevel: 'medium',
    };
  }
}

/**
 * Get live commentary from the AI.
 */
export async function getCommentary(
  recentRoasts: { sender: string; text: string; score?: number }[]
): Promise<CommentaryResult> {
  try {
    const res = await fetch('/api/ai/commentary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recentRoasts }),
    });

    if (!res.ok) {
      throw new Error(`Commentary API returned ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error('[AI] getCommentary failed:', error);
    const fallbackCommentary = [
      'AND WE ARE LIVE, things are getting HEATED in here!',
      'The TENSION in this room is absolutely ELECTRIC!',
      'Both players are giving it EVERYTHING they have!',
    ];
    return {
      commentary: fallbackCommentary[Math.floor(Math.random() * fallbackCommentary.length)],
      hypeLevel: 6,
    };
  }
}

/**
 * Get the dramatic final verdict for the entire battle.
 */
export async function getFinalVerdict(
  allRoasts: any[],
  scores: Record<string, number>,
  rounds: number
): Promise<VerdictResult> {
  try {
    const res = await fetch('/api/ai/verdict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allRoasts, scores, rounds }),
    });

    if (!res.ok) {
      throw new Error(`Verdict API returned ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error('[AI] getFinalVerdict failed:', error);
    // Fallback: determine winner from scores
    const entries = Object.entries(scores);
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    const winner = sorted[0]?.[0] || 'Unknown';

    return {
      winner,
      verdict: 'The AI judge short-circuited from the sheer carnage. Victory goes to whoever dealt the most damage. The battle was real, even if this verdict is not. 💀',
      psychEval: 'Both players exhibit concerning levels of internet brain rot. Further evaluation recommended. The fact that they\'re here at all says everything.',
      careerStatus: 'Career status: pending investigation. HR has been notified.',
      mostCookedMoment: 'The AI was too shook to remember. All moments were equally devastating.',
      clipTitle: 'TECHNICAL DIFFICULTIES (BUT MAKE IT VIOLENT)',
    };
  }
}
