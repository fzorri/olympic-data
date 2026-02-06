# Data Workflow

This document outlines the process for updating the data used by the Olympic Data application.

## Prerequisites
- Python 3.x installed and available in your system path.

## Data Pipeline
The application does not read CSV files directly due to browser security restrictions on the `file://` protocol. Instead, we convert the CSV data into a JavaScript file (`data-generated.js`) that defines a global variable `olympicData`.

## Commands

### 1. Generate Development Data (Sample)
Use this command during development to work with the small sample dataset. This ensures fast load times and quick iteration.

```bash
python process_data.py athlete_events_sample.csv data-generated.js
```

### 2. Generate Production Data (Full)
Use this command to generate the full dataset for the final application.
**Note:** Ensure you have the full `athlete_events.csv` file in the project root.

```bash
python process_data.py athlete_events.csv data-generated.js
```

### 3. Verify Data
After generating `data-generated.js`, open `index.html` in your browser. The application should load the new data automatically.

## File Structure
- `process_data.py`: The ETL script that performs the conversion.
- `athlete_events_sample.csv`: A small subset of data for testing/dev.
- `athlete_events.csv`: The full dataset (not committed to git).
- `data-generated.js`: The output file consumed by the HTML/JS app.
