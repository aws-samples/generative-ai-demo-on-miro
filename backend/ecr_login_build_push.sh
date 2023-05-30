#!/bin/bash
account=$(aws sts get-caller-identity --query "Account" --output text)
region=$AWS_REGION
#Log in to ECR repo
aws ecr get-login-password --region "${region}" | docker login --username AWS --password-stdin "${account}.dkr.ecr.${region}.amazonaws.com"

#Build and push Lambda containers to ECR
cp ../functions/authorize/index.ts .
docker buildx build --platform=linux/arm64 -t authorize .
docker tag authorize "${account}.dkr.ecr.${region}.amazonaws.com/authorize"
docker push "${account}.dkr.ecr.${region}.amazonaws.com/authorize"
rm index.ts

cp ../functions/mlInference/app.py .
docker buildx build -f PyFuncDockerfile --platform=linux/arm64 -t genaiproxy .
docker tag genaiproxy "${account}.dkr.ecr.${region}.amazonaws.com/genaiproxy"
docker push "${account}.dkr.ecr.${region}.amazonaws.com/genaiproxy"
rm app.py

cp ../functions/onBoard/index.ts .
docker buildx build --platform=linux/arm64 -t onboard .
docker tag onboard "${account}.dkr.ecr.${region}.amazonaws.com/onboard"
docker push "${account}.dkr.ecr.${region}.amazonaws.com/onboard"
rm index.ts

##Force update of Lambda images
##Uncomment if you want to update existing deployment
#aws lambda update-function-code --function-name GenAIProxyFunction --image-uri "${account}.dkr.ecr.${region}.amazonaws.com/genaiproxy:latest" 2>&1 > /dev/null
#aws lambda update-function-code --function-name APIGWauthFunction --image-uri "${account}.dkr.ecr.${region}.amazonaws.com/authorize:latest" 2>&1 > /dev/null
#aws lambda update-function-code --function-name UserOnboardFunction --image-uri "${account}.dkr.ecr.${region}.amazonaws.com/onboard:latest" 2>&1 > /dev/null
