// --- TEMEL DEĞİŞKENLER ---
let currentLangData = {}; 
let currentLanguage = ""; 
let currentCategory = "";
let words = []; 
let currentIndex = 0;
let correctCount = 0;
let wrongCount = 0;

// --- YENİ SÜRE VE KOMBO DEĞİŞKENLERİ ---
let isMixedMode = false;
let timerInterval;
let timeRemaining = 60; 
let streakCorrect = 0; 
let streakWrong = 0; 
let comboCount = 0;
let lastAction = "";
let lastCorrectPhrase = "";
let lastWrongPhrase = "";

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

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    // Süre kontrolü
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
        if(screenId === 'app-screen' && isMixedMode) {
            timerDisplay.style.display = 'flex';
        } else {
            clearInterval(timerInterval); 
            timerDisplay.classList.remove('danger');
            timerDisplay.style.display = 'none'; 
        }
    }
}

function enterApp() { 
    showScreen('lang-screen');
}

// --- 1. DİL SEÇİMİ VE KATEGORİLER ---
async function selectLanguage(lang) {
    currentLanguage = lang;
    const container = document.getElementById('category-container');
    document.getElementById('category-title').innerText = `${lang} Kategorileri`;
    container.innerHTML = "<h4>Kelimeler Yükleniyor...</h4>";
    showScreen('category-screen'); 

    try {
        let response;
        if (lang === 'İngilizce') {
            response = await fetch('./data/eng.json');
        } else if (lang === 'İtalyanca') {
            response = await fetch('./data/it.json');
        } else {
            container.innerHTML = "<h4 style='color:red'>Bu dil henüz eklenmedi.</h4>";
            return;
        }

        if (!response.ok) throw new Error("Dosya bulunamadı");
        currentLangData = await response.json();
        container.innerHTML = ""; 

        Object.keys(currentLangData).forEach(cat => {
            const catLower = cat.trim().toLowerCase();
            if(catLower.includes('karışık') || catLower.includes('karisik') || catLower.includes('tümü')) return;

            const div = document.createElement('div');
            div.className = 'liquid-card';
            
            let totalWords = 0;
            let isTwoLevel = !Array.isArray(currentLangData[cat]); 

            if(isTwoLevel) {
                Object.keys(currentLangData[cat]).forEach(subCat => {
                    totalWords += currentLangData[cat][subCat].length;
                });
            } else {
                totalWords = currentLangData[cat].length; 
            }

            div.innerHTML = `<span>${cat} <br><small>(${totalWords} Kelime)</small></span>`;
            
            div.onclick = () => {
                if(isTwoLevel) {
                    openSubcategories(cat);
                } else {
                    words = currentLangData[cat];
                    startGameEngine();
                }
            };
            container.appendChild(div);
        });

        // Karışık Kategori Ekleme
        const mixDiv = document.createElement('div');
        mixDiv.className = 'liquid-card mixed-card';
        mixDiv.innerHTML = `<span>Karışık <br><small>(Tümü & Süreli)</small></span>`;
        mixDiv.onclick = () => startMixedGame(); 
        container.appendChild(mixDiv);

    } catch (error) {
        console.error("Veri çekilemedi:", error);
        container.innerHTML = `<p style='color:red; text-align:center;'>JSON dosyası yüklenemedi!<br>Lütfen Live Server'ı kontrol edin.</p>`;
    }
}

// --- 2. ALT KATEGORİLER ---
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

// Seçili Kategorilerle Başlat
function startSelectedSubcategories() {
    words = [];
    isMixedMode = false; 
    const selectedCards = document.querySelectorAll('#subcategory-container .liquid-card.selected');

    if(selectedCards.length === 0) {
        alert("Lütfen başlamadan önce en az bir alt kategori seçin!");
        return;
    }

    selectedCards.forEach(card => {
        let subCatName = card.querySelector('span').innerText.split('\n')[0].trim();
        const subCatWords = currentLangData[currentCategory][subCatName];
        if(subCatWords) {
            words = words.concat(subCatWords);
        }
    });

    if(words.length === 0) return;
    startGameEngine();
}

// Karışık Oyun Başlat
function startMixedGame() {
    words = [];
    isMixedMode = true; 
    
    Object.keys(currentLangData).forEach(catKey => {
        const catLower = catKey.trim().toLowerCase();
        if(catLower.includes('karışık') || catLower.includes('karisik') || catLower.includes('tümü')) return;

        if(!Array.isArray(currentLangData[catKey])) {
            Object.keys(currentLangData[catKey]).forEach(subCatKey => {
                if(Array.isArray(currentLangData[catKey][subCatKey])) {
                    words = words.concat(currentLangData[catKey][subCatKey]);
                }
            });
        } else {
            if(Array.isArray(currentLangData[catKey])) {
                words = words.concat(currentLangData[catKey]);
            }
        }
    });

    if(words.length === 0) return;
    startGameEngine();
}

function startGameEngine() {
    shuffleArray(words);
    currentIndex = 0; 
    correctCount = 0; 
    wrongCount = 0; 
    
    startCustomTimer();
    
    comboCount = 0; 
    lastAction = ""; 
    document.getElementById('combo-container').innerHTML = "";
    
    showScreen('app-screen'); 
    loadCard();
}

function showResults() {
    clearInterval(timerInterval);
    document.getElementById('correct-text').innerText = `Doğru: ${correctCount}`;
    document.getElementById('wrong-text').innerText = `Yanlış: ${wrongCount}`;
    showScreen('result-screen');
}

function triggerComboMechanic(type) {
    if (lastAction === type) { comboCount++; } else { comboCount = 1; lastAction = type; }

    const container = document.getElementById('combo-container');
    if (comboCount > 1) {
        const comboEl = document.createElement('div');
        comboEl.className = `combo-text ${type === 'correct' ? 'combo-correct' : 'combo-wrong'}`;
        
        let phrases = type === 'correct' ? ["Harika!", "Süper!", "Mükemmel!", "Ateş Ediyorsun!"] : ["Dikkat!", "Odaklan!", "Olmadı!", "Toparlan!"];
        let randomPhrase;

        do { randomPhrase = phrases[Math.floor(Math.random() * phrases.length)]; } 
        while (randomPhrase === (type === 'correct' ? lastCorrectPhrase : lastWrongPhrase));
        
        if (type === 'correct') lastCorrectPhrase = randomPhrase;
        else lastWrongPhrase = randomPhrase;
        
        comboEl.innerHTML = `${comboCount}x KOMBO!<br><span style="font-size:22px">${randomPhrase}</span>`;
        container.appendChild(comboEl);
        setTimeout(() => { if(comboEl.parentNode) comboEl.remove(); }, 1200);
    }
}

function triggerStars(isCorrect) {
    if (!isCorrect) return;
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
    const wordText = currentWord.word || "Kelime Yok";
    const pronText = currentWord.pronunciation || currentWord.phonetic || "";
    const meanText = currentWord.meaning || currentWord.translation || "Anlam Bulunamadı";
    
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
        <div class="card-inner">
            <div class="card-front" id="c-front">
                <div class="roman-numeral">${toRoman(currentIndex + 1)}</div>
                <div class="overlay-text text-bildim">BİLDİM</div>
                <div class="overlay-text text-bilemedim">BİLEMEDİM</div>
                <h1>${wordText}</h1>
                <p>${pronText}</p>
            </div>
            <div class="card-back" id="c-back">
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
    
    let startX = 0, currentX = 0, isDragging = false, isMoved = false;

    function dragStart(x) { 
        startX = x; 
        currentX = x; 
        isDragging = true; 
        isMoved = false; // Her yeni dokunuşta hareketi sıfırla
    }

    function dragMove(x) {
        if (!isDragging) return;
        currentX = x;
        let deltaX = currentX - startX;

        // Parmak 20 pikselden az oynadıysa "tıklama" kabul et, animasyonu başlatma!
        if (Math.abs(deltaX) > 20) {
            isMoved = true;
        }

        if (isMoved) {
            card.style.transform = `translateX(${deltaX}px) rotate(${deltaX * 0.05}deg)`;

            let percent = Math.abs(deltaX) / 200;
            if (percent > 1) percent = 1;

            if (deltaX > 0) {
                cFront.style.background = `linear-gradient(to right, rgba(76, 175, 80, 0.8) ${percent * 100}%, #ffffff ${(percent * 100) + 15}%)`;
                cBack.style.background = `linear-gradient(to left, rgba(76, 175, 80, 0.8) ${percent * 100}%, #e8f5e9 ${(percent * 100) + 15}%)`;
                textsBildim.forEach(el => el.style.opacity = percent);
                textsBilemedim.forEach(el => el.style.opacity = 0);
            } else {
                cFront.style.background = `linear-gradient(to left, rgba(244, 67, 54, 0.8) ${percent * 100}%, #ffffff ${(percent * 100) + 15}%)`;
                cBack.style.background = `linear-gradient(to right, rgba(244, 67, 54, 0.8) ${percent * 100}%, #e8f5e9 ${(percent * 100) + 15}%)`;
                textsBilemedim.forEach(el => el.style.opacity = percent);
                textsBildim.forEach(el => el.style.opacity = 0);
            }
        }
    }

    function dragEnd() {
        if (!isDragging) return;
        isDragging = false;
        let deltaX = currentX - startX;

        // KART HİÇ SÜRÜKLENMEDİYSE SADECE DÖNDÜR
        if (!isMoved) {
            card.style.transform = `translateX(0px) rotate(0deg)`;
            card.classList.toggle('is-flipped');
            cFront.style.background = "#ffffff";
            cBack.style.background = "#e8f5e9";
            textsBildim.forEach(el => el.style.opacity = 0); 
            textsBilemedim.forEach(el => el.style.opacity = 0);
            return; 
        }

        // KART GERÇEKTEN SÜRÜKLENDİYSE SAĞA/SOLA AT
        if (Math.abs(deltaX) > 100) { 
            card.style.transition = "transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.8s";
            card.style.opacity = "0";

            if (deltaX > 0) {
                card.style.transform = `translateX(600px) translateY(-50px) rotate(30deg)`;
                correctCount++; handleAnswerCombo(true); triggerStars(true); triggerComboMechanic('correct');
            } else {
                card.style.transform = `translateX(-600px) translateY(-50px) rotate(-30deg)`;
                wrongCount++; handleAnswerCombo(false); triggerComboMechanic('wrong');
            }
            setTimeout(() => { currentIndex++; loadCard(); }, 600);
        } else {
            card.style.transition = "transform 0.3s ease, background 0.3s";
            card.style.transform = `translateX(0px) rotate(0deg)`;
            cFront.style.background = "#ffffff";
            cBack.style.background = "#e8f5e9";
            textsBildim.forEach(el => el.style.opacity = 0); 
            textsBilemedim.forEach(el => el.style.opacity = 0);
            setTimeout(() => { card.style.transition = "transform 0.3s ease"; }, 300);
        }
    }

    // EVENT LİSTENER KISMI (Eski kodda silinmiş olabilecek kısım)
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

    if (!isMixedMode) {
        if (timerElement) timerElement.style.display = 'none'; 
        return;
    }

    timeRemaining = 60;
    streakCorrect = 0;
    streakWrong = 0;

    if (timerElement) {
        timerElement.style.display = 'flex'; 
        timerElement.style.color = "#333"; 
        timerElement.style.fontWeight = "bold";
        timerElement.style.fontSize = "1.2rem";
        timerElement.innerText = `⏳ ${formatTime(timeRemaining)}`;
    }

    timerInterval = setInterval(() => {
        timeRemaining--;
        if (timeRemaining <= 0) { timeRemaining = 0; clearInterval(timerInterval); showResults(); }
        if (timerElement) timerElement.innerText = `⏳ ${formatTime(timeRemaining)}`;
    }, 1000);
}

function formatTime(seconds) {
    let m = Math.floor(seconds / 60);
    let s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function handleAnswerCombo(isCorrect) {
    if (!isMixedMode) return; 

    let timeChange = 0;
    let timeText = "";
    let color = "";

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