import json
import os
import boto3
import base64
import requests
from io import BytesIO
from PIL import Image
from layer.utils import upload_return_cf_url, get_response_struct, convert_to_image


def encode_img_from_url(img_url):
    response = requests.get(img_url)
    if response.status_code == 200:
        img_bytes = response.content
        encoded_img = base64.b64encode(img_bytes).decode()
        return encoded_img
    else:
        return None


def modify_image(parameters):
    endpoint_name = os.environ['MODIFY_ENDPOINT']

    runtime = boto3.client('runtime.sagemaker')
    print("Call endpoint: ", endpoint_name)
    print("With parameters: ", parameters)
    parameters = json.loads(parameters)
    request_parameters = json.dumps({
        "prompt": parameters["prompt"],
        "image": encode_img_from_url(parameters["image_url"]),
        "negative_prompt": "bad, deformed, ugly, bad anatomy",
        "guidance_scale": parameters["guidance_scale"],
    })
    response = runtime.invoke_endpoint(EndpointName=endpoint_name,
                                       ContentType="application/json",
                                       Accept="application/json",
                                       Body=request_parameters)
    print("Received reply from endpoint, len: ", len(response))

    response_image = response["Body"]
    stream = response_image.read()
    data = json.loads(stream)
    base_64_img_str = data['generated_images'][0]
    new_image = Image.open(BytesIO(base64.decodebytes(bytes(base_64_img_str, "utf-8"))))

    return upload_return_cf_url(new_image)


def handler(event, context):
    try:
        parameters = event["body"]
        print("Parameters: ", parameters)
        full_response_url = modify_image(parameters)
        return get_response_struct({"status": "ok", "responseURL": full_response_url})  # return structured answer
    except Exception as e:
        print("-------- Exception: ", str(e))
        return get_response_struct({"status": "error", "reply": "Error: " + str(e)}, status_code=502)
