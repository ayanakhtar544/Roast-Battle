import { NextResponse } from 'next/server';
import { REACT_PERSONA } from '@/lib/prompts';

export async function POST(req: Request) {
  try {
    const { roast, sender, context } = await req.json();

    if (!roast || !sender) {
      return NextResponse.json(
        { error: 'roast and sender are required.' },
        { status: 400 }
      );
    }

    const userPrompt = `${sender} just dropped this roast:\n"${roast}"${context ? `\n\nBattle context: ${context}` : ''}\n\nReact now.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: REACT_PERSONA },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 1.0,
        max_tokens: 200,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.choices) {
      console.error('[AI React] Groq API error:', data);
      return NextResponse.json(
        { error: data.error?.message || 'Groq API request failed.' },
        { status: 500 }
      );
    }

    const aiResult = JSON.parse(data.choices[0].message.content);

    // Validate and normalize damageLevel
    const validLevels = ['light', 'medium', 'heavy', 'critical'] as const;
    const damageLevel = validLevels.includes(aiResult.damageLevel)
      ? aiResult.damageLevel
      : 'medium';

    return NextResponse.json({
      reaction: aiResult.reaction || 'No comment.',
      score: Math.min(10, Math.max(1, Number(aiResult.score) || 5)),
      damageLevel,
    });
  } catch (error) {
    console.error('[AI React] Error:', error);
    return NextResponse.json(
      { error: 'AI reaction system is offline.' },
      { status: 500 }
    );
  }
}
