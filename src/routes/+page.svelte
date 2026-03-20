<script lang="ts">
	import { onMount } from 'svelte';
	import { writable, get } from 'svelte/store';

	type Todo = { id: string; text: string; done: boolean; createdAt: string };

	// use Svelte stores so state updates are reactive under Svelte 5 runes mode
	const todos = writable<Todo[]>([]);
	const text = writable('');
	const loading = writable(false);
	const isAdding = writable(false);

	function canAddValue() {
		return get(text).trim().length > 0 && !get(isAdding);
	}

	async function load() {
		loading.set(true);
		try {
			const res = await fetch('/api/todos');
			const data = await res.json();
			todos.set(data);
		} finally {
			loading.set(false);
		}
	}

	async function add() {
		const t = get(text).trim();
		console.log('add() called, text=', JSON.stringify(get(text)));
		if (!t) return;
		isAdding.set(true);
		try {
			const res = await fetch('/api/todos', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: t })
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				console.error('Add failed', err);
				return;
			}
			const todo = await res.json();
			todos.update((arr) => [todo, ...arr]);
			text.set('');
		} finally {
			isAdding.set(false);
		}
	}

	async function toggle(todo: Todo) {
		const res = await fetch('/api/todos', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: todo.id, done: !todo.done })
		});
		if (!res.ok) return;
		const updated = await res.json();
		todos.update((arr) => arr.map((t) => (t.id === updated.id ? updated : t)));
	}

	async function remove(id: string) {
		const res = await fetch('/api/todos?id=' + encodeURIComponent(id), { method: 'DELETE' });
		if (!res.ok) return;
		todos.update((arr) => arr.filter((t) => t.id !== id));
	}

	onMount(load);
</script>

<main class="app">
	<section class="card">
		<header class="card-header">
			<h1>My Todo List</h1>
			<p class="muted">Quick, responsive and mobile-friendly</p>
		</header>

				<form class="input-row" on:submit|preventDefault={add} aria-label="Add todo">
					<label class="visually-hidden" for="todo-input">New todo</label>
					<input id="todo-input" class="todo-input" placeholder="What needs doing?" bind:value={$text} autocomplete="off" />
									<button class="btn primary" type="submit" disabled={$text.trim().length === 0 || $isAdding} aria-disabled={$text.trim().length === 0 || $isAdding}>
										{#if $isAdding}Adding...{:else}Add{/if}
									</button>
				</form>

		{#if $loading}
			<p class="muted">Loading...</p>
		{:else if $todos.length === 0}
			<p class="muted">No todos yet — add one above.</p>
		{:else}
			<ul class="todo-list">
				{#each $todos as todo}
					<li class="todo-item">
						<div class="left">
							  <input id={todo.id} class="todo-check" type="checkbox" checked={todo.done} on:change={() => toggle(todo)} />
							  <label for={todo.id} class:done={todo.done}>{todo.text}</label>
						</div>
						<div class="right">
							  <time class="muted small">{new Date(todo.createdAt).toLocaleString()}</time>
							  <button class="btn danger" on:click={() => remove(todo.id)} aria-label={"Delete " + todo.text}>Delete</button>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>

<style>
	:global(body) {
		font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
		margin: 0;
		background: #f6f8fa;
		color: #0f172a;
	}

	.app {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
		min-height: 100vh;
	}

	.card {
		width: 100%;
		max-width: 720px;
		background: white;
		border-radius: 12px;
		padding: 1.25rem;
		box-shadow: 0 6px 18px rgba(12, 17, 25, 0.06);
	}

	.card-header h1 {
		margin: 0 0 0.25rem 0;
		font-size: 1.25rem;
	}

	.muted {
		color: #64748b;
	}

	.input-row {
		display: flex;
		gap: 0.5rem;
		margin: 0.75rem 0 1rem 0;
	}

	.todo-input {
		flex: 1 1 auto;
		padding: 0.6rem 0.75rem;
		border-radius: 8px;
		border: 1px solid #e6eef8;
		background: #fbfdff;
		font-size: 1rem;
		outline: none;
	}

	.todo-input:focus {
		box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
		border-color: #3b82f6;
	}

	.btn {
		border: none;
		padding: 0.55rem 0.85rem;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.95rem;
	}

	.btn[disabled], .btn[aria-disabled='true'] {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.primary {
		background: #0ea5e9;
		color: white;
	}

	.danger {
		background: #ef4444;
		color: white;
		padding: 0.35rem 0.6rem;
		border-radius: 6px;
		margin-left: 0.5rem;
	}

	.todo-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.todo-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.6rem;
		border-radius: 8px;
		background: #fcfdff;
		border: 1px solid #eef2f6;
	}

	.left {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex: 1 1 auto;
	}

	.right {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-left: 0.75rem;
	}

	label.done {
		text-decoration: line-through;
		color: #64748b;
	}

	.small {
		font-size: 0.8rem;
	}

	.visually-hidden {
		position: absolute !important;
		height: 1px; width: 1px;
		overflow: hidden; clip: rect(1px, 1px, 1px, 1px);
		white-space: nowrap; border: 0; padding: 0; margin: -1px;
	}

	@media (max-width: 520px) {
		.card {
			padding: 1rem;
			border-radius: 10px;
		}
		.card-header h1 { font-size: 1.1rem }
		.right { gap: 0.4rem }
	}
</style>
