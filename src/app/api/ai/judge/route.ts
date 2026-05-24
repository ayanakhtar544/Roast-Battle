import { NextResponse } from 'next/server';
import { JUDGE_PERSONA } from '@/lib/prompts';

export async function POST(req: Request) {
  try {
    const { messages, videoId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty.' },
        { status: 400 }
      );
    }

    const chatHistory = messages
      .map((m: { sender: string; text: string }) => `${m.sender}: ${m.text}`)
      .join('\n');

    const userPrompt = `Here is the roast battle chat for this round (Video ID: ${videoId || 'unknown'}):\n\n${chatHistory}\n\nJudge this round now.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: JUDGE_PERSONA },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.9,
        max_tokens: 512,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.choices) {
      console.error('[AI Judge] Groq API error:', data);
      return NextResponse.json(
        { error: data.error?.message || 'Groq API request failed.' },
        { status: 500 }
      );
    }

    const aiResult = JSON.parse(data.choices[0].message.content);

    return NextResponse.json({
      winner: aiResult.winner || 'Unknown',
      verdict: aiResult.verdict || 'No verdict rendered.',
      damageScore: Number(aiResult.damageScore) || 50,
    });
  } catch (error) {
    console.error('[AI Judge] Error:', error);
    return NextResponse.json(
      { error: 'AI Judge is currently offline.' },
      { status: 500 }
    );
  }
}
