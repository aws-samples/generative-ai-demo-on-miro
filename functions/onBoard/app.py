import os
import json
import boto3
from jose import jwt
from botocore.exceptions import ParamValidationError

class MiroJwtToken:
    def __init__(self, payload):
        self.payload = payload

def handler(event, context):
    region = os.environ['AWS_REGION']
    ssm_param_name = os.environ['SSM_PARAMETER_NAME']
    authorization_header = event['headers']['Authorization']
    jwt_token = authorization_header.split(' ')[1]

    jws_decoded = jwt.decode(jwt_token)
    miro_jwt_token = MiroJwtToken(jws_decoded)
    miro_team_from_jwt = miro_jwt_token.payload['team']

    client = boto3.client('ssm', region_name=region)

    try:
        stored_parameter = client.get_parameter(Name=Name)
        if stored_parameter['Parameter']['Value'] == miro_team_from_jwt:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'OK',
                }),
            }
    except client.exceptions.ParameterNotFound:
        try:
            client.put_parameter(
                Name=Name,
                Value=miro_team_from_jwt,
                Type='String',
                Overwrite=True
            )
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'OK',
                }),
            }
        except ParamValidationError as e:
            print(e)

    return {
        'statusCode': 401,
        'body': json.dumps({
            'message': 'Your team is not authorized to use this app.',
        }),
    }
