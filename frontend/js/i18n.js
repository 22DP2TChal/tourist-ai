const TRANSLATIONS = {
  en: {
    // Navbar
    nav_map:       '🗺 Map',
    nav_history:   '💬 History',
    nav_admin:     '⚙️ Admin',
    nav_signout:   'Sign out',
    nav_signin:    'Sign in',
    nav_register:  'Register',

    // Login
    login_heading:    'Sign In',
    login_subtitle:   'Sign in to explore your city with AI',
    label_email:      'Email address',
    label_password:   'Password',
    btn_signin:       'Sign in',
    btn_signing_in:   'Signing in...',
    link_no_account:  "Don't have an account?",

    // Login errors
    err_email_required:    'Please enter your email address',
    err_email_invalid:     'Please enter a valid email address',
    err_password_required: 'Please enter your password',
    err_bad_credentials:   '❌ Incorrect email or password. Please try again.',
    err_check_email:       'Check your email',
    err_check_password:    'Check your password',
    err_generic:           '⚠️ Something went wrong. Please try again later.',

    // Register
    register_heading:    'Create Account',
    register_subtitle:   'Create your account to get started',
    label_password_hint: 'Password (min. 8 characters)',
    label_language:      'Preferred language',
    btn_create:          'Create account',
    btn_creating:        'Creating account...',
    link_have_account:   'Already have an account?',
    register_success:    'Account created! Signing you in...',

    // Register errors
    err_email_taken:    'This email is already registered',
    err_password_short: 'Password must be at least 8 characters',

    // Main page
    chat_panel_title:   'AI Tourist',
    btn_new_chat:       '+ New',
    tab_chat:           '💬 Chat',
    tab_nearby:         '🏛️ Nearby',
    tab_live:              '📡 Live AI',
    nearby_title:          'Nearby Attractions',
    live_status_idle:      'Press 🎤 to start',
    live_status_listening: '🎙 Listening...',
    live_status_thinking:  '🤔 Thinking...',
    live_status_speaking:  '🔊 Speaking...',
    live_no_support:       'Your browser does not support voice recognition. Please use Google Chrome.',
    chat_empty_title:   'Ask AI Tourist',
    chat_empty_desc:    "Ask about nearby attractions, street history, or any place you're curious about!",
    detecting_location: 'Detecting location...',
    location_unavail:   'Location unavailable',
    chat_placeholder:   'Ask about this place...',
    btn_my_location:    '📍 My location',
    btn_reload:         '🔄 Reload',
    btn_ask_ai:         '💬 Ask AI about this',

    // No auth overlay
    noauth_heading: 'Welcome to AI Tourist',
    noauth_sub:     'Sign in to explore cities with your AI travel guide',

    // History
    history_title:       '💬 Chat History',
    btn_new_chat_hist:   '+ New Chat',
    history_empty:       'No conversations yet',
    history_empty_sub:   'Start a new chat from the map page',
    btn_go_to_map:       'Go to map',
    btn_delete_chat:     '🗑 Delete chat',
    history_no_messages: 'No messages in this chat',
    continue_placeholder:'Continue the conversation...',
    btn_back_history:    '← Back to history',
    confirm_delete_chat: 'Delete this conversation?',
    messages_label:      'messages',
  },

  lv: {
    // Navbar
    nav_map:       '🗺 Karte',
    nav_history:   '💬 Vēsture',
    nav_admin:     '⚙️ Administrators',
    nav_signout:   'Izrakstīties',
    nav_signin:    'Pieteikties',
    nav_register:  'Reģistrēties',

    // Login
    login_heading:    'Pieteikties',
    login_subtitle:   'Piesakieties, lai izpētītu pilsētu ar AI',
    label_email:      'E-pasta adrese',
    label_password:   'Parole',
    btn_signin:       'Pieteikties',
    btn_signing_in:   'Piesakās...',
    link_no_account:  'Nav konta?',

    // Login errors
    err_email_required:    'Lūdzu ievadiet e-pasta adresi',
    err_email_invalid:     'Lūdzu ievadiet derīgu e-pasta adresi',
    err_password_required: 'Lūdzu ievadiet paroli',
    err_bad_credentials:   '❌ Nepareizs e-pasts vai parole. Mēģiniet vēlreiz.',
    err_check_email:       'Pārbaudiet e-pastu',
    err_check_password:    'Pārbaudiet paroli',
    err_generic:           '⚠️ Kaut kas nogāja greizi. Mēģiniet vēlreiz vēlāk.',

    // Register
    register_heading:    'Izveidot kontu',
    register_subtitle:   'Izveidojiet kontu, lai sāktu',
    label_password_hint: 'Parole (min. 8 simboli)',
    label_language:      'Vēlamā valoda',
    btn_create:          'Izveidot kontu',
    btn_creating:        'Izveido kontu...',
    link_have_account:   'Jau ir konts?',
    register_success:    'Konts izveidots! Piesakās...',

    // Register errors
    err_email_taken:    'Šis e-pasts jau ir reģistrēts',
    err_password_short: 'Parolei jābūt vismaz 8 simboliem',

    // Main page
    chat_panel_title:   'AI Tūrists',
    btn_new_chat:       '+ Jauns',
    tab_chat:           '💬 Čats',
    tab_nearby:         '🏛️ Tuvumā',
    tab_live:              '📡 Live AI',
    nearby_title:          'Tuvumā esošie objekti',
    live_status_idle:      'Nospied 🎤, lai sāktu',
    live_status_listening: '🎙 Klausos...',
    live_status_thinking:  '🤔 Domāju...',
    live_status_speaking:  '🔊 Runāju...',
    live_no_support:       'Tavs pārlūkprogramma neatbalsta balss atpazīšanu. Lūdzu, izmanto Google Chrome.',
    chat_empty_title:   'Jautāt AI Tūristam',
    chat_empty_desc:    'Jautājiet par tuvumā esošajiem objektiem, ielu vēsturi vai jebkuru interesējošo vietu!',
    detecting_location: 'Nosaka atrašanās vietu...',
    location_unavail:   'Atrašanās vieta nav pieejama',
    chat_placeholder:   'Jautā par šo vietu...',
    btn_my_location:    '📍 Mana vieta',
    btn_reload:         '🔄 Atjaunot',
    btn_ask_ai:         '💬 Jautāt AI par šo',

    // No auth overlay
    noauth_heading: 'Laipni lūdzam AI Tūristā',
    noauth_sub:     'Piesakieties, lai izpētītu pilsētas ar AI ceļvedis',

    // History
    history_title:       '💬 Sarunu vēsture',
    btn_new_chat_hist:   '+ Jauna saruna',
    history_empty:       'Vēl nav sarunu',
    history_empty_sub:   'Sāciet jaunu sarunu no kartes lapas',
    btn_go_to_map:       'Doties uz karti',
    btn_delete_chat:     '🗑 Dzēst sarunu',
    history_no_messages: 'Šajā sarunā nav ziņojumu',
    continue_placeholder:'Turpiniet sarunu...',
    btn_back_history:    '← Atpakaļ uz vēsturi',
    confirm_delete_chat: 'Dzēst šo sarunu?',
    messages_label:      'ziņojumi',
  },
};

// ── Core functions ─────────────────────────────────────────

function getLang() {
  return localStorage.getItem('lang') || 'en';
}

function setLang(lang) {
  localStorage.setItem('lang', lang);
  applyTranslations();
  updateLangSwitcher();
}

function t(key) {
  const lang = getLang();
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key])
      || (TRANSLATIONS['en'] && TRANSLATIONS['en'][key])
      || key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
}

function updateLangSwitcher() {
  const lang = getLang();
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('lang-btn-active', btn.dataset.lang === lang);
  });
}
