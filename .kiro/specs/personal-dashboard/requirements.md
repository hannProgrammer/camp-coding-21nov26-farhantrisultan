# Requirements Document

## Introduction

Life Dashboard is a client-side personal productivity web app. It runs entirely in the browser — no server or build step required — and persists all user data with the Local Storage API. The app displays a live greeting with the current time and date, a configurable Pomodoro focus timer, a to-do list with inline editing, and a quick-links launcher. Three optional challenges are included: light/dark mode toggle, a custom name in the greeting, and a configurable Pomodoro duration.

## Glossary

- **Dashboard**: The single HTML page (`index.html`) that hosts all four feature sections.
- **Greeting Section**: The full-width hero area containing the clock, date, greeting text, name input, and theme-toggle button.
- **Focus Timer**: The Pomodoro countdown timer panel.
- **Task**: A single to-do item with a unique ID, text content, and a completion state.
- **Task List**: The ordered collection of Tasks persisted in Local Storage.
- **Quick Link**: A named URL entry persisted in Local Storage and rendered as a clickable button.
- **Link List**: The collection of Quick Links persisted in Local Storage.
- **Local Storage**: The browser's `window.localStorage` API used for client-side persistence.
- **Theme**: The active color scheme of the Dashboard, either `light` or `dark`.
- **Pomodoro Duration**: The configurable number of minutes for one focus session, stored in Local Storage.

---

## Requirements

### Requirement 1: Live Clock and Date Display

**User Story:** As a user, I want to see the current time and date at a glance, so that I do not need to check another application.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Dashboard SHALL display the current local time in `HH:MM:SS` format, updated once per second.
2. WHEN the Dashboard loads, THE Dashboard SHALL display the current date formatted as `Weekday, Month Day, Year` (e.g., Thursday, November 21, 2026).
3. WHILE the Dashboard is open, THE Dashboard SHALL continue updating the displayed time every second without requiring a page reload.

---

### Requirement 2: Time-of-Day Greeting

**User Story:** As a user, I want a contextual greeting based on the time of day, so that the Dashboard feels personal and welcoming.

#### Acceptance Criteria

1. WHEN the hour is between 05:00 and 11:59, THE Greeting Section SHALL display "Good morning".
2. WHEN the hour is between 12:00 and 17:59, THE Greeting Section SHALL display "Good afternoon".
3. WHEN the hour is between 18:00 and 23:59, THE Greeting Section SHALL display "Good evening".
4. WHEN the hour is between 00:00 and 04:59, THE Greeting Section SHALL display "Good night".
5. WHEN the greeting text is updated due to a time-of-day change, THE Greeting Section SHALL reflect the change within one second.

---

### Requirement 3: Custom Name in Greeting

**User Story:** As a user, I want to enter my name so that the greeting addresses me personally.

#### Acceptance Criteria

1. THE Greeting Section SHALL provide a visible text input field for the user to type their name, with a maximum length of 24 characters.
2. WHEN the user types in the name input field, THE Greeting Section SHALL append `, {name}` to the greeting text immediately (e.g., "Good morning, Farhan").
3. WHEN the name input field is empty, THE Greeting Section SHALL display the greeting without any name suffix.
4. WHEN the user enters a name, THE Dashboard SHALL persist the name in Local Storage so that it is restored on the next page load.
5. WHEN the Dashboard loads and a saved name exists in Local Storage, THE Greeting Section SHALL populate the name input field with the saved name.

---

### Requirement 4: Light/Dark Mode Toggle

**User Story:** As a user, I want to switch between light and dark themes, so that I can use the Dashboard comfortably in any lighting condition.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a visible button in the Greeting Section to toggle between the light and dark themes.
2. WHEN the user clicks the theme-toggle button while the light theme is active, THE Dashboard SHALL switch to the dark theme and update the button label to "Light mode".
3. WHEN the user clicks the theme-toggle button while the dark theme is active, THE Dashboard SHALL switch to the light theme and update the button label to "Dark mode".
4. WHEN the Dashboard first loads and no saved theme exists in Local Storage, THE Dashboard SHALL apply the theme that matches the operating system's `prefers-color-scheme` media query.
5. WHEN the user toggles the theme, THE Dashboard SHALL persist the chosen theme value in Local Storage.
6. WHEN the Dashboard loads and a saved theme exists in Local Storage, THE Dashboard SHALL apply that saved theme before the page is rendered.

---

### Requirement 5: Focus Timer (Pomodoro)

**User Story:** As a user, I want a countdown timer for focused work sessions, so that I can manage my time using the Pomodoro technique.

#### Acceptance Criteria

1. WHEN the Focus Timer panel loads, THE Focus Timer SHALL display the timer in `MM:SS` format initialised to the current Pomodoro Duration.
2. WHEN the user clicks the Start button and the timer is not already running, THE Focus Timer SHALL begin counting down once per second from the current remaining time.
3. WHEN the user clicks the Stop button while the timer is running, THE Focus Timer SHALL pause the countdown and retain the remaining time.
4. WHEN the user clicks the Reset button, THE Focus Timer SHALL stop the countdown and reset the display to the full Pomodoro Duration.
5. WHEN the countdown reaches zero, THE Focus Timer SHALL stop automatically and display the text "Time is up. Take a short break." in the status area below the timer controls.
6. WHILE the timer is running, THE Dashboard SHALL update the browser tab title to show the remaining time in `MM:SS` format followed by " - Life Dashboard".
7. WHEN the timer is not running, THE Dashboard SHALL display "Life Dashboard" as the browser tab title.

---

### Requirement 6: Configurable Pomodoro Duration

**User Story:** As a user, I want to set my own focus session length, so that I can adapt the timer to my preferred working intervals.

#### Acceptance Criteria

1. THE Focus Timer panel SHALL provide a visible number input that accepts integer values between 1 and 180 (inclusive), representing the desired Pomodoro Duration in minutes.
2. WHEN the user changes the minutes input and the input loses focus or the Enter key is pressed, THE Focus Timer SHALL clamp the entered value to the range 1–180, update the input display, reset the timer to the new duration, and persist the new value in Local Storage.
3. WHEN the Dashboard loads and a saved Pomodoro Duration exists in Local Storage, THE Focus Timer SHALL initialise to that saved duration.
4. IF the saved Pomodoro Duration value in Local Storage is not a valid integer between 1 and 180, THEN THE Focus Timer SHALL fall back to a default duration of 25 minutes.

---

### Requirement 7: To-Do List: Add and Display Tasks

**User Story:** As a user, I want to add tasks to a list, so that I can track what I need to do during my session.

#### Acceptance Criteria

1. THE Task List panel SHALL provide a visible text input and an "Add task" button for creating new Tasks, with a maximum task text length of 120 characters.
2. WHEN the user submits the task form with non-empty text, THE Task List SHALL append a new Task with a unique ID, the entered text, and a `done` state of `false`.
3. WHEN a new Task is added, THE Dashboard SHALL persist the updated Task List in Local Storage.
4. WHEN the task input is submitted with only whitespace, THE Task List SHALL not add a new Task.
5. WHEN the Task List contains no Tasks, THE Task List SHALL display the message "No tasks yet. Add your first one above."
6. WHEN the Dashboard loads and saved Tasks exist in Local Storage, THE Task List SHALL render all saved Tasks in their persisted order and completion state.

---

### Requirement 8: To-Do List: Edit, Complete, and Delete Tasks

**User Story:** As a user, I want to update, check off, and remove tasks, so that I can keep the list accurate as I work.

#### Acceptance Criteria

1. WHEN the user clicks the Edit button for a Task, THE Task List SHALL replace the task text with an inline text input pre-filled with the current task text, and display a Save button.
2. WHEN the user submits the inline edit with non-empty text, THE Task List SHALL update the Task text, exit edit mode, and persist the change to Local Storage.
3. WHEN the user presses the Escape key while editing a Task, THE Task List SHALL cancel the edit and restore the original task text without saving.
4. WHEN the user checks the checkbox for a Task, THE Task List SHALL toggle the `done` state of the Task, apply a strikethrough style to completed tasks, and persist the change to Local Storage.
5. WHEN the user clicks the Delete button for a Task, THE Task List SHALL remove that Task from the list and persist the updated Task List to Local Storage.

---

### Requirement 9: Quick Links: Add and Display

**User Story:** As a user, I want to save URLs as named buttons, so that I can open my most-used sites with one click.

#### Acceptance Criteria

1. THE Quick Links panel SHALL display the add-link form at all times without requiring a toggle or reveal action.
2. THE Quick Links panel SHALL provide a visible name input (maximum 20 characters) and a URL input for adding new Quick Links.
3. WHEN the Dashboard first loads and no saved Link List exists in Local Storage, THE Quick Links panel SHALL display default entries for Google, Gmail, and Google Calendar.
4. WHEN the user submits the link form with a valid name and URL, THE Dashboard SHALL normalise the URL by prepending `https://` if no scheme is present, add the new Quick Link to the Link List, and persist the updated Link List to Local Storage.
5. WHEN the user submits the link form with an invalid or non-HTTP(S) URL, THE Quick Links panel SHALL display an inline error message and SHALL NOT add the link.
6. WHEN the Dashboard loads and saved Quick Links exist in Local Storage, THE Quick Links panel SHALL render all saved Quick Links.

---

### Requirement 10: Quick Links: Open and Remove

**User Story:** As a user, I want to open and remove Quick Links, so that I can keep the launcher up to date.

#### Acceptance Criteria

1. WHEN the user clicks a Quick Link button, THE Dashboard SHALL open the associated URL in a new browser tab with `rel="noopener noreferrer"`.
2. WHEN the user clicks the remove button for a Quick Link, THE Dashboard SHALL remove that Quick Link from the Link List and persist the updated list to Local Storage.

---

### Requirement 11: Data Persistence and Resilience

**User Story:** As a user, I want the app to remember my data between sessions, so that I do not need to re-enter tasks, links, or settings on every visit.

#### Acceptance Criteria

1. THE Dashboard SHALL use only the browser Local Storage API for all data persistence; no server requests are required.
2. IF Local Storage is unavailable or a stored value is corrupted, THEN THE Dashboard SHALL fall back to default values and continue operating without throwing an uncaught error.
3. THE Dashboard SHALL function correctly in modern versions of Chrome, Firefox, Edge, and Safari without requiring any installation or build step.

---

### Requirement 12: Layout and Visual Design

**User Story:** As a user, I want a clean, readable, and responsive interface, so that the Dashboard is easy to use on any screen size.

#### Acceptance Criteria

1. THE Dashboard SHALL use a two-column grid layout on viewports wider than 720 px, with the Greeting Section and Quick Links panel spanning the full width.
2. WHEN the viewport width is 720 px or narrower, THE Dashboard SHALL collapse to a single-column layout.
3. THE Dashboard SHALL load all required assets (HTML, CSS, JavaScript, and web fonts) with no external runtime dependencies beyond Google Fonts.
4. THE Dashboard SHALL contain exactly one CSS file inside the `css/` directory and exactly one JavaScript file inside the `js/` directory.
5. THE Dashboard SHALL use `textContent` or equivalent safe DOM APIs when inserting user-supplied text into the page, so that user input is never parsed as HTML.
