"""API stack: Lambda container + API Gateway.

Deploys the FastAPI backend as a Lambda container image. (Req 20.2)
"""
import aws_cdk as cdk
from aws_cdk import (
    aws_lambda as _lambda,
    aws_apigateway as apigw,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    Duration,
)
from constructs import Construct


class ApiStack(cdk.Stack):
    """Lambda + API Gateway for MatchLens API."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        data_bucket: s3.Bucket,
        predictions_table: dynamodb.Table,
        **kwargs,
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Lambda function from container image (Req 20.2)
        api_function = _lambda.DockerImageFunction(
            self, "ApiFunction",
            function_name="matchlens-api",
            code=_lambda.DockerImageCode.from_image_asset(
                directory="../../apps/api",
            ),
            memory_size=1024,
            timeout=Duration.seconds(30),
            environment={
                "S3_BUCKET": data_bucket.bucket_name,
                "DYNAMODB_TABLE_PREFIX": "matchlens-",
                "AWS_REGION": "us-east-1",
                "JWT_SECRET": "change-this-in-production",
                "DEBUG": "false",
            },
        )

        # Grant permissions
        data_bucket.grant_read_write(api_function)
        predictions_table.grant_read_write_data(api_function)

        # Bedrock permissions for AI explanations
        api_function.add_to_role_policy(
            iam.PolicyStatement(
                actions=["bedrock:InvokeModel"],
                resources=["*"],
            )
        )

        # API Gateway
        api = apigw.LambdaRestApi(
            self, "ApiGateway",
            handler=api_function,
            rest_api_name="MatchLens API",
            proxy=True,
            deploy_options=apigw.StageOptions(
                stage_name="v1",
                throttling_rate_limit=100,
                throttling_burst_limit=200,
            ),
        )

        # Outputs
        cdk.CfnOutput(self, "ApiUrl", value=api.url)
        cdk.CfnOutput(self, "FunctionName", value=api_function.function_name)
