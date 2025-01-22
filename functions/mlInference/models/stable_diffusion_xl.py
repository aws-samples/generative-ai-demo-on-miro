import boto3
import json

def create_image(parameters):
    bedrock_client = boto3.client(service_name="bedrock-runtime", region_name=parameters["region"])
    model_id = parameters["model_id"]
    
    body = {
        "text_prompts": [
            {
                "text" : parameters["prompt"],
                "weight": 1
            },
            {
                "text": parameters["negative_prompt"],
                "weight": -1
            }
        ],
        "seed": parameters["seed"],
        "height": parameters["height"],
        "width": parameters["width"]
    }
    
    if parameters["action"] == "Transform":
        body["init_image"] = parameters["init_image"].split(",")[1] # Remove base64 prefix
    
    body = json.dumps(body)
    response = bedrock_client.invoke_model(
        body=body, modelId=model_id
    )
    response_body = json.loads(response.get('body').read())
    return response_body.get("artifacts")[0].get('base64')