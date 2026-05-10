let currentChatId = null;
let userLocation = null;
let isWaitingForAI = false;
let pendingImage = null; // { file, previewUrl }

async function initChat() {
  if (!api.isLoggedIn()) return;

  document.getElementById('new-chat-btn')?.addEventListener('click', startNewChat);
  document.getElementById('send-btn')?.addEventListener('click', sendMessage);

  const textarea = document.getElementById('chat-input');
  if (textarea) {
    textarea.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    });
  }

  // Image upload button
  const imageBtn = document.getElementById('image-btn');
  const imageInput = document.getElementById('image-input');
  if (imageBtn && imageInput) {
    imageBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
      if (file.size > 10 * 1024 * 1024) { alert('Image must be under 10MB'); return; }

      pendingImage = { file, previewUrl: URL.createObjectURL(file) };
      showImagePreview(pendingImage.previewUrl);
      imageInput.value = '';
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

async function sendMessage() {
  if (isWaitingForAI) return;

  const textarea = document.getElementById('chat-input');
  const text = textarea.value.trim();
  const imageToSend = pendingImage; // capture before any awaits

  if (!text && !imageToSend) return;
  if (!currentChatId) await startNewChat(); // may call clearImagePreview internally

  textarea.value = '';
  textarea.style.height = 'auto';
  showEmptyState(false);
  isWaitingForAI = true;
  toggleSendBtn(false);
  showTyping(true);

  try {
    let msgs;
    if (imageToSend) {
      clearImagePreview();
      msgs = await sendImageToAPI(currentChatId, imageToSend.file, text, imageToSend.previewUrl);
    } else {
      msgs = await api.post(`/api/chats/${currentChatId}/messages`, {
        saturs: text,
        latitude:  userLocation?.lat  || null,
        longitude: userLocation?.lng  || null,
        address:   userAddress        || null,
      });
    }
    showTyping(false);
    for (const msg of msgs) {
      appendMessage(msg.saturs, msg.zinaojuma_tips, msg.nosutisanas_laiks, msg.image_url);
    }
  } catch (e) {
    showTyping(false);
    appendMessage('⚠️ Error: ' + e.message, 'ai', new Date().toISOString());
  }

  isWaitingForAI = false;
  toggleSendBtn(true);
}

async function sendImageToAPI(chatId, file, text, localPreviewUrl) {
  const formData = new FormData();
  formData.append('image', file);
  if (text) formData.append('text', text);
  if (userLocation?.lat) formData.append('latitude', userLocation.lat);
  if (userLocation?.lng) formData.append('longitude', userLocation.lng);

  const res = await fetch(`/api/chats/${chatId}/messages/image`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${api.token()}` },
    body: formData,
  });

  if (res.status === 401) { api.logout(); return; }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);

  // Replace server URL with local preview so image shows immediately
  if (data[0]) data[0].image_url = localPreviewUrl;
  return data;
}

function appendMessage(text, type, time, imageUrl) {
  const container = document.getElementById('chat-messages');
  container.querySelector('.chat-empty')?.remove();

  const div = document.createElement('div');
  div.className = `message ${type}`;

  if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = 'max-width:100%;max-height:220px;border-radius:8px;display:block;margin-bottom:6px;cursor:pointer;';
    img.onclick = () => window.open(imageUrl, '_blank');
    div.appendChild(img);
  }

  if (text) {
    const content = document.createElement('div');
    if (type === 'ai' && window.marked) {
      content.className = 'md';
      content.innerHTML = marked.parse(text);
    } else {
      content.textContent = text;
    }
    div.appendChild(content);
  }

  const timeEl = document.createElement('div');
  timeEl.className = 'message-time';
  timeEl.textContent = formatDate(time);
  div.appendChild(timeEl);

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showImagePreview(url) {
  let preview = document.getElementById('image-preview-bar');
  if (!preview) {
    preview = document.createElement('div');
    preview.id = 'image-preview-bar';
    preview.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 0 4px;';
    document.querySelector('.chat-input-area').insertBefore(
      preview,
      document.querySelector('.chat-input-row')
    );
  }
  preview.innerHTML = `
    <div style="position:relative;display:inline-block;">
      <img src="${url}" style="height:60px;border-radius:8px;display:block;">
      <button onclick="clearImagePreview()" style="position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:#ef4444;border:none;color:white;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">✕</button>
    </div>
    <span style="font-size:12px;color:var(--text-muted);">Image ready to send</span>
  `;
}

function clearImagePreview() {
  document.getElementById('image-preview-bar')?.remove();
  pendingImage = null;
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
  clearImagePreview();
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
  document.getElementById('chat-input').value =
    `${t('btn_ask_ai').replace('💬 ', '')}: "${obj.nosaukums}". ${obj.iss_apraksts || ''}`.trim();
  sendMessage();
}

// ── Voice input (OpenAI Whisper via MediaRecorder) ───────────────────────────

function initVoiceInput() {
  const voiceWrap = document.getElementById('voice-wrap');
  const voiceBtn  = document.getElementById('voice-btn');
  const langSel   = document.getElementById('voice-lang');
  if (!voiceBtn) return;

  // Hide language selector — Whisper detects language automatically
  if (langSel) langSel.style.display = 'none';

  if (!navigator.mediaDevices?.getUserMedia) return; // browser doesn't support mic

  if (voiceWrap) voiceWrap.style.display = 'flex';

  let mediaRecorder = null;
  let chunks = [];
  let recording = false;

  voiceBtn.addEventListener('click', async () => {
    // Stop recording on second tap
    if (recording) {
      mediaRecorder?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];

      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Stop all mic tracks to release microphone indicator
        stream.getTracks().forEach(t => t.stop());
        recording = false;
        voiceBtn.classList.remove('recording');

        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: mimeType });
        await transcribeWithWhisper(blob, mimeType);
      };

      mediaRecorder.start();
      recording = true;
      voiceBtn.classList.add('recording');

    } catch (err) {
      alert('Microphone access denied. Please allow microphone in browser settings.');
    }
  });
}

async function transcribeWithWhisper(blob, mimeType) {
  const voiceBtn = document.getElementById('voice-btn');

  // Show loading state
  const origText = voiceBtn.textContent;
  voiceBtn.textContent = '⏳';
  voiceBtn.disabled = true;

  try {
    // Determine file extension from MIME type
    let ext = 'webm';
    if (mimeType.includes('ogg'))  ext = 'ogg';
    if (mimeType.includes('mp4') || mimeType.includes('m4a')) ext = 'mp4';
    if (mimeType.includes('wav'))  ext = 'wav';

    const formData = new FormData();
    formData.append('audio', blob, `voice.${ext}`);

    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${api.token()}` },
      body: formData,
    });

    if (res.status === 401) { api.logout(); return; }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);

    const text = data.text?.trim();
    if (text) {
      document.getElementById('chat-input').value = text;
      sendMessage();
    }
  } catch (err) {
    console.error('Whisper transcription error:', err);
    alert('Voice recognition error: ' + err.message);
  } finally {
    voiceBtn.textContent = origText;
    voiceBtn.disabled = false;
  }
}
