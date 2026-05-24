import { NextResponse } from 'next/server';
import { VERDICT_PERSONA } from '@/lib/prompts';

export async function POST(req: Request) {
  try {
    const { allRoasts, scores, rounds } = await req.json();

    if (!allRoasts || !Array.isArray(allRoasts)) {
      return NextResponse.json(
        { error: 'allRoasts array is required.' },
        { status: 400 }
      );
    }

    const roastLog = allRoasts
      .map((r: any, i: number) => {
        const scoreInfo = r.aiScore ? ` [AI Score: ${r.aiScore}/10]` : '';
        return `${i + 1}. ${r.sender}: "${r.text}"${scoreInfo}`;
      })
      .join('\n');

    const scoreBoard = scores
      ? Object.entries(scores)
          .map(([name, score]) => `${name}: ${score} points`)
          .join(', ')
      : 'Scores unavailable';

    const userPrompt = `FINAL JUDGMENT TIME.

Total Rounds: ${rounds || 'Unknown'}
Final Scores: ${scoreBoard}

Complete Roast Log:
${roastLog}

Deliver your final verdict now.`;

    // Try Gemini first if key exists, fall back to Groq
    const useGemini = !!process.env.GEMINI_API_KEY;

    let aiResult: any;

    if (useGemini) {
      aiResult = await callGemini(userPrompt);
    }

    // Fall back to Groq if Gemini fails or isn't configured
    if (!aiResult) {
      aiResult = await callGroq(userPrompt);
    }

    if (!aiResult) {
      return NextResponse.json(
        { error: 'All AI providers failed to deliver a verdict.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      winner: aiResult.winner || 'Unknown',
      verdict: aiResult.verdict || 'The battle was too intense for words.',
      psychEval: aiResult.psychEval || 'Both players need professional help.',
      careerStatus: aiResult.careerStatus || 'Career status: under investigation.',
      mostCookedMoment: aiResult.mostCookedMoment || 'Too many to count.',
      clipTitle: aiResult.clipTitle || 'ABSOLUTE CARNAGE',
    });
  } catch (error) {
    console.error('[AI Verdict] Error:', error);
    return NextResponse.json(
      { error: 'Final verdict system is offline.' },
      { status: 500 }
    );
  }
}

/**
 * Call Groq API for verdict generation
 */
async function callGroq(userPrompt: string): Promise<any | null> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: VERDICT_PERSONA },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.9,
        max_tokens: 800,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.choices) {
      console.error('[AI Verdict] Groq error:', data);
      return null;
    }

    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('[AI Verdict] Groq call failed:', error);
    return null;
  }
}

/**
 * Call Google Gemini API for verdict generation (higher quality for final verdict)
 */
async function callGemini(userPrompt: string): Promise<any | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${VERDICT_PERSONA}\n\n${userPrompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 800,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('[AI Verdict] Gemini error:', data);
      return null;
    }

    return JSON.parse(data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error('[AI Verdict] Gemini call failed:', error);
    return null;
  }
}
