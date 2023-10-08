import os
import json
import base64
from io import BytesIO
from PIL import Image, ImageDraw
import requests
from layer.utils import upload_return_cf_url, get_response_struct, get_bedrock_response, \
    convert_bedrock_response_to_image, convert_sagemaker_response_to_image, get_sagemaker_response, negative_prompts


def inpaint_image(parameters):
    endpoint_name = os.environ['INPAINT_ENDPOINT']
    bedrock_model_name = os.environ['BEDROCK_MODEL_NAME']
    bedrock_region = os.environ['BEDROCK_REGION']

    new_image = None

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

    if bedrock_model_name != "" and bedrock_region != "":
        prompt = parameters["prompt"]

        # (e.g. photographic, digital-art, cinematic, ...)
        style_preset = parameters[
            "style_preset"] if "style_preset" in parameters else "photographic"
        request_body = json.dumps({
            "text_prompts": (
                    [{"text": prompt, "weight": 1.0}]
                    + [{"text": n_prompt, "weight": -1.0} for n_prompt in negative_prompts]
            ),
            "init_image": encoded_input_image,
            "mask_source": "INIT_IMAGE_ALPHA",
            "mask_image": encoded_mask_image,
            "cfg_scale": 7.5,
            "seed": parameters["seed"],
            "style_preset": style_preset,
            "steps": 70,
        })
        response = get_bedrock_response(bedrock_region, bedrock_model_name, request_body)
        new_image = convert_bedrock_response_to_image(response)
    if endpoint_name != "" and new_image is None:
        request_body = json.dumps({
            "prompt": parameters['prompt'],
            "image": encoded_input_image,
            "mask_image": encoded_mask_image,
            "num_inference_steps": 50,
            "guidance_scale": 7.5
        })
        response = get_sagemaker_response(endpoint_name, request_body)
        new_image = convert_sagemaker_response_to_image(response)

    if new_image is None:
        raise Exception("No response from sagemaker endpoint or bedrock")

    return upload_return_cf_url(new_image)


def handler(event, context):
    try:
        body = event["body"]
        parameters = json.loads(body)
        print("Parameters: ", parameters)
        full_response_url = inpaint_image(parameters)
        return get_response_struct({"status": "ok", "responseURL": full_response_url})  # return structured answer
    except Exception as e:
        print("-------- Exception: ", str(e))
        return get_response_struct({"status": "error", "reply": "Error: " + str(e)}, status_code=502)
