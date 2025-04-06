from django.urls import path
from . import views

urlpatterns = [
    path('', views.chat_home, name='chat_home'),
    path('stream_chat/', views.stream_chat, name='stream_chat'),
]