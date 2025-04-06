from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import StreamingHttpResponse, JsonResponse
from .models import CuiChat, CuiMessage, CuiSystemPrompt
import json
import dotenv
import os
from openai import OpenAI
from django.views.decorators.csrf import csrf_exempt


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
        # Retrieve persisted system prompt, if any, from the session
        persisted_prompt = request.session.get('persisted_system_prompt')
        messages = data.get('messages', [])
        if persisted_prompt:
            # Check if a system message is already in the conversation; if not, add it
            if not any(m.get('role') == 'system' for m in messages):
                messages.insert(0, {"role": "system", "content": persisted_prompt})
        
        
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

def get_system_prompts(request):
    """Fetch all system prompts from the database"""
    prompts = CuiSystemPrompt.objects.all().values("id", "name", "value")
    return JsonResponse(list(prompts), safe=False)

@csrf_exempt
def set_system_prompt(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        prompt_id = data.get('prompt_id')
        custom_prompt = data.get('prompt_text', '').strip()
        persist = data.get('persist', False)

        final_prompt = None

        if prompt_id:
            prompt = get_object_or_404(CuiSystemPrompt, id=prompt_id)
            final_prompt = prompt.value
        elif custom_prompt:
            final_prompt = custom_prompt
        else:
            return JsonResponse({'success': False, 'error': 'No prompt provided'}, status=400)

        # Store or clear persisted prompt based on the persist flag.
        if persist:
            request.session['persisted_system_prompt'] = final_prompt
        else:
            # If not persisting, remove any stored prompt
            request.session.pop('persisted_system_prompt', None)

        return JsonResponse({'success': True, 'prompt': final_prompt})
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)


@csrf_exempt
def add_system_prompt(request):
    """Add a new system prompt to the database."""
    if request.method == 'POST':
        data = json.loads(request.body)
        name = data.get('name')
        value = data.get('value')

        if name and value:
            prompt = CuiSystemPrompt.objects.create(name=name, value=value)
            return JsonResponse({'success': True, 'prompt': {'id': prompt.id, 'name': prompt.name, 'value': prompt.value}})
        else:
            return JsonResponse({'success': False, 'error': 'Name and value are required'}, status=400)

    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

@csrf_exempt
def delete_system_prompt(request):
    """Delete a system prompt based on the provided prompt ID."""
    if request.method == 'POST':
        data = json.loads(request.body)
        prompt_id = data.get('prompt_id')

        if prompt_id:
            prompt = get_object_or_404(CuiSystemPrompt, id=prompt_id)
            prompt.delete()
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'error': 'Prompt ID is required'}, status=400)

    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)