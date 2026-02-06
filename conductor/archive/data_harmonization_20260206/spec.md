# Spec: Data Harmonization and CSV Integration

## Goal
Resolve the mismatch between the existing static `data.js` and the `athlete_events_sample.csv` file. Establish a clean, reproducible data pipeline that transforms CSV data into a web-optimized JavaScript file, allowing the application to run without a web server (file:// protocol).

## Current State Analysis
- **CSV Schema:** Contains detailed athlete data.
- **data.js Schema:** Hardcoded and incompatible with the CSV.
- **Constraint:** Modern browsers block raw CSV fetching from the local file system. Pre-processing into a `.js` script is required for "serverless" local operation.

## Requirements
1. **Unified Data Model:** Define a JSON-like structure within a JavaScript file that represents athlete records.
2. **Reproducible ETL Script:** Create a Python script (`process_data.py`) that:
    - Accepts command-line arguments for input (CSV) and output (JS) file paths.
    - Cleanses data (handles `NA` values).
    - Wraps the data in a global constant (e.g., `const olympicData = [...]`).
    - Extracts unique metadata (Countries, Sports) as metadata variables within the same file.
3. **Workflow Documentation:** Document how to generate the JS file for sample vs. full datasets.
4. **UI Integration:** Update `script.js` to consume the `olympicData` variable directly.

## Success Criteria
- `process_data.py` produces a valid `.js` file that can be loaded via `<script>` tag.
- The UI works correctly by simply opening `index.html` in a browser.
- A clear guide exists for updating the data.
