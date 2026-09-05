
# AlexaTasker MCP

An MCP (Model Context Protocol) server that bridges Alexa+ to a real task and calendar assistant — powered by AWS Bedrock for AI-generated daily planning.

Built for the Fire TV / Alexa+ / Ring / Bee Hackathon — **Alexa+ track** + **AWS Builder mini**.

## What it does

AlexaTasker exposes a set of tools over MCP (Streamable HTTP, spec 2025-11-25+) that let an Alexa+ agent manage your tasks conversationally:

- `add_task` — add a new task, optionally with a due date
- `list_tasks` — list current (or completed) tasks
- `complete_task` — mark a task as done
- `plan_day` — ask AWS Bedrock (Claude) to generate a time-blocked plan for your day based on your current task list

The idea: instead of manually opening a to-do app, you just tell Alexa+ "add a task to call the dentist tomorrow" or "plan my day," and AlexaTasker handles the logic behind the scenes.

## Tech stack

- Node.js + TypeScript
- Express
- `@modelcontextprotocol/sdk` (Streamable HTTP transport)
- AWS Bedrock (`@aws-sdk/client-bedrock-runtime`)
- Zod for schema validation

## Getting started

### Prerequisites

- Node.js 20+
- An AWS account with Bedrock model access enabled
- AWS IAM credentials scoped to Bedrock (`bedrock:InvokeModel`)

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/taskbridge-mcp.git
   cd alexatasker-mcp