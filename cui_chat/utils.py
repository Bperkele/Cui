# utils.py
from .models import CuiChat, CuiMessage
from django.contrib.auth.decorators import login_required

def get_or_create_active_chat(user, initial_message=None):
    """Get or create a chat with automatic title generation"""
    chat = CuiChat.objects.filter(user=user, is_active=True).first()
    
    if not chat:
        chat = CuiChat.objects.create(user=user)
        if initial_message:
            chat.update_title_from_message(initial_message)
    
    return chat