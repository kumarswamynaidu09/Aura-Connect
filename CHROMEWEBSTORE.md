# Chrome Web Store Metadata — AURA CONNECT

## Basic Information
- **Name**: AURA CONNECT — Sovereign AI Context on Monad
- **Summary**: Your user-owned AI context layer that follows you across AI applications powered by Monad high-throughput EVM.
- **Category**: Productivity / Developer Tools
- **Version**: 1.0.0
- **Manifest Version**: 3

## Description
AURA CONNECT is a sovereign AI context and memory layer that follows you across AI applications. Instead of repeating your tech stack, preferences, and projects to every AI assistant, AURA extracts your context, commits cryptographic ownership to the Monad EVM blockchain, and allows you to monetize and permission your memory across ChatGPT, Claude, and developer tools.

### Key Features
- 🧠 **Context Extraction**: Automatically captures developer preferences, tech stacks, and workflows from your conversations.
- ⚡ **Cross-App Portability**: Discover and unlock your saved context in second AI tools with 0.0001 MON micro-payments.
- 🛡️ **Sovereign AURA Vault**: Inspect owned memory assets, monitor connected applications, and revoke access on-chain anytime.
- 🚀 **1-Click AI Injection**: Automatically populates active prompt fields on supported AI websites.

## Permissions Justification
- `sidePanel`: Required to display the contextual AURA CONNECT assistant alongside active AI browser tabs.
- `tabs`: Required to detect the active AI platform (ChatGPT, Claude, Perplexity) and coordinate cross-app memory unlocking.
- `scripting`: Required to inject authorized, decrypted context directly into prompt fields on supported AI websites.
- `storage`: Required to securely store local encrypted context records mapped to on-chain Monad memory identifiers.

## Host Permissions Justification
- `https://chatgpt.com/*`, `https://chat.openai.com/*`: To detect conversational context and allow context injection into ChatGPT.
- `https://claude.ai/*`: To detect conversational context and allow context injection into Claude.
- `https://www.perplexity.ai/*`: To allow context injection into Perplexity.
- `http://localhost:*/*`: To support local AI environments and developer test playgrounds.
