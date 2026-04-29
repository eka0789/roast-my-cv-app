import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a brutally honest but secretly helpful career coach who roasts CVs in a sharp, witty, and entertaining way — like a comedy roast.

Your job: analyze the provided CV and produce TWO sections:

1. THE ROAST: A sharp, funny, merciless (but not cruel) roast of the CV. Call out vague buzzwords ("team player", "passionate about", "results-driven"), overused filler phrases, weak formatting choices, suspicious timeline gaps, generic objective statements, or anything that makes a hiring manager's eyes glaze over. Be specific — reference actual content from their CV. Keep it under 300 words.

2. HOW TO FIX IT: After the roasting, give genuinely useful, concrete, actionable improvement suggestions. Be specific to their actual CV content. Use a numbered list. Keep it under 250 words.

Respond ONLY with valid JSON in exactly this format, no extra text:
{
  "roast": "...",
  "suggestions": "..."
}

Do not use markdown formatting inside the JSON string values. Use plain text with \\n for line breaks where needed.`;

export async function POST(req: NextRequest) {
  let cvText: string;
  let provider: string;
  let modelName: string;
  let userApiKey: string;

  try {
    const body = await req.json();
    cvText = body.cvText;
    provider = body.provider || "gemini";
    modelName = body.model || "gemini-2.0-flash";
    userApiKey = body.apiKey;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!cvText || typeof cvText !== "string" || cvText.trim().length < 50) {
    return NextResponse.json({ error: "CV text is too short." }, { status: 400 });
  }

  if (cvText.length > 15000) {
    return NextResponse.json(
      { error: "CV text is too long (max 15,000 characters)." },
      { status: 400 }
    );
  }

  const effectiveApiKey = userApiKey || (provider === "gemini" ? process.env.GEMINI_API_KEY : null);

  if (!effectiveApiKey) {
    return NextResponse.json(
      { error: `API key for ${provider} is not provided.` },
      { status: 400 }
    );
  }

  try {
    let roast: string = "";
    let suggestions: string = "";

    if (provider === "gemini") {
      const genAI = new GoogleGenerativeAI(effectiveApiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.9,
          maxOutputTokens: 1024,
        },
      });

      const prompt = `${SYSTEM_PROMPT}\n\nHere is the CV to roast:\n\n${cvText}`;
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsed = parseAIResponse(responseText);
      roast = parsed.roast;
      suggestions = parsed.suggestions;
    } else if (provider === "claude") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": effectiveApiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          max_tokens: 1024,
          messages: [{ role: "user", content: `${SYSTEM_PROMPT}\n\nHere is the CV to roast:\n\n${cvText}` }],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Claude API error");
      
      const responseText = data.content[0].text;
      const parsed = parseAIResponse(responseText);
      roast = parsed.roast;
      suggestions = parsed.suggestions;
    } else if (provider === "openrouter") {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${effectiveApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://roast-my-cv.app", // Optional
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "user", content: `${SYSTEM_PROMPT}\n\nHere is the CV to roast:\n\n${cvText}` }],
          response_format: { type: "json_object" },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "OpenRouter API error");
      
      const responseText = data.choices[0].message.content;
      const parsed = parseAIResponse(responseText);
      roast = parsed.roast;
      suggestions = parsed.suggestions;
    }

    return NextResponse.json({ roast, suggestions });
  } catch (err) {
    console.error(`${provider} error:`, err);
    return NextResponse.json(
      { error: cleanErrorMessage(err) },
      { status: 500 }
    );
  }
}

function cleanErrorMessage(err: any): string {
  const message = err instanceof Error ? err.message : String(err);
  
  if (message.includes("429") || message.includes("Quota exceeded") || message.includes("Too Many Requests")) {
    return "AI is currently busy (Rate Limit Exceeded). Please try again in a few seconds.";
  }
  
  if (message.includes("API key not valid") || message.includes("invalid") || message.includes("key")) {
    if (message.includes("key")) return "Invalid API Key. Please check your AI Settings.";
  }

  return "Failed to generate roast. Please try again.";
}

function parseAIResponse(responseText: string) {
  let jsonText = responseText.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }
  
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed.roast || !parsed.suggestions) {
      throw new Error("Missing fields");
    }
    return parsed;
  } catch {
    // If JSON parsing fails, try to extract manually or return a default error
    throw new Error("AI response was not in the expected format.");
  }
}
