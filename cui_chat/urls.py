from django.urls import path
from . import views

urlpatterns = [
    path('', views.chat_home, name='chat_home'),
    path('stream_chat/', views.stream_chat, name='stream_chat'),
    path('create_chat/', views.create_chat, name='create_chat'),
    path('set_active_chat/<int:chat_id>/', views.set_active_chat, name='set_active_chat'),
    path('get_chat_messages/<int:chat_id>/', views.get_chat_messages, name='get_chat_messages'),
    path('delete_chat/<int:chat_id>/', views.delete_chat, name='delete_chat'),
    path('get_system_prompts/', views.get_system_prompts, name='get_system_prompts'),
    path('set_system_prompt/', views.set_system_prompt, name='set_system_prompt'),
    path('add_system_prompt/', views.add_system_prompt, name='add_system_prompt'),
    path('delete_system_prompt/', views.delete_system_prompt, name='delete_system_prompt'),
]