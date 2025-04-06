// Sidebar toggle functionality
document.getElementById('toggleSidebar').addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar');
    const container = document.querySelector('.sidebar-container');
    
    // Toggle collapsed state
    container.classList.toggle('sidebar-collapsed');
    
    // Update icon
    const icon = this.querySelector('i');
    icon.classList.toggle('bi-chevron-double-left');
    icon.classList.toggle('bi-chevron-double-right');
});

// New chat button functionality
document.getElementById('newChatBtn').addEventListener('click', async function() {
    // Clear the chat display
    document.getElementById('chatDisplay').innerHTML = '';
    
    // Mark previous chat as inactive
    const activeChat = document.querySelector('#chatHistoryList .active');
    if (activeChat) {
        activeChat.classList.remove('active');
    }
    
    // Create new chat via API
    try {
        const response = await fetch('/create_chat/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify({})
        });
        
        if (response.ok) {
            const data = await response.json();
            // Reload the page or update the sidebar dynamically
            window.location.reload();
        }
    } catch (error) {
        console.error('Error creating new chat:', error);
    }
});

// Add this to your existing JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Handle chat switching
    document.getElementById('chatHistoryList').addEventListener('click', async function(e) {
        const chatItem = e.target.closest('.list-group-item');
        if (!chatItem) return;
    
        e.preventDefault();
        const chatId = chatItem.dataset.chatId;
    
        document.querySelectorAll('#chatHistoryList .list-group-item').forEach(item => {
            item.classList.remove('active');
        });
    
        chatItem.classList.add('active');
    
        try {
            const response = await fetch(`/set_active_chat/${chatId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                }
            });
    
            if (!response.ok) throw new Error('Failed to switch chat');
    
            // Load chat messages
            const messagesResponse = await fetch(`/get_chat_messages/${chatId}/`);
            const messages = await messagesResponse.json();
    
            console.log("Loaded messages:", messages); // Debugging step
    
            const chatDisplay = document.getElementById('chatDisplay');
            chatDisplay.innerHTML = '';
    
            messages.messages.forEach(msg => {
                console.log("Adding message:", msg); // Debugging step
                addMessage(msg.role, msg.content, false);
            });
    
            chatDisplay.scrollTop = chatDisplay.scrollHeight;
    
        } catch (error) {
            console.error('Error switching chats:', error);
            chatItem.classList.remove('active');
        }
    });
    
});