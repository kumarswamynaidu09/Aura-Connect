import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, conversationHistory } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const lower = message.toLowerCase();

    // Context pattern analysis for intelligent extraction
    let title = "Personal & Technical Profile";
    let category = "technical_preferences";
    let categoryLabel = "Technical Preferences";
    let summary = "User Preferences Context";
    let content = message;
    let tags = ["monad", "web3", "ai-context"];

    if (
      lower.includes("react") ||
      lower.includes("typescript") ||
      lower.includes("minimal") ||
      lower.includes("frontend") ||
      lower.includes("build")
    ) {
      title = "Frontend & Engineering Preferences";
      category = "technical_preferences";
      categoryLabel = "Technical Preferences";
      summary = "React & TypeScript • Minimalist Interface Design";
      content =
        "The user develops applications with React and TypeScript and strongly prefers clean, minimal interfaces with concise architecture.";
      tags = ["React", "TypeScript", "Minimalism", "Frontend"];
    } else if (
      lower.includes("monad") ||
      lower.includes("solidity") ||
      lower.includes("contract") ||
      lower.includes("evm")
    ) {
      title = "Monad Web3 Architecture Preferences";
      category = "project_context";
      categoryLabel = "Project Context";
      summary = "Monad Blitz Hackathon • High-Throughput EVM Architecture";
      content =
        "User is building on Monad high-throughput EVM blockchain, utilizing async execution, type 2 transactions, and granular smart contract permissions.";
      tags = ["Monad", "Solidity", "EVM", "Smart-Contracts"];
    } else if (
      lower.includes("work") ||
      lower.includes("routine") ||
      lower.includes("coffee") ||
      lower.includes("schedule")
    ) {
      title = "Daily Productivity & Workflow";
      category = "work_style";
      categoryLabel = "Work Style";
      summary = "Focus routines, async collaboration, and minimal meetings";
      content =
        "User prefers deep focus blocks, asynchronous updates, and streamlined developer tooling.";
      tags = ["Productivity", "Workflow", "Async"];
    } else {
      title = "General Persona Insights";
      category = "personal_goals";
      categoryLabel = "Personal Goals";
      summary = message.slice(0, 60) + "...";
      content = message;
      tags = ["Insights", "Aura"];
    }

    return NextResponse.json({
      success: true,
      extractedMemory: {
        title,
        category,
        categoryLabel,
        summary,
        content,
        tags,
        suggestedAccessFeeMON: "0.0001",
      },
    });
  } catch (error: any) {
    console.error("Memory extraction error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to extract memory" },
      { status: 500 }
    );
  }
}
