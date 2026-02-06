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
        
        # Extract the JSON part
        try:
            json_str = content.split('var olympianArray =')[1].split(';')[0].strip()
            data = json.loads(json_str)
            
            country_str = content.split('var countryArray =')[1].split(';')[0].strip()
            countries = json.loads(country_str)
            
            event_str = content.split('var eventArray =')[1].split(';')[0].strip()
            events = json.loads(event_str)
        except (IndexError, json.JSONDecodeError):
            self.fail("Could not parse JSON from generated JS file")
        
        # Verify data integrity
        self.assertEqual(len(data), 3)
        
        # [Height, Weight, Slug, [NameParts], Gold, Silver, Bronze, CountryIdx, SportIdx, NOC, Gender, [[Event, Medal], ...]]
        a = data[0]
        self.assertEqual(a[0], 180) # Height
        self.assertEqual(a[1], 80)  # Weight
        self.assertEqual(a[3], ["A", "Dijiang"]) # Name parts
        self.assertEqual(a[9], "CHN") # NOC
        self.assertEqual(a[10], "M") # Gender
        
        # Check metadata
        self.assertTrue(any(['China'] == c for c in countries))
        self.assertTrue(any(['Denmark'] == c for c in countries))
        
        # Verify NA handling
        self.assertIsNone(data[2][0]) # Height
        self.assertIsNone(data[2][1]) # Weight

if __name__ == '__main__':
    unittest.main()
