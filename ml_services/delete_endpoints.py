#!/usr/bin/python3

import boto3, os

client = boto3.client('sagemaker')

# Get endpoint list from Sagemaker
endpoints = client.list_endpoints()['Endpoints']
# Get environment variables
ep_names = [os.environ[end_p] for end_p in os.environ if "_ENDPOINT" in end_p]
print("Endpoints in environment: ", ep_names)
sagemaker_ep = [e['EndpointName'] for e in endpoints]
print("Active endponits: ", sagemaker_ep)
# Iterate over active endpoints to delete those related to demo
for i in sagemaker_ep:
    if i in ep_names:
        print("--- Delete endpoint: ", i)
        client.delete_endpoint(EndpointName=i)