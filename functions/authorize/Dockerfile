FROM public.ecr.aws/lambda/python:3.8
WORKDIR ${LAMBDA_TASK_ROOT}
COPY requirements.txt app.py ./
RUN pip3 install -r requirements.txt

CMD [ "app.handler" ]