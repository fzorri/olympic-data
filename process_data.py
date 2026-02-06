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

def process_data(input_file, output_file):
    athletes = {}
    countries_set = set()
    sports_set = set()
    ages_set = set()
    years_set = set()
    
    try:
        with open(input_file, mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                a_id = row['ID']
                sport = row['Sport']
                # Use (ID, Sport) as key as requested by user
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
                        'Age': parse_value(row['Age']),
                        'Year': parse_value(row['Year']),
                        'Games': row['Games'],
                        'Season': row['Season'],
                        'City': row['City'],
                        'Medals': [],
                        'Events': set()
                    }
                
                medal = row['Medal']
                event = row['Event']
                athletes[key]['Events'].add(event)
                
                if medal != 'NA':
                    athletes[key]['Medals'].append([event, medal.lower()])
                    if medal == 'Gold':
                        athletes[key]['Gold'] += 1
                    elif medal == 'Silver':
                        athletes[key]['Silver'] += 1
                    elif medal == 'Bronze':
                        athletes[key]['Bronze'] += 1
                
                countries_set.add(row['Team'])
                sports_set.add(sport)
                
                age = parse_value(row['Age'])
                if age is not None:
                    ages_set.add(age)
                
                year = parse_value(row['Year'])
                if year is not None:
                    years_set.add(year)

    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
        sys.exit(1)
    except KeyError as e:
        print(f"Error: Missing expected column in CSV: {e}")
        sys.exit(1)

    # Sort metadata
    sorted_countries = sorted(list(countries_set))
    sorted_sports = sorted(list(sports_set))
    sorted_ages = sorted(list(ages_set))
    sorted_years = sorted(list(years_set))
    
    country_map = {c: i for i, c in enumerate(sorted_countries)}
    sport_map = {s: i for i, s in enumerate(sorted_sports)}

    # Convert metadata to simple flat arrays
    country_array = sorted_countries
    event_array = sorted_sports
    age_array = sorted_ages
    year_array = sorted_years

    # Convert athletes to list format
    # [Height, Weight, Slug, [NameParts], Gold, Silver, Bronze, CountryIdx, SportIdx, NOC, Gender, [[Event, Medal], ...], Age, Year, Games, Season, City, [Events]]
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
            a['Medals'],
            a['Age'],
            a['Year'],
            a['Games'],
            a['Season'],
            a['City'],
            sorted(list(a['Events']))
        ])

    # Generate Output
    js_content = f"var countryArray = {json.dumps(country_array, indent=2)};\n"
    js_content += f"var eventArray = {json.dumps(event_array, indent=2)};\n"
    js_content += f"var ageArray = {json.dumps(age_array)};\n"
    js_content += f"var yearArray = {json.dumps(year_array)};\n\n"
    
    js_content += "// Schema: [Height, Weight, Slug, [NameParts], Gold, Silver, Bronze, CountryIdx, SportIdx, NOC, Gender, [[Event, Medal], ...], Age, Year, Games, Season, City, [Events]]\n"
    js_content += f"var olympianArray = {format_as_array_of_arrays(olympian_array)};\n"

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
