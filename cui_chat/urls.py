from django.urls import path
from . import views

urlpatterns = [
    path('', views.chat_home, name='chat_home'),
    path('stream_chat/', views.stream_chat, name='stream_chat'),
    path('create_chat/', views.create_chat, name='create_chat'),
    path('set_active_chat/<int:chat_id>/', views.set_active_chat, name='set_active_chat'),
    path('get_chat_messages/<int:chat_id>/', views.get_chat_messages, name='get_chat_messages'),
]