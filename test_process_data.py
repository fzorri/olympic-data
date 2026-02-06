import unittest
import os
import json
import tempfile
import subprocess

class TestProcessData(unittest.TestCase):
    def setUp(self):
        # Create a temporary CSV file for testing
        self.test_dir = tempfile.mkdtemp()
        self.csv_path = os.path.join(self.test_dir, 'test_data.csv')
        self.js_path = os.path.join(self.test_dir, 'test_data.js')
        
        with open(self.csv_path, 'w') as f:
            f.write('"ID","Name","Sex","Age","Height","Weight","Team","NOC","Games","Year","Season","City","Sport","Event","Medal"\n')
            f.write('"1","A Dijiang","M",24,180,80,"China","CHN","1992 Summer",1992,"Summer","Barcelona","Basketball","Basketball Men\'s Basketball",NA\n')
            f.write('"1","A Dijiang","M",24,180,80,"China","CHN","1992 Summer",1992,"Summer","Barcelona","Basketball","Another Event",Gold\n')
            f.write('"2","A Lamusi","M",23,170,60,"China","CHN","2012 Summer",2012,"Summer","London","Judo","Judo Men\'s Extra-Lightweight",NA\n')
            f.write('"3","Gunnar Nielsen Aaby","M",24,NA,NA,"Denmark","DEN","1920 Summer",1920,"Summer","Antwerpen","Football","Football Men\'s Football",NA\n')

    def tearDown(self):
        # Clean up temporary files
        try:
            if os.path.exists(self.csv_path):
                os.remove(self.csv_path)
            if os.path.exists(self.js_path):
                os.remove(self.js_path)
            os.rmdir(self.test_dir)
        except OSError:
            pass

    def test_script_execution(self):
        # Run the script via subprocess
        result = subprocess.run(
            ['python', 'process_data.py', self.csv_path, self.js_path],
            capture_output=True,
            text=True
        )
        self.assertEqual(result.returncode, 0, f"Script failed with stderr: {result.stderr}")
        self.assertTrue(os.path.exists(self.js_path), "Output JS file was not created")

    def test_output_content(self):
        # Run the script
        subprocess.run(['python', 'process_data.py', self.csv_path, self.js_path])
        
        # Read the generated JS file
        if not os.path.exists(self.js_path):
            self.fail("Output JS file was not created, cannot test content")
            
        with open(self.js_path, 'r') as f:
            content = f.read()
            
        # Check for global variable declaration
        self.assertIn('var olympianArray =', content)
        self.assertIn('var countryArray =', content)
        self.assertIn('var eventArray =', content)
        self.assertIn('var ageArray =', content)
        self.assertIn('var yearArray =', content)
        
        # Extract the JSON part
        try:
            json_str = content.split('var olympianArray =')[1].split(';')[0].strip()
            data = json.loads(json_str)
            
            country_str = content.split('var countryArray =')[1].split(';')[0].strip()
            countries = json.loads(country_str)
            
            age_str = content.split('var ageArray =')[1].split(';')[0].strip()
            ages = json.loads(age_str)

            year_str = content.split('var yearArray =')[1].split(';')[0].strip()
            years = json.loads(year_str)
        except (IndexError, json.JSONDecodeError):
            self.fail("Could not parse JSON from generated JS file")
        
        # Verify data integrity (3 unique ID-Sport combinations)
        self.assertEqual(len(data), 3)
        
        # Athlete 1: A Dijiang, should have 1 Gold (from 2nd row) and 2 events
        a1 = data[0]
        self.assertEqual(a1[3], ["A", "Dijiang"])
        self.assertEqual(a1[4], 1) # Gold
        self.assertEqual(len(a1[11]), 1) # 1 medal in Medals list
        
        # Check new fields
        # [H, W, Slug, [Name], G, S, B, CIdx, SIdx, NOC, Gender, [[Ev, M], ...], Age, Year, Games, Season, City, [Events]]
        self.assertEqual(a1[12], 24) # Age
        self.assertEqual(a1[13], 1992) # Year
        self.assertEqual(a1[14], "1992 Summer") # Games
        self.assertEqual(a1[15], "Summer") # Season
        self.assertEqual(a1[16], "Barcelona") # City
        self.assertEqual(len(a1[17]), 2) # 2 Unique Events
        self.assertIn("Basketball Men's Basketball", a1[17])
        self.assertIn("Another Event", a1[17])

        # Check metadata
        self.assertTrue(any(['China'] == c for c in countries))
        self.assertIn([23], ages)
        self.assertIn([24], ages)
        self.assertIn([1992], years)
        self.assertIn([2012], years)

if __name__ == '__main__':
    unittest.main()
