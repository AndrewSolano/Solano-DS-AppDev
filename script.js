/* ==========================================================================
   TO-DO LIST APP
   --------------------------------------------------------------------------
   This file is organized into five parts:
   1. State & Persistence  - the single source of truth + Local Storage sync
   2. DOM References       - cached elements we'll read/update often
   3. Rendering            - turns state into what the user sees
   4. Event Handlers       - respond to user actions (create/update/delete)
   5. Init                 - runs once when the page loads
   ========================================================================== */

/* ==========================================================================
   1. STATE & PERSISTENCE
   --------------------------------------------------------------------------
   `state.tasks` is the ONE source of truth for the whole app.
   Every feature (create, toggle, delete, delete all) works by:
     a) changing state.tasks
     b) saving state.tasks to Local Storage
     c) re-rendering the list from state.tasks
   The DOM is never edited directly outside of render() - it always
   reflects whatever is currently in state.
   ========================================================================== */

const STORAGE_KEY = "todo-app-tasks";

const state = {
  tasks: [], // each task: { id: string, text: string, completed: boolean, createdAt: number }
};

/**
 * Reads saved tasks from Local Storage into state.tasks.
 * Called once on page load so completed/added tasks survive a refresh.
 */
function loadTasksFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    state.tasks = [];
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    state.tasks = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    // If storage ever contains corrupted data, fail safely instead of crashing.
    console.error("Could not parse saved tasks, starting fresh.", error);
    state.tasks = [];
  }
}

/**
 * Writes the current state.tasks to Local Storage.
 * Called after every mutation (add / toggle / delete / delete all).
 */
function saveTasksToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

/* ==========================================================================
   2. DOM REFERENCES
   ========================================================================== */

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskError = document.getElementById("task-error");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const statsLine = document.getElementById("stats-line");
const todayDate = document.getElementById("today-date");
const deleteAllBtn = document.getElementById("delete-all-btn");
const toast = document.getElementById("toast");

/* ==========================================================================
   3. RENDERING
   --------------------------------------------------------------------------
   render() is the only function allowed to touch the task list's HTML.
   It wipes the list and rebuilds it from state.tasks every time it runs.
   This keeps state as the single source of truth: the UI is just a
   reflection of it, never a separate copy of the data.
   ========================================================================== */

function render() {
  // Clear the current list.
  taskList.innerHTML = "";

  // Show/hide the empty state message.
  const hasTasks = state.tasks.length > 0;
  emptyState.classList.toggle("is-visible", !hasTasks);

  // Build one <li> per task, dynamically, with JavaScript.
  state.tasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = "task-item" + (task.completed ? " is-done" : "");
    item.dataset.id = task.id;

    // Toggle "done" control
    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "task-item__toggle";
    toggleBtn.setAttribute(
      "aria-label",
      task.completed ? "Mark task as not done" : "Mark task as done"
    );
    toggleBtn.addEventListener("click", () => toggleTask(task.id));

    // Task text (double-click to edit)
    const text = document.createElement("span");
    text.className = "task-item__text";
    text.textContent = task.text;
    text.title = "Double-click to edit";
    text.addEventListener("dblclick", () => enterEditMode(item, task, text));

    // Delete control
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "task-item__delete";
    deleteBtn.setAttribute("aria-label", "Delete task");
    deleteBtn.textContent = "\u00D7"; // ×
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    item.append(toggleBtn, text, deleteBtn);
    taskList.appendChild(item);
  });

  updateStats();
}

/**
 * Updates the small "x of y done" summary line in the header.
 */
function updateStats() {
  const total = state.tasks.length;

  if (total === 0) {
    statsLine.textContent = "No tasks yet";
    return;
  }

  const done = state.tasks.filter((task) => task.completed).length;
  statsLine.textContent = `${done} of ${total} done`;
}

/**
 * Displays today's date in the header, e.g. "Fri, Sep 5".
 */
function renderTodayDate() {
  const formatted = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  todayDate.textContent = formatted;
}

/**
 * Briefly shows a small confirmation message at the bottom of the screen.
 */
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");

  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

/* ==========================================================================
   4. EVENT HANDLERS (Create, Update, Delete)
   ========================================================================== */

/**
 * FEATURE: Create Task + Form Submission Handling + Input Validation
 * ---------------------------------------------------------------
 * - Prevents the browser's default form submit (page reload).
 * - Reads and trims the input value.
 * - Rejects empty input with a visible error message.
 * - On success: builds a task object, saves it, renders it, clears the input.
 */
taskForm.addEventListener("submit", (event) => {
  event.preventDefault(); // stop default browser form behavior

  const value = taskInput.value.trim();

  if (value === "") {
    showValidationError("Please enter a task before adding it.");
    return;
  }

  clearValidationError();
  addTask(value);

  taskForm.reset(); // clears the input field after successful submission
  taskInput.focus();
});

// Clear the error as soon as the user starts typing again.
taskInput.addEventListener("input", () => {
  if (taskInput.classList.contains("is-invalid")) {
    clearValidationError();
  }
});

function showValidationError(message) {
  taskError.textContent = message;
  taskInput.classList.add("is-invalid");
}

function clearValidationError() {
  taskError.textContent = "";
  taskInput.classList.remove("is-invalid");
}

/**
 * Adds a new task object to state, persists it, and re-renders.
 */
function addTask(text) {
  const newTask = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    text,
    completed: false,
    createdAt: Date.now(),
  };

  state.tasks.push(newTask);
  saveTasksToStorage();
  render();
}

/**
 * FEATURE: Mark Task as Done (Update)
 * Flips the `completed` flag for one task, persists it, and re-renders.
 */
function toggleTask(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;

  task.completed = !task.completed;
  saveTasksToStorage();
  render();
}

/**
 * FEATURE: Update Task Name (edit-in-place)
 * ---------------------------------------------------------------
 * Double-clicking a task's text swaps it for a text input pre-filled
 * with the current value. Enter or clicking away saves the change,
 * Escape cancels it. Empty edits are rejected and the original text
 * is restored, same validation rule as creating a task.
 */
function enterEditMode(item, task, textSpan) {
  // Avoid opening two editors on the same task.
  if (item.classList.contains("is-editing")) return;
  item.classList.add("is-editing");

  const input = document.createElement("input");
  input.type = "text";
  input.className = "task-item__edit-input";
  input.value = task.text;
  input.maxLength = 120;

  textSpan.replaceWith(input);
  input.focus();
  input.select();

  let finished = false; // guards against blur firing after Enter/Escape

  function commit() {
    if (finished) return;
    finished = true;

    const newValue = input.value.trim();
    task.text = newValue === "" ? task.text : newValue; // reject empty edits
    saveTasksToStorage();
    render();
  }

  function cancel() {
    if (finished) return;
    finished = true;
    render(); // just redraw from unchanged state
  }

  input.addEventListener("blur", commit);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      input.blur(); // triggers commit
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    }
  });
}

/**
 * FEATURE: Delete Task (single)
 * Removes one task from state by id, persists it, and re-renders.
 */
function deleteTask(id) {
  state.tasks = state.tasks.filter((t) => t.id !== id);
  saveTasksToStorage();
  render();
}

/**
 * FEATURE: Delete All (Asynchronous)
 * ---------------------------------------------------------------
 * Simulates a ~2 second loading state (as if this were a network/API
 * call) using setTimeout wrapped in a Promise, so we can `await` it.
 * The button is disabled and relabeled while "deleting" so the user
 * gets feedback that something is happening.
 */
function fakeDeleteAllRequest() {
  return new Promise((resolve) => {
    setTimeout(resolve, 2000);
  });
}

async function handleDeleteAll() {
  if (state.tasks.length === 0) {
    showToast("There are no tasks to delete.");
    return;
  }

  const confirmed = window.confirm("Delete all tasks? This can't be undone.");
  if (!confirmed) return;

  // Enter loading state.
  deleteAllBtn.disabled = true;
  const originalLabel = deleteAllBtn.textContent;
  deleteAllBtn.textContent = "Deleting…";

  await fakeDeleteAllRequest(); // simulated async delay

  // Perform the actual deletion once the "request" resolves.
  state.tasks = [];
  saveTasksToStorage();
  render();

  // Exit loading state.
  deleteAllBtn.disabled = false;
  deleteAllBtn.textContent = originalLabel;

  showToast("All tasks deleted.");
}

deleteAllBtn.addEventListener("click", handleDeleteAll);

/* ==========================================================================
   5. INIT
   ========================================================================== */

function init() {
  renderTodayDate();
  loadTasksFromStorage();
  render();
}

init();
