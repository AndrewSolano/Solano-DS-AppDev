# To-Do List App — Prelim Examination

A vanilla HTML/CSS/JavaScript to-do list app. No frameworks, no build step —
just open `index.html` in a browser.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure: form, task list, delete-all button |
| `style.css` | All visual styling |
| `script.js` | All app logic: state, rendering, events, Local Storage |

## How it works (for your presentation)

`script.js` is organized top to bottom into 5 labeled sections:

1. **State & Persistence** — `state.tasks` is the single source of truth
   (an array of `{ id, text, completed, createdAt }` objects). Every
   feature changes this array first, saves it to Local Storage, then
   re-renders. Nothing else in the app edits the DOM directly.
2. **DOM References** — elements grabbed once and reused.
3. **Rendering** — `render()` wipes and rebuilds the `<ul>` from
   `state.tasks`, so the screen always matches the state.
4. **Event Handlers** — form submit (create + validation), toggle done,
   delete one, and the async "delete all".
5. **Init** — loads saved tasks from Local Storage and renders on page load.

## Feature checklist

- [x] **Create** — form input + button, adds instantly without a page reload, input clears after submit
- [x] **Validation** — empty submissions are blocked with a visible error message (JS-driven, `preventDefault` used)
- [x] **View** — tasks render in a list, each with a toggle and a delete control, list updates dynamically from one state array
- [x] **Update** — clicking the circle toggles a task's completed state (strikethrough + style change), state persists across reloads; double-clicking a task's text turns it into an editable input (Enter/click-away saves, Escape cancels, empty edits are rejected)
- [x] **Delete** — per-task delete removes it immediately and updates storage
- [x] **Data persistence** — all tasks saved to `localStorage` under the key `todo-app-tasks`
- [x] **Delete All (async)** — clears every task, but first simulates a ~2 second loading state via `setTimeout` wrapped in a `Promise`, with the button disabled and relabeled "Deleting…" during the wait

## Data shape stored in Local Storage

```json
[
  { "id": "a1b2c3", "text": "Buy groceries", "completed": false, "createdAt": 1735689600000 },
  { "id": "d4e5f6", "text": "Finish report", "completed": true, "createdAt": 1735689650000 }
]
```

## Running it locally

Just double-click `index.html`, or serve the folder with any static
server, e.g.:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Submitting via GitHub (per the exam instructions)

From your existing repository:

```bash
git checkout -b Prelim-Exam
# copy index.html, style.css, script.js, README.md into the repo
git add .
git commit -m "Prelim Exam: To-Do List app"
git push -u origin Prelim-Exam
```

Then submit your repository link in the submission bin.
