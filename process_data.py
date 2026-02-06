import argparse
import csv
import json
import sys

def parse_value(value):
    if value == 'NA':
        return None
    try:
        if '.' in value:
            return float(value)
        return int(value)
    except ValueError:
        return value

def process_data(input_file, output_file):
    data_rows = []
    keys = []
    countries = set()
    sports = set()
    
    try:
        with open(input_file, mode='r', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            try:
                header = next(reader)
                keys = header # Store keys from header
            except StopIteration:
                print("Error: CSV file is empty")
                sys.exit(1)

            # Map for accessing columns by name for metadata extraction
            col_map = {name: i for i, name in enumerate(header)}
            
            for row in reader:
                clean_row = []
                for val in row:
                    clean_row.append(parse_value(val))
                
                data_rows.append(clean_row)

                # Extract metadata
                if 'Team' in col_map:
                    team_val = clean_row[col_map['Team']]
                    if team_val:
                        countries.add(team_val)
                
                if 'Sport' in col_map:
                    sport_val = clean_row[col_map['Sport']]
                    if sport_val:
                        sports.add(sport_val)

    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
        sys.exit(1)

    # Format metadata as array of arrays [['Value'], ...]
    country_array = sorted([[c] for c in countries])
    event_array = sorted([[s] for s in sports])

    # Generate Compact JSON for data rows (One row per line)
    # json.dumps with indent puts every item on a new line. 
    # We want [ [row1], [row2] ].
    
    data_js_str = "[\n"
    for i, row in enumerate(data_rows):
        # Dump the row as a compact list
        row_str = json.dumps(row)
        data_js_str += "  " + row_str
        if i < len(data_rows) - 1:
            data_js_str += ","
        data_js_str += "\n"
    data_js_str += "]"

    # Wrap in JavaScript variable
    js_content = f"const olympicDataKeys = {json.dumps(keys, indent=2)};\n"
    js_content += f"const olympicData = {data_js_str};\n"
    js_content += f"const countryArray = {json.dumps(country_array, indent=2)};\n"
    js_content += f"const eventArray = {json.dumps(event_array, indent=2)};\n"

    try:
        with open(output_file, 'w', encoding='utf-8') as jsfile:
            jsfile.write(js_content)
    except IOError as e:
        print(f"Error writing to output file: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Convert Olympic CSV data to JavaScript file.')
    parser.add_argument('input', help='Path to input CSV file')
    parser.add_argument('output', help='Path to output JS file')
    
    args = parser.parse_args()
    
    process_data(args.input, args.output)