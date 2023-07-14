import os
import boto3
from jose import jwt

def handler(event, context):
    region = os.environ['AWS_REGION']
    secret_id = os.environ['SECRET_ID']
    method_arn = event['methodArn']
    client = boto3.client('secretsmanager', region_name=region)
    secret_string = client.get_secret_value(SecretId=secret_id)['SecretString']

    if secret_string is None:
        return generate_policy(resource=method_arn)

    if event['headers']:
        jwt_token = event['headers']['Authorization'].split(' ')[1]

        try:
            jws_decoded = jwt.decode(jwt_token, secret_string, issuer='miro', algorithms=['HS256'])
            if jws_decoded is not None:
                return generate_policy(effect='Allow', resource=method_arn)
        except Exception as e:
            print(e)
            return generate_policy(resource=method_arn)

    return generate_policy(resource=method_arn)


def generate_policy(principal_id='user', effect='Deny', resource='*'):
    return {
        'principalId': principal_id,
        'policyDocument': {
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Action': 'execute-api:Invoke',
                    'Effect': effect,
                    'Resource': resource,
                },
            ],
        }
    }
