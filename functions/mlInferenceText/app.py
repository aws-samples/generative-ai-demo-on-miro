import boto3
import json
import os
import sys
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain.llms.bedrock import Bedrock
from langchain.schema import messages_from_dict, messages_to_dict
from langchain.memory.chat_message_histories.in_memory import ChatMessageHistory
from langchain import PromptTemplate


def extract_summarization_message(event):
    # Function to extract summarization message from API GW event
    print('Extracting summarization message')
    try:
        body = json.loads(event.get('body'))
        topic = body['topic']
        notes = ('')
        for note in body['notes']:
            notes += note
            notes += '\n'
        message = f"""
        \n\nHuman: Summarize result of the brainstorming session with the topic: {topic}.
        Notes done by brainstorming attendees:
        {notes}
        Answer in less than 100 words.
        Do not mention amount of words in the answer.
        
        \n\nAssistant:
        """
        print('Message to LLM is: ', message)
    except Exception as e:
        print('Event parsing failed with exception: ', e)
        message = 'Hi!'
    return message


def extract_comment_message(event):
    # Function to extract comment message from API GW event
    print('Extracting comment message')
    try:
        body = json.loads(event.get('body'))
        role = body['role']
        summary = body['summary']
        message = f"""
        \n\nHuman: You are {role} in the company. Recently team had a brainstorming and came up with summary:
        {summary}
        Give comments on benefits and concerns relevant to your role regarding this summary in less than 100 words.
        Do not mention amount of words in the answer.
        
        \n\nAssistant:
        """
        print('Message to LLM is: ', message)
    except Exception as e:
        print('Event parsing failed with exception: ', e)
        message = ('Hi!')
    return message


def request_answer(message):
    # Function to call Bedrock (Claude) for answer to the question message
    # Prompt includes conversation history
    print('Starting request')
    boto_session = boto3.Session()

    boto3_bedrock = boto_session.client(service_name='bedrock',
                                        region_name='us-west-2',
                                        endpoint_url='https://bedrock-runtime.us-west-2.amazonaws.com')
    print('Created client')

    cl_llm = Bedrock(model_id=os.environ['MODELID'],
                     client=boto3_bedrock,
                     model_kwargs={"max_tokens_to_sample": int(os.environ['MAXTOKENS'])})
    conversation = ConversationChain(llm=cl_llm, verbose=False)
    response = conversation.predict(input=message)
    return response


def cleanup_answer(answer):
    # Function to remove intro and new line symbols from LLM response
    if '\n\n' in answer:
        return answer.split('\n\n')[1]
    elif ':' in answer:
        return answer.split(':')[1]
    return answer


def handler(event, context):
    print('Starting handler')
    print('Event received: ', event)

    body = json.loads(event.get('body'))
    if body['task'] == "BrainstormingSummarization":
        message = extract_summarization_message(event)
    elif body['task'] == "BrainstormingSummaryCommentByRole":
        message = extract_comment_message(event)

    answer = request_answer(message)
    print('LLM response is: ', answer)
    llm_response = {'content': cleanup_answer(str(answer))}
    return {
         "headers": {"Content-Type": "text/json", "Access-Control-Allow-Origin": "*",
                     "Access-Control-Allow-Headers": "*",
                     "Access-Control-Allow-Methods": "OPTIONS,POST,GET", "Cache-Control": "no-cache"},
        "statusCode": 200,
        "body": json.dumps(llm_response)
            }
