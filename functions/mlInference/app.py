import json
from models.stable_diffusion_xl import create_image as sdxl_create_image
from models.stable_diffusion_3_ultra import create_image as sd3_create_image
from models.amazon_model import create_image as amazon_create_image


def handler(event, context):

    try:
        parameters = event["body"]
        parameters = json.loads(parameters)

        model_id = parameters["model_id"]
        if model_id == "stability.stable-diffusion-xl-v1":
            base64_image = sdxl_create_image(parameters)
        elif "stability.sd3" in model_id or model_id == "stability.stable-image-ultra-v1:0":
            base64_image = sd3_create_image(parameters)
        elif "amazon" in model_id:
            base64_image = amazon_create_image(parameters)
        else:
            base64_image = None

        if base64_image:
            response_body = json.dumps({"image": base64_image, "status": "ok"})
        else:
            response_body = json.dumps({"response": "Please select proper action", "status": "Error"})

        return {
            "headers": {"Content-Type": "text/json", "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Headers": "*",
                        "Access-Control-Allow-Methods": "OPTIONS,POST,GET", "Cache-Control": "no-cache"},
            "statusCode": 200,
            "body": response_body
            }

    except Exception as e:
        print("-------- Exception: ", str(e))
        return "-------- Exception: " + str(e)  # TODO: Replace with response struct
