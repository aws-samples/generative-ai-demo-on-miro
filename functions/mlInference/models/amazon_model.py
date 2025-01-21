import boto3
import json

def create_image(parameters):
    bedrock_client = boto3.client(service_name="bedrock-runtime", region_name=parameters["region"])
    accept = "application/json"
    content_type = "application/json"
    model_id = parameters["model_id"]
    task_type = {
        "Generate": "TEXT_IMAGE",
        "Transform": "IMAGE_VARIATION",
        "Inpaint": "INPAINT"
    }

    body = {
        "taskType": task_type[parameters["action"]],
        "imageGenerationConfig": {
            "seed": parameters["seed"],
            "width": parameters["width"],
            "height": parameters["height"],
            "numberOfImages": 1
        }
    }
    if parameters["action"] == "Generate":
        body["textToImageParams"] = {
            "text": parameters["prompt"],
        }
        if parameters["negative_prompt"]:
            body["textToImageParams"]["negativeText"] = parameters["negative_prompt"]
    
    if parameters["action"] == "Transform":
        body["imageVariationParams"] = {
            "text": parameters["prompt"],
            "images": [parameters["init_image"].split(",")[1]], # Remove base64 prefix
            "similarityStrength": parameters.get("image_strength", 0.5)
        }
        if parameters["negative_prompt"]:
            body["imageVariationParams"]["negativeText"] = parameters["negative_prompt"]
    
    body = json.dumps(body)
    response = bedrock_client.invoke_model(
        body=body, modelId=model_id, contentType=content_type, accept=accept
    )
    response_body = json.loads(response.get('body').read())
    return response_body.get("images")[0]