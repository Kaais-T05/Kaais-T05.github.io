// Storage key
const STORAGE_KEY = 'kaais-tasks';

// DOM elements
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const dueDateInput = document.getElementById('due-date-input');
const taskList = document.getElementById('task-list');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');

// State
let tasks = [];
let currentFilter = 'all';

// Helpers
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadTasksFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasksToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getFilteredTasks() {
  if (currentFilter === 'not-started') {
    return tasks.filter(t => t.status === 'not-started');
  } else if (currentFilter === 'in-progress') {
    return tasks.filter(t => t.status === 'in-progress');
  } else if (currentFilter === 'completed') {
    return tasks.filter(t => t.status === 'completed');
  }
  return tasks;
}

function getStatusBadge(status) {
  const label =
    status === 'not-started' ? 'Not Started' :
    status === 'in-progress' ? 'In Progress' :
    'Completed';

  const className =
    status === 'not-started' ? 'status-not-started' :
    status === 'in-progress' ? 'status-in-progress' :
    'status-completed';

  return `<span class="status-badge ${className}">${label}</span>`;
}

function renderTasks() {
  taskList.innerHTML = '';
  const filtered = getFilteredTasks();

  if (filtered.length === 0) {
    taskList.innerHTML = '<li class="empty">No tasks here.</li>';
    return;
  }

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item';
    if (task.status === 'completed') li.classList.add('completed');
    li.dataset.id = task.id;

    const dueText = task.dueDate ? `Due: ${task.dueDate}` : '';

    li.innerHTML = `
      <div class="task-header">
        <div class="task-text">${escapeHtml(task.text)}</div>
        ${getStatusBadge(task.status)}
      </div>
      ${dueText ? `<div class="task-meta">${dueText}</div>` : ''}
      <div class="task-actions">
        <button class="btn-in-progress">In Progress</button>
        <button class="btn-complete">Complete</button>
        <button class="btn-delete">Delete</button>
      </div>
    `;

    // In Progress
    li.querySelector('.btn-in-progress').addEventListener('click', () => {
      task.status = 'in-progress';
      saveTasksToStorage();
      renderTasks();
    });

    // Complete
    li.querySelector('.btn-complete').addEventListener('click', () => {
      task.status = 'completed';
      saveTasksToStorage();
      renderTasks();
    });

    // Delete
    li.querySelector('.btn-delete').addEventListener('click', () => {
      if (!confirm('Delete this task?')) return;
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasksToStorage();
      renderTasks();
    });

    taskList.appendChild(li);
  });
}

// Create task
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const text = taskInput.value.trim();
  if (!text) return;

  const task = {
    id: generateId(),
    text,
    dueDate: dueDateInput.value || null,
    status: 'not-started', // default status
    createdAt: new Date().toISOString()
  };

  tasks.push(task);
  saveTasksToStorage();
  taskInput.value = '';
  dueDateInput.value = '';
  renderTasks();
});

// Clear completed
clearCompletedBtn.addEventListener('click', () => {
  if (!confirm('Clear all completed tasks?')) return;
  tasks = tasks.filter(t => t.status !== 'completed');
  saveTasksToStorage();
  renderTasks();
});

// Filters
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// Init
tasks = loadTasksFromStorage();
renderTasks();