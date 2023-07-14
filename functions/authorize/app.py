import os
import json
import boto3
from jose import jwt

class MiroJwtToken:
    def __init__(self, payload):
        self.payload = payload


def handler(event, context):
    region = os.environ['AWS_REGION']
    ssm_param_name = os.environ['SSM_PARAM_NAME']
    client = boto3.client('ssm', region_name=region)
    parameter = client.get_parameter(Name=ssm_param_name)

    jwt_token = event['headers']['Authorization'].split(' ')[1]

    jws_decoded = jwt.decode(jwt_token)
    miro_jwt_token = MiroJwtToken(jws_decoded)
    miro_team_from_jwt = json.dumps(miro_jwt_token.payload['team'])
    miro_team_from_parameter = json.dumps(parameter['Parameter']['Value'])

    policy = {
        "principalId": 'user',
        "policyDocument": {
            "Version": '2012-10-17',
            "Statement": [
                {
                    "Action": 'execute-api:Invoke',
                    "Effect": 'Allow' if miro_team_from_jwt == miro_team_from_parameter else 'Deny',
                    "Resource": event['methodArn'],
                },
            ],
        },
    }

    return policy
