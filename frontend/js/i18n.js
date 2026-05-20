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

    // POI filters
    poi_all: '🗺️ All',
    poi_food: '🍽️ Food',
    poi_sights: '🏛️ Sights',
    poi_shopping: '🛍️ Shopping',
    poi_hotels: '🏨 Hotels',
    // POI sub-filters food
    sub_all: '🍽️ All',
    sub_restaurants: '🍴 Restaurants',
    sub_cafes: '☕ Cafes',
    sub_bars: '🍺 Bars & Pubs',
    sub_fastfood: '🍔 Fast Food',
    // POI sub-filters shopping
    sub_shop_all: '🛍️ All',
    sub_mall: '🏬 Mall',
    sub_grocery: '🛒 Grocery',
    sub_fashion: '👗 Fashion',
    sub_electronics: '💻 Electronics',
    sub_home: '🏠 Home & Garden',
    // Distance
    sub_radius: '📏 Radius:',
    sub_1km: '1 km',
    sub_2km: '2 km',
    sub_5km: '5 km',
    // My Day form
    dp_title: 'Plan My Day',
    dp_where: '📍 Where would you like to go?',
    dp_museums: '🏛️ Museums',
    dp_parks: '🌳 Parks',
    dp_landmarks: '⭐ Landmarks',
    dp_art: '🎨 Art',
    dp_historical: '🏰 Historical',
    dp_viewpoints: '🌆 Viewpoints',
    dp_time: '⏱️ Available time —',
    dp_hours_suffix: 'hours',
    dp_food: '🍽️ Food preference',
    dp_food_any: '🌍 Any',
    dp_food_local: '🥘 Local',
    dp_food_asian: '🍜 Asian',
    dp_food_european: '🍕 European',
    dp_food_indian: '🍛 Indian',
    dp_shopping: '🛍️ Add a shopping stop?',
    dp_shop_no: 'No thanks',
    dp_shop_yes: 'Yes please!',
    dp_radius: '📏 Travel radius',
    dp_return: '🔄 Return back to starting point?',
    dp_return_no: 'No thanks',
    dp_return_yes: 'Yes, loop back',
    dp_generate: '✨ Generate My Day',

    // Admin sidebar
    admin_nav_stats:     '📊 Statistics',
    admin_nav_users:     '👥 Users',
    admin_nav_objects:   '🏛️ Attractions',
    admin_nav_countries: '🌍 Countries',
    admin_nav_settings:  '⚙️ Settings',
    // Admin stats
    admin_stats_title:  '📊 System Statistics',
    admin_stat_users:   'Total users',
    admin_stat_chats:   'Total chats',
    admin_stat_msgs:    'Total messages',
    admin_stat_active:  'Active chats',
    // Admin users
    admin_users_title:       '👥 Users',
    admin_th_id:             'ID',
    admin_th_email:          'Email',
    admin_th_lang:           'Language',
    admin_th_registered:     'Registered',
    admin_th_chats:          'Chats',
    admin_th_role:           'Role',
    admin_th_actions:        'Actions',
    admin_role_admin:        'Administrator',
    admin_role_user:         'User',
    admin_btn_make_admin:    'Make admin',
    admin_btn_remove_admin:  'Remove admin',
    admin_btn_delete:        'Delete',
    admin_btn_edit:          'Edit',
    admin_btn_cancel:        'Cancel',
    admin_btn_save:          'Save',
    admin_btn_save_changes:  'Save changes',
    admin_btn_add:           'Add',
    admin_me:                'You',
    // Admin objects
    admin_objects_title:   '🏛️ Attractions',
    admin_obj_add_title:   'Add new attraction',
    admin_obj_edit_title:  'Edit attraction',
    admin_label_name:      'Name',
    admin_label_category:  'Category',
    admin_label_desc:      'Description',
    admin_label_address:   'Address / Location',
    admin_label_lat:       'Latitude',
    admin_label_lng:       'Longitude',
    admin_th_name:         'Name',
    admin_th_desc:         'Description',
    admin_th_address:      'Address',
    admin_th_coords:       'Coordinates',
    // Object categories
    admin_cat_attraction:  'Attraction',
    admin_cat_monument:    'Monument',
    admin_cat_church:      'Church',
    admin_cat_historic:    'Historic site',
    admin_cat_castle:      'Castle',
    admin_cat_museum:      'Museum',
    admin_cat_street:      'Street',
    admin_cat_market:      'Market',
    admin_cat_theater:     'Theatre',
    // Admin countries
    admin_countries_title:    '🌍 Countries',
    admin_country_add_title:  'Add country',
    admin_country_edit_prefix:'Edit —',
    admin_label_country_name: 'Country name',
    admin_label_iso:          'ISO code',
    admin_label_prompt:       'AI Prompt',
    admin_label_country_desc: 'Description',
    admin_btn_generate_ai:    '✨ Generate with AI',
    admin_generating:         '⏳ Generating…',
    admin_generated_ok:       '✅ Generated!',
    admin_th_code:            'Code',
    admin_th_preview:         'Description preview',
    admin_no_desc:            'No description yet',
    admin_no_countries:       'No countries yet',
    // Admin settings
    admin_settings_title:       '⚙️ App Settings',
    admin_settings_desc:        'Automatically applied when the user has no GPS location.',
    admin_label_default_cat:    'Default POI category',
    admin_cat_all_filter:       '🗺️ All (no filter)',
    admin_cat_sights_filter:    '🏛️ Sights',
    admin_cat_food_filter:      '🍽️ Food',
    admin_cat_shopping_filter:  '🛍️ Shopping',
    admin_cat_hotels_filter:    '🏨 Hotels',
    admin_label_default_city:   'Default city',
    admin_label_default_lat:    'Default latitude',
    admin_label_default_lng:    'Default longitude',
    admin_btn_save_settings:    '💾 Save settings',
    admin_saved:                '✅ Saved!',
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

    // POI filters
    poi_all: '🗺️ Visi',
    poi_food: '🍽️ Ēdiens',
    poi_sights: '🏛️ Apskates',
    poi_shopping: '🛍️ Iepirkšanās',
    poi_hotels: '🏨 Viesnīcas',
    // POI sub-filters food
    sub_all: '🍽️ Visi',
    sub_restaurants: '🍴 Restorāni',
    sub_cafes: '☕ Kafejnīcas',
    sub_bars: '🍺 Bāri',
    sub_fastfood: '🍔 Ātrā ēdināšana',
    // POI sub-filters shopping
    sub_shop_all: '🛍️ Visi',
    sub_mall: '🏬 Tirdzniecības centrs',
    sub_grocery: '🛒 Pārtikas veikals',
    sub_fashion: '👗 Mode',
    sub_electronics: '💻 Elektronika',
    sub_home: '🏠 Māja un dārzs',
    // Distance
    sub_radius: '📏 Rādiuss:',
    sub_1km: '1 km',
    sub_2km: '2 km',
    sub_5km: '5 km',
    // My Day form
    dp_title: 'Plānot manu dienu',
    dp_where: '📍 Kur vēlaties doties?',
    dp_museums: '🏛️ Muzeji',
    dp_parks: '🌳 Parki',
    dp_landmarks: '⭐ Apskates vietas',
    dp_art: '🎨 Māksla',
    dp_historical: '🏰 Vēsture',
    dp_viewpoints: '🌆 Skatu punkti',
    dp_time: '⏱️ Pieejamais laiks —',
    dp_hours_suffix: 'stundas',
    dp_food: '🍽️ Ēdiena preference',
    dp_food_any: '🌍 Jebkāds',
    dp_food_local: '🥘 Vietējā virtuve',
    dp_food_asian: '🍜 Āzijas virtuve',
    dp_food_european: '🍕 Eiropas virtuve',
    dp_food_indian: '🍛 Indijas virtuve',
    dp_shopping: '🛍️ Pievienot iepirkšanās pieturvietu?',
    dp_shop_no: 'Nē, paldies',
    dp_shop_yes: 'Jā, lūdzu!',
    dp_radius: '📏 Ceļojuma rādiuss',
    dp_return: '🔄 Atgriezties sākuma punktā?',
    dp_return_no: 'Nē, paldies',
    dp_return_yes: 'Jā, atgriezties',
    dp_generate: '✨ Ģenerēt manu dienu',

    // Admin sidebar
    admin_nav_stats:     '📊 Statistika',
    admin_nav_users:     '👥 Lietotāji',
    admin_nav_objects:   '🏛️ Apskates vietas',
    admin_nav_countries: '🌍 Valstis',
    admin_nav_settings:  '⚙️ Iestatījumi',
    // Admin stats
    admin_stats_title:  '📊 Sistēmas statistika',
    admin_stat_users:   'Kopā lietotāji',
    admin_stat_chats:   'Kopā čati',
    admin_stat_msgs:    'Kopā ziņojumi',
    admin_stat_active:  'Aktīvie čati',
    // Admin users
    admin_users_title:       '👥 Lietotāji',
    admin_th_id:             'ID',
    admin_th_email:          'Email',
    admin_th_lang:           'Valoda',
    admin_th_registered:     'Reģistrēts',
    admin_th_chats:          'Čati',
    admin_th_role:           'Loma',
    admin_th_actions:        'Darbības',
    admin_role_admin:        'Administrators',
    admin_role_user:         'Lietotājs',
    admin_btn_make_admin:    'Padarīt par adminu',
    admin_btn_remove_admin:  'Noņemt adminu',
    admin_btn_delete:        'Dzēst',
    admin_btn_edit:          'Rediģēt',
    admin_btn_cancel:        'Atcelt',
    admin_btn_save:          'Saglabāt',
    admin_btn_save_changes:  'Saglabāt izmaiņas',
    admin_btn_add:           'Pievienot',
    admin_me:                'Tu',
    // Admin objects
    admin_objects_title:   '🏛️ Apskates vietas',
    admin_obj_add_title:   'Pievienot jaunu apskates vietu',
    admin_obj_edit_title:  'Rediģēt apskates vietu',
    admin_label_name:      'Nosaukums',
    admin_label_category:  'Kategorija',
    admin_label_desc:      'Apraksts',
    admin_label_address:   'Adrese / Atrašanās vieta',
    admin_label_lat:       'Platuma grādi',
    admin_label_lng:       'Garuma grādi',
    admin_th_name:         'Nosaukums',
    admin_th_desc:         'Apraksts',
    admin_th_address:      'Adrese',
    admin_th_coords:       'Koordinātes',
    // Object categories
    admin_cat_attraction:  'Apskates vieta',
    admin_cat_monument:    'Piemineklis',
    admin_cat_church:      'Baznīca',
    admin_cat_historic:    'Vēsturiska vieta',
    admin_cat_castle:      'Pils',
    admin_cat_museum:      'Muzejs',
    admin_cat_street:      'Iela',
    admin_cat_market:      'Tirgus',
    admin_cat_theater:     'Teātris',
    // Admin countries
    admin_countries_title:    '🌍 Valstis',
    admin_country_add_title:  'Pievienot valsti',
    admin_country_edit_prefix:'Rediģēt —',
    admin_label_country_name: 'Valsts nosaukums',
    admin_label_iso:          'ISO kods',
    admin_label_prompt:       'Uzvedne AI',
    admin_label_country_desc: 'Apraksts',
    admin_btn_generate_ai:    '✨ Ģenerēt ar AI',
    admin_generating:         '⏳ Ģenerē…',
    admin_generated_ok:       '✅ Ģenerēts!',
    admin_th_code:            'Kods',
    admin_th_preview:         'Apraksta priekšskatījums',
    admin_no_desc:            'Nav apraksta',
    admin_no_countries:       'Nav nevienas valsts',
    // Admin settings
    admin_settings_title:       '⚙️ Lietotnes iestatījumi',
    admin_settings_desc:        'Tiek automātiski piemēroti, ja lietotājam nav GPS atrašanās vietas.',
    admin_label_default_cat:    'Noklusējuma POI kategorija',
    admin_cat_all_filter:       '🗺️ Visi (bez filtra)',
    admin_cat_sights_filter:    '🏛️ Apskates',
    admin_cat_food_filter:      '🍽️ Ēdiens',
    admin_cat_shopping_filter:  '🛍️ Iepirkšanās',
    admin_cat_hotels_filter:    '🏨 Viesnīcas',
    admin_label_default_city:   'Noklusējuma pilsēta',
    admin_label_default_lat:    'Noklusējuma platuma grādi',
    admin_label_default_lng:    'Noklusējuma garuma grādi',
    admin_btn_save_settings:    '💾 Saglabāt iestatījumus',
    admin_saved:                '✅ Saglabāts!',
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
  // Re-render dynamic admin tables if on admin page
  if (typeof loadUsers === 'function')    loadUsers();
  if (typeof loadObjects === 'function')  loadObjects();
  if (typeof loadCountries === 'function') loadCountries();
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

// ── Theme ───────────────────────────────────────────────────

function getTheme() {
  return localStorage.getItem('theme') || 'dark';
}

function applyTheme() {
  const isDark = getTheme() === 'dark';
  document.body.classList.toggle('light', !isDark);
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.title = isDark ? 'Switch to light theme' : 'Switch to dark theme';
  });
}

function toggleTheme() {
  localStorage.setItem('theme', getTheme() === 'dark' ? 'light' : 'dark');
  applyTheme();
  // Update Google Maps style if map is loaded
  if (typeof window.updateMapTheme === 'function') window.updateMapTheme();
}

// Apply theme immediately on script load (prevents flash)
applyTheme();
