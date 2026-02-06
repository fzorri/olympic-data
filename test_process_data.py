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
            f.write('"1","A Dijiang","M",28,180,80,"China","CHN","1996 Summer",1996,"Summer","Atlanta","Basketball","Basketball Men\'s Basketball",Gold\n')
            f.write('"2","A Lamusi","M",23,170,60,"China","CHN","2012 Summer",2012,"Summer","London","Judo","Judo Men\'s Extra-Lightweight",NA\n')

    def tearDown(self):
        try:
            if os.path.exists(self.csv_path):
                os.remove(self.csv_path)
            if os.path.exists(self.js_path):
                os.remove(self.js_path)
            os.rmdir(self.test_dir)
        except OSError:
            pass

    def test_script_execution(self):
        result = subprocess.run(
            ['python', 'process_data.py', self.csv_path, self.js_path],
            capture_output=True,
            text=True
        )
        self.assertEqual(result.returncode, 0, f"Script failed with stderr: {result.stderr}")
        self.assertTrue(os.path.exists(self.js_path))

    def test_output_content(self):
        subprocess.run(['python', 'process_data.py', self.csv_path, self.js_path])
        
        with open(self.js_path, 'r') as f:
            content = f.read()
            
        json_str = content.split('var olympianArray =')[1].split(';')[0].strip()
        data = json.loads(json_str)
        
        self.assertEqual(len(data), 2)
        
        a1 = data[0] # A Dijiang
        # Check Events (Index 17)
        # Should be list of objects: {Event, Age, Year, Medal}
        events = a1[17]
        self.assertEqual(len(events), 2)
        
        # Check first event (sorted by Event name usually, but logic might vary. Let's check existence)
        # "Basketball Men's Basketball" at 24 (1992) - NA
        # "Basketball Men's Basketball" at 28 (1996) - Gold
        
        e1 = next(e for e in events if e['Year'] == 1992)
        self.assertEqual(e1['Age'], 24)
        self.assertEqual(e1['Medal'], 'NA')
        
        e2 = next(e for e in events if e['Year'] == 1996)
        self.assertEqual(e2['Age'], 28)
        self.assertEqual(e2['Medal'], 'Gold')

if __name__ == '__main__':
    unittest.main()
