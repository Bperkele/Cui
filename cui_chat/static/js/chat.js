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

    // Add user message to chat
    addMessage('user', message);
    input.value = '';
    
    // Prepare messages for API - use existing messages array instead of querying DOM
    const messages = [];
    document.querySelectorAll('.message').forEach(msg => {
        // Skip the temporary assistant message we're about to create
        if (!msg.querySelector('.message-content')?.textContent.includes('...')) {
            messages.push({
                role: msg.classList.contains('user-message') ? 'user' : 
                    msg.classList.contains('system-message') ? 'system' : 'assistant',
                content: msg.querySelector('.message-content').textContent.trim()
            });
        }
    });

    // Create placeholder for streaming response
    const placeholder = addMessage('assistant', '...', false);
    
    try {
        const response = await fetch('/stream_chat/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify({
                messages: messages,
                model: model
            })
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
                    // Inside the while loop where you process chunks:
                    if (data.content) {
                        fullMessage += data.content;
                        const formatted = DOMPurify.sanitize(marked.parse(fullMessage));
                        placeholder.querySelector('.message-content').innerHTML = formatted;
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);
        placeholder.querySelector('.message-content').textContent = 
            'Sorry, there was an error processing your request.';
    }
}

function addMessage(role, content, scroll = true) {
    const chatDisplay = document.getElementById('chatDisplay');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message mb-3 p-3 rounded ${role}-message`;
    
    // Sanitize and parse markdown
    const cleanContent = DOMPurify.sanitize(marked.parse(content));
    
    messageDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-1">
            <strong class="message-role">${role.charAt(0).toUpperCase() + role.slice(1)}</strong>
            <small class="text-muted">${new Date().toLocaleTimeString()}</small>
        </div>
        <div class="message-content">${cleanContent}</div>
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