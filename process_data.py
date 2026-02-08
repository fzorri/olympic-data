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

def format_as_array_of_arrays(data_list):
    """Formats a list of lists as a string with one inner list per line."""
    output = "[\n"
    for i, row in enumerate(data_list):
        output += "  " + json.dumps(row)
        if i < len(data_list) - 1:
            output += ","
        output += "\n"
    output += "]"
    return output

def load_noc_data(noc_file_path):
    noc_map = {}
    try:
        with open(noc_file_path, mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                noc_map[row['NOC']] = row['region']
    except FileNotFoundError:
        print(f"Error: NOC file '{noc_file_path}' not found.")
        sys.exit(1)
    return noc_map

def process_data(input_file, noc_file, output_file):
    athletes = {}
    sports_set = set()
    ages_set = set()
    years_set = set()

    noc_data = load_noc_data(noc_file)
    
    try:
        with open(input_file, mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                a_id = row['ID']
                sport = row['Sport']
                key = (a_id, sport)
                
                if key not in athletes:
                    name = row['Name']
                    name_parts = name.split(' ', 1)
                    if len(name_parts) == 1:
                        name_parts.append("")
                    
                    athletes[key] = {
                        'Height': parse_value(row['Height']),
                        'Weight': parse_value(row['Weight']),
                        'Slug': slugify(name),
                        'NameParts': name_parts,
                        'Gold': 0,
                        'Silver': 0,
                        'Bronze': 0,
                        'Team': row['Team'],
                        'Sport': sport,
                        'NOC': row['NOC'],
                        'Sex': row['Sex'],
                        'Ages': set(),
                        'Years': set(),
                        'Games': row['Games'],
                        'Season': row['Season'],
                        'City': row['City'],
                        'Medals': [],
                        'Events': [] # Changed from set to list of objects
                    }
                
                medal = row['Medal']
                event = row['Event']
                age = parse_value(row['Age'])
                year = parse_value(row['Year'])
                
                # Store rich event data
                event_data = {
                    'Event': event,
                    'Age': age,
                    'Year': year,
                    'Medal': medal
                }
                athletes[key]['Events'].append(event_data)
                
                if medal != 'NA':
                    athletes[key]['Medals'].append([event, medal.lower()])
                    if medal == 'Gold':
                        athletes[key]['Gold'] += 1
                    elif medal == 'Silver':
                        athletes[key]['Silver'] += 1
                    elif medal == 'Bronze':
                        athletes[key]['Bronze'] += 1
                
                sports_set.add(sport)
                
                if age is not None:
                    athletes[key]['Ages'].add(age)
                    ages_set.add(age)
                
                if year is not None:
                    athletes[key]['Years'].add(year)
                    years_set.add(year)

    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
        sys.exit(1)
    except KeyError as e:
        print(f"Error: Missing expected column in CSV: {e}")
        sys.exit(1)

    # Sort metadata
    sorted_countries = sorted(list(set(noc_data.values())))
    sorted_sports = sorted(list(sports_set))
    sorted_ages = sorted(list(ages_set))
    sorted_years = sorted(list(years_set))
    
    country_map = {c: i for i, c in enumerate(sorted_countries)}
    sport_map = {s: i for i, s in enumerate(sorted_sports)}

    # Convert metadata to flat arrays
    country_array = sorted_countries
    event_array = sorted_sports
    age_array = sorted_ages
    year_array = sorted_years

    # Convert athletes to list format
    # [Height, Weight, Slug, [NameParts], Gold, Silver, Bronze, CountryIdx, SportIdx, NOC, Gender, [[Event, Medal], ...], [Ages], [Years], Games, Season, City, [{Event, Age, Year, Medal}, ...]]
    olympian_array = []
    for a in athletes.values():
        # Sort events by Year then Event
        sorted_events = sorted(a['Events'], key=lambda x: (x['Year'] if x['Year'] else 0, x['Event']))
        
        country_name = noc_data.get(a['NOC'], a['Team']) # Fallback to Team if NOC not found
        country_idx = country_map.get(country_name)

        olympian_array.append([
            a['Height'],
            a['Weight'],
            a['Slug'],
            a['NameParts'],
            a['Gold'],
            a['Silver'],
            a['Bronze'],
            country_idx,
            sport_map[a['Sport']],
            a['NOC'],
            a['Sex'],
            a['Medals'],
            sorted(list(a['Ages'])),
            sorted(list(a['Years'])),
            a['Games'],
            a['Season'],
            a['City'],
            sorted_events
        ])

    # Generate Output
    js_content = f"var countryArray = {json.dumps(country_array, indent=2)};\n"
    js_content += f"var eventArray = {json.dumps(event_array, indent=2)};\n"
    js_content += f"var ageArray = {json.dumps(age_array)};\n"
    js_content += f"var yearArray = {json.dumps(year_array)};\n\n"
    
    js_content += "// Schema: [Height, Weight, Slug, [NameParts], Gold, Silver, Bronze, CountryIdx, SportIdx, NOC, Gender, [[Event, Medal], ...], [Ages], [Years], Games, Season, City, [{Event, Age, Year, Medal}, ...]]\n"
    js_content += f"var olympianArray = {format_as_array_of_arrays(olympian_array)};\n"

    try:
        with open(output_file, 'w', encoding='utf-8') as jsfile:
            jsfile.write(js_content)
    except IOError as e:
        print(f"Error writing to output file: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Convert Olympic CSV data to JavaScript file.')
    parser.add_argument('--input', help='Path to input CSV file', required=True)
    parser.add_argument('--noc', help='Path to NOC regions CSV file', required=True)
    parser.add_argument('--output', help='Path to output JS file', required=True)
    
    args = parser.parse_args()
    process_data(args.input, args.noc, args.output)

