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
    data = []
    countries = set()
    sports = set()
    
    try:
        with open(input_file, mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                clean_row = {}
                for key, value in row.items():
                    clean_row[key] = parse_value(value)
                
                # Extract metadata
                if clean_row.get('Team'):
                    # Handle "Denmark/Sweden" cases if necessary? 
                    # For now, just taking the Team as is to be simple, 
                    # or splitting by '/' could be an option but might introduce noise.
                    # Looking at sample: "Denmark/Sweden" -> just add it.
                    countries.add(clean_row['Team'])
                
                if clean_row.get('Sport'):
                    sports.add(clean_row['Sport'])
                    
                data.append(clean_row)
    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
        sys.exit(1)

    # Format metadata as array of arrays [['Value'], ...]
    country_array = sorted([[c] for c in countries])
    event_array = sorted([[s] for s in sports])

    # Wrap in JavaScript variable
    js_content = f"const olympicData = {json.dumps(data, indent=2)};\n"
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
