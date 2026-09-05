import { randomUUID } from "crypto";

export interface Task {
  id: string;
  title: string;
  dueDate?: string;
  done: boolean;
  createdAt: string;
}

const tasks: Map<string, Task> = new Map();

export function addTask(title: string, dueDate?: string): Task {
  const task: Task = {
    id: randomUUID(),
    title,
    dueDate,
    done: false,
    createdAt: new Date().toISOString(),
  };
  tasks.set(task.id, task);
  return task;
}

export function listTasks(includeCompleted = false): Task[] {
  return Array.from(tasks.values()).filter(
    (t) => includeCompleted || !t.done
  );
}

export function completeTask(id: string): Task | null {
  const task = tasks.get(id);
  if (!task) return null;
  task.done = true;
  return task;
}

export function deleteTask(id: string): boolean {
  return tasks.delete(id);
}