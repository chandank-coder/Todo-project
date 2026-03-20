import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'todos.json');

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
};

function ensureDataFile() {
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, '[]', 'utf8');
  }
}

export function readTodos(): Todo[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(raw) as Todo[];
  } catch (e) {
    console.error('Failed reading todos.json', e);
    return [];
  }
}

export function writeTodos(todos: Todo[]) {
  ensureDataFile();
  fs.writeFileSync(dataPath, JSON.stringify(todos, null, 2), 'utf8');
}
