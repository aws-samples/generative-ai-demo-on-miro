import os
import json
import boto3
from jose import jwt

class MiroJwtToken:
    def __init__(self, payload):
        self.payload = payload


def handler(event, context):
#     region = os.getenv('AWS_REGION')
#     Name = 'miroTeam'
#
#     client = boto3.client('ssm', region_name=region)
#
#     parameter = client.get_parameter(Name=Name)
#
#     jwt_token = event['headers']['Authorization'].split(' ')[1]
#
#     jws_decoded = jwt.decode(jwt_token)
#     miro_jwt_token = MiroJwtToken(jws_decoded)
#     miro_team_from_jwt = json.dumps(miro_jwt_token.payload['team'])
#     miro_team_from_parameter = json.dumps(parameter['Parameter']['Value'])

#     policy = {
#         "principalId": 'user',
#         "policyDocument": {
#             "Version": '2012-10-17',
#             "Statement": [
#                 {
#                     "Action": 'execute-api:Invoke',
#                     "Effect": 'Allow' if miro_team_from_jwt == miro_team_from_parameter else 'Deny',
#                     "Resource": event['methodArn'],
#                 },
#             ],
#         },
#     }

    policy = {
        "principalId": 'user',
        "policyDocument": {
            "Version": '2012-10-17',
            "Statement": [
                {
                    "Action": 'execute-api:Invoke',
                    "Effect": 'Allow',
                    "Resource": event['methodArn'],
                },
            ],
        },
    }

    return policy
