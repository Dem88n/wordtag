// --- TEMEL DEĞİŞKENLER VE OYUN MODLARI ---
let currentLangData = {}; 
let currentLanguage = ""; 
let currentCategory = "";
let words = []; 
let currentIndex = 0; 
let correctCount = 0; 
let wrongCount = 0;

let isMixedMode = false; 
let isSuddenDeathMode = false; 
let isReverseMode = false; 
let isDifficultMode = false; 
let isZenMode = false; 

let timerInterval; 
let timeRemaining = 60; 
let sessionEarnedCoins = 0;
let streakCorrect = 0; 
let streakWrong = 0; 
let comboCount = 0;
let lastAction = ""; 
let lastCorrectPhrase = ""; 
let lastWrongPhrase = ""; 
let sessionCorrectInRow = 0;

// --- EKONOMİ, SRS, XP VE BAŞARIM DEĞİŞKENLERİ ---
let currentXP = 0; 
let currentLevel = 1; 
let userCoins = 0;
const xpPerCorrectWord = 25; 
const xpToNextLevelFormula = (level) => 100 * Math.pow(level, 1.5); 
const levelTitles = ["Çırak", "Gezgin", "Alim", "Usta", "Bilge", "Efsane"];

let userStats = { 
    maxStreak: 0, 
    totalWordsLearned: 0, 
    globalCorrect: 0, 
    globalWrong: 0, 
    clearedDifficultMode: false, 
    playedMixed: false, 
    playedSuddenDeath: false, 
    suddenDeathScore: 0, 
    completedMixedWithNoWrong: false, 
    flawlessFocusCompleted: false, 
    playedEveryMode: false, 
    dailyStreak: 0, 
    lastLoginDate: "" 
};

let srsWeights = {}; 
let userThemes = ['default']; 
let activeTheme = 'default';

let achievements = {
    firstStrike: { id: 'firstStrike', icon: '✊', title: 'İlk Kan', desc: 'Arka arkaya 10 doğru yap', condition: (s) => s.maxStreak >= 10, unlocked: false },
    flawlessFocus: { id: 'flawlessFocus', icon: '🧠', title: 'Kusursuz Odak', desc: '1 Dk yanlışsız bitir', condition: (s) => s.flawlessFocusCompleted, unlocked: false },
    errorHunter: { id: 'errorHunter', icon: '🔍', title: 'Hata Avcısı', desc: 'Zorlandıklarım sıfırla', condition: (s) => s.clearedDifficultMode, unlocked: false },
    masterLinguist: { id: 'masterLinguist', icon: '📚', title: 'Usta', desc: '500 etkileşim yap', condition: (s) => s.totalWordsLearned >= 500, unlocked: false },
    timeWarrior: { id: 'timeWarrior', icon: '⏳', title: 'Zaman Savaşçısı', desc: 'Süreli modu 0 yanlışla bitir', condition: (s) => s.completedMixedWithNoWrong, unlocked: false },
    suddenDeathHero: { id: 'suddenDeathHero', icon: '💀', title: 'Hayatta Kalan', desc: 'Ani Ölümde 30 yap', condition: (s) => s.suddenDeathScore >= 30, unlocked: false }
};

const shopItems = [
    { id: 'default', name: 'Klasik Temiz', cost: 0, previewCSS: 'background:#fff; border: 2px solid #ccc;' },
    { id: 'theme-glass', name: 'Buzlu Cam', cost: 500, previewCSS: 'background:linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); opacity:0.8;' },
    { id: 'theme-anatolian', name: 'Anadolu Ateşi', cost: 1000, previewCSS: 'background:#8b0000; border: 2px solid #fdf5e6;' }
];

// --- BAŞLANGIÇ YÜKLEMELERİ ---
window.onload = () => { 
    loadUserProgress(); 
    checkDailyStreak(); 
    if(localStorage.getItem('wordtag_darkmode') === 'true') { 
        toggleDarkMode(true); 
    }
    applyTheme(activeTheme);
    updateCoinDisplays();
};

function loadUserProgress() {
    currentXP = parseInt(localStorage.getItem('wordtag_xp')) || 0;
    currentLevel = parseInt(localStorage.getItem('wordtag_level')) || 1;
    userCoins = parseInt(localStorage.getItem('wordtag_coins')) || 0;
    activeTheme = localStorage.getItem('wordtag_active_theme') || 'default';
    userThemes = JSON.parse(localStorage.getItem('wordtag_user_themes')) || ['default'];
    srsWeights = JSON.parse(localStorage.getItem('wordtag_srs')) || {};
    
    let savedStats = JSON.parse(localStorage.getItem('wordtag_stats'));
    if (savedStats) {
        userStats = { ...userStats, ...savedStats };
    }
    
    let savedAchievements = JSON.parse(localStorage.getItem('wordtag_achievements'));
    if (savedAchievements) { 
        Object.keys(achievements).forEach(key => { 
            if(savedAchievements[key]) achievements[key].unlocked = savedAchievements[key].unlocked; 
        }); 
    }
    triggerXPBarAnimation(0);
}

function saveUserProgress() {
    localStorage.setItem('wordtag_xp', currentXP); 
    localStorage.setItem('wordtag_level', currentLevel); 
    localStorage.setItem('wordtag_coins', userCoins);
    localStorage.setItem('wordtag_active_theme', activeTheme); 
    localStorage.setItem('wordtag_user_themes', JSON.stringify(userThemes));
    localStorage.setItem('wordtag_srs', JSON.stringify(srsWeights)); 
    localStorage.setItem('wordtag_stats', JSON.stringify(userStats));
    localStorage.setItem('wordtag_achievements', JSON.stringify(achievements));
}

// --- DÜKKAN (MARKET) VE TEMA SİSTEMİ ---
function openShop() {
    updateCoinDisplays();
    const container = document.getElementById('shop-container'); 
    container.innerHTML = "";
    
    shopItems.forEach(item => {
        const isPurchased = userThemes.includes(item.id);
        const isActive = activeTheme === item.id;
        const div = document.createElement('div');
        div.className = `shop-item ${isPurchased ? 'purchased' : ''} ${isActive ? 'active-theme' : ''}`;
        
        let actionBtn = "";
        if (isActive) { 
            actionBtn = `<button class="pill-btn" style="padding:5px 10px; font-size:12px;" disabled>Kullanılıyor</button>`; 
        } else if (isPurchased) { 
            actionBtn = `<button class="pill-btn" style="padding:5px 10px; font-size:12px; background:#4CAF50; color:white;" onclick="applyTheme('${item.id}')">Seç</button>`; 
        } else { 
            actionBtn = `<button class="pill-btn" style="padding:5px 10px; font-size:12px; background:#FFC107; color:#333;" onclick="buyTheme('${item.id}', ${item.cost})">${item.cost} Altınla Al</button>`; 
        }
        
        div.innerHTML = `
            <div class="preview" style="${item.previewCSS}"></div>
            <div style="font-weight:bold; font-size:14px; margin-bottom:5px;">${item.name}</div>
            ${actionBtn}
        `;
        container.appendChild(div);
    });
    showScreen('shop-screen');
}

function buyTheme(id, cost) {
    if (userCoins >= cost) {
        userCoins -= cost; 
        userThemes.push(id); 
        saveUserProgress(); 
        openShop();
    } else { 
        alert("Yeterli altınınız yok! Test çözerek kazanabilirsiniz."); 
    }
}

function applyTheme(id) {
    document.body.classList.remove('theme-glass', 'theme-anatolian'); 
    if(id !== 'default') { 
        document.body.classList.add(id); 
    }
    activeTheme = id; 
    saveUserProgress();
    if(document.getElementById('shop-screen').classList.contains('active')) {
        openShop(); 
    }
}

function updateCoinDisplays() {
    if(document.getElementById('menu-coin-display')) document.getElementById('menu-coin-display').innerText = userCoins;
    if(document.getElementById('shop-coin-display')) document.getElementById('shop-coin-display').innerText = userCoins;
    if(document.getElementById('game-coin-display')) document.getElementById('game-coin-display').innerText = `🪙 ${userCoins}`;
}

// --- İSTATİSTİK (DASHBOARD) SİSTEMİ ---
function openDashboard() {
    let acc = (userStats.globalCorrect + userStats.globalWrong) > 0 ? Math.round((userStats.globalCorrect / (userStats.globalCorrect + userStats.globalWrong)) * 100) : 0;
    document.getElementById('dash-accuracy').innerText = `%${acc}`;
    document.getElementById('dash-max-streak').innerText = userStats.maxStreak;
    document.getElementById('dash-words-learned').innerText = userStats.totalWordsLearned;
    
    let unlockedCount = Object.values(achievements).filter(a => a.unlocked).length;
    document.getElementById('dash-achievements').innerText = `${unlockedCount}/${Object.keys(achievements).length}`;
    showScreen('dashboard-screen');
}

// --- GECE MODU VE SERİ KONTROLÜ ---
function toggleDarkMode(forceOn = false) { 
    const isDark = document.body.classList.toggle('dark-mode', forceOn); 
    localStorage.setItem('wordtag_darkmode', isDark); 
    const btn = document.getElementById('dark-mode-btn'); 
    if(btn) btn.innerText = isDark ? "☀️ Gündüz" : "🌙 Gece"; 
}

function checkDailyStreak() { 
    const today = new Date().toDateString(); 
    if (userStats.lastLoginDate !== today) { 
        if (userStats.lastLoginDate) { 
            let last = new Date(userStats.lastLoginDate); 
            let now = new Date(today); 
            let diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24)); 
            if (diffDays === 1) { 
                userStats.dailyStreak++; 
            } else if (diffDays > 1) { 
                userStats.dailyStreak = 1; 
            } 
        } else { 
            userStats.dailyStreak = 1; 
        } 
        userStats.lastLoginDate = today; 
        saveUserProgress(); 
    } 
    const streakDisplay = document.getElementById('streak-count'); 
    if(streakDisplay) streakDisplay.innerText = userStats.dailyStreak; 
}

// --- XP MANTIĞI ---
function addXP(amount) { 
    if(isZenMode) amount = Math.floor(amount / 2); 
    currentXP += amount; 
    let nextLevelXP = xpToNextLevelFormula(currentLevel); 
    if (currentXP >= nextLevelXP) { 
        currentXP -= nextLevelXP; 
        currentLevel++; 
        triggerLevelUpAnimation(); 
        addXP(0); 
        return; 
    } 
    triggerXPBarAnimation(amount); 
    saveUserProgress(); 
}

function triggerXPBarAnimation(amount) { 
    const fillEl = document.getElementById('xp-bar-fill'); 
    const textEl = document.getElementById('xp-text'); 
    let nextLevelXP = xpToNextLevelFormula(currentLevel); 
    let percent = (currentXP / nextLevelXP) * 100; 
    if(fillEl) fillEl.style.width = `${percent}%`; 
    
    const titleEl = document.getElementById('level-title'); 
    let titleIndex = Math.min(Math.floor((currentLevel - 1) / 3), levelTitles.length - 1); 
    if(titleEl) titleEl.innerText = `Lvl ${currentLevel}: ${levelTitles[titleIndex]}`; 
    if(textEl) textEl.innerText = `${Math.floor(currentXP)} / ${Math.floor(nextLevelXP)} XP`; 
}

function triggerLevelUpAnimation() { 
    triggerComboAnimation('SEVİYE ATLADIN!', '#FF9800', document.body); 
    triggerVibration('achievement'); 
}

// --- ROZET MANTIĞI ---
function checkAndUnlockAchievements() { 
    if(userStats.playedMixed && userStats.playedSuddenDeath) { 
        userStats.playedEveryMode = true; 
    } 
    Object.keys(achievements).forEach(key => { 
        let ach = achievements[key]; 
        if (!ach.unlocked && ach.condition(userStats)) { 
            ach.unlocked = true; 
            triggerAchievementPopup(ach); 
        } 
    }); 
    saveUserProgress(); 
}

function triggerAchievementPopup(ach) { 
    const popupEl = document.getElementById('achievement-popup'); 
    const iconEl = popupEl.querySelector('.icon'); 
    const nameEl = popupEl.querySelector('.name'); 
    iconEl.innerText = ach.icon; 
    nameEl.innerText = ach.title; 
    popupEl.style.display = 'flex'; 
    triggerVibration('achievement'); 
    setTimeout(() => { popupEl.style.display = 'none'; }, 4000); 
}

function viewAchievementCollection() { 
    const categoryGrid = document.getElementById('category-container'); 
    const achievementGrid = document.getElementById('achievement-container'); 
    const btn = document.getElementById('view-achievements-btn'); 
    
    if(achievementGrid.style.display === 'flex') { 
        categoryGrid.style.display = 'flex'; 
        achievementGrid.style.display = 'none'; 
        if(btn) btn.innerText = "🏆 Rozetler"; 
    } else { 
        categoryGrid.style.display = 'none'; 
        achievementGrid.style.display = 'flex'; 
        createAchievementGrid(); 
        if(btn) btn.innerText = "🗂️ Kategorilere Dön"; 
    } 
}

function createAchievementGrid() { 
    const container = document.getElementById('achievement-container'); 
    container.innerHTML = ""; 
    Object.keys(achievements).forEach(key => { 
        let ach = achievements[key]; 
        const badgeEl = document.createElement('div'); 
        badgeEl.className = `achievement-badge ${ach.unlocked ? 'unlocked' : 'locked'}`; 
        badgeEl.innerHTML = `<div class="icon">${ach.icon}</div><div class="title">${ach.title}</div><div class="desc">${ach.desc}</div>`; 
        container.appendChild(badgeEl); 
    }); 
}

// --- YARDIMCI VE SRS FONKSİYONLARI ---
function toRoman(num) { 
    const roman = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1}; 
    let str = ''; 
    for (let i of Object.keys(roman)) { 
        let q = Math.floor(num / roman[i]); 
        num -= q * roman[i]; 
        str += i.repeat(q); 
    } 
    return str; 
}

function shuffleAndApplySRS(array) {
    array.sort((a, b) => {
        let weightA = srsWeights[a.word] || 1; 
        let weightB = srsWeights[b.word] || 1;
        return (weightB * Math.random()) - (weightA * Math.random());
    });
}

function triggerVibration(type) { 
    if (!("vibrate" in navigator) || isZenMode) return; 
    if (type === 'correct') { navigator.vibrate(30); } 
    else if (type === 'wrong') { navigator.vibrate([100, 50, 100]); } 
    else if (type === 'shake') { navigator.vibrate(50); } 
    else if (type === 'death') { navigator.vibrate([200, 100, 200, 100, 300]); } 
    else if (type === 'achievement') { navigator.vibrate([100, 50, 100, 50, 200]); } 
}

window.speakWord = function(text, event) { 
    if (event) event.stopPropagation(); 
    if (!('speechSynthesis' in window)) return; 
    speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text); 
    if (currentLanguage === 'İngilizce') { utterance.lang = 'en-US'; } 
    else if (currentLanguage === 'İtalyanca') { utterance.lang = 'it-IT'; } 
    utterance.rate = 0.9; 
    speechSynthesis.speak(utterance); 
}

function showScreen(screenId) { 
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active')); 
    document.getElementById(screenId).classList.add('active'); 
    const timerDisplay = document.getElementById('timer-display'); 
    
    if (timerDisplay) { 
        if(screenId === 'app-screen' && (isMixedMode || isSuddenDeathMode)) { 
            timerDisplay.style.display = 'flex'; 
        } else { 
            clearInterval(timerInterval); 
            timerDisplay.classList.remove('danger'); 
            timerDisplay.style.display = 'none'; 
        } 
    } 
    updateCoinDisplays(); 
}

function enterApp() { showScreen('lang-screen'); }

function toggleReverseMode() { 
    isReverseMode = !isReverseMode; 
    const btn = document.getElementById('reverse-btn'); 
    if(isReverseMode) { 
        btn.innerText = "🔀 Tersine: AÇIK"; 
        btn.style.backgroundColor = "#4CAF50"; 
        btn.style.color = "white"; 
        btn.style.borderColor = "#4CAF50"; 
    } else { 
        btn.innerText = "🔀 Tersine: KAPALI"; 
        btn.style.backgroundColor = "#fdfdfd"; 
        btn.style.color = "#333"; 
        btn.style.borderColor = "#ccc"; 
    } 
}

function toggleZenMode() { 
    isZenMode = !isZenMode; 
    const btn = document.getElementById('zen-btn'); 
    if(isZenMode) { 
        btn.innerText = "🧘‍♂️ Zen: AÇIK"; 
        btn.style.backgroundColor = "#9C27B0"; 
        btn.style.color = "white"; 
        btn.style.borderColor = "#9C27B0"; 
    } else { 
        btn.innerText = "🧘‍♂️ Zen: KAPALI"; 
        btn.style.backgroundColor = "#fdfdfd"; 
        btn.style.color = "#333"; 
        btn.style.borderColor = "#ccc"; 
    } 
}

function openCustomDeckMenu() { showScreen('custom-deck-screen'); }

function addCustomWordRow() { 
    const container = document.getElementById('custom-words-container'); 
    const row = document.createElement('div'); 
    row.className = 'custom-word-row'; 
    row.innerHTML = `<input type="text" placeholder="Yabancı Kelime" class="custom-input word-input"><input type="text" placeholder="Türkçe Anlamı" class="custom-input mean-input">`; 
    container.appendChild(row); 
}

function saveCustomDeck() { 
    const deckName = document.getElementById('custom-deck-name').value.trim(); 
    if(!deckName) { alert("Lütfen isim verin!"); return; } 
    let newWords = []; 
    document.querySelectorAll('.custom-word-row').forEach(row => { 
        let w = row.querySelector('.word-input').value.trim(); 
        let m = row.querySelector('.mean-input').value.trim(); 
        if(w && m) newWords.push({ word: w, meaning: m, pronunciation: "" }); 
    }); 
    if(newWords.length === 0) return; 
    
    let savedDecks = JSON.parse(localStorage.getItem(`wordtag_custom_${currentLanguage}`)) || {}; 
    savedDecks[deckName] = newWords; 
    localStorage.setItem(`wordtag_custom_${currentLanguage}`, JSON.stringify(savedDecks)); 
    alert("Kaydedildi!"); 
    
    document.getElementById('custom-deck-name').value = ""; 
    document.getElementById('custom-words-container').innerHTML = `<div class="custom-word-row"><input type="text" placeholder="Yabancı Kelime" class="custom-input word-input"><input type="text" placeholder="Türkçe Anlamı" class="custom-input mean-input"></div>`; 
    selectLanguage(currentLanguage); 
}

// --- OYUN KURULUMU ---
async function selectLanguage(lang) {
    currentLanguage = lang; 
    const container = document.getElementById('category-container'); 
    const topControls = document.getElementById('top-controls');
    
    document.getElementById('category-title').innerText = `${lang} Kategorileri`; 
    container.innerHTML = "<h4>Yükleniyor...</h4>"; 
    topControls.innerHTML = "";
    document.getElementById('achievement-container').style.display = 'none'; 
    document.getElementById('category-container').style.display = 'flex'; 
    
    // GÜVENLİK KONTROLÜ (HATA BURADAYDI, DÜZELTİLDİ)
    const achBtn = document.getElementById('view-achievements-btn');
    if (achBtn) {
        achBtn.innerText = "🏆 Rozetler";
    }

    topControls.innerHTML = `
        <button id="reverse-btn" class="pill-btn stat-pill" onclick="toggleReverseMode()">${isReverseMode ? "🔀 Tersine: AÇIK" : "🔀 Tersine: KAPALI"}</button>
        <button id="zen-btn" class="pill-btn stat-pill" onclick="toggleZenMode()" style="${isZenMode ? 'background:#9C27B0; color:white; border-color:#9C27B0;' : ''}">${isZenMode ? "🧘‍♂️ Zen: AÇIK" : "🧘‍♂️ Zen: KAPALI"}</button>
        <button class="pill-btn stat-pill" onclick="openCustomDeckMenu()" style="background:#2196F3; color:white; border-color:#2196F3;">➕ Deste Yarat</button>
    `;
    
    if(isReverseMode) { 
        const r = document.getElementById('reverse-btn'); 
        r.style.backgroundColor = "#4CAF50"; 
        r.style.color = "white"; 
        r.style.borderColor = "#4CAF50"; 
    }
    showScreen('category-screen'); 

    try {
        let response; 
        if (lang === 'İngilizce') { response = await fetch('./data/eng.json'); } 
        else if (lang === 'İtalyanca') { response = await fetch('./data/it.json'); } 
        else return;
        
        if (!response.ok) throw new Error("Dosya bulunamadı"); 
        currentLangData = await response.json(); 
        container.innerHTML = ""; 

        let customDecks = JSON.parse(localStorage.getItem(`wordtag_custom_${currentLanguage}`)) || {};
        Object.keys(customDecks).forEach(deckName => { 
            const cDiv = document.createElement('div'); 
            cDiv.className = 'liquid-card'; 
            cDiv.style.borderColor = "#2196F3"; 
            cDiv.innerHTML = `<span>⭐ ${deckName} <br><small style="color:#2196F3">(${customDecks[deckName].length} Kelime)</small></span>`; 
            cDiv.onclick = () => { 
                words = customDecks[deckName]; 
                isMixedMode = false; isSuddenDeathMode = false; isDifficultMode = false; 
                startGameEngine(); 
            }; 
            container.appendChild(cDiv); 
        });

        let savedWrongWords = JSON.parse(localStorage.getItem(`wordtag_wrong_${currentLanguage}`)) || [];
        if (savedWrongWords.length > 0) { 
            const wrongDiv = document.createElement('div'); 
            wrongDiv.className = 'liquid-card'; 
            wrongDiv.style.borderColor = "#F44336"; 
            wrongDiv.innerHTML = `<span>Zorlandıklarım <br><small style="color:#F44336">(${savedWrongWords.length} Kelime)</small></span>`; 
            wrongDiv.onclick = () => { 
                words = savedWrongWords; 
                isMixedMode = false; isSuddenDeathMode = false; isDifficultMode = true; 
                startGameEngine(); 
            }; 
            container.appendChild(wrongDiv); 
        }

        Object.keys(currentLangData).forEach(cat => { 
            const catLower = cat.trim().toLowerCase(); 
            if(catLower.includes('karışık') || catLower.includes('tümü')) return; 
            
            const div = document.createElement('div'); 
            div.className = 'liquid-card'; 
            let totalWords = 0; 
            let isTwoLevel = !Array.isArray(currentLangData[cat]); 
            
            if(isTwoLevel) { 
                Object.keys(currentLangData[cat]).forEach(subCat => { totalWords += currentLangData[cat][subCat].length; }); 
            } else { 
                totalWords = currentLangData[cat].length; 
            } 
            
            div.innerHTML = `<span>${cat} <br><small>(${totalWords} Kelime)</small></span>`; 
            div.onclick = () => { 
                if(isTwoLevel) { openSubcategories(cat); } 
                else { 
                    words = currentLangData[cat]; 
                    isMixedMode = false; isSuddenDeathMode = false; isDifficultMode = false; 
                    startGameEngine(); 
                } 
            }; 
            container.appendChild(div); 
        });

        const mixDiv = document.createElement('div'); 
        mixDiv.className = 'liquid-card mixed-card'; 
        mixDiv.innerHTML = `<span>Karışık <br><small>(Tümü & Süreli)</small></span>`; 
        mixDiv.onclick = () => startMixedGame(); 
        container.appendChild(mixDiv);
        
        const suddenDiv = document.createElement('div'); 
        suddenDiv.className = 'liquid-card'; 
        suddenDiv.style.background = "#ffebee"; 
        suddenDiv.style.borderColor = "#B71C1C"; 
        suddenDiv.innerHTML = `<span style="color:#B71C1C">Ani Ölüm 💀<br><small>(Tek Hata = Biter)</small></span>`; 
        suddenDiv.onclick = () => startSuddenDeathGame(); 
        container.appendChild(suddenDiv);

    } catch (error) { 
        container.innerHTML = `<p style='color:red;'>JSON dosyası yüklenemedi!</p>`; 
    }
}

function saveWrongWord(wordObj) { 
    let saved = JSON.parse(localStorage.getItem(`wordtag_wrong_${currentLanguage}`)) || []; 
    if (!saved.some(w => w.word === wordObj.word)) { 
        saved.push(wordObj); 
        localStorage.setItem(`wordtag_wrong_${currentLanguage}`, JSON.stringify(saved)); 
    } 
}

function removeWrongWord(wordObj) { 
    let saved = JSON.parse(localStorage.getItem(`wordtag_wrong_${currentLanguage}`)) || []; 
    saved = saved.filter(w => w.word !== wordObj.word); 
    localStorage.setItem(`wordtag_wrong_${currentLanguage}`, JSON.stringify(saved)); 
    if(saved.length === 0) { 
        userStats.clearedDifficultMode = true; 
        checkAndUnlockAchievements(); 
    } 
}

function openSubcategories(category) { 
    currentCategory = category; 
    document.getElementById('subcategory-title').innerText = category; 
    const container = document.getElementById('subcategory-container'); 
    container.innerHTML = ""; 
    const subCats = currentLangData[category]; 
    
    Object.keys(subCats).forEach(subCat => { 
        const div = document.createElement('div'); 
        div.className = 'liquid-card'; 
        div.innerHTML = `<span>${subCat} <br><small>(${subCats[subCat].length} Kelime)</small></span>`; 
        div.onclick = function() { this.classList.toggle('selected'); }; 
        container.appendChild(div); 
    }); 
    showScreen('subcategory-screen'); 
}

function startSelectedSubcategories() { 
    words = []; 
    isMixedMode = false; isSuddenDeathMode = false; isDifficultMode = false; 
    const selectedCards = document.querySelectorAll('#subcategory-container .liquid-card.selected'); 
    if(selectedCards.length === 0) return; 
    
    selectedCards.forEach(card => { 
        let subCatName = card.querySelector('span').innerText.split('\n')[0].trim(); 
        const subCatWords = currentLangData[currentCategory][subCatName]; 
        if(subCatWords) words = words.concat(subCatWords); 
    }); 
    if(words.length === 0) return; 
    startGameEngine(); 
}

function startMixedGame() { 
    words = []; isMixedMode = true; isSuddenDeathMode = false; isDifficultMode = false; userStats.playedMixed = true; 
    Object.keys(currentLangData).forEach(catKey => { 
        const catLower = catKey.trim().toLowerCase(); 
        if(catLower.includes('karışık') || catLower.includes('tümü')) return; 
        if(!Array.isArray(currentLangData[catKey])) { 
            Object.keys(currentLangData[catKey]).forEach(subCatKey => { 
                if(Array.isArray(currentLangData[catKey][subCatKey])) { 
                    words = words.concat(currentLangData[catKey][subCatKey]); 
                } 
            }); 
        } else { 
            if(Array.isArray(currentLangData[catKey])) { words = words.concat(currentLangData[catKey]); } 
        } 
    }); 
    if(words.length === 0) return; 
    startGameEngine(); 
}

function startSuddenDeathGame() { 
    words = []; isMixedMode = false; isSuddenDeathMode = true; isDifficultMode = false; userStats.playedSuddenDeath = true; 
    Object.keys(currentLangData).forEach(catKey => { 
        const catLower = catKey.trim().toLowerCase(); 
        if(catLower.includes('karışık') || catLower.includes('tümü')) return; 
        if(!Array.isArray(currentLangData[catKey])) { 
            Object.keys(currentLangData[catKey]).forEach(subCatKey => { 
                if(Array.isArray(currentLangData[catKey][subCatKey])) { 
                    words = words.concat(currentLangData[catKey][subCatKey]); 
                } 
            }); 
        } else { 
            if(Array.isArray(currentLangData[catKey])) { words = words.concat(currentLangData[catKey]); } 
        } 
    }); 
    if(words.length === 0) return; 
    startGameEngine(); 
}

function startGameEngine() { 
    shuffleAndApplySRS(words); 
    currentIndex = 0; correctCount = 0; wrongCount = 0; sessionEarnedCoins = 0; sessionCorrectInRow = 0; comboCount = 0; lastAction = ""; 
    document.getElementById('combo-container').innerHTML = ""; 
    triggerXPBarAnimation(0); 
    startCustomTimer(); 
    showScreen('app-screen'); 
    loadCard(); 
}

function showResults() { 
    clearInterval(timerInterval); 
    document.getElementById('correct-text').innerText = `Doğru: ${correctCount}`; 
    document.getElementById('wrong-text').innerText = `Yanlış: ${wrongCount}`; 
    document.getElementById('earned-coins-text').innerText = `Kazanılan Altın: +${sessionEarnedCoins} 🪙`; 
    
    if(isSuddenDeathMode) { 
        document.querySelector('#result-screen .section-title').innerText = "💀 Ani Ölüm Bitti!"; 
    } else if(isMixedMode && wrongCount === 0 && correctCount > 0 && !isZenMode) { 
        userStats.completedMixedWithNoWrong = true; 
    } 
    
    checkAndUnlockAchievements(); 
    document.querySelector('#result-screen .section-title').innerText = isSuddenDeathMode ? "💀 Ani Ölüm Bitti!" : "Test Bitti!"; 
    showScreen('result-screen'); 
}

function triggerComboMechanic(type) {
    if(isZenMode) return; 
    
    if (lastAction === type) { 
        comboCount++; 
    } else { 
        comboCount = 1; lastAction = type; 
    }
    
    if (type === 'correct') { 
        sessionCorrectInRow++; 
        if(sessionCorrectInRow > userStats.maxStreak) userStats.maxStreak = sessionCorrectInRow; 
    } else { 
        sessionCorrectInRow = 0; 
    }
    
    const container = document.getElementById('combo-container');
    if (comboCount > 1) { 
        const comboEl = document.createElement('div'); 
        comboEl.className = `combo-text ${type === 'correct' ? 'combo-correct' : 'combo-wrong'}`; 
        
        let phrases = type === 'correct' ? ["Harika!", "Süper!", "Mükemmel!", "Ateş Ediyorsun!"] : ["Dikkat!", "Odaklan!", "Olmadı!"]; 
        let randomPhrase; 
        do { 
            randomPhrase = phrases[Math.floor(Math.random() * phrases.length)]; 
        } while (randomPhrase === (type === 'correct' ? lastCorrectPhrase : lastWrongPhrase)); 
        
        if (type === 'correct') lastCorrectPhrase = randomPhrase; else lastWrongPhrase = randomPhrase; 
        
        comboEl.innerHTML = `${comboCount}x KOMBO!<br><span style="font-size:22px">${randomPhrase}</span>`; 
        container.appendChild(comboEl); 
        setTimeout(() => { if(comboEl.parentNode) comboEl.remove(); }, 1200); 
    }
}

function triggerStars(isCorrect) { 
    if (!isCorrect || isZenMode) return; 
    const container = document.getElementById('card-container'); 
    for (let i = 0; i < 8; i++) { 
        let star = document.createElement('div'); 
        star.innerHTML = '✨'; 
        star.className = 'star-particle'; 
        star.style.left = (150 + Math.random() * 100) + 'px'; 
        star.style.top = (100 + Math.random() * 200) + 'px'; 
        star.style.setProperty('--tx', (Math.random() * 150 + 50) + 'px'); 
        star.style.setProperty('--ty', (Math.random() * 100 - 150) + 'px'); 
        container.appendChild(star); 
        setTimeout(() => star.remove(), 700); 
    } 
}

function loadCard() {
    const container = document.getElementById('card-container'); 
    container.innerHTML = ""; 
    if (currentIndex >= words.length) { showResults(); return; }
    
    const currentWord = words[currentIndex]; 
    const rawWordText = currentWord.word || "Kelime Yok"; 
    const rawPronText = currentWord.pronunciation || currentWord.phonetic || ""; 
    const rawMeanText = currentWord.meaning || currentWord.translation || "Anlam Bulunamadı";
    
    const wordText = isReverseMode ? rawMeanText : rawWordText; 
    const meanText = isReverseMode ? rawWordText : rawMeanText; 
    const pronText = isReverseMode ? "" : rawPronText; 
    
    const speakerFront = !isReverseMode ? `<div class="speaker-btn" onclick="speakWord('${rawWordText.replace(/'/g, "\\'")}', event)">🔊</div>` : ''; 
    const speakerBack = isReverseMode ? `<div class="speaker-btn" onclick="speakWord('${rawWordText.replace(/'/g, "\\'")}', event)">🔊</div>` : '';
    
    const card = document.createElement('div'); 
    card.className = 'card';
    card.innerHTML = `
        <div class="card-inner">
            <div class="card-front" id="c-front">
                ${speakerFront}
                <div class="roman-numeral">${toRoman(currentIndex + 1)}</div>
                <div class="overlay-text text-bildim">BİLDİM</div>
                <div class="overlay-text text-bilemedim">BİLEMEDİM</div>
                <h1>${wordText}</h1>
                <p>${pronText}</p>
            </div>
            <div class="card-back" id="c-back">
                ${speakerBack}
                <div class="roman-numeral">${toRoman(currentIndex + 1)}</div>
                <div class="overlay-text text-bildim">BİLDİM</div>
                <div class="overlay-text text-bilemedim">BİLEMEDİM</div>
                <h1>${meanText}</h1>
            </div>
        </div>
    `;
    container.appendChild(card);
    
    const cFront = card.querySelector('#c-front'); 
    const cBack = card.querySelector('#c-back'); 
    const textsBildim = card.querySelectorAll('.text-bildim'); 
    const textsBilemedim = card.querySelectorAll('.text-bilemedim');
    
    let startX = 0, currentX = 0, isDragging = false, isMoved = false, hasFlipped = false;
    
    function dragStart(x) { startX = x; currentX = x; isDragging = true; isMoved = false; }
    
    function dragMove(x) {
        if (!isDragging) return; 
        currentX = x; let deltaX = currentX - startX; 
        if (Math.abs(deltaX) > 20) { isMoved = true; }
        
        if (isMoved) {
            if (!hasFlipped) { 
                isDragging = false; 
                triggerVibration('shake'); 
                card.classList.add('shake'); 
                setTimeout(() => card.classList.remove('shake'), 400); 
                return; 
            }
            card.style.transform = `translateX(${deltaX}px) rotate(${deltaX * 0.05}deg)`; 
            let percent = Math.abs(deltaX) / 200; if (percent > 1) percent = 1;
            
            if (deltaX > 0) { 
                cFront.style.background = `linear-gradient(to right, rgba(76, 175, 80, 0.8) ${percent * 100}%, transparent ${(percent * 100) + 15}%)`; 
                cBack.style.background = `linear-gradient(to left, rgba(76, 175, 80, 0.8) ${percent * 100}%, transparent ${(percent * 100) + 15}%)`; 
                textsBildim.forEach(el => el.style.opacity = percent); textsBilemedim.forEach(el => el.style.opacity = 0); 
            } else { 
                cFront.style.background = `linear-gradient(to left, rgba(244, 67, 54, 0.8) ${percent * 100}%, transparent ${(percent * 100) + 15}%)`; 
                cBack.style.background = `linear-gradient(to right, rgba(244, 67, 54, 0.8) ${percent * 100}%, transparent ${(percent * 100) + 15}%)`; 
                textsBilemedim.forEach(el => el.style.opacity = percent); textsBildim.forEach(el => el.style.opacity = 0); 
            }
        }
    }
    
    function dragEnd() {
        if (!isDragging) return; 
        isDragging = false; 
        let deltaX = currentX - startX; 
        
        if (!isMoved || !hasFlipped) { 
            card.style.transform = `translateX(0px) rotate(0deg)`; 
            return; 
        }
        
        if (Math.abs(deltaX) > 100) { 
            card.style.transition = "transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.8s"; card.style.opacity = "0";
            if (deltaX > 0) { 
                triggerVibration('correct'); card.style.transform = `translateX(600px) translateY(-50px) rotate(30deg)`; 
                correctCount++; userStats.globalCorrect++; 
                if (isSuddenDeathMode && !isZenMode) { userStats.suddenDeathScore++; } 
                if (isDifficultMode) { removeWrongWord(currentWord); } 
                srsWeights[currentWord.word] = Math.max(0.1, (srsWeights[currentWord.word] || 1) - 0.5); 
                handleAnswer(true); triggerStars(true); triggerComboMechanic('correct'); 
                setTimeout(() => { currentIndex++; loadCard(); }, 600); 
            } else { 
                triggerVibration('wrong'); card.style.transform = `translateX(-600px) translateY(-50px) rotate(-30deg)`; 
                wrongCount++; userStats.globalWrong++; saveWrongWord(currentWord); 
                srsWeights[currentWord.word] = (srsWeights[currentWord.word] || 1) + 2; 
                if(isSuddenDeathMode && !isZenMode) { triggerVibration('death'); setTimeout(() => { showResults(); }, 400); return; } 
                handleAnswer(false); triggerComboMechanic('wrong'); 
                setTimeout(() => { currentIndex++; loadCard(); }, 600); 
            }
        } else { 
            card.style.transition = "transform 0.3s ease, background 0.3s"; 
            card.style.transform = `translateX(0px) rotate(0deg)`; 
            cFront.style.background = "transparent"; cBack.style.background = "transparent"; 
            textsBildim.forEach(el => el.style.opacity = 0); textsBilemedim.forEach(el => el.style.opacity = 0); 
            setTimeout(() => { card.style.transition = "transform 0.3s ease"; }, 300); 
        }
    }
    
    card.addEventListener('click', () => { 
        if (!isMoved) { 
            card.classList.toggle('is-flipped'); hasFlipped = true; 
            cFront.style.background = "transparent"; cBack.style.background = "transparent"; 
            textsBildim.forEach(el => el.style.opacity = 0); textsBilemedim.forEach(el => el.style.opacity = 0); 
        } 
    });
    
    card.addEventListener('touchstart', (e) => dragStart(e.touches[0].clientX)); 
    card.addEventListener('touchmove', (e) => dragMove(e.touches[0].clientX)); 
    card.addEventListener('touchend', dragEnd); 
    card.addEventListener('mousedown', (e) => dragStart(e.clientX)); 
    window.addEventListener('mousemove', (e) => dragMove(e.clientX)); 
    window.addEventListener('mouseup', dragEnd);
}

function startCustomTimer() {
    clearInterval(timerInterval); 
    const timerElement = document.getElementById('timer-display');
    
    if (isZenMode) { 
        if (timerElement) { timerElement.style.display = 'flex'; timerElement.style.color = "#9C27B0"; timerElement.innerText = `🧘‍♂️ Zen Modu`; } 
        return; 
    }
    if (!isMixedMode && !isSuddenDeathMode) { 
        if (timerElement) timerElement.style.display = 'none'; 
        return; 
    }
    if (isSuddenDeathMode) { 
        if (timerElement) { timerElement.style.display = 'flex'; timerElement.style.color = "#B71C1C"; timerElement.innerText = `💀 Ani Ölüm`; } 
        return; 
    }
    
    timeRemaining = 60; streakCorrect = 0; streakWrong = 0; 
    
    if (timerElement) { 
        timerElement.style.display = 'flex'; 
        timerElement.style.color = document.body.classList.contains('dark-mode') ? '#fff' : '#333'; 
        timerElement.innerText = `⏳ ${formatTime(timeRemaining)}`; 
    }
    
    timerInterval = setInterval(() => { 
        timeRemaining--; 
        if (timeRemaining <= 0) { 
            timeRemaining = 0; clearInterval(timerInterval); 
            if(wrongCount === 0) userStats.flawlessFocusCompleted = true; 
            showResults(); 
        } 
        if (timerElement) timerElement.innerText = `⏳ ${formatTime(timeRemaining)}`; 
    }, 1000);
}

function formatTime(seconds) { 
    let m = Math.floor(seconds / 60); 
    let s = seconds % 60; 
    return `${m}:${s < 10 ? '0' : ''}${s}`; 
}

function handleAnswer(isCorrect) {
    if (isCorrect) { 
        userStats.totalWordsLearned++; addXP(xpPerCorrectWord); 
        if(!isZenMode) { userCoins += 5; sessionEarnedCoins += 5; updateCoinDisplays(); } 
    }
    saveUserProgress();
    
    if (!isMixedMode || isZenMode) { checkAndUnlockAchievements(); return; }
    
    let timeChange = 0; let timeText = ""; let color = "";
    if (isCorrect) { 
        streakWrong = 0; streakCorrect++; 
        timeChange = Math.min(streakCorrect * 3, 12); 
        timeRemaining += timeChange; 
        timeText = `+${timeChange}s`; color = "#4CAF50"; 
    } else { 
        streakCorrect = 0; streakWrong++; 
        timeChange = Math.min(streakWrong * 2, 8); 
        timeRemaining -= timeChange; 
        if (timeRemaining < 0) timeRemaining = 0; 
        timeText = `-${timeChange}s`; color = "#F44336"; 
    }
    
    const timerElement = document.getElementById('timer-display'); 
    if (timerElement) { 
        timerElement.innerText = `⏳ ${formatTime(timeRemaining)}`; 
        showComboAnimation(timeText, color, timerElement); 
    }
    
    if (timeRemaining === 0) { clearInterval(timerInterval); setTimeout(showResults, 300); } 
    checkAndUnlockAchievements();
}

function showComboAnimation(text, color, targetElement) { 
    const animEl = document.createElement('div'); 
    animEl.innerText = text; 
    animEl.style.position = 'absolute'; 
    animEl.style.color = color; 
    animEl.style.fontWeight = 'bold'; 
    animEl.style.fontSize = '24px'; 
    animEl.style.transition = 'all 0.8s ease-out'; 
    animEl.style.zIndex = '1000'; 
    animEl.style.textShadow = "1px 1px 3px rgba(0,0,0,0.5)"; 
    animEl.style.left = '50%'; 
    animEl.style.top = '100%'; 
    animEl.style.transform = 'translateX(-50%)'; 
    targetElement.style.position = "relative"; 
    targetElement.appendChild(animEl); 
    
    setTimeout(() => { animEl.style.top = '-25px'; animEl.style.opacity = '0'; }, 50); 
    setTimeout(() => animEl.remove(), 800); 
}

function triggerComboAnimation(text, color, targetElement) { 
    const animEl = document.createElement('div'); 
    animEl.innerText = text; 
    animEl.style.position = 'absolute'; 
    animEl.style.color = color; 
    animEl.style.fontWeight = 'bold'; 
    animEl.style.fontSize = '28px'; 
    animEl.style.zIndex = '9999'; 
    animEl.style.textShadow = "0px 4px 10px rgba(0,0,0,0.5)"; 
    animEl.style.left = '50%'; 
    animEl.style.top = '20%'; 
    animEl.style.transform = 'translate(-50%, -50%)'; 
    animEl.style.animation = 'popUp 1.5s forwards'; 
    targetElement.appendChild(animEl); 
    
    setTimeout(() => animEl.remove(), 1500); 
}