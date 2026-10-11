import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

function generateHeuristicResponse(question: string, context: any): string {
  const qLower = question.toLowerCase();
  const evals = Array.isArray(context?.evaluations) ? context.evaluations : [];
  const topic = context?.topic || "Technical Viva";
  const score = context?.score ?? context?.finalScore ?? 0;
  const grade = context?.grade || (score >= 90 ? 'S' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F');

  // Match question index like "q1", "q2", "question 1", "first question"
  const qNumMatch = qLower.match(/(?:q|question)\s*(\d+)/i) || 
    (qLower.includes('first') ? [null, '1'] : qLower.includes('second') ? [null, '2'] : qLower.includes('third') ? [null, '3'] : null);

  if (qNumMatch && qNumMatch[1]) {
    const idx = parseInt(qNumMatch[1], 10) - 1;
    if (idx >= 0 && idx < evals.length) {
      const ev = evals[idx];
      const isCorrect = ev.isCorrect;
      const qText = ev.question || `Question ${idx + 1}`;
      const userAns = ev.userAnswer || "No answer recorded";
      const ideal = ev.idealAnswer || ev.explanation || "Refer to core domain principles.";
      const feedback = ev.feedback || "";

      if (isCorrect) {
        return `🎯 **Question ${idx + 1} Analysis:**\n\n` +
          `**Question:** ${qText}\n\n` +
          `✅ **You got this right!** (Score: ${ev.score || 100}/100)\n` +
          `Your response accurately identified the core concept: "${userAns}".\n\n` +
          `💡 **Key takeaway:** ${ideal}`;
      } else {
        return `🔍 **Question ${idx + 1} Breakdown & Solution:**\n\n` +
          `**Question:** ${qText}\n\n` +
          `❌ **What was missed:** You selected/submitted: "${userAns}".\n\n` +
          `💡 **Ideal Solution / Explanation:**\n${ideal}\n\n` +
          (feedback ? `📋 **Evaluator Feedback:** ${feedback}\n\n` : '') +
          `📌 **How to master this:** Focus on the underlying architectural invariants and state transitions in ${topic}.`;
      }
    }
  }

  // Handle "Why did I get ... wrong" or "missed questions"
  if (qLower.includes('wrong') || qLower.includes('miss') || qLower.includes('incorrect') || qLower.includes('mistake')) {
    const wrongEvals = evals.filter((e: any) => !e.isCorrect);
    if (wrongEvals.length === 0) {
      return `🎉 **Incredible work!** You didn't get any questions wrong in this session (Score: ${score}/100, Grade: ${grade}).\n\nTo continue advancing, try attempting the **Expert Difficulty** or exploring advanced topics in ${topic}!`;
    }
    const summaryList = wrongEvals.map((e: any, i: number) => {
      const qIdx = evals.indexOf(e) + 1;
      return `• **Q${qIdx}:** ${e.question.substring(0, 90)}...\n  👉 **Core concept:** ${e.idealAnswer || e.explanation || 'See report for details.'}`;
    }).join('\n\n');

    return `📚 **Review of Missed Questions (${wrongEvals.length} total):**\n\n${summaryList}\n\n💡 **Coach Tip:** Click the ⭐ Bookmark icon on these questions in the Answer Review below to review them anytime in your Flashcard Deck!`;
  }

  // Handle "How to improve score" or "tips" or "grade"
  if (qLower.includes('improve') || qLower.includes('tips') || qLower.includes('better') || qLower.includes('score') || qLower.includes('study')) {
    return `📈 **Action Plan to Reach Grade S in ${topic}:**\n\n` +
      `1. **Clarify Tradeoffs:** In technical vivas, professors look for *why* a design is chosen over alternatives, not just what it is.\n` +
      `2. **Master Terminology:** Use precise technical vocabulary (e.g. *atomic CAS*, *cache coherence*, *invariants*, *time complexity*).\n` +
      `3. **Practice Missed Questions:** Use the "Practice Missed Questions" button above to run a focused Study Mode drill.\n` +
      `4. **Pacing:** Allocate the first 15 seconds to structuring your thought before typing or speaking.`;
  }

  // Handle "Explain concept" or general queries
  return `🤖 **AI Coach for ${topic}:**\n\n` +
    `Based on your exam performance (${score}/100, Grade: ${grade}):\n\n` +
    `• **Your Performance:** You completed ${evals.length} viva questions with ${evals.filter((e: any) => e.isCorrect).length} correct.\n` +
    `• **Key Concept Focus:** In ${topic}, ensure you can clearly articulate algorithmic complexity, memory tradeoffs, and edge-case handling.\n` +
    `• **Next Step:** You can ask me specific questions like: *"Why did I get Q1 wrong?"*, *"Explain Q2"*, or *"Give me a study guide for ${topic}"*!`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, sessionContext, sessionData } = body;

    if (!question || !question.trim()) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // 1. If Gemini API Key is configured, attempt real-time generative response
    if (apiKey && apiKey.trim().length > 5) {
      try {
        const ai = new GoogleGenerativeAI(apiKey);
        const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
        
        let lastError = null;
        for (const modelName of models) {
          try {
            const model = ai.getGenerativeModel({ model: modelName });
            const prompt = `You are an expert Computer Science professor and AI academic viva coach helping a student understand their exam results.
Session Context:
${typeof sessionContext === 'string' ? sessionContext : JSON.stringify(sessionData || sessionContext || '')}

Student Question: "${question}"

Instructions:
- Provide an authoritative, clear, and encouraging explanation.
- If referencing specific questions (Q1, Q2, etc.), explain the correct concept clearly and why distractors/wrong answers fail.
- Use clean Markdown formatting with bold titles and bullet points.
- Keep the response concise, punchy, and under 250 words.`;

            const timeoutPromise = new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Gemini API timeout')), 5000)
            );

            const result = await Promise.race([
              model.generateContent(prompt),
              timeoutPromise
            ]);

            const responseText = result.response.text();
            if (responseText && responseText.trim().length > 0) {
              return NextResponse.json({ success: true, answer: responseText.trim(), source: 'gemini' });
            }
          } catch (modelErr) {
            lastError = modelErr;
          }
        }
        console.warn('Gemini models attempted, falling back to heuristic engine:', lastError);
      } catch (geminiErr) {
        console.warn('Gemini generative call failed, using heuristic fallback:', geminiErr);
      }
    }

    // 2. Intelligent Domain-Specific Heuristic Engine Fallback
    const fallbackAnswer = generateHeuristicResponse(question, sessionData || sessionContext);
    return NextResponse.json({ success: true, answer: fallbackAnswer, source: 'coach-engine' });

  } catch (err: any) {
    console.error('AI Coach endpoint error:', err);
    return NextResponse.json({
      success: true,
      answer: "I'm your AI Viva Coach! Ask me about specific questions (e.g. *'Why did I get Q1 wrong?'*), concepts, or how to improve your score.",
      source: 'default-fallback'
    });
  }
}
