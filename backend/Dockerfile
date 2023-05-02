#FROM public.ecr.aws/lambda/python:3.8
FROM ubuntu:20.04

RUN apt-get update && apt-get install -y --no-install-recommends git wget python3 python3-pip && pip install awslambdaric

COPY requirements.txt ./
RUN pip3 install -r requirements.txt
ENV PATH="/bin:/usr/bin:/sbin:/usr/sbin"

COPY *.py ./

ENTRYPOINT [ "/bin/python3", "-m", "awslambdaric" ]
#ENTRYPOINT ["/root/miniconda3/bin/python", "integration_style_transfer_func.py"]
CMD ["miro-ml-inference-invoke-lambda.lambda_handler"]

