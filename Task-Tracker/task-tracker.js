const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const dueDateInput = document.getElementById("due-date-input");
const taskList = document.getElementById("task-list");
const clearCompletedBtn = document.getElementById("clear-completed");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item ${task.completed ? "completed" : ""}`;

    li.innerHTML = `
      <div class="task-info">
        <div class="task-title">${task.title}</div>
        ${task.dueDate ? `<div class="task-date">Due: ${formatDate(task.dueDate)}</div>` : ""}
      </div>
      <div class="task-actions">
        <button class="btn-small btn-complete" data-id="${task.id}">
          ${task.completed ? "Undo" : "Complete"}
        </button>
        <button class="btn-small btn-delete" data-id="${task.id}">Delete</button>
      </div>
    `;

    taskList.appendChild(li);
  });
}

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = taskInput.value.trim();
  const dueDate = dueDateInput.value;

  if (!title) return;

  const task = {
    id: Date.now(),
    title,
    dueDate,
    completed: false,
  };

  tasks.push(task);
  saveTasks();
  renderTasks();

  taskInput.value = "";
  dueDateInput.value = "";
});

taskList.addEventListener("click", (e) => {
  const id = Number(e.target.dataset.id);
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  if (e.target.classList.contains("btn-complete")) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
  }

  if (e.target.classList.contains("btn-delete")) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    renderTasks();
  }
});

clearCompletedBtn.addEventListener("click", () => {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  renderTasks();
});

renderTasks();