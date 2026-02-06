# Plan: Code Modularization & Script Refactoring

## Phase 1: Structure & Extraction
- [x] Task: Create `js/` directory and initialize `config.js` with shared constants.
- [x] Task: Extract graph-related logic (SVG, Grid, BMI, Zoom/Pan) into `js/graph.js`.
- [x] Task: Extract filtering logic into `js/filters.js`.
- [x] Task: Extract UI/Dashboard/Detail logic into `js/ui.js`.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Structure & Extraction' (Protocol in workflow.md) [checkpoint: b6708d4]

## Phase 2: Integration & Cleanup
- [ ] Task: Create `js/main.js` as the new entry point and wire all modules together.
- [ ] Task: Update `index.html` to load the new scripts in the correct order.
- [ ] Task: Verify overall application functionality and remove the old `script.js`.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Integration & Cleanup' (Protocol in workflow.md) [checkpoint: ]
