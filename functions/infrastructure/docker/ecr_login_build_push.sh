#!/bin/bash
account=$(aws sts get-caller-identity --query "Account" --output text)
region=$AWS_REGION
#Log in to ECR repo
aws ecr get-login-password --region "${region}" | docker login --username AWS --password-stdin "${account}.dkr.ecr.${region}.amazonaws.com"

#Build and push Lambda containers to ECR
cp ../../authorize/app.py .
cp ../../authorize/requirements.txt .
docker buildx build --platform=linux/arm64 -t authorize .
docker tag authorize "${account}.dkr.ecr.${region}.amazonaws.com/authorize"
docker push "${account}.dkr.ecr.${region}.amazonaws.com/authorize"
rm app.py
rm requirements.txt

cp ../../mlInference/app.py .
cp ../../mlInference/requirements.txt .
docker buildx build --platform=linux/arm64 -t genaiproxy .
docker tag genaiproxy "${account}.dkr.ecr.${region}.amazonaws.com/genaiproxy"
docker push "${account}.dkr.ecr.${region}.amazonaws.com/genaiproxy"
rm app.py
rm requirements.txt

cp ../../onBoard/app.py .
cp ../../onBoard/requirements.txt .
docker buildx build --platform=linux/arm64 -t onboard .
docker tag onboard "${account}.dkr.ecr.${region}.amazonaws.com/onboard"
docker push "${account}.dkr.ecr.${region}.amazonaws.com/onboard"
rm app.py
rm requirements.txt

#cp ../functions/authorize/index.ts .
#docker buildx build --platform=linux/arm64 -t authorize .
#docker tag authorize "${account}.dkr.ecr.${region}.amazonaws.com/authorize"
#docker push "${account}.dkr.ecr.${region}.amazonaws.com/authorize"
#rm index.ts
#
#cp ../functions/onBoard/index.ts .
#docker buildx build --platform=linux/arm64 -t onboard .
#docker tag onboard "${account}.dkr.ecr.${region}.amazonaws.com/onboard"
#docker push "${account}.dkr.ecr.${region}.amazonaws.com/onboard"
#rm index.ts

##Force update of Lambda images
##Uncomment if you want to update existing deployment
#aws lambda update-function-code --function-name GenAIProxyFunction --image-uri "${account}.dkr.ecr.${region}.amazonaws.com/genaiproxy:latest" 2>&1 > /dev/null
#aws lambda update-function-code --function-name APIGWauthFunction --image-uri "${account}.dkr.ecr.${region}.amazonaws.com/authorize:latest" 2>&1 > /dev/null
#aws lambda update-function-code --function-name OnboardFunction --image-uri "${account}.dkr.ecr.${region}.amazonaws.com/onboard:latest" 2>&1 > /dev/null
