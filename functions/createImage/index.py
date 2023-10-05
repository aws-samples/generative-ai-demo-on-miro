import os
import boto3
import json
from layer.utils import convert_to_image, upload_return_cf_url, get_response_struct


def create_image_from_text(parameters):
    endpoint_name = os.environ['IMAGE_CREATE_ENDPOINT']
    runtime = boto3.client('runtime.sagemaker')
    parameters = json.loads(parameters)

    request_parameters = {}
    for i in ['prompt', 'negative_prompt', 'seed']:
        if i in parameters:
            request_parameters[i] = parameters[i]

    request_parameters["negative_prompt"] = 'f{request_parameters["negative_prompt"]}, bad, deformed, ugly, bad anatomy'
    encoded_text = json.dumps(request_parameters).encode("utf-8")
    response = runtime.invoke_endpoint(EndpointName=endpoint_name,
                                       ContentType='application/json',
                                       Body=encoded_text)

    new_image = convert_to_image(response)
    return upload_return_cf_url(new_image)


def handler(event, context):
    try:
        parameters = event["body"]
        full_response_url = create_image_from_text(parameters)
        return get_response_struct({"status": "ok", "responseURL": full_response_url})  # return structured answer
    except Exception as e:
        print("-------- Exception: ", str(e))
        return get_response_struct({"status": "error", "reply": "Error: " + str(e)}, status_code=502)
