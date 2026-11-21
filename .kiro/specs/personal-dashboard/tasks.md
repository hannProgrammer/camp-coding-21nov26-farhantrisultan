# Implementation Plan: Personal Dashboard

## Overview

The existing `index.html`, `css/style.css`, and `js/app.js` files already implement the core features. The work is a targeted set of bug fixes applied to those files, with no new structure needed. Each task maps directly to a specific bug or omission identified in the design document.

## Tasks

- [ ] 1. Fix `<script>` tag placement in `index.html`
  - Move the `<script src="js/app.js">` tag so it is the last element **inside** `<body>`, not after `</body>`
  - _Requirements: 11.3_ (correct browser parsing and DOM readiness)

- [ ] 2. Fix the `el()` DOM builder in `js/app.js`
  - [ ] 2.1 Assign `checked` as a DOM property (`node.checked = value`) instead of calling `setAttribute('checked', ...)`
    - This fixes pre-checked checkboxes for completed tasks on re-render
    - _Requirements: 8.4_
  - [ ]* 2.2 Write unit test for `el()` boolean property assignment
    - Verify that an element built with `{ checked: true }` has `node.checked === true`
    - _Requirements: 8.4_
  - [ ] 2.3 Assign `value` as a DOM property (`node.value = value`) instead of calling `setAttribute('value', ...)`
    - This fixes pre-filled text in the inline edit input
    - _Requirements: 8.1_
  - [ ]* 2.4 Write unit test for `el()` value property assignment
    - Verify that an input built with `{ value: 'hello' }` has `node.value === 'hello'`
    - _Requirements: 8.1_

- [ ] 3. Checkpoint — ensure the `el()` fix works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Fix timer minutes label association in `index.html`
  - Confirm `<input id="timer-minutes">` exists and the wrapping element is a `<label for="timer-minutes">` (or equivalent `aria-label`)
  - _Requirements: 12.1_ (accessible, well-formed HTML)

- [ ] 5. Re-focus task input after adding a task in `js/app.js`
  - Add `taskInput.focus()` immediately after `renderTasks()` in the `taskForm` submit handler
  - _Requirements: 7.2_
  - [ ]* 5.1 Write unit test for task-input focus after submit
    - Verify `document.activeElement` equals `taskInput` after a successful form submission
    - _Requirements: 7.2_

- [ ] 6. Stabilise default Quick Link IDs in `js/app.js`
  - Move `makeId()` calls for `defaultLinks` outside the array literal so each ID is computed once at module load, not on every evaluation
  - _Requirements: 9.3_
  - [ ]* 6.1 Write unit test for stable default link IDs
    - Verify that the three default link IDs do not change between two evaluations of the module
    - _Requirements: 9.3_

- [ ] 7. Add `btn` class to Quick Link remove buttons in `js/app.js`
  - In `renderLinks()`, add `class: 'btn'` to the remove `<button>` element built with `el()`
  - _Requirements: 12.1_ (style consistency across interactive elements)

- [ ] 8. Property-based tests for pure functions
  - [ ]* 8.1 Write property test for `greetingFor(hour)` — Property 2
    - For every integer in [0, 23], verify the correct greeting string is returned
    - **Property 2: Time-of-day greeting is correct for every hour**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
  - [ ]* 8.2 Write property test for `formatTime(totalSeconds)` — Property 6
    - For any non-negative integer, verify the output matches `/^\d{2}:\d{2}$/`
    - **Property 6: `formatTime` always produces valid MM:SS strings**
    - **Validates: Requirements 5.1**
  - [ ]* 8.3 Write property test for `clampMinutes(value)` — Property 9
    - For any numeric input (including NaN, negatives, decimals, >180), verify result is an integer in [1, 180]
    - **Property 9: `clampMinutes` always returns a value in [1, 180]**
    - **Validates: Requirements 6.2, 6.4**
  - [ ]* 8.4 Write property test for `normalizeUrl(raw)` — Property 14
    - For any hostname without a scheme that contains a dot, verify the output begins with `"https://"`
    - **Property 14: `normalizeUrl` prepends `https://` to bare hostnames**
    - **Validates: Requirements 9.4**
  - [ ]* 8.5 Write property test for theme toggle — Property 5
    - For any initial theme value, verify that toggling twice returns the original value
    - **Property 5: Theme toggle is its own inverse**
    - **Validates: Requirements 4.2, 4.3**
  - [ ]* 8.6 Write property test for task add — Property 10
    - For any task list and any non-empty text, verify the list length increases by exactly 1 after add
    - **Property 10: Adding a task grows the list by exactly one**
    - **Validates: Requirements 7.2, 7.3**
  - [ ]* 8.7 Write property test for task delete — Property 13
    - For any task list and any task in it, verify deletion removes exactly that task and shrinks list by 1
    - **Property 13: Deleting a task removes it and shrinks the list by one**
    - **Validates: Requirements 8.5, 10.2**
  - [ ]* 8.8 Write property test for XSS safety — Property 15
    - For any string with HTML metacharacters, verify rendered DOM text node contains literal characters
    - **Property 15: User-supplied text is never inserted as raw HTML**
    - **Validates: Requirements 12.5**

- [ ] 9. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- All bug fixes target the three existing files; no new files or directories are needed
- Property tests validate universal correctness properties; unit tests validate specific examples and edge cases

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "4"] },
    { "id": 1, "tasks": ["2.1", "2.3"] },
    { "id": 2, "tasks": ["2.2", "2.4", "5", "6", "7"] },
    { "id": 3, "tasks": ["5.1", "6.1", "8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7", "8.8"] }
  ]
}
```
