// --- TEMEL DEĞİŞKENLER ---
let currentLangData = {}; let currentLanguage = ""; let currentCategory = "";
let words = []; let currentIndex = 0; let correctCount = 0; let wrongCount = 0;

// --- MOD VE OYUN DEĞİŞKENLERİ ---
let isMixedMode = false; let isSuddenDeathMode = false; let isReverseMode = false; 
let isDifficultMode = false; // Zorlandıklarım modu mu?
let timerInterval; let timeRemaining = 60; 
let streakCorrect = 0; let streakWrong = 0; let comboCount = 0;
let lastAction = ""; let lastCorrectPhrase = ""; let lastWrongPhrase = "";
let sessionCorrectInRow = 0; // Kusursuz Odak rozeti için

// --- YENİ: XP VE ROZET SİSTEMİ DEĞİŞKENLERİ ---
let currentXP = 0; 
let currentLevel = 1; 
const xpPerCorrectWord = 25; 
const xpToNextLevelFormula = (level) => 100 * Math.pow(level, 1.5); 
const levelTitles = ["Çırak", "Gezgin", "Alim", "Usta", "Bilge", "Efsane"];

let userStats = { maxStreak: 0, totalWordsLearned: 0, clearedDifficultMode: false, playedMixed: false, playedSuddenDeath: false, suddenDeathScore: 0, completedMixedWithNoWrong: false, flawlessFocusCompleted: false, playedEveryMode: false };

let achievements = {
    firstStrike: { id: 'firstStrike', icon: '✊', title: 'İlk Kan', desc: 'Arka arkaya 10 doğru yap', condition: (s) => s.maxStreak >= 10, unlocked: false },
    flawlessFocus: { id: 'flawlessFocus', icon: '🧠', title: 'Kusursuz Odak', desc: '1 Dakikayı yanlış yapmadan bitir', condition: (s) => s.flawlessFocusCompleted, unlocked: false },
    errorHunter: { id: 'errorHunter', icon: '🔍', title: 'Hata Avcısı', desc: 'Zorlandıklarım kategorisini sıfırla', condition: (s) => s.clearedDifficultMode, unlocked: false },
    masterLinguist: { id: 'masterLinguist', icon: '📚', title: 'Usta', desc: '500 kelime öğren', condition: (s) => s.totalWordsLearned >= 500, unlocked: false },
    timeWarrior: { id: 'timeWarrior', icon: '⏳', title: 'Zaman Savaşçısı', desc: 'Süreli modu 0 yanlışla bitir', condition: (s) => s.completedMixedWithNoWrong, unlocked: false },
    suddenDeathHero: { id: 'suddenDeathHero', icon: '💀', title: 'Hayatta Kalan', desc: 'Ani Ölümde 30 puan yap', condition: (s) => s.suddenDeathScore >= 30, unlocked: false }
};

// --- BAŞLANGIÇ YÜKLEMELERİ ---
window.onload = () => { loadUserProgress(); };

function loadUserProgress() {
    currentXP = parseInt(localStorage.getItem('wordtag_xp')) || 0;
    currentLevel = parseInt(localStorage.getItem('wordtag_level')) || 1;
    let savedStats = JSON.parse(localStorage.getItem('wordtag_stats'));
    if (savedStats) userStats = { ...userStats, ...savedStats };
    let savedAchievements = JSON.parse(localStorage.getItem('wordtag_achievements'));
    if (savedAchievements) { Object.keys(achievements).forEach(key => { if(savedAchievements[key]) achievements[key].unlocked = savedAchievements[key].unlocked; }); }
    triggerXPBarAnimation(0);
}

function saveUserProgress() {
    localStorage.setItem('wordtag_xp', currentXP);
    localStorage.setItem('wordtag_level', currentLevel);
    localStorage.setItem('wordtag_stats', JSON.stringify(userStats));
    localStorage.setItem('wordtag_achievements', JSON.stringify(achievements));
}

// --- XP VE SEVİYE MANTIĞI ---
function addXP(amount) {
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
    if(userStats.playedMixed && userStats.playedSuddenDeath) { userStats.playedEveryMode = true; }
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
        btn.innerText = "🏆 Rozet Koleksiyonum";
    } else {
        categoryGrid.style.display = 'none';
        achievementGrid.style.display = 'flex';
        createAchievementGrid(); 
        btn.innerText = "🗂️ Kategorilere Dön";
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

// --- YARDIMCI FONKSİYONLAR ---
function toRoman(num) {
    const roman = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
    let str = '';
    for (let i of Object.keys(roman)) { let q = Math.floor(num / roman[i]); num -= q * roman[i]; str += i.repeat(q); } 
    return str;
}
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; }
}

function triggerVibration(type) {
    if (!("vibrate" in navigator)) return; 
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
    if (currentLanguage === 'İngilizce') { utterance.lang = 'en-US'; } else if (currentLanguage === 'İtalyanca') { utterance.lang = 'it-IT'; }
    utterance.rate = 0.9; 
    speechSynthesis.speak(utterance);
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
        if(screenId === 'app-screen' && (isMixedMode || isSuddenDeathMode)) { timerDisplay.style.display = 'flex'; } 
        else { clearInterval(timerInterval); timerDisplay.classList.remove('danger'); timerDisplay.style.display = 'none'; }
    }
}
function enterApp() { showScreen('lang-screen'); }

function toggleReverseMode() {
    isReverseMode = !isReverseMode;
    const btn = document.getElementById('reverse-btn');
    if(isReverseMode) { btn.innerText = "🔀 Tersine Mod: AÇIK"; btn.style.backgroundColor = "#4CAF50"; btn.style.color = "white"; btn.style.borderColor = "#4CAF50"; } 
    else { btn.innerText = "🔀 Tersine Mod: KAPALI"; btn.style.backgroundColor = "#f2f2f2"; btn.style.color = "#333"; btn.style.borderColor = "#ccc"; }
}

async function selectLanguage(lang) {
    currentLanguage = lang;
    const container = document.getElementById('category-container');
    document.getElementById('category-title').innerText = `${lang} Kategorileri`;
    container.innerHTML = "<h4>Kelimeler Yükleniyor...</h4>";
    
    // Rozet butonunu sıfırla
    document.getElementById('achievement-container').style.display = 'none';
    document.getElementById('category-container').style.display = 'flex';
    document.getElementById('view-achievements-btn').innerText = "🏆 Rozet Koleksiyonum";

    if(!document.getElementById('reverse-btn')) {
        const revBtn = document.createElement('button');
        revBtn.id = 'reverse-btn'; revBtn.className = 'pill-btn'; revBtn.style.marginBottom = '30px';
        revBtn.innerText = isReverseMode ? "🔀 Tersine Mod: AÇIK" : "🔀 Tersine Mod: KAPALI";
        if(isReverseMode) { revBtn.style.backgroundColor = "#4CAF50"; revBtn.style.color = "white"; revBtn.style.borderColor = "#4CAF50"; }
        revBtn.onclick = toggleReverseMode;
        document.getElementById('category-title').after(revBtn);
    }
    showScreen('category-screen'); 

    try {
        let response;
        if (lang === 'İngilizce') { response = await fetch('./data/eng.json'); } 
        else if (lang === 'İtalyanca') { response = await fetch('./data/it.json'); } 
        else { container.innerHTML = "<h4 style='color:red'>Bu dil henüz eklenmedi.</h4>"; return; }

        if (!response.ok) throw new Error("Dosya bulunamadı");
        currentLangData = await response.json();
        container.innerHTML = ""; 

        let savedWrongWords = JSON.parse(localStorage.getItem(`wordtag_wrong_${currentLanguage}`)) || [];
        if (savedWrongWords.length > 0) {
            const wrongDiv = document.createElement('div');
            wrongDiv.className = 'liquid-card'; wrongDiv.style.borderColor = "#F44336"; wrongDiv.style.boxShadow = "0 0 15px rgba(244, 67, 54, 0.2)";
            wrongDiv.innerHTML = `<span>Zorlandıklarım <br><small style="color:#F44336">(${savedWrongWords.length} Kelime)</small></span>`;
            wrongDiv.onclick = () => { words = savedWrongWords; isMixedMode = false; isSuddenDeathMode = false; isDifficultMode = true; startGameEngine(); };
            container.appendChild(wrongDiv);
        }

        Object.keys(currentLangData).forEach(cat => {
            const catLower = cat.trim().toLowerCase();
            if(catLower.includes('karışık') || catLower.includes('tümü')) return;
            const div = document.createElement('div'); div.className = 'liquid-card';
            let totalWords = 0; let isTwoLevel = !Array.isArray(currentLangData[cat]); 
            if(isTwoLevel) { Object.keys(currentLangData[cat]).forEach(subCat => { totalWords += currentLangData[cat][subCat].length; }); } 
            else { totalWords = currentLangData[cat].length; }
            div.innerHTML = `<span>${cat} <br><small>(${totalWords} Kelime)</small></span>`;
            div.onclick = () => { if(isTwoLevel) { openSubcategories(cat); } else { words = currentLangData[cat]; isMixedMode = false; isSuddenDeathMode = false; isDifficultMode = false; startGameEngine(); } };
            container.appendChild(div);
        });

        const mixDiv = document.createElement('div'); mixDiv.className = 'liquid-card mixed-card'; mixDiv.innerHTML = `<span>Karışık <br><small>(Tümü & Süreli)</small></span>`;
        mixDiv.onclick = () => startMixedGame(); container.appendChild(mixDiv);

        const suddenDiv = document.createElement('div'); suddenDiv.className = 'liquid-card'; suddenDiv.style.background = "#ffebee"; suddenDiv.style.borderColor = "#B71C1C";
        suddenDiv.innerHTML = `<span style="color:#B71C1C">Ani Ölüm 💀<br><small>(Tek Hata = Biter)</small></span>`;
        suddenDiv.onclick = () => startSuddenDeathGame(); container.appendChild(suddenDiv);

    } catch (error) { container.innerHTML = `<p style='color:red; text-align:center;'>JSON dosyası yüklenemedi!<br>Lütfen Live Server'ı kontrol edin.</p>`; }
}

function saveWrongWord(wordObj) {
    let saved = JSON.parse(localStorage.getItem(`wordtag_wrong_${currentLanguage}`)) || [];
    if (!saved.some(w => w.word === wordObj.word)) { saved.push(wordObj); localStorage.setItem(`wordtag_wrong_${currentLanguage}`, JSON.stringify(saved)); }
}

// Zorlandıklarım modunda doğru bilinen kelimeyi listeden çıkar
function removeWrongWord(wordObj) {
    let saved = JSON.parse(localStorage.getItem(`wordtag_wrong_${currentLanguage}`)) || [];
    saved = saved.filter(w => w.word !== wordObj.word);
    localStorage.setItem(`wordtag_wrong_${currentLanguage}`, JSON.stringify(saved));
    if(saved.length === 0) { userStats.clearedDifficultMode = true; checkAndUnlockAchievements(); }
}

function openSubcategories(category) {
    currentCategory = category; document.getElementById('subcategory-title').innerText = category;
    const container = document.getElementById('subcategory-container'); container.innerHTML = "";
    const subCats = currentLangData[category];
    Object.keys(subCats).forEach(subCat => {
        const div = document.createElement('div'); div.className = 'liquid-card';
        div.innerHTML = `<span>${subCat} <br><small>(${subCats[subCat].length} Kelime)</small></span>`;
        div.onclick = function() { this.classList.toggle('selected'); };
        container.appendChild(div);
    });
    showScreen('subcategory-screen');
}

function startSelectedSubcategories() {
    words = []; isMixedMode = false; isSuddenDeathMode = false; isDifficultMode = false;
    const selectedCards = document.querySelectorAll('#subcategory-container .liquid-card.selected');
    if(selectedCards.length === 0) { alert("Lütfen başlamadan önce en az bir alt kategori seçin!"); return; }
    selectedCards.forEach(card => {
        let subCatName = card.querySelector('span').innerText.split('\n')[0].trim();
        const subCatWords = currentLangData[currentCategory][subCatName];
        if(subCatWords) { words = words.concat(subCatWords); }
    });
    if(words.length === 0) return; startGameEngine();
}

function startMixedGame() {
    words = []; isMixedMode = true; isSuddenDeathMode = false; isDifficultMode = false; userStats.playedMixed = true;
    Object.keys(currentLangData).forEach(catKey => {
        const catLower = catKey.trim().toLowerCase();
        if(catLower.includes('karışık') || catLower.includes('tümü')) return;
        if(!Array.isArray(currentLangData[catKey])) { Object.keys(currentLangData[catKey]).forEach(subCatKey => { if(Array.isArray(currentLangData[catKey][subCatKey])) { words = words.concat(currentLangData[catKey][subCatKey]); } }); } 
        else { if(Array.isArray(currentLangData[catKey])) { words = words.concat(currentLangData[catKey]); } }
    });
    if(words.length === 0) return; startGameEngine();
}

function startSuddenDeathGame() {
    words = []; isMixedMode = false; isSuddenDeathMode = true; isDifficultMode = false; userStats.playedSuddenDeath = true;
    Object.keys(currentLangData).forEach(catKey => {
        const catLower = catKey.trim().toLowerCase();
        if(catLower.includes('karışık') || catLower.includes('tümü')) return;
        if(!Array.isArray(currentLangData[catKey])) { Object.keys(currentLangData[catKey]).forEach(subCatKey => { if(Array.isArray(currentLangData[catKey][subCatKey])) { words = words.concat(currentLangData[catKey][subCatKey]); } }); } 
        else { if(Array.isArray(currentLangData[catKey])) { words = words.concat(currentLangData[catKey]); } }
    });
    if(words.length === 0) return; startGameEngine();
}

function startGameEngine() {
    shuffleArray(words); currentIndex = 0; correctCount = 0; wrongCount = 0; 
    sessionCorrectInRow = 0; comboCount = 0; lastAction = ""; document.getElementById('combo-container').innerHTML = "";
    triggerXPBarAnimation(0); // Barı güncelle
    startCustomTimer(); showScreen('app-screen'); loadCard();
}

function showResults() {
    clearInterval(timerInterval);
    document.getElementById('correct-text').innerText = `Doğru: ${correctCount}`;
    document.getElementById('wrong-text').innerText = `Yanlış: ${wrongCount}`;
    
    if(isSuddenDeathMode) { document.querySelector('#result-screen .section-title').innerText = "💀 Ani Ölüm Bitti!"; } 
    else if(isMixedMode && wrongCount === 0 && correctCount > 0) { userStats.completedMixedWithNoWrong = true; }
    
    checkAndUnlockAchievements();
    document.querySelector('#result-screen .section-title').innerText = isSuddenDeathMode ? "💀 Ani Ölüm Bitti!" : "Test Bitti!";
    showScreen('result-screen');
}

function triggerComboMechanic(type) {
    if (lastAction === type) { comboCount++; } else { comboCount = 1; lastAction = type; }
    
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
        do { randomPhrase = phrases[Math.floor(Math.random() * phrases.length)]; } while (randomPhrase === (type === 'correct' ? lastCorrectPhrase : lastWrongPhrase));
        if (type === 'correct') lastCorrectPhrase = randomPhrase; else lastWrongPhrase = randomPhrase;
        
        comboEl.innerHTML = `${comboCount}x KOMBO!<br><span style="font-size:22px">${randomPhrase}</span>`;
        container.appendChild(comboEl);
        setTimeout(() => { if(comboEl.parentNode) comboEl.remove(); }, 1200);
    }
}

function triggerStars(isCorrect) {
    if (!isCorrect) return;
    const container = document.getElementById('card-container');
    for (let i = 0; i < 8; i++) {
        let star = document.createElement('div'); star.innerHTML = '✨'; star.className = 'star-particle';
        star.style.left = (150 + Math.random() * 100) + 'px'; star.style.top = (100 + Math.random() * 200) + 'px';
        star.style.setProperty('--tx', (Math.random() * 150 + 50) + 'px'); star.style.setProperty('--ty', (Math.random() * 100 - 150) + 'px');
        container.appendChild(star); setTimeout(() => star.remove(), 700);
    }
}

function loadCard() {
    const container = document.getElementById('card-container'); container.innerHTML = "";
    if (currentIndex >= words.length) { showResults(); return; }

    const currentWord = words[currentIndex];
    const rawWordText = currentWord.word || "Kelime Yok"; const rawPronText = currentWord.pronunciation || currentWord.phonetic || ""; const rawMeanText = currentWord.meaning || currentWord.translation || "Anlam Bulunamadı";
    
    const wordText = isReverseMode ? rawMeanText : rawWordText; const meanText = isReverseMode ? rawWordText : rawMeanText; const pronText = isReverseMode ? "" : rawPronText; 
    const targetVoiceWord = rawWordText; 

    const speakerFront = !isReverseMode ? `<div class="speaker-btn" onclick="speakWord('${targetVoiceWord.replace(/'/g, "\\'")}', event)">🔊</div>` : '';
    const speakerBack = isReverseMode ? `<div class="speaker-btn" onclick="speakWord('${targetVoiceWord.replace(/'/g, "\\'")}', event)">🔊</div>` : '';

    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `
        <div class="card-inner">
            <div class="card-front" id="c-front">${speakerFront}<div class="roman-numeral">${toRoman(currentIndex + 1)}</div><div class="overlay-text text-bildim">BİLDİM</div><div class="overlay-text text-bilemedim">BİLEMEDİM</div><h1>${wordText}</h1><p>${pronText}</p></div>
            <div class="card-back" id="c-back">${speakerBack}<div class="roman-numeral">${toRoman(currentIndex + 1)}</div><div class="overlay-text text-bildim">BİLDİM</div><div class="overlay-text text-bilemedim">BİLEMEDİM</div><h1>${meanText}</h1></div>
        </div>
    `;
    container.appendChild(card);
    
    const cFront = card.querySelector('#c-front'); const cBack = card.querySelector('#c-back');
    const textsBildim = card.querySelectorAll('.text-bildim'); const textsBilemedim = card.querySelectorAll('.text-bilemedim');
    let startX = 0, currentX = 0, isDragging = false, isMoved = false, hasFlipped = false;

    function dragStart(x) { startX = x; currentX = x; isDragging = true; isMoved = false; }
    function dragMove(x) {
        if (!isDragging) return; currentX = x; let deltaX = currentX - startX;
        if (Math.abs(deltaX) > 20) { isMoved = true; }
        if (isMoved) {
            if (!hasFlipped) { isDragging = false; triggerVibration('shake'); card.classList.add('shake'); setTimeout(() => card.classList.remove('shake'), 400); return; }
            card.style.transform = `translateX(${deltaX}px) rotate(${deltaX * 0.05}deg)`;
            let percent = Math.abs(deltaX) / 200; if (percent > 1) percent = 1;
            if (deltaX > 0) {
                cFront.style.background = `linear-gradient(to right, rgba(76, 175, 80, 0.8) ${percent * 100}%, #ffffff ${(percent * 100) + 15}%)`; cBack.style.background = `linear-gradient(to left, rgba(76, 175, 80, 0.8) ${percent * 100}%, #e8f5e9 ${(percent * 100) + 15}%)`;
                textsBildim.forEach(el => el.style.opacity = percent); textsBilemedim.forEach(el => el.style.opacity = 0);
            } else {
                cFront.style.background = `linear-gradient(to left, rgba(244, 67, 54, 0.8) ${percent * 100}%, #ffffff ${(percent * 100) + 15}%)`; cBack.style.background = `linear-gradient(to right, rgba(244, 67, 54, 0.8) ${percent * 100}%, #e8f5e9 ${(percent * 100) + 15}%)`;
                textsBilemedim.forEach(el => el.style.opacity = percent); textsBildim.forEach(el => el.style.opacity = 0);
            }
        }
    }

    function dragEnd() {
        if (!isDragging) return; isDragging = false; let deltaX = currentX - startX;
        if (!isMoved || !hasFlipped) { card.style.transform = `translateX(0px) rotate(0deg)`; return; }

        if (Math.abs(deltaX) > 100) { 
            card.style.transition = "transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.8s"; card.style.opacity = "0";

            if (deltaX > 0) {
                // DOĞRU
                triggerVibration('correct'); card.style.transform = `translateX(600px) translateY(-50px) rotate(30deg)`;
                correctCount++; 
                if (isSuddenDeathMode) { userStats.suddenDeathScore++; }
                if (isDifficultMode) { removeWrongWord(currentWord); } // Zorlandıklarımdan çıkar
                
                handleAnswer(true); triggerStars(true); triggerComboMechanic('correct');
                setTimeout(() => { currentIndex++; loadCard(); }, 600);
            } else {
                // YANLIŞ
                triggerVibration('wrong'); card.style.transform = `translateX(-600px) translateY(-50px) rotate(-30deg)`;
                wrongCount++; saveWrongWord(currentWord); 
                
                if(isSuddenDeathMode) { triggerVibration('death'); setTimeout(() => { showResults(); }, 400); return; }
                handleAnswer(false); triggerComboMechanic('wrong');
                setTimeout(() => { currentIndex++; loadCard(); }, 600);
            }
        } else {
            card.style.transition = "transform 0.3s ease, background 0.3s"; card.style.transform = `translateX(0px) rotate(0deg)`;
            cFront.style.background = "#ffffff"; cBack.style.background = "#e8f5e9";
            textsBildim.forEach(el => el.style.opacity = 0); textsBilemedim.forEach(el => el.style.opacity = 0);
            setTimeout(() => { card.style.transition = "transform 0.3s ease"; }, 300);
        }
    }

    card.addEventListener('click', () => {
        if (!isMoved) { 
            card.classList.toggle('is-flipped'); hasFlipped = true; 
            cFront.style.background = "#ffffff"; cBack.style.background = "#e8f5e9";
            textsBildim.forEach(el => el.style.opacity = 0); textsBilemedim.forEach(el => el.style.opacity = 0);
        }
    });

    card.addEventListener('touchstart', (e) => dragStart(e.touches[0].clientX)); card.addEventListener('touchmove', (e) => dragMove(e.touches[0].clientX)); card.addEventListener('touchend', dragEnd);
    card.addEventListener('mousedown', (e) => dragStart(e.clientX)); window.addEventListener('mousemove', (e) => dragMove(e.clientX)); window.addEventListener('mouseup', dragEnd);
}

function startCustomTimer() {
    clearInterval(timerInterval); const timerElement = document.getElementById('timer-display');
    if (!isMixedMode && !isSuddenDeathMode) { if (timerElement) timerElement.style.display = 'none'; return; }
    if (isSuddenDeathMode) { if (timerElement) { timerElement.style.display = 'flex'; timerElement.style.color = "#B71C1C"; timerElement.innerText = `💀 Ani Ölüm`; } return; }

    timeRemaining = 60; streakCorrect = 0; streakWrong = 0;
    if (timerElement) { timerElement.style.display = 'flex'; timerElement.style.color = "#333"; timerElement.innerText = `⏳ ${formatTime(timeRemaining)}`; }

    timerInterval = setInterval(() => {
        timeRemaining--;
        if (timeRemaining <= 0) { 
            timeRemaining = 0; clearInterval(timerInterval); 
            if(wrongCount === 0) userStats.flawlessFocusCompleted = true; // Kusursuz rozet kontrolü
            showResults(); 
        }
        if (timerElement) timerElement.innerText = `⏳ ${formatTime(timeRemaining)}`;
    }, 1000);
}

function formatTime(seconds) { let m = Math.floor(seconds / 60); let s = seconds % 60; return `${m}:${s < 10 ? '0' : ''}${s}`; }

function handleAnswer(isCorrect) {
    if (isCorrect) {
        userStats.totalWordsLearned++;
        addXP(xpPerCorrectWord); // XP Ekle
    }
    
    if (!isMixedMode) { checkAndUnlockAchievements(); return; }

    let timeChange = 0; let timeText = ""; let color = "";
    if (isCorrect) {
        streakWrong = 0; streakCorrect++; timeChange = Math.min(streakCorrect * 3, 12); timeRemaining += timeChange;
        timeText = `+${timeChange}s`; color = "#4CAF50"; 
    } else {
        streakCorrect = 0; streakWrong++; timeChange = Math.min(streakWrong * 2, 8); timeRemaining -= timeChange;
        if (timeRemaining < 0) timeRemaining = 0; timeText = `-${timeChange}s`; color = "#F44336"; 
    }

    const timerElement = document.getElementById('timer-display');
    if (timerElement) { timerElement.innerText = `⏳ ${formatTime(timeRemaining)}`; showComboAnimation(timeText, color, timerElement); }
    if (timeRemaining === 0) { clearInterval(timerInterval); setTimeout(showResults, 300); }
    
    checkAndUnlockAchievements();
}

function showComboAnimation(text, color, targetElement) {
    const animEl = document.createElement('div'); animEl.innerText = text;
    animEl.style.position = 'absolute'; animEl.style.color = color; animEl.style.fontWeight = 'bold'; animEl.style.fontSize = '24px'; animEl.style.transition = 'all 0.8s ease-out'; animEl.style.zIndex = '1000'; animEl.style.textShadow = "1px 1px 3px rgba(0,0,0,0.5)";
    animEl.style.left = '50%'; animEl.style.top = '100%'; animEl.style.transform = 'translateX(-50%)'; targetElement.style.position = "relative"; targetElement.appendChild(animEl);
    setTimeout(() => { animEl.style.top = '-25px'; animEl.style.opacity = '0'; }, 50); setTimeout(() => animEl.remove(), 800);
}

function triggerComboAnimation(text, color, targetElement) {
    const animEl = document.createElement('div'); animEl.innerText = text;
    animEl.style.position = 'absolute'; animEl.style.color = color; animEl.style.fontWeight = 'bold'; animEl.style.fontSize = '28px'; animEl.style.zIndex = '9999'; animEl.style.textShadow = "0px 4px 10px rgba(0,0,0,0.5)";
    animEl.style.left = '50%'; animEl.style.top = '20%'; animEl.style.transform = 'translate(-50%, -50%)';
    animEl.style.animation = 'popUp 1.5s forwards';
    targetElement.appendChild(animEl);
    setTimeout(() => animEl.remove(), 1500);
}