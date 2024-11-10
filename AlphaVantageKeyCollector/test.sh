#!/bin/bash

# Variables
RANDOM_ID=$(openssl rand -hex 3)
INSTANCE_NAME="free-tier-instance-$RANDOM_ID"
ZONE="us-central1-a"
#ZONE="europe-west10-a"
#ZONE="australia-southeast1-b"
#ZONE="africa-south1-a"
PROJECT_ID="your-project-id"
SCRIPT_PATH="./main.py"
KEY_FILE="./platinum-chain-token-service.json"

# Create an instance
gcloud compute instances create $INSTANCE_NAME \
    --zone=$ZONE \
    --machine-type=e2-micro \
    --image-family=debian-11 \
    --image-project=debian-cloud \
    --boot-disk-size=30GB \
    --network-tier=PREMIUM

# Wait until the instance is in RUNNING state
echo "Waiting for the instance to be in RUNNING state..."
while [[ $(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format='get(status)') != "RUNNING" ]]; do
    echo "Instance not ready, checking again in 5 seconds..."
    sleep 5
done

# Get the instance's IP address
IP_ADDRESS=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

# Wait for SSH port (22) to be available on the instance
echo "Waiting for SSH to be available on the instance..."
while ! nc -zv $IP_ADDRESS 22 2>/dev/null; do
    echo "SSH port not available, checking again in 5 seconds..."
    sleep 5
done

echo "Instance is ready and SSH is available, starting installation and executing the script..."

# Transfer the script and the key file
gcloud compute scp $SCRIPT_PATH $INSTANCE_NAME:~ --zone=$ZONE
gcloud compute scp $KEY_FILE $INSTANCE_NAME:~ --zone=$ZONE

# Connect and execute installation commands and the script, including Tor installation, then delete the instance after execution
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command "
    # Update package list and install dependencies
    sudo apt-get update &&
    sudo apt-get install -y python3-pip --no-install-recommends &&

    # Install Tor and configure it
    sudo apt-get install -y tor &&

    # Install Python dependencies
    pip3 install google-cloud-firestore pysocks &&

    # Execute the main Python script
    python3 ~/$(basename $SCRIPT_PATH)
"

# Delete the instance after the script execution
echo "Script finished. Deleting the instance..."
gcloud compute instances delete $INSTANCE_NAME --zone=$ZONE --quiet

echo "Instance deleted after execution."
