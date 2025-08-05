import sys
import os

# Replaces the ocurrences of "ENVIRONMENT_VARIABLES" strings
# in the target file with the contents of the input file

if len(sys.argv) != 3:
    print(f"Usage: {sys.argv[0]} <target_file> <input_file>")
    sys.exit(1)

target_file = sys.argv[1]
input_file = sys.argv[2]

# Check if the json file exists and is readable
if not os.path.isfile(input_file) or not os.access(input_file, os.R_OK):
    print("Error: Placeholder file does not exist or is not readable.")
    sys.exit(2)

# Check if the target file exists and is writable
if not os.path.isfile(target_file) or not os.access(target_file, os.W_OK):
    print("Error: Target file does not exist or is not writable.")
    sys.exit(3)

# Read the contents of the json file and escape special characters
try:
    with open(input_file, 'r') as file:
        contents = file.read()
    contents = contents.replace('\n', '') # Remove newlines
    contents = contents.replace('/', '\\/').replace('&', '\\&')  # Escape / and &

    # Read target file contents
    with open(target_file, 'r') as file:
        target_content = file.read()

    # Replace the placeholder text in the target file with the contents of the content file
    updated_content = target_content.replace("ENVIRONMENT_VARIABLES", contents)

    # Write the updated content back to the target file
    with open(target_file, 'w') as file:
        file.write(updated_content)

    print("Placeholder text replaced successfully.")

except IOError as e:
    print(f"Error: Failed to read or write files - {e}")
    sys.exit(4)
