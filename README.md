![Build Status](https://gitlab.com/pages/plain-html/badges/master/build.svg)

---
## Generative AI demo on Miro board

# Installation
1. Create IAM role “generative-ai-demo-function”
2. Create IAM role “generative-ai-demo-demo-operator”
3. Create CodeCommit and push this GitLab Repository to CodeCommit
4. (Automate next steps: 6, 7, 8, 9, 10, 11, 12, 13)
5. Create S3 bucket
6. Create subfolder ‘out_images’ 
7. Create CloudFront distribution 
8. Create ECR repository 
9. Create CloudBuild pipeline 
10. Run CloudBuild to build container/push to ECR
11. Create Lambda from ECR container (Parameters: Extend running time to 20 sec, Create environment variables. Role: “demo_function”)
12. Create API Gateway / point to Lambda
13. Edit “index.js” / add API Gateway URL 
14. [Build frontend and deploy to S3 bucket](#frontend-setup) 
15. Start Sagemaker notebook 
16. Open “ml_example-1” notebook 
17. Setup environment variable for Lambda

") Note: don't forget shutdown all Sagemaker endpoints to avoid receiving unnecessary charges.

## Create CloudFront and setup policy to S3
When you created S3 and CloudFront distrubution you need to setup correct access list ot S3. Here is the example:
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
            "Resource": "arn:aws:s3:::miro-app-image-style-transfer/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::616815736523:distribution/E21OMBYGU2GUQC"
                }
            }
        }
    ]
}

```

## Frontend setup
````
# cd frontend
# npm install
# npm run build
# aws s3 cp dist/ s3://<bucket_for_app_distribution> --recursive
````

---

Example plain HTML site using GitLab Pages.

Learn more about GitLab Pages at https://pages.gitlab.io and the official
documentation https://docs.gitlab.com/ce/user/project/pages/.

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [GitLab CI](#gitlab-ci)
- [GitLab User or Group Pages](#gitlab-user-or-group-pages)
- [Did you fork this project?](#did-you-fork-this-project)
- [Troubleshooting](#troubleshooting)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## GitLab CI

This project's static Pages are built by [GitLab CI][ci], following the steps
defined in [`.gitlab-ci.yml`](.gitlab-ci.yml):

```
image: alpine:latest

pages:
  stage: deploy
  script:
  - echo 'Nothing to do...'
  artifacts:
    paths:
    - public
  only:
  - master
```

The above example expects to put all your HTML files in the `public/` directory.

## GitLab User or Group Pages

To use this project as your user/group website, you will need one additional
step: just rename your project to `namespace.gitlab.io`, where `namespace` is
your `username` or `groupname`. This can be done by navigating to your
project's **Settings**.

Read more about [user/group Pages][userpages] and [project Pages][projpages].

## Did you fork this project?

If you forked this project for your own use, please go to your project's
**Settings** and remove the forking relationship, which won't be necessary
unless you want to contribute back to the upstream project.

## Troubleshooting

1. CSS is missing! That means that you have wrongly set up the CSS URL in your
   HTML files. Have a look at the [index.html] for an example.

[ci]: https://about.gitlab.com/gitlab-ci/
[index.html]: https://gitlab.com/pages/plain-html/blob/master/public/index.html
[userpages]: https://docs.gitlab.com/ce/user/project/pages/introduction.html#user-or-group-pages
[projpages]: https://docs.gitlab.com/ce/user/project/pages/introduction.html#project-pages
