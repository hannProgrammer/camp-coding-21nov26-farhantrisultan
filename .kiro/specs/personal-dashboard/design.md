# Design Document

## Overview

Life Dashboard is a single-page, client-side productivity app built with plain HTML, CSS, and vanilla JavaScript. All state lives in `localStorage`. The page is a static file served directly from the filesystem or any static host — no build step, no server, no frameworks.

The existing codebase (`index.html`, `css/style.css`, `js/app.js`) already implements the core features. This design describes the target architecture, documents the specific bugs to fix, and defines the correctness properties the implementation must satisfy.

---

## Architecture

```
index.html          ← single HTML page; all markup
css/style.css       ← all styles; CSS custom properties for theming
js/app.js           ← all logic; one IIFE; no globals exposed
```

The JavaScript module is wrapped in an immediately invoked function expression (IIFE) to avoid polluting the global scope. It is loaded with a `<script>` tag placed as the **last child of `<body>`** so the DOM is ready when the script runs.

### State model

All mutable state is kept in-memory as plain variables and mirrored to `localStorage` on every write. There is no in-memory object graph shared between sections — each section manages its own slice.

| `localStorage` key | Type | Default |
|---|---|---|
| `theme` | `"light" \| "dark"` | OS preference |
| `userName` | `string` | `""` |
| `pomodoroMinutes` | `number` (1–180) | `25` |
| `tasks` | `Task[]` | `[]` |
| `links` | `Link[]` | three default entries |

```javascript
// Task shape
{ id: string, text: string, done: boolean }

// Link shape
{ id: string, name: string, url: string }
```

---

## Components and Interfaces

### 1. `store` — localStorage wrapper

A lightweight object with `get(key, fallback)` and `set(key, value)` methods. Both are wrapped in `try/catch` so a corrupted value or a blocked storage API never crashes the app. `get` returns `fallback` when the key is absent or the stored JSON is unparseable.

### 2. `el(tag, attrs, ...children)` — DOM builder

Creates an element, applies attributes, and appends children. User-supplied text is always passed as a child string (which the browser converts to a text node), never via `innerHTML`. Special cases:

- **`class`** → sets `node.className`
- **`on*`** → calls `node.addEventListener(key.slice(2), value)`
- **Boolean attributes** (e.g., `checked`, `disabled`) → assigned as **properties** (`node[key] = value`), not via `setAttribute`, so they work correctly with the DOM.
- **`value` on inputs** → assigned as a property (`node.value = value`) to set the current value, not the HTML attribute.

> **Bug fix 2 & 3**: The original `el()` used `setAttribute` for all attributes. `setAttribute('checked', true)` sets the *default* checked state but not the *current* `checked` property, so pre-checked checkboxes (for completed tasks) and pre-filled edit inputs were broken. Fixing `el()` to use property assignment for `checked` and `value` resolves both.

### 3. Greeting / Clock section

- Runs a `setInterval` at 1 000 ms.
- `greetingFor(hour)` is a pure function mapping hour → greeting string.
- `updateClock()` reads `new Date()`, formats the time and date strings, and updates three DOM elements: `#clock`, `#date`, `#greeting`.
- The name input's `input` event updates the in-memory `userName`, persists it, and re-calls `updateClock()`.

### 4. Focus Timer

- State: `minutes` (number), `remaining` (seconds), `endAt` (ms timestamp), `intervalId`.
- Countdown uses `endAt - Date.now()` rather than decrementing a counter, so the display stays accurate if the browser throttles the tab.
- `formatTime(totalSeconds)` is a pure function returning `"MM:SS"`.
- `clampMinutes(value)` is a pure function: `Math.min(180, Math.max(1, Math.round(Number(value)) || 25))`.
- The `#timer-minutes` input has an explicit `<label>` element associated via `for`/`id` for accessibility.

> **Bug fix 4**: The original HTML had a `<label class="inline-field">` wrapping a `<span>` and an `<input>`, but the input lacked an `id` and the label lacked a matching `for` attribute. Fix: add `id="timer-minutes"` to the input (already present) and ensure the wrapping element is a proper `<label for="timer-minutes">`.

### 5. To-Do List

- State: `tasks` (array), `editingId` (string | null).
- `renderTasks()` rebuilds the `<ul>` from scratch on every state change.
- Task IDs are generated with `makeId()` once at creation time.
- After a successful add, `taskInput.focus()` is called so the user can immediately type the next task.

> **Bug fix 5**: The original code cleared the input but did not re-focus it after adding a task. One line `taskInput.focus()` added after `renderTasks()` in the submit handler fixes this.

### 6. Quick Links

- State: `links` (array).
- Default links are defined **outside** the `store.get` call with stable, pre-computed IDs so they do not regenerate on every load.

> **Bug fix 6**: The original code called `makeId()` inside the `defaultLinks` array literal, which ran every time the file was evaluated. Moving to static constant IDs (e.g., hard-coded strings) or computing them once at module level fixes the cosmetic churn.

- The remove `<button>` inside each link item is given the `btn` class for style consistency.

> **Bug fix 7**: The remove button lacked the `btn` class, leaving it unstyled compared to other interactive buttons in the app.

### 7. `<script>` placement

> **Bug fix 1**: The `<script src="js/app.js">` tag was placed after `</body>`, which is outside the HTML document body. It must be the last element **inside** `<body>`.

---

### DOM entry points (IDs queried by `app.js`)

| ID | Element | Purpose |
|---|---|---|
| `theme-toggle` | `<button>` | Toggle light/dark |
| `clock` | `<p>` | Live time display |
| `date` | `<p>` | Date display |
| `greeting` | `<p>` | Greeting text |
| `name-input` | `<input type="text">` | Custom name entry |
| `timer` | `<p>` | Countdown display |
| `timer-status` | `<p>` | Timer messages |
| `timer-minutes` | `<input type="number">` | Pomodoro duration |
| `timer-start` | `<button>` | Start timer |
| `timer-stop` | `<button>` | Stop timer |
| `timer-reset` | `<button>` | Reset timer |
| `task-form` | `<form>` | Add task form |
| `task-input` | `<input type="text">` | New task text |
| `task-status` | `<p>` | Task messages |
| `task-list` | `<ul>` | Task list container |
| `link-form` | `<form>` | Add link form |
| `link-name` | `<input type="text">` | Link name |
| `link-url` | `<input type="text">` | Link URL |
| `link-status` | `<p>` | Link messages |
| `link-list` | `<ul>` | Link list container |

---

## Data Models

```javascript
// Task
{
  id: string,       // makeId() output — alphanumeric, unique per session
  text: string,     // 1–120 characters, trimmed
  done: boolean     // false on creation; toggled by checkbox
}

// Link
{
  id: string,       // makeId() output or stable constant for defaults
  name: string,     // 1–20 characters, trimmed
  url: string       // fully-qualified https:// URL
}
```

---

## Error Handling

| Scenario | Handling |
|---|---|
| `localStorage` unavailable | `store.set` swallows the error; app works for the session |
| Corrupted JSON in `localStorage` | `store.get` catches parse errors and returns the fallback |
| Invalid Pomodoro minutes input | `clampMinutes` coerces the value; invalid non-numeric input falls back to 25 |
| Invalid URL in link form | `normalizeUrl` returns `null`; the submit handler shows an inline error and rejects the entry |
| XSS via user input | All user text is inserted with `textContent` or as DOM text nodes via `el()`, never `innerHTML` |

---

## Testing Strategy

### Dual Testing Approach

**Unit / example tests** cover specific behaviors: DOM structure checks, edge cases (empty task, invalid URL, Escape to cancel edit), and initialization flows (default theme, default links).

**Property-based tests** cover the pure functions and universal invariants listed in the Correctness Properties section below. These functions have no side effects and vary meaningfully with input, making them ideal candidates:

- `greetingFor(hour)` — 24 discrete inputs, all branches covered by generation
- `formatTime(totalSeconds)` — large integer domain; generated values find off-by-one errors
- `clampMinutes(value)` — boundary behavior across a wide numeric range
- `normalizeUrl(raw)` — large string domain; edge cases around schemes, dots, and special characters
- Task and link CRUD invariants — list length, contents, and localStorage round trips

### Unit Test Focus Areas

- Verify DOM structure (required IDs, input attributes, label associations)
- Verify initialization from localStorage (saved theme, name, tasks, links)
- Verify error message display for invalid URL and empty task
- Verify Escape key cancels edit without mutation
- Verify timer reaches zero and shows the status message

### Property Test Configuration

- Minimum 100 iterations per property
- Use in-memory mocks for localStorage to isolate pure logic
- Tag format: **Feature: personal-dashboard, Property {N}: {title}**

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Date format contains all required components

*For any* `Date` object, the formatted date string produced by the dashboard's date formatter SHALL contain a weekday name, a month name, a numeric day, and a 4-digit year.

**Validates: Requirements 1.2**

---

### Property 2: Time-of-day greeting is correct for every hour

*For any* integer hour in the range [0, 23], `greetingFor(hour)` SHALL return "Good night" for hours 0–4, "Good morning" for hours 5–11, "Good afternoon" for hours 12–17, and "Good evening" for hours 18–23.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

---

### Property 3: Greeting includes name when name is non-empty

*For any* non-empty name string and *any* hour, the rendered greeting text SHALL end with `, {name}` where `{name}` is the entered value.

**Validates: Requirements 3.2**

---

### Property 4: Name persistence round trip

*For any* name string up to 24 characters, after the name is saved, reading the `userName` key from `localStorage` SHALL return the same string.

**Validates: Requirements 3.4, 3.5**

---

### Property 5: Theme toggle is its own inverse

*For any* initial theme value (`"light"` or `"dark"`), applying the toggle operation twice SHALL yield the original theme value.

**Validates: Requirements 4.2, 4.3**

---

### Property 6: `formatTime` always produces valid MM:SS strings

*For any* non-negative integer `totalSeconds`, `formatTime(totalSeconds)` SHALL return a string that matches the pattern `/^\d{2}:\d{2}$/`.

**Validates: Requirements 5.1**

---

### Property 7: Timer reset always produces the full duration

*For any* timer state (running, paused, or expired) and *any* valid `minutes` value in [1, 180], after calling reset, the remaining time SHALL equal `minutes * 60` seconds.

**Validates: Requirements 5.4**

---

### Property 8: Tab title reflects running state

*For any* remaining time value and running/stopped state, `document.title` SHALL equal `"MM:SS - Life Dashboard"` when the timer is running and `"Life Dashboard"` when it is not.

**Validates: Requirements 5.6, 5.7**

---

### Property 9: `clampMinutes` always returns a value in [1, 180]

*For any* numeric input (including `NaN`, negative numbers, decimals, and values above 180), `clampMinutes(value)` SHALL return an integer in the inclusive range [1, 180].

**Validates: Requirements 6.2, 6.4**

---

### Property 10: Adding a task grows the list by exactly one

*For any* task list state and *any* non-empty, non-whitespace-only task text, submitting the add-task form SHALL increase the task list length by exactly 1 and persist the updated list to `localStorage`.

**Validates: Requirements 7.2, 7.3**

---

### Property 11: Editing a task updates its text without affecting other tasks

*For any* task list and *any* task in that list, after entering edit mode, typing new non-empty text, and saving, that task's `text` SHALL equal the new string, and all other tasks SHALL remain unchanged.

**Validates: Requirements 8.1, 8.2**

---

### Property 12: Checkbox toggle is its own inverse

*For any* task, toggling the `done` checkbox twice SHALL return `task.done` to its original value.

**Validates: Requirements 8.4**

---

### Property 13: Deleting a task removes it and shrinks the list by one

*For any* task list and *any* task in that list, after deletion, the task SHALL not be present in the list and the list length SHALL decrease by exactly 1.

**Validates: Requirements 8.5, 10.2**

---

### Property 14: `normalizeUrl` prepends `https://` to bare hostnames

*For any* hostname string that does not begin with `http://` or `https://` and contains a dot, `normalizeUrl` SHALL return a string beginning with `"https://"`.

**Validates: Requirements 9.4**

---

### Property 15: User-supplied text is never inserted as raw HTML

*For any* string containing HTML metacharacters (`<`, `>`, `"`, `&`), when that string is rendered as a task label, link name, greeting name, or any other user-visible field, the resulting DOM text node SHALL contain the literal characters rather than interpreted HTML markup.

**Validates: Requirements 12.5**
