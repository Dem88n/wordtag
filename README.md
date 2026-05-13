# 🗂️ WordTAG - Kelime Öğrenme Uygulaması

WordTAG, İngilizce ve İtalyanca kelime öğrenmeyi eğlenceli ve rekabetçi bir hale getiren, etkileşimli bir "Flashcard" (Kelime Kartı) web uygulamasıdır. Popüler kaydırma (swipe) mekaniği, kombo sistemi ve süreli oyun modlarıyla ezber yapmayı oyunlaştırır.

## 🚀 Canlı Demo
Uygulamayı tarayıcınızdan hemen denemek için tıklayın: **[WordTAG Canlı İzle](https://Dem88n.github.io/wordtag/)**

## ✨ Öne Çıkan Özellikler
* **Etkileşimli Kart Sistemi:** Kartların arkasındaki anlamı görmek için dokunun, "Bildim" için sağa, "Bilemedim" için sola kaydırın.
* **Oyunlaştırma (Gamification):** Üst üste doğru bilerek kombo yapın, özel yıldız animasyonları ve motive edici mesajlar kazanın.
* **Karışık ve Süreli Mod:** 60 saniyelik zamanlayıcıya karşı yarışın. Doğrular süre kazandırırken (+3s), yanlışlar süreden düşer (-2s).
* **Mobil Uyumluluk:** Dokunmatik ekranlar için özel olarak optimize edilmiştir (çift tıklama engellemesi, hassas kaydırma algılama).
* **Dinamik Veri Yönetimi:** Kelime havuzu tamamen JSON dosyalarından asenkron (fetch API) olarak çekilir, karmaşık veritabanlarına ihtiyaç duymaz.

## 🛠️ Kullanılan Teknolojiler
* **HTML5:** Semantik sayfa iskeleti
* **CSS3:** Modern UI, 3D kart döndürme animasyonları ve responsive tasarım
* **JavaScript (Vanilla JS):** Oyun motoru, özel zamanlayıcı algoritması ve dokunmatik kaydırma (touch/drag) mekanikleri
* **JSON:** Veri depolama

## ⚙️ Kurulum (Geliştiriciler İçin)
Projeyi kendi bilgisayarınızda çalıştırmak isterseniz:
1. Bu repoyu bilgisayarınıza indirin (ZIP veya Clone).
2. Projeyi VS Code gibi bir editörde açın.
3. JavaScript'teki `fetch` işlemlerinin güvenlik politikalarına (CORS) takılmaması için HTML dosyasını **Live Server** eklentisi ile çalıştırın.

---
**Geliştirici:** Osman Bayır
