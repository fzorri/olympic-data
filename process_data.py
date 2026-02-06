import argparse
import csv
import json
import sys
import re

def parse_value(value):
    if value == 'NA' or value == '':
        return None
    try:
        if '.' in value:
            return float(value)
        return int(value)
    except ValueError:
        return value

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '_', text)
    return text.strip('_')

def process_data(input_file, output_file):
    athletes = {}
    countries_set = set()
    sports_set = set()
    
    try:
        with open(input_file, mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                a_id = row['ID']
                if a_id not in athletes:
                    name = row['Name']
                    name_parts = name.split(' ', 1)
                    if len(name_parts) == 1:
                        name_parts.append("")
                    
                    athletes[a_id] = {
                        'Height': parse_value(row['Height']),
                        'Weight': parse_value(row['Weight']),
                        'Slug': slugify(name),
                        'NameParts': name_parts,
                        'Gold': 0,
                        'Silver': 0,
                        'Bronze': 0,
                        'Team': row['Team'],
                        'Sport': row['Sport'],
                        'NOC': row['NOC'],
                        'Sex': row['Sex'],
                        'Medals': []
                    }
                
                medal = row['Medal']
                if medal != 'NA':
                    athletes[a_id]['Medals'].append([row['Event'], medal.lower()])
                    if medal == 'Gold':
                        athletes[a_id]['Gold'] += 1
                    elif medal == 'Silver':
                        athletes[a_id]['Silver'] += 1
                    elif medal == 'Bronze':
                        athletes[a_id]['Bronze'] += 1
                
                countries_set.add(row['Team'])
                sports_set.add(row['Sport'])

    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
        sys.exit(1)
    except KeyError as e:
        print(f"Error: Missing expected column in CSV: {e}")
        sys.exit(1)

    # Sort metadata
    sorted_countries = sorted(list(countries_set))
    sorted_sports = sorted(list(sports_set))
    
    country_map = {c: i for i, c in enumerate(sorted_countries)}
    sport_map = {s: i for i, s in enumerate(sorted_sports)}

    # Convert metadata to array of arrays
    country_array = [[c] for c in sorted_countries]
    event_array = [[s] for s in sorted_sports]

    # Convert athletes to list format
    # [Height, Weight, Slug, [NameParts], Gold, Silver, Bronze, CountryIdx, SportIdx, NOC, Gender, [[Event, Medal], ...]]
    olympian_array = []
    for a in athletes.values():
        olympian_array.append([
            a['Height'],
            a['Weight'],
            a['Slug'],
            a['NameParts'],
            a['Gold'],
            a['Silver'],
            a['Bronze'],
            country_map[a['Team']],
            sport_map[a['Sport']],
            a['NOC'],
            a['Sex'],
            a['Medals']
        ])

    # Generate Output
    js_content = f"var countryArray = {json.dumps(country_array, indent=2)};\n"
    js_content += f"var eventArray = {json.dumps(event_array, indent=2)};\n"
    
    data_js_str = "[\n"
    for i, row in enumerate(olympian_array):
        row_str = json.dumps(row)
        data_js_str += "  " + row_str
        if i < len(olympian_array) - 1:
            data_js_str += ","
        data_js_str += "\n"
    data_js_str += "]"
    
    js_content += f"var olympianArray = {data_js_str};\n"

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
