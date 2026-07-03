"""AWS CDK application for MatchLens infrastructure.

Defines all AWS resources as infrastructure-as-code. (Req 20.3)
"""
import aws_cdk as cdk
from stacks.data_stack import DataStack
from stacks.api_stack import ApiStack

app = cdk.App()

# Data stack: S3 + DynamoDB
data_stack = DataStack(app, "MatchLensData",
    env=cdk.Environment(region="us-east-1"),
)

# API stack: Lambda + API Gateway
api_stack = ApiStack(app, "MatchLensApi",
    data_bucket=data_stack.data_bucket,
    predictions_table=data_stack.predictions_table,
    env=cdk.Environment(region="us-east-1"),
)

app.synth()
