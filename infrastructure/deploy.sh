#!/bin/bash

echo "🤖Hello, please enter the endpoint name of the image generation model:"
read -r CREATE_IMAGE_ENDPOINT
echo "🤖Thanks, please enter the endpoint name of the inpainting model:"
read -r INPAINT_ENDPOINT
echo "🤖Thanks, please enter the endpoint name of the image modification model:"
read -r IMAGE_MODIFY_ENDPOINT
echo "🤖Thanks, please enter the endpoint name of the style transfer model:"
read -r STYLE_TRANSFER_ENDPOINT
echo "🤖Thanks, deploying... 🚀☁️"

cdk deploy --require-approval never \
  --parameters CreateImageEndpoint="$CREATE_IMAGE_ENDPOINT" \
  --parameters InpaintEndpoint="$INPAINT_ENDPOINT" \
  --parameters ImageModifyEndpoint="$IMAGE_MODIFY_ENDPOINT" \
  --parameters StyleTransferEndpoint="$STYLE_TRANSFER_ENDPOINT"