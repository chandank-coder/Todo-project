import type { RequestHandler } from './$types';
import { readTodos, writeTodos, type Todo } from '$lib/todoStore';

function json(data: any, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
    ...init
  });
}

export const GET: RequestHandler = async () => {
  const todos = await readTodos();
  return json(todos);
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const text = String(body.text || '').trim();
  if (!text) return json({ error: 'text required' }, { status: 400 });

  const todos = await readTodos();
  const newTodo: Todo = {
    id: (globalThis.crypto && (globalThis.crypto as any).randomUUID)
      ? (globalThis.crypto as any).randomUUID()
      : Date.now().toString(),
    text,
    done: false,
    createdAt: new Date().toISOString()
  };

  todos.unshift(newTodo);
  await writeTodos(todos);
  return json(newTodo, { status: 201 });
};

export const PUT: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { id, text, done } = body;
  if (!id) return json({ error: 'id required' }, { status: 400 });

  const todos = await readTodos();
  const idx = todos.findIndex((t) => t.id === id);
  if (idx === -1) return json({ error: 'not found' }, { status: 404 });

  if (typeof text === 'string') todos[idx].text = text;
  if (typeof done === 'boolean') todos[idx].done = done;

  await writeTodos(todos);
  return json(todos[idx]);
};

export const DELETE: RequestHandler = async ({ url, request }) => {
  // try query param id first
  const id = url.searchParams.get('id') || (await request.json().then((b) => b.id).catch(() => undefined));
  if (!id) return json({ error: 'id required' }, { status: 400 });

  const todos = await readTodos();
  const idx = todos.findIndex((t) => t.id === id);
  if (idx === -1) return json({ error: 'not found' }, { status: 404 });

  const removed = todos.splice(idx, 1)[0];
  await writeTodos(todos);
  return json(removed);
};
