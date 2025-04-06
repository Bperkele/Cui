


let isPersisting = false;  // Default value, not persisting.

document.getElementById('persistSwitch').addEventListener('change', function () {
    // Check if the switch is on or off
    isPersisting = this.checked;
});

document.getElementById('systemPromptBtn').addEventListener('click', async function () {
    const select = document.getElementById('systemPromptSelect');
    try {
        const response = await fetch('/get_system_prompts/');
        const prompts = await response.json();
        // Clear any existing options.
        select.innerHTML = '<option value="">-- Select a system prompt --</option>';
        prompts.forEach(prompt => {
            const option = document.createElement('option');
            option.value = prompt.value; // The prompt text is stored as the value.
            option.textContent = prompt.name;
            option.setAttribute('data-id', prompt.id); // Save the prompt ID.
            select.appendChild(option);
        });
        new bootstrap.Modal(document.getElementById('systemPromptModal')).show();
    } catch (error) {
        console.error("Error fetching system prompts:", error);
    }
});

// When a preset is selected, update the textarea with the prompt's text.
document.getElementById('systemPromptSelect').addEventListener('change', function () {
    const selectedOption = this.options[this.selectedIndex];
    if (selectedOption && selectedOption.getAttribute('data-id')) {
        document.getElementById('systemPromptInput').value = selectedOption.value;
    } else {
        document.getElementById('systemPromptInput').value = '';
    }
});

document.getElementById('insertSystemPrompt').addEventListener('click', async function () {
    // Get the persist flag state from the switch.
    const persist = document.getElementById('persistSwitch').checked;
    const selectedOption = document.getElementById('systemPromptSelect').options[document.getElementById('systemPromptSelect').selectedIndex];
    const promptId = selectedOption ? selectedOption.getAttribute('data-id') : null;
    const promptText = document.getElementById('systemPromptInput').value.trim();

    if (promptId || promptText) {
        try {
            const payload = { persist: persist };
            if (promptId) {
                payload.prompt_id = promptId;
            } else {
                payload.prompt_text = promptText;
            }
            const response = await fetch('/set_system_prompt/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.success) {
                displaySystemPrompt(result.prompt);
            } else {
                alert("Failed to apply system prompt.");
            }
            bootstrap.Modal.getInstance(document.getElementById('systemPromptModal')).hide();
            // Reset inputs.
            document.getElementById('systemPromptInput').value = '';
            document.getElementById('systemPromptSelect').selectedIndex = 0;
        } catch (error) {
            console.error("Error setting system prompt:", error);
        }
    }
});

// Helper to display a system prompt in the chat window.
function displaySystemPrompt(promptContent) {
    const chatDisplay = document.getElementById('chatDisplay');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message mb-3 p-3 rounded system-message';
    messageDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-1">
            <strong class="message-role">System</strong>
            <small class="text-muted">${new Date().toLocaleTimeString()}</small>
        </div>
        <div class="message-content">${promptContent}</div>
    `;
    chatDisplay.appendChild(messageDiv);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

// When the page loads, check if there's a persisted system prompt
window.onload = function () {
    const persistedPrompt = localStorage.getItem('persistedSystemPrompt');
    if (persistedPrompt && isPersisting) {
        displaySystemPrompt(persistedPrompt);  // Display persisted prompt if toggle is on
    }
};


// --- Additional functions for dynamic add and remove ---

// Add a new system prompt via the modal.
document.getElementById('addSystemPrompt').addEventListener('click', async function () {
    const newName = document.getElementById('newPromptName').value.trim();
    const newValue = document.getElementById('newPromptValue').value.trim();
    if (newName && newValue) {
        try {
            const response = await fetch('/add_system_prompt/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({ name: newName, value: newValue })
            });
            const result = await response.json();
            if (result.success) {
                // Update the dropdown options manually after adding a prompt
                updateSystemPromptDropdown();
                document.getElementById('newPromptName').value = '';
                document.getElementById('newPromptValue').value = '';
                bootstrap.Modal.getInstance(document.getElementById('systemPromptModal')).hide(); // Close the modal
            } else {
                alert("Failed to add prompt.");
            }
        } catch (error) {
            console.error("Error adding prompt:", error);
        }
    } else {
        alert("Enter both a name and prompt text.");
    }
});

document.getElementById('deleteSystemPrompt').addEventListener('click', async function () {
    const selectedOption = document.getElementById('systemPromptSelect').options[document.getElementById('systemPromptSelect').selectedIndex];
    const promptId = selectedOption ? selectedOption.getAttribute('data-id') : null;
    if (promptId && confirm("Are you sure you want to delete this prompt?")) {
        try {
            const response = await fetch('/delete_system_prompt/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({ prompt_id: promptId })
            });
            const result = await response.json();
            if (result.success) {
                // Update the dropdown options manually after deletion
                updateSystemPromptDropdown();
                bootstrap.Modal.getInstance(document.getElementById('systemPromptModal')).hide(); // Close the modal
            } else {
                alert("Failed to delete prompt.");
            }
        } catch (error) {
            console.error("Error deleting prompt:", error);
        }
    }
});

// Function to update the system prompt dropdown
async function updateSystemPromptDropdown() {
    const select = document.getElementById('systemPromptSelect');
    try {
        const response = await fetch('/get_system_prompts/');
        const prompts = await response.json();
        // Clear existing options and add new ones
        select.innerHTML = '<option value="">-- Select a system prompt --</option>';
        prompts.forEach(prompt => {
            const option = document.createElement('option');
            option.value = prompt.value;
            option.textContent = prompt.name;
            option.setAttribute('data-id', prompt.id);
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching system prompts:", error);
    }
}
