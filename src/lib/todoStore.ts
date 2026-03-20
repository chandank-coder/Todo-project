import { put, list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

const BLOB_KEY = 'todos.json';
const LOCAL_PATH = path.join(process.cwd(), 'data', 'todos.json');

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
};

// Check if we're in development mode (local file) or production (Vercel Blob)
const isDev = process.env.NODE_ENV !== 'production' && !process.env.VERCEL;

function ensureLocalFile() {
  if (!fs.existsSync(LOCAL_PATH)) {
    fs.mkdirSync(path.dirname(LOCAL_PATH), { recursive: true });
    fs.writeFileSync(LOCAL_PATH, '[]', 'utf8');
  }
}

export async function readTodos(): Promise<Todo[]> {
  try {
    if (isDev) {
      // Development: use local JSON file
      ensureLocalFile();
      const raw = fs.readFileSync(LOCAL_PATH, 'utf8');
      return JSON.parse(raw) as Todo[];
    } else {
      // Production: use Vercel Blob via fetch
      try {
        const token = process.env.BLOB_READ_WRITE_TOKEN;
        if (!token) {
          console.log('BLOB_READ_WRITE_TOKEN not set, returning empty array');
          return [];
        }
        
        const response = await fetch(`https://blob.vercel-storage.com/${BLOB_KEY}`, {
          headers: { 'authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          if (response.status === 404) return [];
          throw new Error(`Blob fetch failed: ${response.statusText}`);
        }
        
        const text = await response.text();
        return JSON.parse(text) as Todo[];
      } catch (error) {
        console.error('Error reading from Vercel Blob:', error);
        return [];
      }
    }
  } catch (e) {
    console.error('Failed reading todos:', e);
    return [];
  }
}

export async function writeTodos(todos: Todo[]): Promise<void> {
  try {
    if (isDev) {
      // Development: write to local JSON file
      ensureLocalFile();
      fs.writeFileSync(LOCAL_PATH, JSON.stringify(todos, null, 2), 'utf8');
    } else {
      // Production: write to Vercel Blob
      const jsonString = JSON.stringify(todos, null, 2);
      await put(BLOB_KEY, new Blob([jsonString], { type: 'application/json' }), {
        access: 'public'
      });
    }
  } catch (e) {
    console.error('Failed writing todos:', e);
    throw e;
  }
}
