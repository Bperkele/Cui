from django.db import models
from django.contrib.auth.models import User

class CuiChat(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-updated_at']

    def update_title(self, message_content):
        """Generate title from first user message"""
        from django.utils.text import Truncator
        self.title = Truncator(message_content).chars(40)
        self.save()

class CuiMessage(models.Model):
    chat = models.ForeignKey(CuiChat, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20, choices=[
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System')
    ])
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

class CuiSystemPrompt(models.Model):
    """Model for storing system prompts"""
    name = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
