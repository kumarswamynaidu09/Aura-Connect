import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { persona, messages, contextMemories, hasAccess } = await req.json();

    const userMessage =
      messages && messages.length > 0
        ? messages[messages.length - 1].content
        : "";

    if (persona === "life") {
      // Life AI Persona: Warm, conversational, lifestyle & project companion
      let responseText = "";
      const lower = userMessage.toLowerCase();

      if (
        lower.includes("react") ||
        lower.includes("typescript") ||
        lower.includes("minimal") ||
        lower.includes("build")
      ) {
        responseText = `That sounds like an amazing focus! React paired with TypeScript brings such rock-solid type safety, and minimal interfaces make apps so much faster and more intuitive to use.\n\n💡 I noticed a key preference here regarding your technical stack and aesthetic. Would you like me to preserve this in your sovereign **AURA Vault** on Monad so your developer tools and Code AI can access it with your permission?`;
      } else if (lower.includes("hello") || lower.includes("hi")) {
        responseText = `Hey there! I'm **Life AI**, your personal AI companion. Whatever projects you're planning, habits you're building, or ideas you're brainstorming, I'm here to help. Anything you share here stays strictly in your control via Monad on-chain identity. What's on your mind today?`;
      } else {
        responseText = `Got it! I've noted that down. As your AI context evolves, you can selectively store these insights on Monad and monetize or permission them across your entire suite of AI apps.`;
      }

      return NextResponse.json({
        role: "assistant",
        content: responseText,
        detectedMemoryCandidate:
          lower.includes("react") ||
          lower.includes("typescript") ||
          lower.includes("minimal") ||
          lower.includes("build")
            ? {
                title: "Frontend Engineering Preferences",
                category: "technical_preferences",
                categoryLabel: "Technical Preferences",
                summary: "React + TypeScript • Minimalist Interface Design",
                content:
                  "User builds with React and TypeScript and prefers minimal interfaces.",
                tags: ["React", "TypeScript", "Minimalism"],
                accessFeeMON: "0.0001",
              }
            : null,
      });
    }

    if (persona === "code") {
      // Code AI Persona: Technical, sharp, developer-first
      const lower = userMessage.toLowerCase();

      if (hasAccess && contextMemories && contextMemories.length > 0) {
        // UNLOCKED CONTEXT: Produce tailored React + TypeScript minimalist code
        const memoryContent = contextMemories
          .map((m: any) => `[Aura Context (${m.categoryLabel})]: ${m.content}`)
          .join("\n");

        let codeSnippet = "";

        if (
          lower.includes("component") ||
          lower.includes("button") ||
          lower.includes("ui") ||
          lower.includes("form") ||
          lower.includes("card") ||
          lower.includes("page") ||
          lower.includes("write") ||
          lower.includes("create") ||
          lower.includes("build")
        ) {
          codeSnippet = `\`\`\`tsx
import React, { useState } from 'react';

// Tailored to your unlocked AURA context: React + TypeScript + Minimalist UI
interface MinimalCardProps {
  title: string;
  subtitle?: string;
  onAction?: () => void;
}

export const MinimalCard: React.FC<MinimalCardProps> = ({
  title,
  subtitle,
  onAction,
}) => {
  const [isActive, setIsActive] = useState<boolean>(false);

  return (
    <div 
      className="p-6 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-violet-500/50 transition-all duration-300"
      onClick={() => setIsActive(!isActive)}
    >
      <h3 className="text-lg font-medium text-zinc-100 tracking-tight">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-mono text-violet-400">
          {isActive ? 'STATUS: ACTIVE' : 'STATUS: IDLE'}
        </span>
        {onAction && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 hover:bg-zinc-800 transition"
          >
            Execute
          </button>
        )}
      </div>
    </div>
  );
};
\`\`\``;
        } else {
          codeSnippet = `\`\`\`typescript
// Unlocked Context Applied: React + TypeScript strict guidelines
export interface MonadExecutionContext<T> {
  id: string;
  payload: T;
  verifiedOnChain: boolean;
  timestamp: number;
}

export function createMinimalExecutor<T>(config: { autoValidate: boolean }) {
  return (context: MonadExecutionContext<T>) => {
    if (config.autoValidate && !context.verifiedOnChain) {
      throw new Error("Execution context unauthorized on Monad");
    }
    return { ok: true, data: context.payload };
  };
}
\`\`\``;
        }

        const responseText = `⚡ **Context Verified via Monad Testnet**\n\nI have retrieved and decrypted your authorized context:\n> *"${contextMemories[0].summary}"*\n\nApplying your preferences (**React + TypeScript**, minimal aesthetic, strict typing):\n\n${codeSnippet}\n\n*This response was automatically adapted according to your on-chain sovereign context permissions.*`;

        return NextResponse.json({
          role: "assistant",
          content: responseText,
          usedContext: true,
          contextSummaries: contextMemories.map((m: any) => m.summary),
        });
      } else {
        // LOCKED CONTEXT: Standard fallback without personal customization
        const responseText = `👋 **Code AI Initialized**\n\nI am operating in **Standard Mode** without access to your personal developer profile or technical preferences.\n\n🔒 **AURA Context Locked**: If you have saved your engineering preferences in Life AI, you can unlock them using the **Unlock Context (0.0001 MON)** button above. Once confirmed on Monad, I will tailor all code generation strictly to your stack and design preferences.\n\nHow can I help you write code today?`;

        return NextResponse.json({
          role: "assistant",
          content: responseText,
          usedContext: false,
        });
      }
    }

    return NextResponse.json({
      role: "assistant",
      content: "Aura Connect AI system ready.",
    });
  } catch (error: any) {
    console.error("AI Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process chat" },
      { status: 500 }
    );
  }
}
