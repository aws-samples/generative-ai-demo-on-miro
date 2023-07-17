import {
    aws_apigateway,
    aws_cloudfront,
    aws_cloudfront_origins,
    aws_ecr,
    aws_iam,
    aws_lambda,
    aws_s3,
    aws_s3_deployment,
	aws_logs,
    Duration,
    Stack,
    StackProps,
    RemovalPolicy,
    CfnOutput,
    CfnParameter
} from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as path from 'path'

export class DeployStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps ) {
        super(scope, id, props)

        const SECRET_ID = 'MiroSecret'

        const createImageEndpoint = new CfnParameter(this, 'CreateImageEndpoint', {
            type: 'String',
            description: 'Endpoint for creating image',
        });

        const inpaintEndpoint = new CfnParameter(this, 'InpaintEndpoint', {
            type: 'String',
            description: 'Endpoint for inpainting image',
        });

        const imageModifyEndpoint = new CfnParameter(this, 'ImageModifyEndpoint', {
            type: 'String',
            description: 'Endpoint for modifying image',
        });

        const styleTransferEndpoint = new CfnParameter(this, 'StyleTransferEndpoint', {
            type: 'String',
            description: 'Endpoint for style transfer',
        });

        const clientSecret = new CfnParameter(this, 'MiroClientSecret', {
            type: 'String',
            description: 'Client secret for Miro application',
        });

		//Bucket for access logs
		const logBucket = new aws_s3.Bucket(this, 'LogBucket', {
			removalPolicy: cdk.RemovalPolicy.RETAIN,
			enforceSSL: true
		});

        //Bucket for assets
        const assetsBucket = new aws_s3.Bucket(this, 'AssetsBucket', {
            autoDeleteObjects: true,
            removalPolicy: RemovalPolicy.DESTROY,
			enforceSSL: true,
			serverAccessLogsBucket: logBucket,
			serverAccessLogsPrefix: 'assetsbucket/'
        })

        //Provision data in assets S3 bucket
        new aws_s3_deployment.BucketDeployment(this, 'BucketDeployment', {
            sources: [
                aws_s3_deployment.Source.asset(
                    path.join(__dirname, '../../frontend/dist')
                ),
            ],
            destinationBucket: assetsBucket,
        })

        const secret = new aws_secretsmanager.Secret(this, SECRET_ID, {
            secretObjectValue: {
                clientSecret: cdk.SecretValue.unsafePlainText(clientSecret.valueAsString),
            },
        });

        // //API GW authorizer function and permissions to get parameters from Secret Manager
        const apiGWAuthFunction = new aws_lambda.DockerImageFunction(
            this,
            'APIGWAuthFunction',
            {
                functionName: 'APIGWauthFunction',
                //runtime: aws_lambda.Runtime.FROM_IMAGE,
                architecture: aws_lambda.Architecture.ARM_64,
                code: aws_lambda.DockerImageCode.fromImageAsset(
                    path.join(__dirname, '../../functions/authorize')
                ),
                environment: {
                    SECRET_ID,
                },
            }
        )
        apiGWAuthFunction.addToRolePolicy(
            new aws_iam.PolicyStatement({
                actions: ['ssm:GetParameter'],
                resources: ['*'],
            })
        )
        secret.grantRead(apiGWAuthFunction);


		//Log group for API Gateway
		const apiLogGroup = new aws_logs.LogGroup(this, 'ApiGwLogs', {
			logGroupName: 'generative-ai-demo-miro/apigw/BackendGateway',
			retention: aws_logs.RetentionDays.ONE_MONTH
		})

        //API Gateway
        const apiGateway = new aws_apigateway.RestApi(this, 'ApiGateway', {
            restApiName: 'BackendGateway',
            endpointConfiguration: {
                types: [aws_apigateway.EndpointType.REGIONAL],
            },
			deployOptions: {
				accessLogDestination: new aws_apigateway.LogGroupLogDestination(apiLogGroup),
				accessLogFormat: aws_apigateway.AccessLogFormat.jsonWithStandardFields()
			}
        })

        //Create API GW root path with region
        const regionResource = apiGateway.root.addResource('api')

        //Create API GW authorizer for header
        const authorizer = new aws_apigateway.RequestAuthorizer(
            this,
            'APIGWAuthorizer',
            {
                handler: apiGWAuthFunction,
                identitySources: [
                    aws_apigateway.IdentitySource.header('Authorization'),
                ],
                resultsCacheTtl: Duration.seconds(0),
            }
        )


        //CloudFront distribution for assets and API
        const distribution = new aws_cloudfront.Distribution(
            this,
            'CFDistribution',
            {
				enableLogging: true,
				logBucket: logBucket,
				logIncludesCookies: true,
				logFilePrefix: 'cloudfront/',
				defaultRootObject: 'index.html',
                defaultBehavior: {
                    origin: new aws_cloudfront_origins.S3Origin(assetsBucket),
                    allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_ALL,
                    responseHeadersPolicy:
                        aws_cloudfront.ResponseHeadersPolicy
                            .CORS_ALLOW_ALL_ORIGINS,
                },
                additionalBehaviors: {
                    'api/*': {
                        origin: new aws_cloudfront_origins.RestApiOrigin(
                            apiGateway
                        ),
                        allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_ALL,
                        cachePolicy: new aws_cloudfront.CachePolicy(
                            this,
                            'CachePolicy',
                            {
                                defaultTtl: Duration.seconds(0),
                                minTtl: Duration.seconds(0),
                                maxTtl: Duration.seconds(1),
                                headerBehavior:
                                    aws_cloudfront.CacheHeaderBehavior.allowList(
                                        'Authorization'
                                    ),
                            }
                        ),
                    }
                },
            }
        )

        const genAIProxyFunction = new aws_lambda.DockerImageFunction(
            this,
            'GenAIProxyFunction',
            {
                functionName: 'GenAIProxyFunction',
                architecture: aws_lambda.Architecture.ARM_64,
                code: aws_lambda.DockerImageCode.fromImageAsset(
                    path.join(__dirname, '../../functions/mlInference')
                ),
                environment: {
                    S3_BUCKET: assetsBucket.bucketName,
                    IMAGE_CREATE_ENDPOINT: createImageEndpoint.valueAsString,
                    INPAINT_ENDPOINT: inpaintEndpoint.valueAsString,
                    MODIFY_ENDPOINT: imageModifyEndpoint.valueAsString,
                    STYLE_TRANSFER_ENDPOINT: styleTransferEndpoint.valueAsString,
                },
                timeout: Duration.seconds(30),
            }
        )
        genAIProxyFunction.addToRolePolicy(
            new aws_iam.PolicyStatement({
                actions: [
                    'sagemaker:InvokeEndpoint',
                    's3:PutObject'
                ],
                resources: ['*'],
            })
        )
        const resourceGenAIProxy = regionResource.addResource('gen-ai-proxy')
        resourceGenAIProxy.addMethod(
            'POST',
            new aws_apigateway.LambdaIntegration(genAIProxyFunction),
            {
                authorizationType: aws_apigateway.AuthorizationType.CUSTOM,
                authorizer: authorizer,
            }
        )

        new CfnOutput(this, 'DistributionOutput', {
            exportName: 'DistributionURL',
            value: distribution.distributionDomainName,
        })
    }
}
