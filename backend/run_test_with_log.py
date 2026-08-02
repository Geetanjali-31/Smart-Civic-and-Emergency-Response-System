import sys
import subprocess

# Run the test submission and save output to test_output.log
with open('test_output.log', 'w') as f:
    result = subprocess.run([sys.executable, 'test_submission.py'], stdout=f, stderr=subprocess.STDOUT)
