import "dotenv/config";
import express from "express";
import { randomUUID } from "crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { addTask, listTasks, completeTask } from "./tasks.js";
import { planDay } from "./bedrock.js";

const app = express();
app.use(express.json());

function buildServer() {
  const server = new McpServer({
    name: "taskbridge-mcp",
    version: "0.1.0",
  });

  server.tool(
    "add_task",
    "Add a new task, optionally with a due date",
    {
      title: z.string().describe("The task description"),
      dueDate: z.string().optional().describe("ISO date string, optional"),
    },
    async ({ title, dueDate }) => {
      const task = addTask(title, dueDate);
      return {
        content: [
          { type: "text", text: `Added task: "${task.title}" (id: ${task.id})` },
        ],
      };
    }
  );

  server.tool(
    "list_tasks",
    "List current tasks",
    {
      includeCompleted: z.boolean().optional().default(false),
    },
    async ({ includeCompleted }) => {
      const tasks = listTasks(includeCompleted);
      const summary = tasks.length
        ? tasks.map((t) => `- ${t.title}${t.dueDate ? ` (due ${t.dueDate})` : ""}`).join("\n")
        : "No tasks found.";
      return { content: [{ type: "text", text: summary }] };
    }
  );

  server.tool(
    "complete_task",
    "Mark a task as completed by id",
    { id: z.string() },
    async ({ id }) => {
      const task = completeTask(id);
      return {
        content: [
          {
            type: "text",
            text: task ? `Marked "${task.title}" as done.` : `No task found with id ${id}.`,
          },
        ],
      };
    }
  );

  server.tool(
    "plan_day",
    "Generate an AI-powered plan for the day based on current tasks (uses AWS Bedrock)",
    {},
    async () => {
      const tasks = listTasks(false);
      const summary = tasks.length
        ? tasks.map((t) => `- ${t.title}${t.dueDate ? ` (due ${t.dueDate})` : ""}`).join("\n")
        : "No pending tasks.";
      const plan = await planDay(summary);
      return { content: [{ type: "text", text: plan }] };
    }
  );

  return server;
}

// Streamable HTTP endpoint at /mcp
app.post("/mcp", async (req, res) => {
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TaskBridge MCP server running on port ${PORT}`);
});