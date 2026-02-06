# Plan: Data Harmonization and CSV Integration

## Phase 1: ETL Scripting & Variable Generation [checkpoint: 1648691]
- [x] Task: Create `process_data.py` to transform CSV into a `.js` file containing a global `olympicData` variable. [commit: befc124]
- [x] Task: Implement CSV parsing, cleaning, and metadata extraction (unique Sports/Countries). [commit: 3ee4766]
- [x] Task: Create `DATA_WORKFLOW.md` documenting the commands to generate the `.js` data file. [commit: 7c1719e]
- [x] Task: Refactor `process_data.py` to output compact array-of-arrays format for size optimization. [commit: 1d4cf8a]
- [x] Task: Conductor - User Manual Verification 'Phase 1: ETL Scripting & Variable Generation' (Protocol in workflow.md) [checkpoint: 1648691]

## Phase 2: UI Integration
- [x] Task: Update `index.html` to include the generated `.js` file via `<script>` tag. [commit: 876775c]
- [ ] Task: Modify `script.js` to initialize the app using the `olympicData` and metadata variables.
- [ ] Task: Verify the UI works with the processed sample data without a web server.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: UI Integration' (Protocol in workflow.md) [checkpoint: ]
