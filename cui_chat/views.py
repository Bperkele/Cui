from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import StreamingHttpResponse, JsonResponse
from .models import CuiChat, CuiMessage
import json
import dotenv
import os
from openai import OpenAI

dotenv.load_dotenv()
client = OpenAI(api_key=os.getenv("DEEPSEEK_API_KEY"), base_url="https://api.deepseek.com")

@login_required  
def chat_home(request):
    # Get or create active chat
    active_chat = CuiChat.objects.filter(user=request.user, is_active=True).first()
    if not active_chat:
        active_chat = CuiChat.objects.create(
            user=request.user,
            title="New Chat"
        )
    
    return render(request, 'cui_chat/index.html', {
        'active_chat': active_chat,
        'messages': active_chat.messages.all().order_by('timestamp'),
        'chat_history': CuiChat.objects.filter(user=request.user).order_by('-updated_at')
    })

@login_required
def stream_chat(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user_message = data.get('messages', [])[-1]['content']
        model = data.get('model', 'deepseek-chat')
        
        # Get or create chat
        chat = CuiChat.objects.filter(user=request.user, is_active=True).first()
        if not chat:
            chat = CuiChat.objects.create(user=request.user)
        
        # Update title if first message
        if chat.messages.count() == 0:
            chat.update_title(user_message)
        
        # Save user message
        CuiMessage.objects.create(
            chat=chat,
            role='user',
            content=user_message
        )
        
        def event_stream():
            assistant_message = None
            full_content = ""
            
            stream = client.chat.completions.create(
                model=model,
                messages=data.get('messages', []),
                stream=True
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_content += content
                    
                    # Create or update assistant message
                    if not assistant_message:
                        assistant_message = CuiMessage.objects.create(
                            chat=chat,
                            role='assistant',
                            content=content
                        )
                    else:
                        assistant_message.content = full_content
                        assistant_message.save()
                    
                    yield f"data: {json.dumps({'content': content})}\n\n"
        
        return StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    
@login_required
def create_chat(request):
    if request.method == 'POST':
        # Mark all previous chats as inactive
        CuiChat.objects.filter(user=request.user).update(is_active=False)
        
        # Create new chat
        new_chat = CuiChat.objects.create(
            user=request.user,
            title="New Chat"
        )
        
        return JsonResponse({
            'id': new_chat.id,
            'title': new_chat.title,
            'success': True
        })
    return JsonResponse({'success': False}, status=400)

@login_required
def set_active_chat(request, chat_id):
    if request.method == 'POST':
        # Mark all chats as inactive
        CuiChat.objects.filter(user=request.user).update(is_active=False)
        
        # Mark selected chat as active
        chat = get_object_or_404(CuiChat, id=chat_id, user=request.user)
        chat.is_active = True
        chat.save()
        
        return JsonResponse({'success': True})
    return JsonResponse({'success': False}, status=400)

@login_required
def get_chat_messages(request, chat_id):
    chat = get_object_or_404(CuiChat, id=chat_id, user=request.user)
    messages = chat.messages.all().order_by('timestamp')

    if not messages:
        return JsonResponse({'messages': []})  # Ensure an empty array is returned if no messages

    return JsonResponse({
        'messages': [
            {
                'role': msg.role,
                'content': msg.content,
                'timestamp': msg.timestamp.isoformat()
            } 
            for msg in messages
        ]
    })

@login_required
def delete_chat(request, chat_id):
    if request.method == 'POST':
        chat = get_object_or_404(CuiChat, id=chat_id, user=request.user)
        chat.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False}, status=400)
