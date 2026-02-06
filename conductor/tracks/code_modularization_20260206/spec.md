# Spec: Code Modularization & Script Refactoring

## Goal
Deconstruct the monolithic `script.js` into smaller, focused, and well-organized files. Improve maintainability and readability without introducing build tools or breaking `file://` compatibility.

## Requirements
1. **Directory Structure:** Create a `js/` folder to house the modularized scripts.
2. **Logical Split:** Divide `script.js` into at least the following modules:
    - `config.js`: Shared constants and configuration.
    - `graph.js`: SVG rendering logic, Zoom/Pan, Grid, and BMI zones.
    - `filters.js`: Filter application logic and UI builder.
    - `ui.js`: Dashboard updates, athlete detail panel, and tooltips.
    - `main.js`: Application initialization and global event orchestration.
3. **Compatibility:** Ensure the application continues to run directly from the file system (`file://` protocol) by using sequential global script loading instead of ES modules.
4. **State Management:** Use a clean mechanism (e.g., a shared state object or controlled global variables) to coordinate data between modules.

## Success Criteria
- `script.js` is reduced to a minimal entry point or replaced entirely.
- The application functionality remains identical to the current state.
- Code is better organized and easier to navigate.
- No regression in filtering or visualization performance.
