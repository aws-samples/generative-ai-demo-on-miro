![Build Status](https://gitlab.com/pages/plain-html/badges/master/build.svg)

---
## Generative AI demo on Miro board

# Installation
1. Create IAM role “generative-ai-demo-function”
2. Create IAM role “generative-ai-demo-demo-operator”
3. Create CodeCommit repository
4. Push this GitLab Repository to CodeCommit
5. (Automate next steps)
6. Create S3 bucket
7. Create subfolder ‘out_images’ 
8. Create CloudFront distribution 
9. Create ECR repository 
10. Create CloudBuild pipeline 
11. Run CloudBuild to build container/push to ECR
12. Create Lambda from ECR container (Parameters: Extend running time to 20 sec, Create environment variables. Role: “demo_function”)
13. Create API Gateway / point to Lambda
14. Setup npm for Cloud9 
15. Edit “index.js” / add API Gateway URL 
16. Enter to frontend/ and build frontend 
17. Deploy frontend to S3 bucket 
18. Start Sagemaker notebook 
19. Open “ml_example-1” notebook 
20. Setup environment variable for Lambda

") Note: don't forget shutdown all Sagemaker endpoints to avoid receiving unnecessary charges.



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
