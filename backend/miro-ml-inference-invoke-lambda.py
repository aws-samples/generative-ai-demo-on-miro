import boto3
import base64, json, os, hashlib, time
from io import BytesIO
import numpy as np
from PIL import Image


# utility - upload umage to S3
class S3ImagesInvalidExtension(Exception):
    pass


class S3ImagesUploadFailed(Exception):
    pass


def to_s3(s3_client, img, bucket, key):
    buffer = BytesIO()
    print("File: ", key)
    img.save(buffer, get_safe_ext(key))
    buffer.seek(0)
    print(buffer)
    sent_data = s3_client.put_object(Bucket=bucket, Key=key, Body=buffer)
    print("Result: ", sent_data)
    if sent_data['ResponseMetadata']['HTTPStatusCode'] != 200:
        raise S3ImagesUploadFailed('Failed to upload image {} to bucket {}'.format(key, bucket))
    else:
        print("Upload sucessfully")


def get_safe_ext(key):
    ext = os.path.splitext(key)[-1].strip('.').upper()
    if ext in ['JPG', 'JPEG']:
        return 'JPEG'
    elif ext in ['PNG']:
        return 'PNG'
    else:
        raise S3ImagesInvalidExtension('Extension is invalid')


def upload_image_to_s3(image, bucket):
    key = hashlib.sha1(bytes(str(time.time()), 'utf')).hexdigest()
    filename = os.path.join('out_images/', key + ".jpg")

    client = boto3.client('s3', region_name='us-east-1')

    to_s3(client, image, bucket, filename)
    return filename


# import requests

# Create image based on text
def create_image_from_text(parameters):
    # '''
    ENDPOINT_NAME_CREATE = os.environ['ENDPOINT_NAME_CREATE']
    #ENDPOINT_NAME_MODIFY = os.environ['ENDPOINT_NAME_MODIFY']

    # ENDPOINT_NAME = "jumpstart-example-infer-model-txt2img-s-2023-02-10-19-44-33-357"
    runtime = boto3.client('runtime.sagemaker')
    #
    print("Call endpoint: ", ENDPOINT_NAME_CREATE)
    print("With parameters: ", parameters)
    response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME_CREATE,
                                       ContentType='application/json',
                                       Body=parameters)
    print("Received reply from endpoint, len: ", len(response))
    response_image = response["Body"]
    stream = response_image.read()
    data = json.loads(stream)
    #image, prompt = data['generated_images'][0], data['prompt']
    #img_to_save = Image.fromarray(np.uint8(np.array(image)), "RGB")
    #
    new_byte_io = BytesIO(base64.decodebytes(data.encode("utf-8")))

    new_image = Image.open(new_byte_io)
    bucket = "miro-app-image-style-transfer"
    response_file_name = upload_image_to_s3(new_image, bucket)
    # response_file_name = "ffc41f731cb3aa342aa2c14bcdf6edd5e54a4309.jpg"
    #
    cloudfront_url = "https://di06o62ghj1zv.cloudfront.net"
    full_response_url = os.path.join(cloudfront_url, response_file_name)
    return full_response_url

# Modify image based on text suggestion
def modify_image(parameters):
    ENDPOINT_NAME_MODIFY = os.environ['ENDPOINT_NAME_MODIFY']

    runtime = boto3.client('runtime.sagemaker')
    #
    print ("Call endpoint: ", ENDPOINT_NAME_MODIFY )
    print ("With parameters: ", parameters)
    response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME_MODIFY,
                                       ContentType='application/json',
                                       Body=parameters)
    print ("Received reply from endpoint, len: ", len(response))
    # What to do with string to make it bytes again
    response_image = response["Body"]
    stream = response_image.read()
    data = json.loads(stream)
    # What to do with string to make it bytes again
    new_byte_io = BytesIO(base64.decodebytes(data.encode("utf-8")))

    new_image = Image.open(new_byte_io)
    #
    bucket = "miro-app-image-style-transfer"
    response_file_name = upload_image_to_s3(new_image, bucket)
    # response_file_name = "ffc41f731cb3aa342aa2c14bcdf6edd5e54a4309.jpg"
    #
    cloudfront_url = "https://di06o62ghj1zv.cloudfront.net"
    full_response_url = os.path.join(cloudfront_url, response_file_name)
    return full_response_url

# Main handler

def lambda_handler(event, context):
    """Sample pure Lambda function

    Parameters
    ----------
    event: dict, required
        API Gateway Lambda Proxy Input Format

        Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format

    context: object, required
        Lambda Context runtime methods and attributes

        Context doc: https://docs.aws.amazon.com/lambda/latest/dg/python-context-object.html

    Returns
    ------
    API Gateway Lambda Proxy Output Format: dict

        Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
    """

    try:
        if ("httpMethod" in event and event["httpMethod"] == "POST"):  # and event["httpMethod"] == "POST"

            # parameters = json.loads(base64.urlsafe_b64decode(event["body"]))
            parameters = base64.urlsafe_b64decode(event["body"])
            print("Parameters: ", parameters)
            command = json.loads(parameters.decode("utf-8"))
            full_response_url = None
            if (command['action'] == 'create'):
                print("----- Action: create")
                full_response_url = create_image_from_text(parameters)
            elif (command['action'] == 'modify'):
                print ("----- Action: modify")
                full_response_url = modify_image(parameters)
            #
            response = {"responseURL": full_response_url}
            return {
                'headers': {"Content-Type": "text/json", "Access-Control-Allow-Origin": "*",
                            "Access-Control-Allow-Headers": "Content-Type, Access-Control-Allow-Origin",
                            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"},
                'statusCode': 200,
                'body': base64.urlsafe_b64encode(json.dumps(response).encode()).decode(),
                'isBase64Encoded': True
                }
    except Exception as e:
        print ("-------- Exception: ", e.with_traceback())
        return {
            'headers': {"Content-Type": "text/json", "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Headers": "Content-Type, Access-Control-Allow-Origin",
                        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"},
            'statusCode': 404,
            'body': json.dumps({"reply": "Error: ", "Error_details": e }),
            'isBase64Encoded': False
        }

    print ("-------- Return default reply")
    reply = {
        'headers': {"Content-Type": "text/json", "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type, Access-Control-Allow-Origin",
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"},
        'statusCode': 200,
        'body': json.dumps({"reply": "Only POST requests accepted"}),
        'isBase64Encoded': False
        }
    print (reply)
    return reply