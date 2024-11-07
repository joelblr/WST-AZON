import json
import os
import subprocess
import sys

def check_for_credentials() :

    credentials_file = 'credentials.json'
    # Check if the credentials file exists and contains the necessary data
    if os.path.exists(credentials_file):
        with open(credentials_file, 'r') as file:
            credentials = json.load(file)
            if 'email_phone' in credentials and 'password' in credentials:
                return True
    return False


def main() :
    if not check_for_credentials() :
        print("No credentials found, launching login_gui.py...")
        # If no credentials, run login_gui.py
        result = subprocess.run(
            [sys.executable, 'login_gui.py'],
            capture_output=True,  # Capture both stdout and stderr
            text=True  # Return output as text (not bytes)
        )

    print("Credentials found, launching app...")
    # If credentials exist, run app.py (main app)
    result = subprocess.run(
        [sys.executable, 'app.py'],
        capture_output=True,  # Capture both stdout and stderr
        text=True  # Return output as text (not bytes)
    )



if __name__ == "__main__":
    main()
