import os
import json
from layer.utils import convert_sagemaker_response_to_image, upload_return_cf_url, get_response_struct, \
    get_bedrock_response, get_sagemaker_response, convert_bedrock_response_to_image, negative_prompts


def create_image_from_text(parameters):
    endpoint_name = os.environ['IMAGE_CREATE_ENDPOINT']
    bedrock_model_name = os.environ['BEDROCK_MODEL_NAME']
    bedrock_region = os.environ['BEDROCK_REGION']

    new_image = None

    if bedrock_model_name != "" and bedrock_region != "":
        prompt = parameters["prompt"]

        # (e.g. photographic, digital-art, cinematic, ...)
        style_preset = parameters[
            "style_preset"] if "style_preset" in parameters else "photographic"

        print("Negative prompts: ", negative_prompts)
        request_body = json.dumps({
            "text_prompts": (
                    [{"text": prompt, "weight": 1.0}]
                    + [{"text": n_prompt, "weight": -1.0} for n_prompt in negative_prompts]
            ),
            "seed": parameters["seed"],
            "cfg_scale": 5,
            "steps": 70,
            "style_preset": style_preset,
        })
        response = get_bedrock_response(bedrock_region, bedrock_model_name, request_body)
        new_image = convert_bedrock_response_to_image(response)

    if endpoint_name != "" and new_image is None:
        request_body = json.dumps({
            "prompt": parameters["prompt"],
            "negative_prompt": 'f{parameters["negative_prompt"]}, bad, deformed, ugly, bad anatomy',
            "seed": parameters["seed"]
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
        full_response_url = create_image_from_text(parameters)
        return get_response_struct({"status": "ok", "responseURL": full_response_url})  # return structured answer
    except Exception as e:
        print("-------- Exception: ", str(e))
        return get_response_struct({"status": "error", "reply": "Error: " + str(e)}, status_code=502)
