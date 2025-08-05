import json
import sys

# Check if the file path argument is provided
if len(sys.argv) != 3:
    print(f"Usage: {sys.argv[0]} <path_to_env_file> <output_file_path>")
    sys.exit(1)

env_file_path = sys.argv[1]
output_file_path = sys.argv[2]
env_data = []

try:
    # Attempt to read and parse the .env file
    with open(env_file_path, 'r') as file:
        for line in file:
            # Ignore empty or comment lines
            if line and not line.startswith('#'):
                try:
                    key, value = [part.strip() for part in line.split('=', 1)]
                    env_data.append({"name": key, "value": value})
                except ValueError:
                    print(f"Warning: Skipping malformed line: {line}")
except FileNotFoundError:
    print(f"Error: The file '{env_file_path}' was not found.")
    sys.exit(2)
except PermissionError:
    print(f"Error: Permission denied when trying to read '{env_file_path}'.")
    sys.exit(3)
except Exception as e:
    print(f"An unexpected error occurred: {str(e)}")
    sys.exit(4)

# Serialize to JSON
json_output = json.dumps(env_data, indent=2)

try:
    with open(output_file_path, "w") as json_file:
        json_file.write(json_output)
except IOError as e:
    print(f"Error: Failed to write to file. {e}")
    sys.exit(5)

print(json_output)

