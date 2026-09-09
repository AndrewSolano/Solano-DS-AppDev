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

  try {  // if something goes wrong
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
function saveTasksToStorage() {  //javascript into JSON string to local storage
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

function render() { // Take the current data and display it on the webpage
  // Clear the current list. Because render() is going to rebuild the list from scratch.
  taskList.innerHTML = "";

  //state.tasks.length tells you how many tasks exist.
  const hasTasks = state.tasks.length > 0;
  emptyState.classList.toggle("is-visible", !hasTasks); //Show "No tasks yet" when there are no tasks.

  // Build one <li> per task, dynamically, with JavaScript.
  state.tasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = "task-item" + (task.completed ? " is-done" : ""); //If completed, add " is-done"; otherwise add nothing.
    item.dataset.id = task.id; //associate the HTML element with the task's ID

    // Toggle "done" control
    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "task-item__toggle"; //Gives it a CSS class.
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
    deleteBtn.textContent = "\u00D7"; // Displays X
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    item.append(toggleBtn, text, deleteBtn); //O, Text List, X
    taskList.appendChild(item);
  });

  updateStats(); //2 of 5 done
}

/**
 * Updates the small "x of y done" summary line in the header.
 */
function updateStats() {
  const total = state.tasks.length;

  if (total === 0) {
    statsLine.textContent = "No tasks yet";
    return; //Stop the function because there is nothing else to calculate.
  }

  const done = state.tasks.filter((task) => task.completed).length; //Take all tasks, keep only completed tasks, then count them.
  statsLine.textContent = `${done} of ${total} done`; // Display Result 2 of 4 done
}

/**
 * Displays today's date in the header, e.g. "Fri, Sep 5".
 */
function renderTodayDate() { //gets the current date/time.
  const formatted = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  todayDate.textContent = formatted; //formats it into a readable date.
}

/**
 * Briefly shows a small confirmation message at the bottom of the screen.
 */
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");  //showToast("All tasks deleted.");
}

  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200); //Time to dissappear

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
taskForm.addEventListener("submit", (event) => { // When the form is submitted, run this code.
  event.preventDefault(); // stop default browser form behavior

  const value = taskInput.value.trim(); //Get what the user type

  if (value === "") {
    showValidationError("Please enter a task before adding it.");
    return;
  }

  clearValidationError(); // If success Remove any previous error
  addTask(value); // Create task

  taskForm.reset(); // clears the input field after successful submission
  taskInput.focus();
});

// Clear the error as soon as the user starts typing again.
taskInput.addEventListener("input", () => {
  if (taskInput.classList.contains("is-invalid")) { //Check whether the input currently has the error CSS class.
    clearValidationError(); //If it does, remove the error.
  }
});

function showValidationError(message) { //Creates a function that receives an error message.
  taskError.textContent = message;
  taskInput.classList.add("is-invalid");
}

function clearValidationError() { //Remove the error text and styling
  taskError.textContent = "";
  taskInput.classList.remove("is-invalid");
}

/**
 * Adds a new task object to state, persists it, and re-renders.
 */
function addTask(text) {
  const newTask = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), //Creates a unique ID. If crypto.randomUUID exists, use it. Otherwise use the current timestamp
    text,
    completed: false,
    createdAt: Date.now(),
  };

  state.tasks.push(newTask); //adds something to the end of an array.
  saveTasksToStorage();
  render(); //Redraw the webpage using the updated state.
}
/**User enters task
       ↓
addTask()
       ↓
state.tasks.push()
       ↓
saveTasksToStorage()
       ↓
render()
       ↓
Task appears on screen  */
/**
 * FEATURE: Mark Task as Done (Update)
 * Flips the `completed` flag for one task, persists it, and re-renders.
 */
function toggleTask(id) { //If success This function receives a task ID
  const task = state.tasks.find((t) => t.id === id); //Find the task whose ID matches the ID I received. t is simply a temporary name for each task.

  if (!task) return; //If no task was found, stop.

  task.completed = !task.completed;
  saveTasksToStorage();
  render(); //Save the change and redraw the page. 
}

/**
 * FEATURE: Update Task Name (edit-in-place)
 * ---------------------------------------------------------------
 * Double-clicking a task's text swaps it for a text input pre-filled
 * with the current value. Enter or clicking away saves the change,
 * Escape cancels it. Empty edits are rejected and the original text
 * is restored, same validation rule as creating a task.
 */
function enterEditMode(item, task, textSpan) {   //This function runs when you double-click a task.

  if (item.classList.contains("is-editing")) return;   // If the task is already being edited, don't create another editor
  item.classList.add("is-editing");

  const input = document.createElement("input");
  input.type = "text";
  input.className = "task-item__edit-input";
  input.value = task.text;
  input.maxLength = 120;

  textSpan.replaceWith(input); //Replace text with input
  input.focus();
  input.select();  //Select the existing text.

  let finished = false; //keeps track of whether editing is already finished.

  function commit() { //Accept and save the edit.
    if (finished) return;
    finished = true;

    const newValue = input.value.trim(); //Get the edited text and remove unnecessary spaces.
    task.text = newValue === "" ? task.text : newValue; // reject empty edits
    saveTasksToStorage();
    render(); //Save and redraw.
  }

  function cancel() { //Creates a function to cancel the edit.
    if (finished) return;
    finished = true;
    render(); // just redraw from unchanged state
  }
/**
User is editing
       ↓
Clicks somewhere else/Press Enter
       ↓
Input loses focus
       ↓
blur
       ↓
commit()
 */
  input.addEventListener("blur", commit);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      input.blur(); // triggers commit
    } else if (event.key === "Escape") { //Press ESC to cancel edit
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
  if (state.tasks.length === 0) { //Check if there are no tasks.
    showToast("There are no tasks to delete.");
    return;
  }

  const confirmed = window.confirm("Delete all tasks? This can't be undone."); //Displays a browser confirmation dialog.
  if (!confirmed) return;

  // Enter loading state. Deleting...
  deleteAllBtn.disabled = true;
  const originalLabel = deleteAllBtn.textContent;
  deleteAllBtn.textContent = "Deleting…";

  await fakeDeleteAllRequest(); // simulated async delay

  // Perform the actual deletion once the "request" resolves.
  state.tasks = []; //Now all tasks are removed from state.
  saveTasksToStorage();
  render();

  // Exit loading state.
  deleteAllBtn.disabled = false;
  deleteAllBtn.textContent = originalLabel;

  showToast("All tasks deleted.");
}

deleteAllBtn.addEventListener("click", handleDeleteAll); //Connect Delete All button

/* ==========================================================================
   5. INIT
   ========================================================================== */

function init() {
  renderTodayDate();
  loadTasksFromStorage();
  render();
}

init();
