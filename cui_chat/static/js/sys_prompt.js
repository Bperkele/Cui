document.getElementById('systemPromptBtn').addEventListener('click', function() {
    new bootstrap.Modal(document.getElementById('systemPromptModal')).show();
});

document.getElementById('insertSystemPrompt').addEventListener('click', function() {
    const prompt = document.getElementById('systemPromptInput').value;
    if (prompt) {
        const chatDisplay = document.getElementById('chatDisplay');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message mb-3 p-3 rounded system-message';
        messageDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-1">
                <strong class="message-role">System</strong>
                <small class="text-muted">${new Date().toLocaleTimeString()}</small>
            </div>
            <div class="message-content">${prompt}</div>
        `;
        chatDisplay.appendChild(messageDiv);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
        bootstrap.Modal.getInstance(document.getElementById('systemPromptModal')).hide();
        document.getElementById('systemPromptInput').value = '';
    }
});
