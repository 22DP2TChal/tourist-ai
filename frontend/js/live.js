// ── Live AI — Web Speech API (real-time) + OpenAI TTS ────────────────────────

let liveActive       = false;
let liveChatId       = null;
let liveRecognition  = null;
let liveSpeaking     = false;
let liveCurrentAudio = null;
let liveDebounce     = null;   // timer to send after pause
let livePending      = '';     // accumulated final text

const SEND_PAUSE_MS = 1200;    // send to AI after 1.2s pause in speech

// ── Init ──────────────────────────────────────────────────────────────────────

function initLiveAI() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    document.getElementById('live-no-support').style.display = 'flex';
    document.getElementById('live-ready').style.display      = 'none';
    return;
  }
  document.getElementById('live-start-btn')?.addEventListener('click', toggleLive);
  document.getElementById('live-skip-btn')?.addEventListener('click', skipSpeaking);
}

function onLiveTabLeave() {
  if (liveActive) stopConversation();
}

// ── Start / Stop ──────────────────────────────────────────────────────────────

async function toggleLive() {
  if (liveActive) { stopConversation(); return; }

  if (!api.isLoggedIn()) { window.location.href = '/login.html'; return; }

  try {
    const chat = await api.post('/api/chats');
    liveChatId = chat.id;
  } catch (e) { alert('Error: ' + e.message); return; }

  liveActive   = true;
  liveSpeaking = false;
  livePending  = '';
  clearLiveMessages();
  hideLiveBubble();

  document.getElementById('live-start-btn').textContent = '⏹';
  document.getElementById('live-start-btn').classList.add('active');
  document.getElementById('live-skip-btn').style.display = 'flex';

  setLiveStatus('listening');
  startRecognition();
}

function stopConversation() {
  liveActive = false;
  stopRecognition();
  stopAudio();
  clearTimeout(liveDebounce);
  livePending  = '';
  liveSpeaking = false;

  document.getElementById('live-start-btn').textContent = '🎤';
  document.getElementById('live-start-btn').classList.remove('active');
  document.getElementById('live-skip-btn').style.display = 'none';

  hideLiveBubble();
  setLiveStatus('idle');
}

// ── Speech recognition ────────────────────────────────────────────────────────

function startRecognition() {
  if (!liveActive || liveSpeaking) return;
  stopRecognition();

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  liveRecognition = new SR();
  liveRecognition.continuous     = true;
  liveRecognition.interimResults = true;
  liveRecognition.lang = document.getElementById('live-lang-sel')?.value || 'en-US';

  liveRecognition.onresult = onSpeechResult;

  liveRecognition.onerror = e => {
    if (e.error === 'no-speech') return; // normal — keep running
    if (liveActive && !liveSpeaking) scheduleRestart(300);
  };

  liveRecognition.onend = () => {
    if (liveActive && !liveSpeaking) scheduleRestart(200);
  };

  try { liveRecognition.start(); } catch (_) {}
}

function stopRecognition() {
  if (liveRecognition) {
    try { liveRecognition.abort(); } catch (_) {}
    liveRecognition = null;
  }
}

let _restartTimer = null;
function scheduleRestart(ms) {
  clearTimeout(_restartTimer);
  _restartTimer = setTimeout(() => {
    if (liveActive && !liveSpeaking) startRecognition();
  }, ms);
}

// ── Handle recognition results ────────────────────────────────────────────────

function onSpeechResult(e) {
  let interim = '';
  let final   = '';

  for (let i = e.resultIndex; i < e.results.length; i++) {
    const t = e.results[i][0].transcript;
    if (e.results[i].isFinal) final   += t;
    else                       interim += t;
  }

  // Show what user is saying right now
  if (interim) showLiveBubble(interim, true);
  if (final)   showLiveBubble(final,   false);

  if (final) {
    livePending += (livePending ? ' ' : '') + final.trim();

    // Reset debounce: send after SEND_PAUSE_MS of no new final results
    clearTimeout(liveDebounce);
    liveDebounce = setTimeout(() => {
      if (livePending.trim() && liveActive && !liveSpeaking) {
        const text = livePending.trim();
        livePending = '';
        processUserSpeech(text);
      }
    }, SEND_PAUSE_MS);
  }
}

// ── Process: AI request + TTS ─────────────────────────────────────────────────

async function processUserSpeech(text) {
  stopRecognition();
  clearTimeout(liveDebounce);
  liveSpeaking = true;

  // Commit user bubble to history
  commitLiveBubble(text);
  setLiveStatus('thinking');

  try {
    const msgs = await api.post(`/api/chats/${liveChatId}/messages`, {
      saturs:    text,
      latitude:  userLocation?.lat  || null,
      longitude: userLocation?.lng  || null,
      address:   userAddress        || null,
    });

    const aiText = msgs?.find(m => m.zinaojuma_tips === 'ai')?.saturs;
    if (!aiText) { liveSpeaking = false; resume(); return; }

    addLiveMessage('ai', aiText);
    setLiveStatus('speaking');
    await playTTS(aiText);

  } catch (e) {
    addLiveMessage('ai', '⚠️ ' + e.message);
  } finally {
    liveSpeaking = false;
    resume();
  }
}

function resume() {
  if (!liveActive) return;
  hideLiveBubble();
  setLiveStatus('listening');
  scheduleRestart(300);
}

// ── OpenAI TTS ────────────────────────────────────────────────────────────────

async function playTTS(text) {
  const voice = document.getElementById('live-voice-sel')?.value || 'nova';

  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${api.token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });
  if (res.status === 401) { api.logout(); return; }
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || 'TTS error'); }

  const url = URL.createObjectURL(await res.blob());
  return new Promise(resolve => {
    liveCurrentAudio = new Audio(url);
    const done = () => { URL.revokeObjectURL(url); liveCurrentAudio = null; resolve(); };
    liveCurrentAudio.onended = done;
    liveCurrentAudio.onerror = done;
    liveCurrentAudio.play().catch(done);
  });
}

function skipSpeaking() {
  if (liveCurrentAudio) { liveCurrentAudio.pause(); liveCurrentAudio = null; }
  liveSpeaking = false;
  if (liveActive) resume();
}

function stopAudio() {
  if (liveCurrentAudio) { liveCurrentAudio.pause(); liveCurrentAudio = null; }
}

// ── Live speech bubble ────────────────────────────────────────────────────────

let liveCommitted = false; // has current bubble been committed to history?

function showLiveBubble(text, isInterim) {
  const area = document.getElementById('live-bubble-area');
  const span = document.getElementById('live-bubble-text');
  const cursor = document.getElementById('live-cursor');
  if (!area || !span) return;

  area.style.display = 'flex';
  span.textContent   = text;
  if (cursor) cursor.style.display = isInterim ? 'inline-block' : 'none';
  liveCommitted = false;
}

function hideLiveBubble() {
  const area = document.getElementById('live-bubble-area');
  const span = document.getElementById('live-bubble-text');
  if (area) area.style.display = 'none';
  if (span) span.textContent = '';
}

function commitLiveBubble(text) {
  // Move live bubble into history as a real user message
  hideLiveBubble();
  addLiveMessage('user', text);
}

// ── UI ────────────────────────────────────────────────────────────────────────

const STATUS = {
  idle:      () => t('live_status_idle')      || 'Press 🎤 to start',
  listening: () => t('live_status_listening') || '🎙 Listening...',
  thinking:  () => t('live_status_thinking')  || '🤔 Thinking...',
  speaking:  () => t('live_status_speaking')  || '🔊 Speaking...',
};

function setLiveStatus(state) {
  document.getElementById('live-dot')?.setAttribute('class', 'live-dot ' + state);
  const lbl = document.getElementById('live-status-label');
  if (lbl) lbl.textContent = STATUS[state]?.() || state;
}

function addLiveMessage(type, text) {
  const c = document.getElementById('live-messages');
  if (!c) return;
  const div = document.createElement('div');
  div.className = `message ${type}`;
  const content = document.createElement('div');
  if (type === 'ai' && window.marked) {
    content.className = 'md';
    content.innerHTML = marked.parse(text);
  } else {
    content.textContent = text;
  }
  div.appendChild(content);
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
}

function clearLiveMessages() {
  const c = document.getElementById('live-messages');
  if (c) c.innerHTML = '';
}
