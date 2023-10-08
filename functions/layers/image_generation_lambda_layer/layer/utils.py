from io import BytesIO
import json
import boto3
import hashlib
import time
import base64
import os
from PIL import Image
import numpy as np

OUT_IMAGES_PATH = 'out_images/'


class S3ImagesInvalidExtension(Exception):
    pass


class S3ImagesUploadFailed(Exception):
    pass


def get_safe_ext(key):
    ext = os.path.splitext(key)[-1].strip('.').upper()
    if ext in ['JPG', 'JPEG']:
        return 'JPEG'
    elif ext in ['PNG']:
        return 'PNG'
    else:
        raise S3ImagesInvalidExtension('Extension is invalid')


def to_s3(s3_client, img, bucket, key):
    buffer = BytesIO()
    img.save(buffer, get_safe_ext(key))
    buffer.seek(0)
    sent_data = s3_client.put_object(Bucket=bucket, Key=key, Body=buffer)
    if sent_data['ResponseMetadata']['HTTPStatusCode'] != 200:
        raise S3ImagesUploadFailed('Failed to upload image {} to bucket {}'.format(key, bucket))
    else:
        print("Upload successfully")


def upload_image_to_s3(image, bucket):
    key = hashlib.sha1(bytes(str(time.time()), 'utf')).hexdigest()
    filename = os.path.join(OUT_IMAGES_PATH, key + ".jpg")

    client = boto3.client('s3', region_name='us-east-1')

    to_s3(client, image, bucket, filename)
    return filename


def get_response_struct(data, status_code=200):
    return {
        'headers': {"Content-Type": "text/json", "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type, Access-Control-Allow-Origin, Access-Control-Allow-Methods",
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET", "Cache-Control": "no-cache"},
        'statusCode': status_code,
        'body': json.dumps(data)
    }


def convert_sagemaker_response_to_image(response_sagemaker):
    response_image = response_sagemaker["Body"]
    stream = response_image.read()
    data = json.loads(stream)

    response_array = data['generated_images'][0]
    new_image = Image.fromarray(np.array(response_array).astype('uint8'), 'RGB')
    return new_image


def upload_return_cf_url(image_to_upload):
    bucket = os.environ['S3_BUCKET']

    return upload_image_to_s3(image_to_upload, bucket)


def get_bedrock_response(region_name, bedrock_model_name, body):
    bedrock_runtime = boto3.client(
        service_name='bedrock-runtime',
        region_name=region_name
    )
    return bedrock_runtime.invoke_model(
        body=body,
        modelId=bedrock_model_name,
        accept='application/json',
        contentType='application/json'
    )


def get_sagemaker_response(endpoint_name, body):
    runtime = boto3.client('runtime.sagemaker')
    return runtime.invoke_endpoint(EndpointName=endpoint_name,
                                   ContentType='application/json',
                                   Accept="application/json",
                                   Body=body)


def convert_bedrock_response_to_image(response_bedrock):
    response_body = json.loads(response_bedrock.get("body").read())
    base_64_img_str = response_body["artifacts"][0].get("base64")
    new_image = Image.open(BytesIO(base64.decodebytes(bytes(base_64_img_str, "utf-8"))))
    return new_image


negative_prompts = [
    "poorly rendered",
    "poor background details",
    "poorly drawn mountains",
    "disfigured mountain features",
    "bad",
    "deformed",
    "ugly",
    "bad anatomy"
]
