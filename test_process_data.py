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
            # Same athlete (ID 1) in different years/ages
            f.write('"1","A Dijiang","M",24,180,80,"China","CHN","1992 Summer",1992,"Summer","Barcelona","Basketball","Basketball Men\'s Basketball",NA\n')
            f.write('"1","A Dijiang","M",28,180,80,"China","CHN","1996 Summer",1996,"Summer","Atlanta","Basketball","Basketball Men\'s Basketball",NA\n')
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
        
        # Verify aggregation
        self.assertEqual(len(data), 2) # A Dijiang and A Lamusi
        
        a1 = data[0] # A Dijiang
        # Age should be an array [24, 28] (sorted)
        self.assertEqual(a1[12], [24, 28])
        # Year should be an array [1992, 1996]
        self.assertEqual(a1[13], [1992, 1996])
        
        a2 = data[1] # A Lamusi
        self.assertEqual(a2[12], [23])
        self.assertEqual(a2[13], [2012])

if __name__ == '__main__':
    unittest.main()