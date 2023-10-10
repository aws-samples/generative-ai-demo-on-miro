import json
import os
import base64
import requests
from layer.utils import upload_return_cf_url, get_response_struct, convert_sagemaker_response_to_image, \
    get_bedrock_response, get_sagemaker_response, convert_bedrock_response_to_image, negative_prompts


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
    bedrock_model_name = os.environ['BEDROCK_MODEL_NAME']
    bedrock_region = os.environ['BEDROCK_REGION']

    new_image = None

    if bedrock_model_name != "" and bedrock_region != "":
        prompt = parameters["prompt"]

        request_body = json.dumps({
            "text_prompts": (
                    [{"text": prompt, "weight": 1.0}]
                    + [{"text": n_prompt, "weight": -1.0} for n_prompt in negative_prompts]
            ),
            "init_image": encode_img_from_url(parameters["image_url"]),
            "init_image_mode": "IMAGE_STRENGTH",
            "image_strength": 0.35,
            "cfg_scale": 5,
            "steps": 70,
            "seed": parameters["seed"],
        })
        response = get_bedrock_response(bedrock_region, bedrock_model_name, request_body)
        new_image = convert_bedrock_response_to_image(response)

    if endpoint_name != "" and new_image is None:
        request_body = json.dumps({
            "prompt": parameters["prompt"],
            "image": encode_img_from_url(parameters["image_url"]),
            "negative_prompt": "bad, deformed, ugly, bad anatomy",
            "guidance_scale": parameters["guidance_scale"],
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
        full_response_url = modify_image(parameters)
        return get_response_struct({"status": "ok", "responseURL": full_response_url})  # return structured answer
    except Exception as e:
        print("-------- Exception: ", str(e))
        return get_response_struct({"status": "error", "reply": "Error: " + str(e)}, status_code=502)
