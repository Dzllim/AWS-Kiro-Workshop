"""Data stack: S3 buckets and DynamoDB tables.

Creates storage resources for MatchLens.
"""
import aws_cdk as cdk
from aws_cdk import (
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    RemovalPolicy,
)
from constructs import Construct


class DataStack(cdk.Stack):
    """S3 + DynamoDB resources for MatchLens."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # S3 Bucket for raw/processed datasets and model artifacts
        self.data_bucket = s3.Bucket(
            self, "DataBucket",
            bucket_name="matchlens-data",
            removal_policy=RemovalPolicy.RETAIN,
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
        )

        # DynamoDB: Predictions table
        self.predictions_table = dynamodb.Table(
            self, "PredictionsTable",
            table_name="matchlens-predictions",
            partition_key=dynamodb.Attribute(
                name="predictionId", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN,
        )
        self.predictions_table.add_global_secondary_index(
            index_name="userId-index",
            partition_key=dynamodb.Attribute(
                name="userId", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="createdAt", type=dynamodb.AttributeType.STRING
            ),
        )

        # DynamoDB: Users table
        self.users_table = dynamodb.Table(
            self, "UsersTable",
            table_name="matchlens-users",
            partition_key=dynamodb.Attribute(
                name="userId", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN,
        )
        self.users_table.add_global_secondary_index(
            index_name="email-index",
            partition_key=dynamodb.Attribute(
                name="email", type=dynamodb.AttributeType.STRING
            ),
        )

        # DynamoDB: Teams table
        self.teams_table = dynamodb.Table(
            self, "TeamsTable",
            table_name="matchlens-teams",
            partition_key=dynamodb.Attribute(
                name="teamId", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN,
        )

        # DynamoDB: Model Metrics table
        self.model_metrics_table = dynamodb.Table(
            self, "ModelMetricsTable",
            table_name="matchlens-model-metrics",
            partition_key=dynamodb.Attribute(
                name="modelId", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="version", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN,
        )

        # Outputs
        cdk.CfnOutput(self, "DataBucketName", value=self.data_bucket.bucket_name)
        cdk.CfnOutput(self, "PredictionsTableName", value=self.predictions_table.table_name)
