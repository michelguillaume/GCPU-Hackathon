import requests
import time
import random
import string
import sys
import re
import subprocess
from google.cloud import firestore
from datetime import datetime

# Initialize Firestore client
db = firestore.Client.from_service_account_json("./platinum-chain-token-service.json")

url = "https://www.alphavantage.co/create_post/"

def get_random_email():
    # Generate a random email address for the request
    name_length = random.randint(12, 16)
    name = ''.join(random.choices(string.ascii_lowercase + string.digits, k=name_length))

    domain_length = random.randint(5, 10)
    domain_name = ''.join(random.choices(string.ascii_lowercase, k=domain_length))
    domain = f"{domain_name}.com"

    return f"{name}@{domain}"

def send_request():
    # Define request headers and proxies
    headers = {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "priority": "u=1, i",
        "sec-ch-ua": "\"Not?A_Brand\";v=\"99\", \"Chromium\";v=\"130\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-csrftoken": "2lrlNmSoGVF3QGvPk8odS7hJkROBiSkG",
        "x-requested-with": "XMLHttpRequest",
        "cookie": 'cc_cookie={"categories":[],"level":[],"revision":0,"data":null,"rfc_cookie":false,"consent_date":"2024-10-22T21:30:03.845Z","consent_uuid":"364703a0-eb0d-4f48-b7e7-88fad41464da","last_consent_update":"2024-10-22T21:30:03.845Z"}; csrftoken=2lrlNmSoGVF3QGvPk8odS7hJkROBiSkG',
        "Referer": "https://www.alphavantage.co/support/",
        "Referrer-Policy": "same-origin"
    }

    email = get_random_email()
    data = {
        "first_text": "deprecated",
        "last_text": "deprecated",
        "occupation_text": "Investor",
        "organization_text": "Epitech",
        "email_text": email
    }

    proxies = {
        "http": "socks5://localhost:9050",
        "https": "socks5://localhost:9050",
    }

    # Send the POST request
    response = requests.post(url, headers=headers, data=data, proxies=proxies, timeout=5)

    # Process the response and extract the API key if available
    if response.status_code == 200:
        response_data = response.json()
        if 'text' in response_data:
            message = response_data['text']
            match = re.search(r"\b([A-Z0-9]{16})\b", message)
            if match:
                token = match.group(1)
                print("API Key:", token, flush=True)
                return token
            else:
                raise Exception(f"Error: {message}")
        else:
            raise Exception(f"Unexpected error in response: {response_data}")
    else:
        raise Exception(f"Error: {response.status_code} - {response.text}")

def add_token_to_firestore(token, status="available"):
    # Add the token to Firestore with its status and last modified time
    tokens_ref = db.collection("tokens")

    token_data = {
        "status": status,
        "last_modified": datetime.now()
    }

    tokens_ref.document(token).set(token_data)
    print(f"Token {token} added to Firestore successfully.")

def restart_tor():
    subprocess.run(f"echo MeGaNe291219! | sudo -S pkill tor", shell=True)
    time.sleep(2)

    # Start Tor again
    subprocess.Popen(["tor"])
    time.sleep(10)

def generate_and_store_api_keys():
    while True:
        try:
            # Attempt to send request and process response
            token = send_request()
            if token:
                add_token_to_firestore(token)
          #  time.sleep(1)
        except Exception as e:
            # On error, print the error and restart Tor
            print(f"Error encountered: {e}", flush=True)
            print("Restarting Tor and retrying...")
            restart_tor()  # Restart Tor if an error occurs

def main():
    restart_tor()  # Ensure Tor is running at the start
    generate_and_store_api_keys()

if __name__ == "__main__":
    main()
