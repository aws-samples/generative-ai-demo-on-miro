#!/bin/bash

# load default names for Sagemaker endpoints
source ../ml_services/endpoint_names.sh

echo "🤖Hello, please enter the endpoint name of the image generation model [$DEFAULT_CREATE_IMAGE_ENDPOINT]:"
read -r CREATE_IMAGE_ENDPOINT
CREATE_IMAGE_ENDPOINT=${CREATE_IMAGE_ENDPOINT:-$DEFAULT_CREATE_IMAGE_ENDPOINT}
echo "🤖Thanks, please enter the endpoint name of the inpainting model [$DEFAULT_INPAINT_ENDPOINT]:"
read -r INPAINT_ENDPOINT
INPAINT_ENDPOINT=${INPAINT_ENDPOINT:-$DEFAULT_INPAINT_ENDPOINT}
echo "🤖Thanks, please enter the endpoint name of the image modification model [$DEFAULT_IMAGE_MODIFY_ENDPOINT]:"
read -r IMAGE_MODIFY_ENDPOINT
IMAGE_MODIFY_ENDPOINT=${IMAGE_MODIFY_ENDPOINT:-$DEFAULT_IMAGE_MODIFY_ENDPOINT}
echo "🤖Thanks, please enter the endpoint name of the style transfer model [$DEFAULT_STYLE_TRANSFER_ENDPOINT]:"
read -r STYLE_TRANSFER_ENDPOINT
STYLE_TRANSFER_ENDPOINT=${STYLE_TRANSFER_ENDPOINT:-$DEFAULT_STYLE_TRANSFER_ENDPOINT}
echo "🤖Thanks, deploying... 🚀☁️"

cdk deploy --require-approval never \
  --parameters CreateImageEndpoint="$CREATE_IMAGE_ENDPOINT" \
  --parameters InpaintEndpoint="$INPAINT_ENDPOINT" \
  --parameters ImageModifyEndpoint="$IMAGE_MODIFY_ENDPOINT" \
  --parameters StyleTransferEndpoint="$STYLE_TRANSFER_ENDPOINT"