import boto3
import json

def create_image(parameters):
    bedrock_client = boto3.client(service_name="bedrock-runtime", region_name=parameters["region"])
    accept = "application/json"
    content_type = "application/json"
    model_id = parameters["model_id"]
    mode = {
        "Generate": "text-to-image",
        "Transform": "image-to-image",
        "Inpaint": "INPAINT"
    }

    aspect_ratio = {
        "1024 x 1024": "1:1",
        "1088 x 896": "5:4",
        "1216 x 832": "3:2",
        "1344 x 768": "16:9",
        "1536 x 640": "21:9",
        "896 x 1088": "4:5",
        "832 x 1216": "2:3",
        "768 x 1344": "9:16",
        "640 x 1536": "9:21"
    }

    body = {
        "prompt": parameters["prompt"],
        "negative_prompt": parameters["negative_prompt"],
        "mode": mode[parameters["action"]],
        "seed": parameters["seed"],
        "output_format": "png"
    }

    if parameters["action"] == "Generate":
        body["aspect_ratio"] = aspect_ratio[str(parameters["width"]) + " x " + str(parameters["height"])]
    
    if parameters["action"] == "Transform":
        body["image"] = parameters["init_image"].split(",")[1] # Remove base64 prefix
        body["strength"] = parameters.get("image_strength", 0.5)
    
    body = json.dumps(body)
    response = bedrock_client.invoke_model(
        body=body, modelId=model_id, contentType=content_type, accept=accept
    )
    response_body = json.loads(response.get('body').read())
    return response_body.get("images")[0]