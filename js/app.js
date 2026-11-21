(() => {
  'use strict';

  /* ---------- Helpers ---------- */
  const $ = (selector) => document.querySelector(selector);

  // Local Storage wrapper: never crashes if storage is blocked or data is corrupted.
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* storage unavailable: app still works for this session */
      }
    },
  };

  const makeId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // Small DOM builder. Uses textContent, so user input is never parsed as HTML.
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'class') node.className = value;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
      else if (value !== false && value != null) node.setAttribute(key, value === true ? '' : value);
    }
    node.append(...children);
    return node;
  }

  function setStatus(node, message, isError = false) {
    node.textContent = message;
    node.classList.toggle('error', isError);
  }

  /* ---------- Challenge 1: Light / Dark mode ---------- */
  const themeToggle = $('#theme-toggle');

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeToggle.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
  }

  let theme = store.get('theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(theme);

  themeToggle.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    store.set('theme', theme);
    applyTheme(theme);
  });

  /* ---------- Greeting: clock, date, and Challenge 2: custom name ---------- */
  const clockEl = $('#clock');
  const dateEl = $('#date');
  const greetingEl = $('#greeting');
  const nameInput = $('#name-input');

  let userName = store.get('userName', '');
  nameInput.value = userName;

  nameInput.addEventListener('input', () => {
    userName = nameInput.value.trim();
    store.set('userName', userName);
    updateClock();
  });

  function greetingFor(hour) {
    if (hour < 5) return 'Good night';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  function updateClock() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-GB');
    dateEl.textContent = now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    greetingEl.textContent = greetingFor(now.getHours()) + (userName ? `, ${userName}` : '');
  }

  updateClock();
  setInterval(updateClock, 1000);

  /* ---------- Focus Timer + Challenge 3: custom Pomodoro time ---------- */
  const timerEl = $('#timer');
  const timerStatus = $('#timer-status');
  const minutesInput = $('#timer-minutes');

  const clampMinutes = (value) => Math.min(180, Math.max(1, Math.round(Number(value)) || 25));

  let minutes = clampMinutes(store.get('pomodoroMinutes', 25));
  let remaining = minutes * 60; // seconds
  let endAt = 0;
  let intervalId = null;

  minutesInput.value = minutes;

  function formatTime(totalSeconds) {
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function renderTimer() {
    timerEl.textContent = formatTime(remaining);
    document.title = intervalId ? `${formatTime(remaining)} - Life Dashboard` : 'Life Dashboard';
  }

  function tick() {
    // Based on the end timestamp, so it stays accurate even if the tab is throttled.
    remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    if (remaining === 0) {
      stopTimer();
      setStatus(timerStatus, 'Time is up. Take a short break.');
    }
    renderTimer();
  }

  function startTimer() {
    if (intervalId) return;
    if (remaining === 0) remaining = minutes * 60;
    setStatus(timerStatus, '');
    endAt = Date.now() + remaining * 1000;
    intervalId = setInterval(tick, 250);
    renderTimer();
  }

  function stopTimer() {
    clearInterval(intervalId);
    intervalId = null;
    renderTimer();
  }

  function resetTimer() {
    stopTimer();
    remaining = minutes * 60;
    setStatus(timerStatus, '');
    renderTimer();
  }

  $('#timer-start').addEventListener('click', startTimer);
  $('#timer-stop').addEventListener('click', stopTimer);
  $('#timer-reset').addEventListener('click', resetTimer);

  minutesInput.addEventListener('change', () => {
    minutes = clampMinutes(minutesInput.value);
    minutesInput.value = minutes;
    store.set('pomodoroMinutes', minutes);
    resetTimer();
  });

  renderTimer();

  /* ---------- To-Do List ---------- */
  const taskForm = $('#task-form');
  const taskInput = $('#task-input');
  const taskList = $('#task-list');
  const taskStatus = $('#task-status');

  let tasks = store.get('tasks', []);
  let editingId = null;

  const saveTasks = () => store.set('tasks', tasks);

  function renderTasks() {
    taskList.replaceChildren();

    if (tasks.length === 0) {
      taskList.append(el('li', { class: 'empty' }, 'No tasks yet. Add your first one above.'));
      return;
    }

    for (const task of tasks) {
      const item = el('li', { class: task.done ? 'done' : '' });

      const checkbox = el('input', {
        type: 'checkbox',
        'aria-label': `Mark "${task.text}" as done`,
        checked: task.done,
        onchange: () => {
          task.done = checkbox.checked;
          saveTasks();
          renderTasks();
        },
      });

      if (editingId === task.id) {
        const editInput = el('input', { type: 'text', maxlength: 120, value: task.text, 'aria-label': 'Edit task' });
        const commit = () => {
          const text = editInput.value.trim();
          if (text) task.text = text;
          editingId = null;
          saveTasks();
          renderTasks();
        };
        editInput.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') commit();
          if (event.key === 'Escape') { editingId = null; renderTasks(); }
        });
        item.append(
          checkbox,
          editInput,
          el('button', { class: 'btn btn-small btn-primary', type: 'button', onclick: commit }, 'Save'),
        );
      } else {
        item.append(
          checkbox,
          el('span', { class: 'task-text' }, task.text),
          el('button', {
            class: 'btn btn-small', type: 'button',
            onclick: () => { editingId = task.id; renderTasks(); },
          }, 'Edit'),
          el('button', {
            class: 'btn btn-small btn-danger', type: 'button',
            onclick: () => {
              tasks = tasks.filter((t) => t.id !== task.id);
              saveTasks();
              renderTasks();
            },
          }, 'Delete'),
        );
      }
      taskList.append(item);
    }

    const editField = taskList.querySelector('input[type="text"]');
    if (editField) editField.focus();
  }

  taskForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;
    tasks.push({ id: makeId(), text, done: false });
    saveTasks();
    taskInput.value = '';
    setStatus(taskStatus, '');
    renderTasks();
  });

  renderTasks();

  /* ---------- Quick Links ---------- */
  const linkForm = $('#link-form');
  const linkName = $('#link-name');
  const linkUrl = $('#link-url');
  const linkList = $('#link-list');
  const linkStatus = $('#link-status');

  const defaultLinks = [
    { id: makeId(), name: 'Google', url: 'https://www.google.com/' },
    { id: makeId(), name: 'Gmail', url: 'https://mail.google.com/' },
    { id: makeId(), name: 'Calendar', url: 'https://calendar.google.com/' },
  ];

  let links = store.get('links', defaultLinks);
  const saveLinks = () => store.set('links', links);

  // Accepts "example.com" or a full URL. Only http(s) links are allowed.
  function normalizeUrl(raw) {
    let value = raw.trim();
    if (!value) return null;
    if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
    try {
      const url = new URL(value);
      const isWeb = url.protocol === 'http:' || url.protocol === 'https:';
      return isWeb && url.hostname.includes('.') ? url.href : null;
    } catch {
      return null;
    }
  }

  function renderLinks() {
    linkList.replaceChildren();
    for (const link of links) {
      linkList.append(
        el('li', {},
          el('a', { href: link.url, target: '_blank', rel: 'noopener noreferrer' }, link.name),
          el('button', {
            type: 'button',
            'aria-label': `Remove ${link.name}`,
            onclick: () => {
              links = links.filter((l) => l.id !== link.id);
              saveLinks();
              renderLinks();
            },
          }, '\u00d7'),
        ),
      );
    }
  }

  linkForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = linkName.value.trim();
    const url = normalizeUrl(linkUrl.value);
    if (!name) return;
    if (!url) {
      setStatus(linkStatus, 'Enter a valid web address, for example example.com.', true);
      return;
    }
    links.push({ id: makeId(), name, url });
    saveLinks();
    linkName.value = '';
    linkUrl.value = '';
    setStatus(linkStatus, '');
    renderLinks();
  });

  renderLinks();
})();