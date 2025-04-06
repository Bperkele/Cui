from django.shortcuts import render
from .models import CuiChat, CuiMessage
from django.contrib.auth.decorators import login_required
from django.http import StreamingHttpResponse
import json
import dotenv
import os
from openai import OpenAI

# Load environment variables from .env file
dotenv.load_dotenv()
# Get OpenAI API key from environment variables
api_key = os.getenv("DEEPSEEK_API_KEY")
# Initialize OpenAI client
client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")


@login_required  
def chat_home(request):
    # Get or create active chat for user
    active_chat = CuiChat.objects.filter(user=request.user, is_active=True).first()
    if not active_chat:
        active_chat = CuiChat.objects.create(
            user=request.user,
            title="My First Guinea Pig Chat"
        )
    
    return render(request, 'cui_chat/index.html', {
        'active_chat': active_chat,
        'messages': active_chat.messages.all().order_by('timestamp')
    })

def stream_chat(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        messages = data.get('messages', [])
        model = data.get('model', 'deepseek-chat')
        
        def event_stream():
            stream = client.chat.completions.create(
                model=model,
                messages=messages,
                stream=True
            )
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield f"data: {json.dumps({'content': chunk.choices[0].delta.content})}\n\n"
        
        return StreamingHttpResponse(event_stream(), content_type='text/event-stream')