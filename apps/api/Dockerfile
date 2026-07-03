FROM public.ecr.aws/lambda/python:3.11

# Copy requirements and install dependencies
COPY requirements.txt ${LAMBDA_TASK_ROOT}/
RUN pip install -r ${LAMBDA_TASK_ROOT}/requirements.txt --target ${LAMBDA_TASK_ROOT}

# Copy application code
COPY . ${LAMBDA_TASK_ROOT}/

# Copy prediction engine
COPY ../../packages/prediction-engine/ ${LAMBDA_TASK_ROOT}/prediction_engine/

# Copy sample data
COPY ../../data/sample/ ${LAMBDA_TASK_ROOT}/data/sample/

# Set the handler
CMD ["main.handler"]
