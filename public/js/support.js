// ===== Customer Support Module =====
// Built-in customer support chat system

class CustomerSupport {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.loadHistory();
    }

    loadHistory() {
        const saved = localStorage.getItem('supportChatHistory');
        if (saved) {
            this.messages = JSON.parse(saved);
        }
    }

    saveHistory() {
        localStorage.setItem('supportChatHistory', JSON.stringify(this.messages));
    }

    addMessage(text, isUser = true) {
        const message = {
            text,
            isUser,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };
        this.messages.push(message);
        this.saveHistory();
        return message;
    }

    getAutoResponse(query) {
        const lowerQuery = query.toLowerCase();

        // Quick responses for common questions
        if (lowerQuery.includes('hours') || lowerQuery.includes('open')) {
            return "Our support team is available Monday-Friday, 9 AM - 6 PM EST. For urgent issues, please email support@digitalinventory.com";
        }

        if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('pricing')) {
            return "For pricing information, please visit our website or contact sales@digitalinventory.com";
        }

        if (lowerQuery.includes('bug') || lowerQuery.includes('error') || lowerQuery.includes('problem')) {
            return "Thank you for reporting this issue. Please provide:\n1. What you were trying to do\n2. What happened instead\n3. Any error messages\n\nOur team will investigate and respond within 24 hours.";
        }

        if (lowerQuery.includes('feature') || lowerQuery.includes('request')) {
            return "We love hearing feature ideas! Please describe your suggestion in detail. Our product team reviews all requests.";
        }

        if (lowerQuery.includes('help') || lowerQuery.includes('how')) {
            return "I'm here to help! Common topics:\n• Account & Billing\n• Technical Issues\n• Feature Requests\n• General Questions\n\nWhat do you need help with?";
        }

        // Default response
        return "Thank you for contacting support! A team member will respond shortly. In the meantime, check out our Help Center at help.digitalinventory.com";
    }

    clearHistory() {
        this.messages = [];
        this.saveHistory();
    }
}

// Initialize customer support
const customerSupport = new CustomerSupport();

// Quick response templates
const quickResponses = [
    "I need help with billing",
    "I found a bug",
    "Feature request",
    "How do I...?",
    "Technical issue"
];

// UI Functions
function toggleSupportChat() {
    const chatContainer = document.getElementById('supportChatContainer');
    const chatButton = document.getElementById('supportChatButton');

    if (customerSupport.isOpen) {
        chatContainer.classList.remove('active');
        chatButton.classList.remove('active');
        customerSupport.isOpen = false;
    } else {
        chatContainer.classList.add('active');
        chatButton.classList.add('active');
        customerSupport.isOpen = true;
        renderSupportMessages();
    }
}

function renderSupportMessages() {
    const messagesContainer = document.getElementById('supportMessages');

    if (customerSupport.messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="support-welcome">
                <div class="support-welcome-icon">💬</div>
                <h3>Customer Support</h3>
                <p>How can we help you today?</p>
                <div class="quick-responses">
                    ${quickResponses.map(text => `
                        <button class="quick-response-btn" onclick="sendQuickResponse('${text}')">
                            ${text}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        return;
    }

    messagesContainer.innerHTML = customerSupport.messages.map(msg => `
        <div class="support-message ${msg.isUser ? 'user' : 'agent'}">
            <div class="support-message-content">${msg.text.replace(/\n/g, '<br>')}</div>
            <div class="support-message-time">${new Date(msg.timestamp).toLocaleTimeString()}</div>
        </div>
    `).join('');

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendSupportMessage() {
    const input = document.getElementById('supportInput');
    const message = input.value.trim();

    if (!message) return;

    // Add user message
    customerSupport.addMessage(message, true);
    input.value = '';
    renderSupportMessages();

    // Auto-response after short delay
    setTimeout(() => {
        const response = customerSupport.getAutoResponse(message);
        customerSupport.addMessage(response, false);
        renderSupportMessages();
    }, 1000);
}

function sendQuickResponse(text) {
    const input = document.getElementById('supportInput');
    input.value = text;
    sendSupportMessage();
}

function clearSupportChat() {
    if (confirm('Clear all support chat history?')) {
        customerSupport.clearHistory();
        renderSupportMessages();
    }
}

function createSupportTicket() {
    const messages = customerSupport.messages
        .map(msg => `[${msg.isUser ? 'You' : 'Support'}] ${msg.text}`)
        .join('\n\n');

    const ticket = {
        timestamp: new Date().toISOString(),
        messages: messages,
        user: JSON.parse(localStorage.getItem('user') || '{}').username
    };

    // Save ticket
    const tickets = JSON.parse(localStorage.getItem('supportTickets') || '[]');
    tickets.push(ticket);
    localStorage.setItem('supportTickets', JSON.stringify(tickets));

    alert('Support ticket created! Reference ID: ' + ticket.timestamp.slice(0, 10));
}
