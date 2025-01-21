import boto3
import os
import json
import base64
from io import BytesIO
from PIL import Image, ImageDraw


def get_response_struct(data, status_code=200):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data)
    }

def convert_to_image(response):
    """Convert Sagemaker endpoint response to PIL Image"""
    response_body = response['Body']
    response_data = json.loads(response_body.read().decode())
    if isinstance(response_data, str):
        # Handle base64 string response
        image_bytes = base64.b64decode(response_data)
    else:
        # Handle JSON response with base64 field
        image_bytes = base64.b64decode(response_data.get('image', response_data.get('generated_image', '')))
    return Image.open(BytesIO(image_bytes))

def image_to_base64(image):
    """Convert PIL Image to base64 string"""
    buffered = BytesIO()
    image.save(buffered, format="JPEG")
    return base64.b64encode(buffered.getvalue()).decode()

def create_image(parameters):
    """
    Unified method to handle image generation, modification, and inpainting scenarios.
    
    Args:
        parameters (dict): Parameters for the operation including:
            - operation: str, one of "generate", "transform", or "inpaint"
            - prompt: str, text prompt for the operation
            - image: str (optional), base64 encoded image for transform/inpaint
            - shape_position: dict (optional), for inpaint operation
            Additional parameters specific to each operation
    
    Returns:
        dict: Response structure containing the generated image as base64
    """
    parameters = json.loads(parameters) if isinstance(parameters, str) else parameters
    operation = parameters.get('operation', 'generate')
    runtime = boto3.client('runtime.sagemaker')
    
    if operation == 'generate':
        endpoint_name = os.environ['IMAGE_CREATE_ENDPOINT']
        request_parameters = {
            key: parameters[key]
            for key in ['prompt', 'negative_prompt', 'seed']
            if key in parameters
        }
    
    elif operation == 'transform':
        endpoint_name = os.environ['MODIFY_ENDPOINT']
        request_parameters = parameters
    
    elif operation == 'inpaint':
        endpoint_name = os.environ['INPAINT_ENDPOINT']
        shape_position = parameters['shape_position']
        
        # Create mask for inpainting
        image_data = base64.b64decode(parameters['image'])
        image = Image.open(BytesIO(image_data))
        
        mask_image = Image.new(mode="L", size=image.size)
        draw = ImageDraw.Draw(mask_image)
        
        # Calculate shape coordinates
        sh_x1 = shape_position['x'] - shape_position['width'] / 2
        sh_x2 = shape_position['x'] + shape_position['width'] / 2
        sh_y1 = shape_position['y'] - shape_position['height'] / 2
        sh_y2 = shape_position['y'] + shape_position['height'] / 2
        
        draw.ellipse((sh_x1, sh_y1, sh_x2, sh_y2), fill=(255), outline=(0))
        
        request_parameters = {
            "prompt": parameters['prompt'],
            "image": parameters['image'],
            "mask_image": image_to_base64(mask_image),
            "num_inference_steps": 50,
            "guidance_scale": 7.5
        }
    
    else:
        return get_response_struct({"error": "Invalid operation"}, 400)
    
    print(f"Calling endpoint: {endpoint_name}")
    print(f"With parameters: {request_parameters}")
    
    encoded_parameters = json.dumps(request_parameters).encode("utf-8")
    response = runtime.invoke_endpoint(
        EndpointName=endpoint_name,
        ContentType='application/json',
        Body=encoded_parameters
    )
    
    print("Received reply from endpoint")
    generated_image = convert_to_image(response)
    return get_response_struct(image_to_base64(generated_image))