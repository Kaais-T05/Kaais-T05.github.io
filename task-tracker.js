const STORAGE_KEY = 'kaais-tasks';

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const dueDateInput = document.getElementById('due-date-input');
const taskList = document.getElementById('task-list');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');

let tasks = [];
let currentFilter = 'all';

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

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function getFilteredTasks() {
  if (currentFilter === 'not-started') return tasks.filter(t => t.status === 'not-started');
  if (currentFilter === 'in-progress') return tasks.filter(t => t.status === 'in-progress');
  if (currentFilter === 'completed') return tasks.filter(t => t.status === 'completed');
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
    li.dataset.id = task.id;
    li.dataset.status = task.status;

    li.innerHTML = `
      <div class="task-content">
        <div class="task-header">
          <div class="task-text">${escapeHtml(task.text)}</div>
          ${getStatusBadge(task.status)}
        </div>
        ${task.dueDate ? `<div class="task-meta">Due: ${formatDate(task.dueDate)}</div>` : ''}
      </div>
      <div class="task-actions">
        <button class="btn-in-progress" type="button">In Progress</button>
        <button class="btn-complete" type="button">Complete</button>
        <button class="btn-delete" type="button">Delete</button>
      </div>
    `;

    li.querySelector('.btn-in-progress').addEventListener('click', () => {
      task.status = 'in-progress';
      saveTasksToStorage();
      renderTasks();
    });

    li.querySelector('.btn-complete').addEventListener('click', () => {
      task.status = 'completed';
      saveTasksToStorage();
      renderTasks();
    });

    li.querySelector('.btn-delete').addEventListener('click', () => {
      if (!confirm('Delete this task?')) return;
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasksToStorage();
      renderTasks();
    });

    taskList.appendChild(li);
  });
}

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const text = taskInput.value.trim();
  if (!text) return;

  const task = {
    id: generateId(),
    text,
    dueDate: dueDateInput.value || null,
    status: 'not-started',
    createdAt: new Date().toISOString()
  };

  tasks.push(task);
  saveTasksToStorage();
  taskForm.reset();
  renderTasks();
});

clearCompletedBtn.addEventListener('click', () => {
  if (!confirm('Clear all completed tasks?')) return;
  tasks = tasks.filter(t => t.status !== 'completed');
  saveTasksToStorage();
  renderTasks();
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

tasks = loadTasksFromStorage();
renderTasks();