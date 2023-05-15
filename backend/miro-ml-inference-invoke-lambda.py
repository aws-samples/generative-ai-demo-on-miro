import boto3
import base64, json, os, hashlib, time, io, requests
from io import BytesIO
import numpy as np
from PIL import Image, ImageDraw

##########################################
# Parameters                             #

OUT_IMAGES_PATH = 'out_images/'

##########################################
# utility functions - upload umage to S3 #
##########################################
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
    filename = os.path.join(OUT_IMAGES_PATH, key + ".jpg")

    client = boto3.client('s3', region_name='us-east-1')

    to_s3(client, image, bucket, filename)
    return filename

def getResponceStruct (data, statusCode=200, isBase64Encoded = True ):
    #bodyDump = None
    if isBase64Encoded:
        bodyDump = base64.urlsafe_b64encode(json.dumps(data).encode()).decode()
    else:
        bodyDump = json.dumps(data)

    return {
        'headers': {"Content-Type": "text/json", "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type, Access-Control-Allow-Origin, Access-Control-Allow-Methods",
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET", "Cache-Control" : "no-cache"},
        'statusCode': statusCode,
        'isBase64Encoded': isBase64Encoded,
        'body': bodyDump
    }


# import requests
#################################################
# ML endpoints invocation                       #
# Endpoint names are stored in env variables    #
# ENDPOINT_NAME_CREATE - create image           #
# ENDPOINT_NAME_MODIFY - modify image           #
# ENDPOINT_NAME_STYLE_TRANSFER - style transfer #
# S3_BUCKET - bucket for output images          #
# CLOUDFRONT_URL - URL for cloudfront           #
#################################################

# convert Sagemaker response to image
def convert_to_image (response_sagemaker):
    response_image = response_sagemaker["Body"]
    stream = response_image.read()
    data = json.loads(stream)

    responce_array = data['generated_images'][0]
    # create Image from stream
    new_image = Image.fromarray(np.array(responce_array).astype('uint8'), 'RGB')
    return new_image

def load_image_from_array(responce_array):
    # create image from array
    return Image.fromarray(np.array(responce_array).astype('uint8'), 'RGB')

# upload file to S3 and return url to CloudFront
# Environment variables
# S3_BUCKET - S3 bucket where application could write
# CLOUDFRONT_URL - base URL to CloudFront
def upload_return_cf_url (image_to_upload):
    bucket = os.environ['S3_BUCKET']
    # cloudfront_url = "https://di06o62ghj1zv.cloudfront.net"
    cloudfront_url = os.environ['CLOUDFRONT_URL']

    response_file_name = upload_image_to_s3(image_to_upload, bucket)
    full_response_url = os.path.join(cloudfront_url, response_file_name)
    return full_response_url

# Create image based on text
def create_image_from_text(parameters):
    # '''
    ENDPOINT_NAME = os.environ['ENDPOINT_NAME_CREATE']
    runtime = boto3.client('runtime.sagemaker')
    #
    parameters = json.loads(parameters)
    print("Call endpoint: ", ENDPOINT_NAME)
    print("With parameters: ", parameters)

    request_parameters = {}
    # transfer to request_parameters only valid fields
    for i in ['prompt', 'negative_prompt', 'seed']:
        if i in parameters:
            request_parameters[i] = parameters[i]

    encoded_text = json.dumps(request_parameters).encode("utf-8")
    response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                       ContentType='application/json',
                                       Body=encoded_text)
    print("Received reply from endpoint, len: ", len(response))

    new_image = convert_to_image(response)
    return upload_return_cf_url(new_image)

# Modify image based on text suggestion
# TODO - refactor this function
def modify_image(parameters):
    ENDPOINT_NAME = os.environ['ENDPOINT_NAME_MODIFY']

    runtime = boto3.client('runtime.sagemaker')
    #
    print ("Call endpoint: ", ENDPOINT_NAME )
    print ("With parameters: ", parameters)
    response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                       ContentType='application/json',
                                       Body=parameters)
    print ("Received reply from endpoint, len: ", len(response))

    new_image = convert_to_image(response)
    return upload_return_cf_url(new_image)

def inpaint_image(parameters):
    ENDPOINT_NAME = os.environ['ENDPOINT_NAME_INPAINT']
    runtime = boto3.client('runtime.sagemaker')
    parameters = json.loads(parameters)
    print("Call endpoint: ", ENDPOINT_NAME)
    print("With parameters: ", parameters)
    image_url = parameters['image_url']
    prompt = parameters['prompt']
    shape_position = parameters['shape_position']
    sh_x1 = shape_position['x'] - shape_position['width'] / 2
    sh_x2 = shape_position['x'] + shape_position['width'] / 2
    sh_y1 = shape_position['y'] - shape_position['height'] / 2
    sh_y2 = shape_position['y'] + shape_position['height'] / 2

    # load image and prepare
    image = Image.open(requests.get(image_url, stream=True).raw)
    b = io.BytesIO()
    image.save(b, 'jpeg')
    encoded_input_image = base64.b64encode(bytearray(b.getvalue())).decode()

    # create mask
    mask_image = Image.new(mode="L", size=image.size)
    # draw mask

    draw = ImageDraw.Draw(mask_image)
    draw.ellipse((sh_x1, sh_y1, sh_x2, sh_y2), fill=(255), outline=(0))

    b_m = io.BytesIO()
    mask_image.save(b_m, 'jpeg')
    encoded_mask_image = base64.b64encode(bytearray(b_m.getvalue())).decode()
    parameters = {
        "prompt": parameters['prompt'],
        "image": encoded_input_image,
        "mask_image": encoded_mask_image,
        "num_inference_steps": 50,
        "guidance_scale": 7.5
    }
    encoded_text = json.dumps(parameters).encode("utf-8")
    response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                       ContentType='application/json;jpeg',
                                       Body=encoded_text)
    print("Received reply from endpoint, len: ", len(response))

    new_image = convert_to_image(response)
    return upload_return_cf_url(new_image)

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
            # Run action depending on the command
            if (command['action'] == 'create'):
                print("----- Action: create")
                full_response_url = create_image_from_text(parameters)
            elif (command['action'] == 'modify'):
                print ("----- Action: modify")
                full_response_url = modify_image(parameters)
            elif (command['action'] == 'inpaint'):
                print("----- Action: inpaint")
                full_response_url = inpaint_image(parameters)
            else:
                raise Exception("invalid command action '%s'" % command['action'])
            #
            return getResponceStruct({"status": "ok", "responseURL": full_response_url})              # return structured answer

    except Exception as e:
        print ("-------- Exception: ", str(e))
        return getResponceStruct({"status": "error", "reply": "Error: " + str(e) }, statusCode=200, isBase64Encoded=False)

    # If HTTP Method is not POST -> return standard error
    print ("-------- Return default reply")
    return getResponceStruct({"reply": "Only POST requests accepted"}, statusCode=200, isBase64Encoded=False)
