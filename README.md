![Build Status](https://gitlab.com/pages/plain-html/badges/master/build.svg)

---
## Installation steps
1. [Create IAM role “generative-ai-demo-function”](#1-create-iam-role-generative-ai-demo-function)
2. [Create IAM role “generative-ai-demo-demo-operator”](#2-create-iam-role-generative-ai-demo-demo-operator)
3. [Create CodeCommit and push this GitLab Repository to CodeCommit](#3-create-codecommit-repository-and-push-this-repository-to-it)
4. [Create ECR repository](#4-create-ecr-repository) 
5. [Create CloudBuild pipeline & run build](#5-create-cloudbuild-configuration--run-build)
6. [Create Lambda from ECR container](#6-create-lambda-from-ecr-repository)
7. [Create APIGateway](#7-create-apigateway)
8. [Create S3 bucket](#8-create-s3-bucket)
9. [Create CloudFront distribution & update lambda variable](#9-create-cloudfront-distribution--lambda-variable)
10. [Update S3 bucket access policy](#10-update-s3-bucket-access-policy)
11. [Build frontend app & deploy to bucket](#11-build-frontend-app--deploy-to-bucket)
12. [Run Sagemaker endpoint-1](#12-13-14-run-sagemaker-endpoint)
13. Run Sagemaker endpoint-2
14. Run Sagemaker endpoint-3
15. [Open Miro and integrate application](#15-open-miro-and-integrate-application)

### 1. Create IAM role “generative-ai-demo-function”

Policies:
- AmazonSageMakerFullAccess
- AmazonS3FullAccess

### 2. Create IAM role “generative-ai-demo-demo-operator”

Policies:
- AWSCodeCommitPowerUser
- AmazonSageMakerFullAccess
- AmazonS3FullAccess
- AmazonElasticContainerRegistryPublicFullAccess

### 3. Create CodeCommit repository and push this repository to it

Repository name: 'generative-ai-demo-on-miro'

### 4. Create ECR repository
Repository name = `generative-ai-demo-on-miro`

### 5. Create CloudBuild configuration & run build
- Compute: 3 GB memory, 2 vCPUs
- Image: `aws/codebuild/standard:5.0`
- Role: `generative-ai-demo-demo-operator`
- Buildspec: `backend/buildspec.yml`
- Environment variables:
  - `AWS_DEFAULT_REGION` = `us-east-1`
  - `AWS_ACCOUNT_ID` = `<AWS ID>`
  - `IMAGE_TAG` = `latest`
  - `IMAGE_REPO_NAME` = `generative-ai-demo-on-miro`

### 6. Create Lambda from ECR repository

- Create Lambda from ECR. Name = `lambda-generative-ai-demo-on-miro`
- Extend running time to 20s
- Setup environment variables:
  - `CLOUDFRONT_URL` = `<update after step 9>`
  - `S3_BUCKET` = `generative-ai-demo-on-miro-bucket`
  - `ENDPOINT_NAME_CREATE` = `jumpstart-example-infer-model-txt2img-demo-on-miro-1`
  - `ENDPOINT_NAME_INPAINT` = `jumpstart-example-model-inpainting-demo-on-miro-1`
  - `ENDPOINT_NAME_MODIFY` = `TBD`
  - `ENDPOINT_NAME_STYLE_TRANSFER` = `TBD`

**Note:** *Names of Sagemaker endpoints are hardcoded to notebooks to simplify demo start*

### 7. Create APIGateway

- Default endpoint: `Enabled`
- Stage name: `api`
- Invoke URL: `https://<ENDPOINT>/api`
- API endpoint: `https://<ENDPOINT>/api/lambda-generative-ai-demo-on-miro`

### 8. Create S3 bucket

Bucket name = 'generative-ai-demo-on-miro-bucket'

### 9. Create CloudFront distribution & lambda variable

- General settings: default root object: `index.html`
- Two origins:
  - Origin type: S3, Point to S3 bucket, Origin access control settings -> Update S3 bucket policy
  - Origin type: Custom origin, Point to APIGateway, protocol: match viewer
- Behavior: Default(*), plus `/api/*` -> redirect to APIGateway origin, HTTP methods: `POST`

**Don't forget to update Lambda environment variable with CloudFront URL !**

### 10. Update S3 bucket access policy

Setup following access policy to S3 to allow CloudFront access (example):
```
{
    "Version": "2008-10-17",
    "Id": "PolicyForCloudFrontPrivateContent",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::generative-ai-demo-on-miro-bucket/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": <<__ "arn:aws:cloudfront::616815736523:distribution/E21OMBYGU2GUQC" __>>
                }
            }
        }
    ]
}

```

### 11. Build frontend app & deploy to bucket

Open Cloud9, enter to main catalog of git repository.
````
$ cd frontend
$ npm install
$ npm run build
$ aws s3 rm s3://generative-ai-demo-on-miro-bucket/assets --recursive
$ aws s3 cp dist/ s3://generative-ai-demo-on-miro-bucket --recursive
````
Step 4 needs to clean previous installations.

### 12, 13, 14 Run Sagemaker endpoint

- open Sagemaker notebook
- run all steps
- check if endpoint works

**Don't forget delete endpoint after demo session to avoid high $$$ spend in your account !!!**

### 15. Open Miro and integrate application

**TBD**

