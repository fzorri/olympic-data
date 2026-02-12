# Archive Directory

This directory contains development, build, and source files that are not needed for runtime operation of the Olympic Data application.

## 📁 Contents

### 🛠️ Build Tools
- `convert-topojson.js` - Converts `countries-110m.json` to `world-topology-data.js`
- `create_noc_mapping.py` - Generates NOC↔ISO mapping files from CSV
- `process_data.py` - Processes athlete data from CSV to JavaScript
- `test_process_data.py` - Tests for data processing

### 📊 Source Data Files
- `countries-110m.json` - Source TopoJSON world map data
- `noc_regions.csv` - Source CSV for NOC↔country mappings
- `athlete_events_sample.csv` - Sample athlete data

### 📚 Documentation
- `DATA_WORKFLOW.md` - Data processing workflow
- `GEMINI.md` - AI assistant setup documentation
- `SUMMARY.md` - Project summary notes
- `conductor/` - Project management and planning documents

### 🧪 Testing
- `test/` - Test files and test runner

### 🗑️ Legacy Code
- `script.js` - Legacy monolithic implementation (replaced by modular `js/` directory)
- `world-topology.js` - Unused map wrapper (replaced by `world-topology-data.js`)

## 🔧 How to Use These Files

### To Update Map Data:
1. Update `countries-110m.json` if needed
2. Run: `node convert-topojson.js`
3. Output: `map/world-topology-data.js` (used at runtime)

### To Update NOC Mappings:
1. Update `noc_regions.csv` if needed
2. Run: `python create_noc_mapping.py`
3. Output: `map/iso-to-noc.js` and `map/noc-to-iso.js` (used at runtime)

### To Update Athlete Data:
1. Update source CSV files
2. Run: `python process_data.py`
3. Output: `data-generated.js` (used at runtime)

## 🚀 Runtime Files

The main application only needs files in the root directory:
- `index.html`, `styles.css`, `data.js`, `data-generated.js`
- `js/` directory (all modular JavaScript files)
- `map/` directory (only the 3 generated `.js` files)

All other files are for development/build purposes only.