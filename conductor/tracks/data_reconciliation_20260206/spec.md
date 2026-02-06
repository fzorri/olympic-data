# Spec: Enhanced Analytics & Data Reconciliation

## Goal
Extend the application to support deeper data analysis by integrating all relevant fields from the CSV (`Age`, `Year`, `Games`, `Season`, `City`, `Event`, `Medal`). Implement advanced filtering for Age and Year, and reconcile the athlete data structure to handle multiple events and simplified medal counting.

## Requirements

### 1. Data Schema Expansion
- Update the ETL process (`process_data.py`) to include:
    - `Age` (Numeric)
    - `Year` (Numeric)
    - `Games` (String)
    - `Season` (String)
    - `City` (String)
    - `Event` (String)
- **Aggregation:** Group data by Athlete ID. Store unique events in an array for each athlete.
- **Medal Counting:** Simplify counting to separate Gold, Silver, and Bronze totals per athlete across all their events.

### 2. Advanced Filtering UI
- **Age Filtering:**
    - Dropdown with unique age values found in the dataset.
    - Comparison operators: `>`, `>=`, `<`, `<=`, `=`.
- **Year Filtering:**
    - Dropdown with unique Olympic years.
    - Comparison operators: `>`, `>=`, `<`, `<=`, `=`.

### 3. Informational Display
- Update the athlete detail panel to show `Games`, `Season`, `City`, and the full list of `Events`.

## Success Criteria
- The ETL script generates a dataset containing all requested fields.
- Users can filter athletes by specific ages or years, or ranges of them.
- Athlete details correctly display multi-event history and medal counts.
- Performance remains high even with additional fields.
