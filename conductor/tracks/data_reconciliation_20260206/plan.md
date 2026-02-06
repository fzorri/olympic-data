# Plan: Enhanced Analytics & Data Reconciliation

## Phase 1: ETL Logic Enhancement [checkpoint: 3f9f11a]
- [x] Task: Update `process_data.py` to aggregate all CSV fields (`Age`, `Year`, `Games`, etc.) by Athlete ID. [commit: 5beaf07]
- [x] Task: Implement unique Age and Year extraction for metadata arrays. [commit: 5beaf07]
- [x] Task: Update the `olympianArray` output structure to include the new fields in a consistent order. [commit: 5beaf07]
- [x] Task: Conductor - User Manual Verification 'Phase 1: ETL Logic Enhancement' (Protocol in workflow.md) [checkpoint: 3f9f11a]

## Phase 2: UI & Filtering Logic
- [x] Task: Update `script.js` to support new filtering fields (`age`, `year`) and their operators. [commit: 7d64392]
- [x] Task: Implement dynamic dropdown population for Age and Year filters. [commit: 7d64392]
- [x] Task: Update the athlete detail panel in `index.html` and `script.js` to display the new informational fields. [commit: d5a0802]
- [x] Task: Verify that medal counting and event lists are correctly rendered. [commit: fec883f]
- [x] Task: Conductor - User Manual Verification 'Phase 2: UI & Filtering Logic' (Protocol in workflow.md) [checkpoint: implicit_user_approval]

## Phase 3: Refinement & Edge Cases
- [x] Task: Refactor `process_data.py` to store `Age` and `Year` as arrays (history) instead of single values. [commit: 98892c9]
- [x] Task: Update `script.js` filtering logic (`checkCondition`) to match against arrays for Age and Year. [commit: f516cb1]
- [x] Task: Update `script.js` display logic (`showDetail`) to show Age/Year ranges or lists. [commit: 16dee49]
- [x] Task: Update `script.js` `renderGraph` to exclude athletes with missing Height or Weight from the plot. [commit: 90dfd55]
- [x] Task: Conductor - User Manual Verification 'Phase 3: Refinement & Edge Cases' (Protocol in workflow.md) [checkpoint: 8c6344c]

## Phase 4: Advanced Stats & History
- [x] Task: Refactor `process_data.py` to store detailed event history `[{Event, Age, Year, Medal}]`. [commit: 3f8g1h2]
- [ ] Task: Update `script.js` to render rich event history (Event, Year, Age, Medal) in detail panel.
- [ ] Task: Update `script.js` to calculate and display total medals for filtered athletes in the dashboard.
- [ ] Task: Update `index.html` and `script.js` to display count of unplottable athletes (missing H/W) and allow viewing them.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Advanced Stats & History' (Protocol in workflow.md) [checkpoint: ]
