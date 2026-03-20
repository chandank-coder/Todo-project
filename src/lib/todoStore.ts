import fs from 'fs';
import path from 'path';
import os from 'os';

// Use /tmp for Vercel (persistent during request), data/ for local dev
const getDataPath = () => {
  if (process.env.VERCEL) {
    // Vercel: Use /tmp directory (temporary but works for serverless)
    return path.join('/tmp', 'todos.json');
  } else {
    // Local dev: Use data directory
    const dataDir = path.join(process.cwd(), 'data');
    return path.join(dataDir, 'todos.json');
  }
};

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
};

function ensureDataFile() {
  const dataPath = getDataPath();
  const dir = path.dirname(dataPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, '[]', 'utf8');
  }
}

export async function readTodos(): Promise<Todo[]> {
  try {
    ensureDataFile();
    const dataPath = getDataPath();
    const raw = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(raw) as Todo[];
  } catch (e) {
    console.error('Failed reading todos:', e);
    return [];
  }
}

export async function writeTodos(todos: Todo[]): Promise<void> {
  try {
    ensureDataFile();
    const dataPath = getDataPath();
    fs.writeFileSync(dataPath, JSON.stringify(todos, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed writing todos:', e);
    throw e;
  }
}
