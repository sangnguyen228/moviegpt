
document.getElementById('send-btn').addEventListener('click', sendMessage);
document.getElementById('mode-icon').addEventListener('click', toggleMode);
displayBotMessage('Enter the name of your favourite actor')


function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const messageText = messageInput.value.trim();

    if (messageText === "") return; 

    const messageBubble = document.createElement('div');
    messageBubble.classList.add('message', 'user');
    messageBubble.textContent = messageText;

    const chatBox = document.getElementById('chat-box');
    chatBox.appendChild(messageBubble);

    showTypingIndicator();

    fetchActorInfo(messageText);

    messageInput.value = "";
    messageInput.style.height = "auto";
    chatBox.scrollTop = chatBox.scrollHeight;
}

function fetchActorInfo(actorName) {
    fetch('/get_actor_info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ actor: actorName }),
    })
    .then(response => {
        console.log('Response status:', response.status); 
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Backend response data:', data); 
        removeTypingIndicator();

        if (data.error) {
            displayBotMessage(data.error);
        } else {
            displayActorInfo(data); 
        }
    })
    .catch(error => {
        removeTypingIndicator();
        console.error('Fetch error:', error); 
        displayBotMessage("An error occurred while fetching actor information.");
    });
}

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

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function displayActorInfo(data) {
    const chatBox = document.getElementById('chat-box');

    if (data.description) {
        const descriptionMessage = document.createElement('div');
        descriptionMessage.classList.add('message', 'bot');
        //descriptionMessage.textContent = data.description; 
        descriptionMessage.innerHTML = data.description.replace(/\n/g, '<br>');
        chatBox.appendChild(descriptionMessage);
    }

    if (data.movies && data.movies.length > 0) {
        const resultMessage = document.createElement('div');
        resultMessage.classList.add('message', 'bot');

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

    if (data.wordcloud) {
        const wordCloudImg = document.createElement('img');
        wordCloudImg.src = 'data:image/png;base64,' + data.wordcloud;
        wordCloudImg.style.width = '100%';
        chatBox.appendChild(wordCloudImg);
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}

function displayBotMessage(message) {
    const chatBox = document.getElementById('chat-box');
    const messageBubble = document.createElement('div');
    messageBubble.classList.add('message', 'bot');
    messageBubble.textContent = message;
    chatBox.appendChild(messageBubble);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function toggleMode() {
    const body = document.body;
    const modeIcon = document.getElementById('mode-icon');
    const modeImage = document.getElementById('mode-image');

    body.classList.toggle('dark-mode');
    body.classList.toggle('light-mode');

    if (body.classList.contains('dark-mode')) {
        modeImage.src = "https://img.icons8.com/ios-filled/50/ffffff/moon-symbol.png";  // Moon icon for dark mode
        modeIcon.setAttribute("title", "Switch to Light Mode");
    } else {
        modeImage.src = "https://img.icons8.com/ios-filled/50/000000/sun--v1.png";   // Sun icon for light mode
        modeIcon.setAttribute("title", "Switch to Dark Mode");
    }
}

document.getElementById('message-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); 
        sendMessage();
    } else if (e.key === 'Enter' && e.shiftKey) {
        
        this.style.height = "auto";
        this.style.height = (this.scrollHeight) + "px";
    }
});