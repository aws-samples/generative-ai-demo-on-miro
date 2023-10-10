# Use Amazon Linux 2 with the AWS Lambda Runtime Interface Client (RIC)
FROM public.ecr.aws/lambda/python:3.9

# Install OS level dependencies
RUN yum install -y \
    gcc \
    python3-devel \
    libffi-devel \
    libxslt-devel \
    libxml2-devel
# Install Python dependencies
COPY requirements.txt ./
RUN python3 -m pip install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"
RUN pip install --upgrade urllib3 --target "${LAMBDA_TASK_ROOT}"

# Copy the lambda function (app.py is your lambda function)
COPY app.py ${LAMBDA_TASK_ROOT}

# Command can be overwritten by providing a different command in the template directly.
CMD ["app.handler"]