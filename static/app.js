// Add Event Listeners for sending message and toggling modes
document.getElementById('send-btn').addEventListener('click', sendMessage);
document.getElementById('mode-icon').addEventListener('click', toggleMode);

// Function to send a message and handle actor info retrieval
function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const messageText = messageInput.value.trim();

    if (messageText === "") return;  // Ignore empty messages

    // Create message bubble for the user
    const messageBubble = document.createElement('div');
    messageBubble.classList.add('message', 'user');
    messageBubble.textContent = messageText;

    // Append message to chat box
    const chatBox = document.getElementById('chat-box');
    chatBox.appendChild(messageBubble);

    // Show typing indicator while fetching data
    showTypingIndicator();

    // Send the actor name to the backend
    fetchActorInfo(messageText);

    // Clear input and scroll to bottom
    messageInput.value = "";
    messageInput.style.height = "auto"; // Reset the height after sending
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Function to fetch actor info from backend
function fetchActorInfo(actorName) {
    fetch('/get_actor_info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ actor: actorName }),  // Sending actor name to backend
    })
    .then(response => {
        console.log('Response status:', response.status);  // Log the status for debugging
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Backend response data:', data);  // Log data for debugging
        // Only remove typing indicator after displaying data
        removeTypingIndicator();

        if (data.error) {
            displayBotMessage(data.error);  // Handle error if any
        } else {
            displayActorInfo(data);  // Display the actor info if successful
        }
    })
    .catch(error => {
        removeTypingIndicator();
        console.error('Fetch error:', error);  // Log error for debugging
        displayBotMessage("An error occurred while fetching actor information.");
    });
}



// Function to show typing indicator
function showTypingIndicator() {
    const chatBox = document.getElementById('chat-box');
    const typingIndicator = document.createElement('div');
    typingIndicator.classList.add('message', 'bot', 'typing-indicator');
    typingIndicator.id = 'typing-indicator';
    typingIndicator.innerHTML = `
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
    `;
    chatBox.appendChild(typingIndicator);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Function to remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Function to display actor info (movies and word cloud)
function displayActorInfo(data) {
    const chatBox = document.getElementById('chat-box');

    // Display actor description if it exists
    if (data.description) {
        const descriptionMessage = document.createElement('div');
        descriptionMessage.classList.add('message', 'bot');
        descriptionMessage.textContent = data.description;  // Plain text for actor description
        chatBox.appendChild(descriptionMessage);
    }

    // Check if movie data exists and display as a table
    if (data.movies && data.movies.length > 0) {
        const resultMessage = document.createElement('div');
        resultMessage.classList.add('message', 'bot');

        // Build table dynamically
        let tableHTML = `
            <table class="movie-table">
                <thead>
                    <tr>
                        <th>Top 5 Movies by IMDB Reviewers</th>
                        <th>Rating</th>
                    </tr>
                </thead>
                <tbody>`;

        data.movies.forEach(movie => {
            tableHTML += `<tr><td>${movie.title}</td><td>${movie.rating}</td></tr>`;
        });

        tableHTML += `
                </tbody>
            </table>`;

        resultMessage.innerHTML = tableHTML;
        chatBox.appendChild(resultMessage);
    } else {
        displayBotMessage("No movies available.");
    }

    // Display word cloud if it exists
    if (data.wordcloud) {
        const wordCloudImg = document.createElement('img');
        wordCloudImg.src = 'data:image/png;base64,' + data.wordcloud;
        wordCloudImg.style.width = '100%';
        chatBox.appendChild(wordCloudImg);
    }

    // Scroll to the bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Function to display bot messages (for errors or simple notifications)
function displayBotMessage(message) {
    const chatBox = document.getElementById('chat-box');
    const messageBubble = document.createElement('div');
    messageBubble.classList.add('message', 'bot');
    messageBubble.textContent = message;
    chatBox.appendChild(messageBubble);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Toggle between Light and Dark Mode
function toggleMode() {
    const body = document.body;
    const modeIcon = document.getElementById('mode-icon');
    const modeImage = document.getElementById('mode-image');

    // Switch mode
    body.classList.toggle('dark-mode');
    body.classList.toggle('light-mode');

    // Update icon and tooltip
    if (body.classList.contains('dark-mode')) {
        modeImage.src = "https://img.icons8.com/ios-filled/50/ffffff/moon-symbol.png";  // Moon icon for dark mode
        modeIcon.setAttribute("title", "Switch to Light Mode");
    } else {
        modeImage.src = "https://img.icons8.com/ios-filled/50/000000/sun--v1.png";   // Sun icon for light mode
        modeIcon.setAttribute("title", "Switch to Dark Mode");
    }
}

// Handle Enter and Shift+Enter in the input field
document.getElementById('message-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent new line
        sendMessage();
    } else if (e.key === 'Enter' && e.shiftKey) {
        // Let Shift+Enter work as new line
        this.style.height = "auto";
        this.style.height = (this.scrollHeight) + "px";
    }
});