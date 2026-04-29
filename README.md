# Roast My CV 🔥

Roast My CV is a bold, AI-powered application designed to transform the monotonous task of resume reviewing into an entertaining and highly productive experience.

## Project Overview
Built for job seekers, career changers, and students, Roast My CV takes a "brutally honest" approach to resume feedback. By pasting their CV content into the platform, users receive a sharp, witty, and merciless "roast" that highlights common mistakes, clichés, and formatting faux pas that often lead to rejection in the real world.

AI plays the central role of a "secretly helpful career coach." It doesn't just mock the resume; it follows up with concrete, actionable suggestions on how to improve impact, clarity, and professional appeal. Whether it's catching overused buzzwords like "team player" or identifying suspicious gaps in experience, the AI provides insights that are both deeply insightful and genuinely funny. This application turns a stressful part of the job search into a moment of levity and growth, helping users refine their professional identity with a smile.

## How AI is Integrated
The application features a robust multi-provider AI backend architecture:
- **Multi-Model Support**: Users can choose between industry-leading models including **Google Gemini**, **Anthropic Claude**, and various open-source models via **OpenRouter**.
- **Secure Key Management**: The app implements a "Bring Your Own Key" (BYOK) model, allowing public users to use their own API quota. Keys are handled only during the request lifecycle and are never stored on the server.
- **Structured Feedback**: We utilize specialized system prompting to ensure the AI returns structured JSON, separating the "humorous roast" from "actionable advice" to provide a seamless user interface.

## Branding Notes
- **Visual Style**: A "Molten Dark" aesthetic that feels premium and high-stakes. It uses a dark background with ambient glow effects to simulate the heat of a roast.
- **Color Palette**: 
    - **Primary**: Intense Orange (`#ea580c`) for branding and primary actions.
    - **Secondary**: Deep Reds and Zinc/Black backgrounds for a sleek, modern look.
    - **Accents**: Emerald green for "Fix It" suggestions to provide a clear visual contrast between the "burn" and the "solution."
- **Typography**: Uses modern, high-readability sans-serif fonts to maintain a professional tech-startup feel.
- **Micro-interactions**: Smooth transitions and loading states powered by **Framer Motion**, including "living" status messages that keep the user engaged while the AI is "judging" their resume.

## WHAT MAKES IT UNIQUE
- **Humor as Utility**: By using the "Roast" format, the app breaks through the noise of traditional career advice, making the critiques more memorable and encouraging users to actually fix their mistakes.
- **Provider Agility**: It is one of the few resume tools that gives users direct control over which AI engine they want to use, allowing for different "personalities" of feedback.
- **Zero-Boring Zone**: From the loading messages ("AI is judging your life choices...") to the final roast, every interaction is designed to be shareable, fun, and ultimately helpful.

---

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
