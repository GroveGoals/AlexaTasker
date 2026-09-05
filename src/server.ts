import "dotenv/config";
import express from "express";
import { randomUUID } from "crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { addTask, listTasks, completeTask } from "./tasks.js";

const app = express();
app.use(express.json());

// Allow the dashboard (running from a different origin/file) to call this server
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

function buildServer() {
  const server = new McpServer({
    name: "alexatasker-mcp",
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
          { type: "text", text: JSON.stringify(task) },
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
      return {
        content: [
          { type: "text", text: summary },
          { type: "text", text: JSON.stringify(tasks) },
        ],
      };
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
    "Generate a simple prioritized plan for the day based on current tasks",
    {},
    async () => {
      const tasks = listTasks(false);
      if (!tasks.length) {
        return { content: [{ type: "text", text: "No pending tasks — your day is open!" }] };
      }
      const withDates = tasks.filter((t) => t.dueDate).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
      const withoutDates = tasks.filter((t) => !t.dueDate);
      const ordered = [...withDates, ...withoutDates];
      const plan = ordered
        .map((t, i) => `${i + 1}. ${t.title}${t.dueDate ? ` — due ${t.dueDate}` : ""}`)
        .join("\n");
      return { content: [{ type: "text", text: `Here's your plan for today:\n${plan}` }] };
    }
  );

  return server;
}

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
  console.log(`AlexaTasker MCP server running on port ${PORT}`);
});