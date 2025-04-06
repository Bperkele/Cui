from django.db import models
from django.contrib.auth.models import User

class CuiChat(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100, default="New Guinea Pig Chat")
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

class CuiMessage(models.Model):
    chat = models.ForeignKey(CuiChat, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20)  # 'user' or 'assistant'
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)