import os
import boto3
import json
import base64
from io import BytesIO
from PIL import Image, ImageDraw
import requests
from layer.utils import upload_return_cf_url, get_response_struct, convert_to_image


def inpaint_image(parameters):
    endpoint_name = os.environ['INPAINT_ENDPOINT']
    runtime = boto3.client('runtime.sagemaker')
    parameters = json.loads(parameters)
    print("Call endpoint: ", endpoint_name)
    print("With parameters: ", parameters)
    image_url = parameters['image_url']
    shape_position = parameters['shape_position']
    sh_x1 = shape_position['x'] - shape_position['width'] / 2
    sh_x2 = shape_position['x'] + shape_position['width'] / 2
    sh_y1 = shape_position['y'] - shape_position['height'] / 2
    sh_y2 = shape_position['y'] + shape_position['height'] / 2

    # load image and prepare
    image = Image.open(requests.get(image_url, stream=True, timeout=5).raw)

    b = BytesIO()
    image.save(b, 'jpeg')
    encoded_input_image = base64.b64encode(bytearray(b.getvalue())).decode()

    # create mask
    mask_image = Image.new(mode="L", size=image.size)
    # draw mask
    draw = ImageDraw.Draw(mask_image)
    draw.ellipse((sh_x1, sh_y1, sh_x2, sh_y2), fill=(255), outline=(0))

    b_m = BytesIO()
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
    response = runtime.invoke_endpoint(EndpointName=endpoint_name,
                                       ContentType='application/json;jpeg',
                                       Body=encoded_text)
    print("Received reply from endpoint, len: ", len(response))

    new_image = convert_to_image(response)
    return upload_return_cf_url(new_image)


def handler(event, context):
    try:
        parameters = event["body"]
        print("Parameters: ", parameters)
        full_response_url = inpaint_image(parameters)
        return get_response_struct({"status": "ok", "responseURL": full_response_url})  # return structured answer
    except Exception as e:
        print("-------- Exception: ", str(e))
        return get_response_struct({"status": "error", "reply": "Error: " + str(e)}, status_code=502)
