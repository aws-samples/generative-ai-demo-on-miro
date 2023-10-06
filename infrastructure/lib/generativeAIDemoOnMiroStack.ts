import {
    aws_apigateway,
    aws_cloudfront,
    aws_cloudfront_origins,
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
    aws_secretsmanager,
    SecretValue,
} from 'aws-cdk-lib'
import * as aws_lambda_python from '@aws-cdk/aws-lambda-python-alpha'
import { Construct } from 'constructs'
import * as path from 'path'

interface BackendStackProps extends StackProps {
    readonly clientAppSecret: string
    readonly createImageEndpointName: string
    readonly imageModifyEndpointName: string
    readonly imageInpaintEndpointName: string
}

export class DeployStack extends Stack {
    constructor(scope: Construct, id: string, props: BackendStackProps) {
        super(scope, id, props)

        const SECRET_ID = 'MiroSecret' // Secretsmanager ID for app secret

        //Bucket for access logs
        const logBucket = new aws_s3.Bucket(this, 'LogBucket', {
            removalPolicy: RemovalPolicy.RETAIN,
            enforceSSL: true,
            accessControl: aws_s3.BucketAccessControl.LOG_DELIVERY_WRITE,
        })

        //Bucket for assets
        const assetsBucket = new aws_s3.Bucket(this, 'AssetsBucket', {
            autoDeleteObjects: true,
            removalPolicy: RemovalPolicy.DESTROY,
            enforceSSL: true,
            serverAccessLogsBucket: logBucket,
            serverAccessLogsPrefix: 'assetsbucket/',
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
                clientSecret: SecretValue.unsafePlainText(
                    props.clientAppSecret
                ),
            },
        })

        // //API GW authorizer function and permissions to get parameters from Secret Manager
        const apiGWAuthFunction = new aws_lambda_python.PythonFunction(
            this,
            'APIGWAuthFunction',
            {
                entry:  path.join(__dirname, '../../functions/authorize'),
                runtime: aws_lambda.Runtime.PYTHON_3_8,
                environment: {
                    SECRET_ID: secret.secretName,
                },
            }
        )
        apiGWAuthFunction.addToRolePolicy(
            new aws_iam.PolicyStatement({
                actions: ['ssm:GetParameter'],
                resources: ['*'],
            })
        )
        secret.grantRead(apiGWAuthFunction)

        const imageGenerationLambdaLayer = new aws_lambda_python.PythonLayerVersion(this, 'imageGenerationLambdaLayer', {
            entry: path.join(__dirname, '../../functions/layers/image_generation_lambda_layer'),
            compatibleRuntimes: [aws_lambda.Runtime.PYTHON_3_8],
            compatibleArchitectures: [aws_lambda.Architecture.ARM_64],
        })

        const createImageFunction = new aws_lambda_python.PythonFunction(
            this,
            'CreateImageFunction',
            {
                entry:  path.join(__dirname, '../../functions/createImage'),
                runtime: aws_lambda.Runtime.PYTHON_3_8,
                architecture: aws_lambda.Architecture.ARM_64,
                environment: {
                    S3_BUCKET: assetsBucket.bucketName,
                    IMAGE_CREATE_ENDPOINT: props.createImageEndpointName,
                },
                timeout: Duration.seconds(90),
                layers: [imageGenerationLambdaLayer],
            }
        )
        createImageFunction.addToRolePolicy(
            new aws_iam.PolicyStatement({
                actions: ['sagemaker:InvokeEndpoint', 's3:PutObject'],
                resources: ['*'],
            })
        )

        const modifyImageFunction = new aws_lambda_python.PythonFunction(
            this,
            'ModifyImageFunction',
            {
                entry:  path.join(__dirname, '../../functions/modifyImage'),
                runtime: aws_lambda.Runtime.PYTHON_3_8,
                architecture: aws_lambda.Architecture.ARM_64,
                environment: {
                    S3_BUCKET: assetsBucket.bucketName,
                    MODIFY_ENDPOINT: props.imageModifyEndpointName,
                },
                timeout: Duration.seconds(90),
                layers: [imageGenerationLambdaLayer],
            }
        )
        modifyImageFunction.addToRolePolicy(
            new aws_iam.PolicyStatement({
                actions: ['sagemaker:InvokeEndpoint', 's3:PutObject'],
                resources: ['*'],
            })
        )

        const inPaintImageFunction = new aws_lambda_python.PythonFunction(
            this,
            'InPaintImageFunction',
            {
                entry:  path.join(__dirname, '../../functions/inpaintImage'),
                runtime: aws_lambda.Runtime.PYTHON_3_8,
                architecture: aws_lambda.Architecture.ARM_64,
                environment: {
                    S3_BUCKET: assetsBucket.bucketName,
                    INPAINT_ENDPOINT: props.imageInpaintEndpointName,
                },
                timeout: Duration.seconds(90),
                layers: [imageGenerationLambdaLayer],
            }
        )
        inPaintImageFunction.addToRolePolicy(
            new aws_iam.PolicyStatement({
                actions: ['sagemaker:InvokeEndpoint', 's3:PutObject'],
                resources: ['*'],
            })
        )

        //Log group for API Gateway
        const apiLogGroup = new aws_logs.LogGroup(this, 'GenerativeAIDemoApiGwLogs', {
            retention: aws_logs.RetentionDays.ONE_MONTH,
        })

        //API Gateway
        const apiGateway = new aws_apigateway.RestApi(this, 'ApiGateway', {
            restApiName: 'BackendGateway',
            endpointConfiguration: {
                types: [aws_apigateway.EndpointType.REGIONAL],
            },
            deployOptions: {
                accessLogDestination: new aws_apigateway.LogGroupLogDestination(
                    apiLogGroup
                ),
                accessLogFormat:
                    aws_apigateway.AccessLogFormat.jsonWithStandardFields(),
            },
            cloudWatchRole: true,
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
                    },
                },
            }
        )

        const resourceCreateImageProxy = regionResource.addResource('create-image-proxy')
        resourceCreateImageProxy.addMethod(
            'POST',
            new aws_apigateway.LambdaIntegration(createImageFunction),
            {
                authorizationType: aws_apigateway.AuthorizationType.CUSTOM,
                authorizer: authorizer,
            }
        )

        const resourceModifyImageProxy = regionResource.addResource('modify-image-proxy')
        resourceModifyImageProxy.addMethod(
            'POST',
            new aws_apigateway.LambdaIntegration(modifyImageFunction),
            {
                authorizationType: aws_apigateway.AuthorizationType.CUSTOM,
                authorizer: authorizer,
            }
        )

        const resourceInPaintImageProxy = regionResource.addResource('inpaint-image-proxy')
        resourceInPaintImageProxy.addMethod(
            'POST',
            new aws_apigateway.LambdaIntegration(inPaintImageFunction),
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
