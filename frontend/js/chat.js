let currentChatId = null;
let userLocation = null;
let isWaitingForAI = false;

async function initChat() {
  if (!api.isLoggedIn()) return;

  const newBtn = document.getElementById('new-chat-btn');
  if (newBtn) newBtn.addEventListener('click', startNewChat);

  const sendBtn = document.getElementById('send-btn');
  const textarea = document.getElementById('chat-input');

  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  if (textarea) {
    textarea.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    });
  }

  initVoiceInput();
}

async function startNewChat() {
  try {
    const chat = await api.post('/api/chats');
    currentChatId = chat.id;
    clearMessages();
    showEmptyState(true);
    document.getElementById('chat-title').textContent = t('chat_panel_title');
  } catch (e) {
    alert('Could not create chat: ' + e.message);
  }
}

async function loadChat(chatId) {
  try {
    const chat = await api.get(`/api/chats/${chatId}`);
    currentChatId = chat.id;
    clearMessages();
    document.getElementById('chat-title').textContent = `Chat #${chat.id}`;

    if (chat.zinojumi && chat.zinojumi.length > 0) {
      showEmptyState(false);
      for (const msg of chat.zinojumi) {
        appendMessage(msg.saturs, msg.zinaojuma_tips, msg.nosutisanas_laiks);
      }
    } else {
      showEmptyState(true);
    }
  } catch (e) {
    console.error(e);
  }
}

async function sendMessage() {
  if (isWaitingForAI) return;

  const textarea = document.getElementById('chat-input');
  const text = textarea.value.trim();
  if (!text) return;

  if (!currentChatId) await startNewChat();

  textarea.value = '';
  textarea.style.height = 'auto';
  showEmptyState(false);
  isWaitingForAI = true;
  toggleSendBtn(false);
  showTyping(true);

  try {
    const msgs = await api.post(`/api/chats/${currentChatId}/messages`, {
      saturs: text,
      latitude: userLocation?.lat || null,
      longitude: userLocation?.lng || null,
    });
    showTyping(false);
    for (const msg of msgs) {
      appendMessage(msg.saturs, msg.zinaojuma_tips, msg.nosutisanas_laiks);
    }
  } catch (e) {
    showTyping(false);
    appendMessage('⚠️ Error: ' + e.message, 'ai', new Date().toISOString());
  }

  isWaitingForAI = false;
  toggleSendBtn(true);
}

function appendMessage(text, type, time) {
  const container = document.getElementById('chat-messages');
  const empty = container.querySelector('.chat-empty');
  if (empty) empty.remove();

  const div = document.createElement('div');
  div.className = `message ${type}`;

  const content = document.createElement('div');
  content.textContent = text;
  div.appendChild(content);

  const timeEl = document.createElement('div');
  timeEl.className = 'message-time';
  timeEl.textContent = formatDate(time);
  div.appendChild(timeEl);

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showTyping(visible) {
  const existing = document.getElementById('typing');
  if (visible && !existing) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.id = 'typing';
    div.className = 'typing-indicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  } else if (!visible && existing) {
    existing.remove();
  }
}

function clearMessages() {
  document.getElementById('chat-messages').innerHTML = '';
}

function showEmptyState(show) {
  const container = document.getElementById('chat-messages');
  const existing = container.querySelector('.chat-empty');
  if (show && !existing) {
    container.innerHTML = `
      <div class="chat-empty">
        <div class="icon">🤖</div>
        <h4>${t('chat_empty_title')}</h4>
        <p>${t('chat_empty_desc')}</p>
      </div>`;
  } else if (!show && existing) {
    existing.remove();
  }
}

function toggleSendBtn(enabled) {
  const btn = document.getElementById('send-btn');
  if (btn) btn.disabled = !enabled;
}

async function askAboutObject(obj) {
  if (!api.isLoggedIn()) { window.location.href = '/login.html'; return; }
  if (!currentChatId) await startNewChat();

  const textarea = document.getElementById('chat-input');
  textarea.value = `${t('btn_ask_ai').replace('💬 ', '')}: "${obj.nosaukums}". ${obj.iss_apraksts || ''}`.trim();
  sendMessage();
}

function initVoiceInput() {
  const voiceBtn = document.getElementById('voice-btn');
  if (!voiceBtn) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { voiceBtn.style.display = 'none'; return; }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = getLang() === 'lv' ? 'lv-LV' : 'en-US';

  let recording = false;

  voiceBtn.addEventListener('click', () => {
    recognition.lang = getLang() === 'lv' ? 'lv-LV' : 'en-US';
    recording ? recognition.stop() : recognition.start();
  });

  recognition.onstart = () => {
    recording = true;
    voiceBtn.classList.add('recording');
  };

  recognition.onend = () => {
    recording = false;
    voiceBtn.classList.remove('recording');
  };

  recognition.onresult = e => {
    document.getElementById('chat-input').value = e.results[0][0].transcript;
    sendMessage();
  };
}
