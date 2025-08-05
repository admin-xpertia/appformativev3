import sys
import os
import re
import fileinput

if len(sys.argv) != 3:
    print(f"Usage: {sys.argv[0]} <target_file> <envfile>")
    sys.exit(1)

target_file = sys.argv[1]
envfile = sys.argv[2]

# Check if the environment file exists
if not os.path.isfile(envfile):
    print(f"Error: Environment file '{envfile}' not found.")
    sys.exit(2)

# Check if the template file exists
if not os.path.isfile(target_file):
    print(f"Error: Target file '{target_file}' not found.")
    sys.exit(3)

# Process each line in the environment file
with open(envfile, 'r') as file:
    for line in file:
        # Ignore empty or comment lines
        if line and not line.startswith('#'):
            try:
                key, value = [part.strip() for part in line.split('=', 1)]

                # Escape characters that might interfere with regex operations
                escaped_value = re.sub(r'([&/|])', r'\\\1', value)
                
                # Perform the replacement in the target file
                with fileinput.FileInput(target_file, inplace=True) as f:
                    for line in f:
                        new_line = re.sub(key, escaped_value, line)
                        sys.stdout.write(new_line)
            except ValueError:
                print(f"Warning: Skipping malformed line: {line}")

print("Replacement complete. Target updated in place.")
