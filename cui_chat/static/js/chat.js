// Auto-scroll to bottom of chat
function scrollToBottom() {
    const chatDisplay = document.getElementById('chatDisplay');
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

// Initial scroll to bottom
window.addEventListener('load', scrollToBottom);

// Chat functionality
document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    const model = document.getElementById('modelSelect').value;

    if (!message) return;

    let activeChatId = document.querySelector('#chatHistoryList .active')?.dataset.chatId;

    if (!activeChatId) {
        await document.getElementById('newChatBtn').click();
        activeChatId = document.querySelector('#chatHistoryList .active')?.dataset.chatId;
    }

    addMessage('user', message);
    input.value = '';

    const messages = Array.from(document.querySelectorAll('.message')).map(msg => ({
        role: msg.classList.contains('user-message') ? 'user' : 
            msg.classList.contains('system-message') ? 'system' : 'assistant',
        content: msg.querySelector('.message-content').textContent.trim()
    }));

    const placeholder = addMessage('assistant', '...', false);

    try {
        const response = await fetch('/stream_chat/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify({ messages, model })
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullMessage = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n\n').filter(line => line.trim());

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = JSON.parse(line.substring(6));
                    if (data.content) {
                        fullMessage += data.content;
                        placeholder.querySelector('.message-content').innerHTML = DOMPurify.sanitize(marked.parse(fullMessage));
                    }
                }
            }
        }

        // After sending, re-fetch messages to make sure they appear on reload
        await loadChatMessages(activeChatId);

    } catch (error) {
        console.error('Error:', error);
        placeholder.querySelector('.message-content').textContent = 
            'Sorry, there was an error processing your request.';
    }
}

async function loadChatMessages(chatId) {
    try {
        const messagesResponse = await fetch(`/get_chat_messages/${chatId}/`);
        const messages = await messagesResponse.json();

        const chatDisplay = document.getElementById('chatDisplay');
        chatDisplay.innerHTML = '';

        messages.messages.forEach(msg => {
            addMessage(msg.role, msg.content, false);
        });

        chatDisplay.scrollTop = chatDisplay.scrollHeight;

    } catch (error) {
        console.error('Error loading chat messages:', error);
    }
}

function addMessage(role, content, scroll = true) {
    const chatDisplay = document.getElementById('chatDisplay');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message mb-3 p-3 rounded ${role}-message`;
    
    const formattedContent = DOMPurify.sanitize(marked.parse(content));
    
    messageDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-1">
            <strong class="message-role">${role.charAt(0).toUpperCase() + role.slice(1)}</strong>
            <small class="text-muted">${new Date().toLocaleTimeString()}</small>
        </div>
        <div class="message-content">${formattedContent}</div>
    `;
    
    chatDisplay.appendChild(messageDiv);
    if (scroll) {
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }
    return messageDiv;
}

// Helper function to get CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}