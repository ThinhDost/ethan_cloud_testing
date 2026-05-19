<<<<<<< HEAD
        //------------STATE-------------
=======
//-----STATE-----

const state = {
    popupTexts: ["Kya! (≧◡≦)", "UwU", "Baka~ (＃￣ω￣)", "💕", "Nyaha!", "Stop it! ✨"],
    audioCtx: new (window.AudioContext || window.webkitAudioContext)()
};
//-----------------
const token = localStorage.getItem('authToken');
let API_URL = "";
const currentHost = window.location.hostname;

if (currentHost === "localhost" || currentHost === "127.0.0.1") {
    // 1. Bạn đang mở web dưới máy tính để lập trình
    API_URL = "http://localhost:8787";
    
} else if (currentHost === "ethan-cloud-testing.pages.dev") {
    // 2. Đây ĐÚNG CHÍNH XÁC là trang web thật (Production)
    // Bạn điền URL của con Worker Production (bản thật) vào đây:
    API_URL = "https://db-info.giathinh260307.workers.dev/";
    
} else {
    // 3. Tất cả các trường hợp còn lại (như efa1f4f0.ethan-cloud-testing.pages.dev)
    // Trình duyệt sẽ tự hiểu đây là trang chạy thử nghiệm (Preview / Dev)
    // Bạn điền URL của con Worker Dev (bản -dev) vào đây:
    API_URL = "https://backend-dev.<tên-subdomain-của-bạn>.workers.dev";
}
//-----DOM-----

 // --- LOGIC GIAO DIỆN & ANIMATION CŨ ---
>>>>>>> b953c23e29835fa4a3bbb7d4cbcfb40a892ead7a
        
        // --- LOGIC GIAO DIỆN & ANIMATION CŨ ---
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const popupTexts = ["Kya! (≧◡≦)", "UwU", "Baka~ (＃￣ω￣)", "💕", "Nyaha!", "Stop it! ✨"];

        function playPopSound() {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(800, audioCtx.currentTime); 
            osc.frequency.exponentialRampToValueAtTime(1500, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.connect(gainNode); gainNode.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + 0.1);
        }

        const Hiura_cow = document.getElementById('Hiura_interact');
        Hiura_cow.addEventListener('click', interactWaifu);
        //---------------EVENT------------------
        function interactWaifu(event) {
            playPopSound();
            const wrapper = document.getElementById('shelfWrapper');
            const newBubble = document.createElement('div');
            newBubble.innerText = popupTexts[Math.floor(Math.random() * popupTexts.length)]; 
            newBubble.className = 'falling-bubble';
            newBubble.style.setProperty('--dir', (Math.random() - 0.5) * 2); 
            newBubble.style.setProperty('--spread', (Math.random() * 70 + 80) + 'px');
            newBubble.style.left = `50%`; newBubble.style.top = `-20px`;
            wrapper.appendChild(newBubble);
            setTimeout(() => { newBubble.remove(); }, 3500);
        }

        
        const createPostBtn = document.getElementById('createPostBtn');
        createPostBtn.addEventListener('click', checkAuthBeforeSubmit);
        async function checkAuthBeforeSubmit() {
            if (!token) {
                await window.magicPopup("Bạn chưa đăng nhập! (＃￣ω￣)", "alert");
                return;
            }
            toggleModal(true);
        }

        const cancelBtn = document.getElementById('cancelBtn');
        cancelBtn.addEventListener('click', () => toggleModal(false));

        function toggleModal(show) {
            const modal = document.getElementById('postModal');
            if(show) { 
                modal.classList.add('active'); 
                document.getElementById('postText').focus(); 
            } else { 
                modal.classList.remove('active'); 
                if(window.removeImage) window.removeImage(); 
            }
        }

        const modalOverlay = document.getElementById('postModal');
        modalOverlay.addEventListener('click', checkCloseModal);
        function checkCloseModal(e) { if (e.target.id === 'postModal') toggleModal(false); }

        async function callGeminiAPI(prompt, retries = 5) {
            const apiKey = ""; 
            if(!apiKey) return "Senpai chưa gắn lõi năng lượng Gemini (API Key) kìa! (╥﹏╥)";
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
            const payload = { contents: [{ parts: [{ text: prompt }] }], systemInstruction: { parts: [{ text: "Bạn là nhân vật anime. Trả lời vui vẻ, cute." }] } };
            const delay = (ms) => new Promise(res => setTimeout(res, ms));
            for (let i = 0; i < retries; i++) {
                try {
                    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const data = await response.json(); return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                } catch (error) {
                    if (i === retries - 1) return "Lỗi phép thuật rồi (╥﹏╥)";
                    await delay(Math.pow(2, i) * 1000); 
                }
            }
        }

        async function enhancePost() {
            const textarea = document.getElementById('postText');
            const text = textarea.value.trim();
            if (!text) { textarea.value = "Senpai chưa nhập gì kìa! Baka! (＃￣ω￣)"; return; }
            const btn = document.getElementById('enhanceBtn');
            const originalText = btn.innerHTML; btn.innerHTML = '⏳ Đang niệm chú...'; btn.disabled = true; btn.style.opacity = '0.7';
            const enhancedText = await callGeminiAPI(`Biến tấu câu này: "${text}"`);
            if (enhancedText) {
                textarea.value = ''; let i = 0;
                const typing = setInterval(() => {
                    if (i < enhancedText.length) { textarea.value += enhancedText.charAt(i); i++; } 
                    else { clearInterval(typing); }
                }, 20);
            }
            btn.innerHTML = originalText; btn.disabled = false; btn.style.opacity = '1';
        }

        const canvas = document.getElementById('bg-canvas'); const ctx = canvas.getContext('2d');
        let width, height; let particles = []; const mouse = { x: -1000, y: -1000, radius: 120 };

        function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; initParticles(); }
        function initParticles() {
            particles = []; let numParticles = Math.floor((width * height) / 8000); 
            for (let i = 0; i < numParticles; i++) {
                particles.push({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 3 + 1, speedX: (Math.random() - 0.5) * 0.5, speedY: (Math.random() - 0.5) * 0.5 - 0.3, alpha: Math.random() * 0.5 + 0.2 });
            }
        }
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
        window.addEventListener('mouseout', () => { mouse.x = -1000; mouse.y = -1000; });
        function animate() {
            ctx.clearRect(0, 0, width, height);
            for (let i = 0; i < particles.length; i++) {
                let p = particles[i]; p.x += p.speedX; p.y += p.speedY;
                if (p.y < -10) p.y = height + 10; if (p.x < -10) p.x = width + 10; if (p.x > width + 10) p.x = -10;
                let dx = mouse.x - p.x; let dy = mouse.y - p.y; let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) { let force = (mouse.radius - distance) / mouse.radius; let angle = Math.atan2(dy, dx); p.x -= Math.cos(angle) * force * 2; p.y -= Math.sin(angle) * force * 2; }
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = `rgba(255, 182, 193, ${p.alpha})`; ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(255, 119, 169, 0.4)'; ctx.fill();
            }
            requestAnimationFrame(animate);
        }
        resize(); animate();

        // --- LOGIC CHILL SPACE MỚI ---
       // --- LOGIC CHILL SPACE ---
        const chillBubble = document.getElementById('chillBubble');
        chillBubble.addEventListener('click', toggleChillSpace);
        const ChillCloseBtn = document.getElementById('chillClose');
        if(ChillCloseBtn) ChillCloseBtn.addEventListener('click', toggleChillSpace);
       
        function toggleChillSpace() {
            const panel = document.getElementById('chillPanel');
            if (panel) panel.classList.toggle('active');
        }

        // --- DANH SÁCH VIDEO KÈM BÀI HÁT ---
        // Điền tên bài hát (giống hệt tên ở phần HTML) và link video mp4 trong máy bạn
        const musicVideos = {
            'HoYoHoYo': 'https://files.catbox.moe/mdyu13.mp4', 
            // Nếu bài nào không khai báo ở đây, nó sẽ tự hiểu là không có video
        };

        const musicImages = {
            'Anamanaguchi - Miku': './imgs/Anamanaguchi - Miku.jpg', // Dùng link web
            'Khaim - Mad Trick': './imgs/Khaim-Madtrick.jpg', // Hoặc dùng file ảnh trong máy
            'Resonance': './imgs/Resonance.png',
            // Các bài hát muốn hiện ảnh tĩnh thì điền vào đây
        };

        // --- 1. HÀM PHÁT NHẠC (ĐÃ THÊM FADE IN/OUT) ---
        
        function selectChillMusic(audioPath, title, coverImgPath) {
            const audio = document.getElementById('chillAudio');
            const bgVideo = document.getElementById('bg-video');
            const bgImageContainer = document.getElementById('bg-image-container'); // Gọi bức màn ra
            const recordImg = document.getElementById('chill-record-img');
            const songInfo = document.getElementById('chillSongInfo');
            const songTitle = document.getElementById('chillSongTitle');
            const bubble = document.querySelector('.chill-bubble'); 
            
            if (audio.src.includes(audioPath.replace('./', ''))) {
                // Đang phát -> Play/Pause
                if (!audio.paused) {
                    audio.pause();
                    if(bgVideo) bgVideo.pause();
                    if(recordImg) recordImg.classList.add('paused');
                } else {
                    audio.play().catch(e => console.error(e));
                    if(bgVideo && bgVideo.src) bgVideo.play();
                    if(recordImg) recordImg.classList.remove('paused');
                }
            } else {
                // Bấm bài MỚI
                audio.src = audioPath;
                audio.play().catch(e => console.error(e));
                
                if (bgVideo) {
                    if (musicVideos && musicVideos[title]) {
                        // TRƯỜNG HỢP 1: CÓ VIDEO
                        bgVideo.src = musicVideos[title];
                        bgVideo.play();
                        bgVideo.classList.add('active');
                        bgImageContainer.style.opacity = 0; // Làm mờ màn ảnh tĩnh đi
                    } 
                    else if (musicImages && musicImages[title]) {
                        // TRƯỜNG HỢP 2: CÓ ẢNH TĨNH
                        bgVideo.classList.remove('active');
                        setTimeout(() => bgVideo.pause(), 1000); 
                        
                        bgImageContainer.style.opacity = 0; // 1. Fade out mờ đi
                        setTimeout(() => {
                            // 2. Tráo ảnh phía sau lưng
                            bgImageContainer.style.backgroundImage = `url('${musicImages[title]}')`;
                            bgImageContainer.style.opacity = 1; // 3. Fade in hiện rõ lên
                        }, 800); // 800ms khớp với CSS
                    } 
                    else {
                        // TRƯỜNG HỢP 3: KHÔNG CÓ GÌ -> VỀ NỀN MẶC ĐỊNH
                        bgVideo.classList.remove('active');
                        setTimeout(() => bgVideo.pause(), 1000);
                        
                        bgImageContainer.style.opacity = 0; // 1. Fade out
                        setTimeout(() => {
                            bgImageContainer.style.backgroundImage = 'none';
                            bgImageContainer.style.backgroundColor = 'var(--bg-color)';
                            bgImageContainer.style.opacity = 1; // 2. Fade in
                        }, 800);
                    }
                }
                
                // Cập nhật UI
                if(recordImg) {
                    recordImg.src = coverImgPath;
                    recordImg.classList.add('active'); 
                    recordImg.classList.remove('paused'); 
                }
                if(songTitle) songTitle.innerText = title;
                if(songInfo) songInfo.classList.add('active'); 
                if(bubble) bubble.classList.add('playing'); 
            }
        }
        //Duyệt qua từng item trong playlist để gắn sự kiện click,khi click sẽ gọi hàm getInfoOfChillMusic để lấy thông tin bài hát và truyền vào hàm selectChillMusic
        const musicItems = document.querySelectorAll('.music-item');
        musicItems.forEach(item => {
            item.addEventListener('click', getInfoOfChillMusic);
        });
        function getInfoOfChillMusic()
        {
            const path = this.getAttribute('data-path');
            const title = this.getAttribute('data-title');
            const img = this.getAttribute('data-img');
            selectChillMusic(path, title, img);
        }

        // --- 2. HÀM ĐỔI HÌNH NỀN TĨNH (ĐÃ THÊM FADE IN/OUT) ---
        function selectChillBackground(bgPath) {
            const bgVideo = document.getElementById('bg-video');
            const bgImageContainer = document.getElementById('bg-image-container'); // Gọi bức màn ra
            const bubble = document.querySelector('.chill-bubble');
            const audio = document.getElementById('chillAudio');

            if(bgVideo) {
                bgVideo.classList.remove('active');
                setTimeout(() => bgVideo.pause(), 1000);
            }

            // Hiệu ứng Fade out (Làm mờ bức màn hiện tại trước)
            bgImageContainer.style.opacity = 0;

            // Chờ 0.8 giây rồi mới đổi ảnh và Fade in lên
            setTimeout(() => {
                if (bgPath === 'none') {
                    bgImageContainer.style.backgroundImage = 'none';
                    bgImageContainer.style.backgroundColor = 'var(--bg-color)';
                    if(bubble) bubble.classList.remove('playing'); 
                    if(audio) audio.pause(); 
                } else {
                    bgImageContainer.style.backgroundImage = `url('${bgPath}')`;
                    bgImageContainer.style.backgroundColor = '#1a0b2e'; 
                }
                
                // Kéo màn lên lại (Fade in)
                bgImageContainer.style.opacity = 1;
            }, 800);
        }

        // Lắng nghe tiến trình bài hát để chạy thanh Progress Bar
        document.addEventListener('DOMContentLoaded', () => {
            const audio = document.getElementById('chillAudio');
            const progressFill = document.getElementById('chillProgressFill');
            const timeRemainingText = document.getElementById('chillTimeRemaining');

            audio.addEventListener('timeupdate', () => {
                if(!isNaN(audio.duration)) {
                    // Tính phần trăm để kéo dài vệt màu
                    const progressPercent = (audio.currentTime / audio.duration) * 100;
                    progressFill.style.width = `${progressPercent}%`;

                    // Tính thời gian còn lại
                    const remaining = audio.duration - audio.currentTime;
                    const mins = Math.floor(remaining / 60);
                    const secs = Math.floor(remaining % 60);
                    // Hiển thị dạng -2:05
                    timeRemainingText.innerText = `-${mins}:${secs < 10 ? '0' : ''}${secs}`;
                }
            });
        });

        // Tự động đóng bảng nếu click ra ngoài
        document.addEventListener('click', (e) => {
            const container = document.querySelector('.chill-widget-container');
            const panel = document.getElementById('chillPanel');
            if (container && !container.contains(e.target) && panel.classList.contains('active')) {
                panel.classList.remove('active');
            }
        });
//-----------------------------------
//PHẦN CỦA DATABASE / CẬP NHẬT
//-----------------------------------
import { createClient } from "https://esm.sh/@libsql/client/web";

        // =========================================================================
        // ⚠️ ĐIỀN THÔNG TIN TURSO DATABASE CỦA BẠN VÀO ĐÂY
        // =========================================================================
        const TURSO_URL = 'https://db-info.giathinh260307.workers.dev/';
        const TURSO_TOKEN = 'aHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1kUXc0dzlXZ1hjUQ==';

        let db;
        let currentBase64Image = null;

        try {
            db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
            // HÀM ĐIỀU KHIỂN POPUP MA THUẬT
            window.magicPopup = function(message, type = 'alert') {
                return new Promise((resolve) => {
                    const overlay = document.getElementById('magic-popup-overlay');
                    const msgText = document.getElementById('popup-msg-text');
                    const inputField = document.getElementById('popup-pass-input');
                    const btnYes = document.getElementById('popup-btn-yes');
                    const btnNo = document.getElementById('popup-btn-no');

                    msgText.innerHTML = message;
                    inputField.value = ''; 
                    
                    if (type === 'prompt') {
                        inputField.style.display = 'block';
                        btnNo.style.display = 'inline-flex';
                    } else if (type === 'confirm') {
                        inputField.style.display = 'none';
                        btnNo.style.display = 'inline-flex';
                    } else { 
                        inputField.style.display = 'none';
                        btnNo.style.display = 'none';
                        btnYes.textContent = "Đã hiểu";
                    }

                    overlay.classList.add('active');
                    if (type === 'prompt') setTimeout(() => inputField.focus(), 300);

                    const closePopup = (result) => {
                        overlay.classList.remove('active');
                        btnYes.onclick = null; btnNo.onclick = null; inputField.onkeydown = null;
                        btnYes.textContent = "Xác nhận"; 
                        resolve(result); 
                    };

                    btnNo.onclick = () => closePopup(null);
                    btnYes.onclick = () => {
                        if (type === 'prompt') closePopup(inputField.value);
                        else closePopup(true);
                    };
                    inputField.onkeydown = (e) => { if (e.key === 'Enter') btnYes.click(); };
                });
            };
            console.log("Đã gắn động cơ Database!");
            setTimeout(() => { window.fetchPosts(); }, 100);
        } catch (e) {
            console.error("Lỗi cấu hình:", e);
        }

        // --- XỬ LÝ CHỌN VÀ NÉN ẢNH ---
        window.processImageFile = function(file) {
            if (!file || !file.type.startsWith('image/')) return; 

            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 600; 
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    currentBase64Image = canvas.toDataURL('image/jpeg', 0.7);

                    document.getElementById('imagePreview').src = currentBase64Image;
                    document.getElementById('imagePreviewContainer').style.display = 'inline-block';
                }
                img.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }

        window.handleImageSelect = function(event) {
            const file = event.target.files[0];
            window.processImageFile(file);
        }

        document.addEventListener('paste', function(e) {
            const modal = document.getElementById('postModal');
            if (!modal.classList.contains('active')) return;

            const items = (e.clipboardData || window.clipboardData).items;
            for (let index in items) {
                const item = items[index];
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    window.processImageFile(file);
                    
                    const previewContainer = document.getElementById('imagePreviewContainer');
                    previewContainer.style.boxShadow = '0 0 20px #00ff88';
                    setTimeout(() => previewContainer.style.boxShadow = 'none', 500);
                }
            }
        });

        window.removeImage = function() {
            currentBase64Image = null;
            document.getElementById('postImage').value = '';
            document.getElementById('imagePreviewContainer').style.display = 'none';
        }

        // --- TẢI BÀI VIẾT TỪ DB ---
        function escapeHTML(str) {
            return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        }
        window.fetchPosts = async function() {
            const feed = document.getElementById('feed-container');
            try {
                const result = await db.execute("SELECT * FROM posts ORDER BY created_at DESC");
                feed.innerHTML = ''; 
                
                if (result.rows.length === 0) {
                     feed.innerHTML = '<div style="text-align: center; color: var(--soft-pink);">Chưa có bài viết nào. Hãy mở bát nhé!</div>';
                     return;
                }

                result.rows.forEach(post => {
                    const safeauthor = escapeHTML(post.author) || 'Anonymous';
                    const rawText = post.content || '';
                    const safeContent = DOMPurify.sanitize(rawText);
                    const date = new Date(post.created_at + "Z").toLocaleString('vi-VN');
                    const postId = post.id;

                    feed.innerHTML += `
                        <div id="post-wrapper-${postId}" style="margin-bottom: 20px;">
                            <article class="glass-panel" id="post-article-${postId}" style="margin-bottom: 0;">
                                <div class="post-header">
                                    <div class="avatar">${safeauthor.charAt(0).toUpperCase()}</div>
                                    <div>
                                        <h3 style="color: var(--soft-pink);">${safeauthor}</h3>
                                        <span class="post-meta">Đăng lúc: ${date}</span>
                                    </div>
                                </div>
                                <div class="post-content">
                                    ${safeContent}
                                </div>
                                <div class="flex-between" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                                    <div>
                                        <button class="liquid-btn" style="padding: 8px 15px; font-size: 0.9rem;">💖 Thích</button>
                                        <button class="liquid-btn" style="padding: 8px 15px; font-size: 0.9rem;">💬 Bình luận</button>
                                    </div>
                                    <button class="liquid-btn" style="padding: 8px 15px; font-size: 0.9rem; background: rgba(255, 50, 50, 0.3); border-color: rgba(255, 50, 50, 0.5);" onclick="window.deletePost(${postId})">
                                        🗑️ Xóa
                                    </button>
                                </div>
                            </article>
                        </div>
                    `;
                });
            } catch (error) {
                console.error("Lỗi tải dữ liệu:", error);
                feed.innerHTML = `<div style="text-align: center; color: red;">Lỗi tải dữ liệu. Lỗi chi tiết: ${error.message}</div>`;
            }
        }

        // --- ĐĂNG BÀI (BẢN MỚI QUA BACKEND WORKER) ---

        window.submitPost = async function() {
<<<<<<< HEAD
            const author = document.getElementById('postAuthor').value || 'Anonymous';
            const text = document.getElementById('postText').value;

            if(!text.trim() && !currentBase64Image) return;

=======
            // 1. LẤY VÉ THÔNG HÀNH JWT: Vào ngăn kéo trình duyệt bốc token ra
            const token = localStorage.getItem('user_token');
            
            // Nếu chưa đăng nhập (không có token), chặn lại ngay từ vòng gửi xe trên FE
            if (!token) {
                await window.magicPopup("Vui lòng đăng nhập để có quyền đăng bài viết! ⚠️", "alert");
                return;
            }

            const author = document.getElementById('postAuthor').value || 'Anonymous';
            const text = document.getElementById('postText').value;

            // Kiểm tra nếu không nhập chữ và cũng không chọn ảnh thì dừng lại
            if (!text.trim() && !currentBase64Image) return;
            
>>>>>>> b953c23e29835fa4a3bbb7d4cbcfb40a892ead7a
            const btn = document.getElementById('submitBtn');
            btn.innerText = "⏳ Đang phóng lên đám mây...";
            btn.disabled = true;

            try {
                // 2. GỌI API BACKEND: Thay vì tương tác DB tại FE, ta dùng fetch gọi sang Worker
                // (Thay đổi URL 'http://localhost:8787' thành link thật của bạn nếu deploy lên mây)
                const response = await fetch('https://db-info.giathinh260307.workers.dev/api/posts/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        
                        // Đính kèm tấm vé JWT vào Header Authorization theo chuẩn quốc tế
                        'Authorization': `Bearer ${token}`
                    },
                    // Đóng gói nguyên liệu thô dạng JSON để gửi đi
                    body: JSON.stringify({
                        author: author, 
                        text: text,
                        image: currentBase64Image // Chuỗi Base64 của ảnh (nếu có)
                    })
                });

                // 3. ĐỌC PHẢN HỒI TỪ BACKEND
                const result = await response.json();

                // Nếu HTTP Status Code không phải 200/201 hoặc backend báo success: false
                if (!response.ok || !result.success) {
                    throw new Error(result.message || "Đăng bài thất bại từ phía máy chủ");
                }
                
                // 4. XỬ LÝ KHI THÀNH CÔNG CỦA FE (Giữ nguyên logic cũ của bạn)
                document.getElementById('postText').value = '';
                window.removeImage(); 
                toggleModal(false); 
                
                // Tải lại danh sách bài viết (Hàm fetchPosts này sau này cũng gọi qua API GET /api/posts nhé)
                await window.fetchPosts(); 
                
            } catch (error) {
                // Nếu token hết hạn, bị sai, hoặc lỗi mạng, hệ thống sẽ nhảy vào đây
                await window.magicPopup("Lỗi khi đăng: " + error.message, "alert");
            } finally {
                // Trả lại trạng thái nút bấm như cũ
                btn.innerText = "🚀 Đăng bài";
                btn.disabled = false;
            }
        }

        // --- XÓA BÀI ---
        window.deletePost = async function(postId) {
            const isSure = await window.magicPopup("Bạn có chắc chắn muốn ném bài viết này<br>vào hố đen vũ trụ không?", "confirm");
            if (!isSure) return;

            const passcode = await window.magicPopup("Nhập mật mã Quản trị viên<br>để thi triển ma pháp phá hủy:", "prompt");
            if (!passcode) return;

            try {
                if(!token) {
                    await window.magicPopup("Bạn chưa đăng nhập! (＃￣ω￣)", "alert");
                    return;
                }
                const ketQua = await fetch("https://db-info.giathinh260307.workers.dev", {
                    method: "DELETE", 
                    headers: {
                        "Content-Type": "application/json",
                        "X-Admin-Password": passcode,
                        'Authorization': 'Bearer ' + token,
                    },
                    body: JSON.stringify({ postId: postId })
                });

                if (!ketQua.ok){ 
                    await window.magicPopup("Mật mã sai!<br>Kẻ xâm nhập đã bị phát hiện. (＃￣ω￣)", "alert");
                    return; 
                }

                const wrapper = document.getElementById(`post-wrapper-${postId}`);
                const article = document.getElementById(`post-article-${postId}`);
            
                if (wrapper && article) {
                    const rect = article.getBoundingClientRect();
                    const polygons = [
                        'polygon(0% 0%, 100% 0%, 50% 50%)', 
                        'polygon(100% 0%, 100% 100%, 50% 50%)',
                        'polygon(0% 100%, 50% 50%, 100% 100%)',
                        'polygon(0% 0%, 50% 50%, 0% 100%)'
                    ];

                    polygons.forEach((poly, index) => {
                        const shard = article.cloneNode(true);
                        shard.id = ''; 
                        shard.style.position = 'fixed';
                        shard.style.top = rect.top + 'px';
                        shard.style.left = rect.left + 'px';
                        shard.style.width = rect.width + 'px';
                        shard.style.height = rect.height + 'px';
                        shard.style.margin = '0';
                        shard.style.zIndex = '9999';
                        shard.style.clipPath = poly;
                        shard.style.transition = 'all 1s cubic-bezier(0.25, 1, 0.5, 1)';
                        shard.style.transformOrigin = 'center';
                        
                        document.body.appendChild(shard);
                        shard.offsetHeight;

                        const moveX = (index === 1 ? 100 : (index === 3 ? -100 : 0)) + (Math.random() * 60 - 30);
                        const moveY = (index === 2 ? 150 : (index === 0 ? 50 : 100)) + Math.random() * 100;
                        const rotate = (Math.random() - 0.5) * 90;

                        shard.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${rotate}deg) scale(0.6)`;
                        shard.style.opacity = '0';

                        setTimeout(() => shard.remove(), 1000);
                    });

                    article.style.display = 'none';
                    wrapper.style.height = rect.height + 'px';
                    wrapper.style.overflow = 'hidden';
                    wrapper.style.transition = 'all 0.5s ease-in-out';
                    wrapper.offsetHeight; 
                    wrapper.style.height = '0';
                    wrapper.style.marginBottom = '0';
                    wrapper.style.opacity = '0';
                }
            } catch (error) {
                console.error("Lỗi khi xóa bài:", error);
                await window.magicPopup("Lỗi không thể xóa: " + error.message, "alert");
            }
        }
        // ==========================================
        // PHẦN THÊM MỚI: LOGIC UI AUTHENTICATION
        // ==========================================

        document.addEventListener('DOMContentLoaded', () => {
            const loginBtn = document.getElementById('auth-login-btn');
            const modal = document.getElementById('auth-modal');
            const closeBtn = document.getElementById('auth-close-btn');
            const loginForm = document.getElementById('auth-login-form');

            // Mở popup
            loginBtn.addEventListener('click', () => {
                modal.classList.remove('hidden');
            });

            // Đóng popup khi bấm nút ✖
            closeBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });

<<<<<<< HEAD
            // Đóng popup khi bấm ra ngoài vùng kính
=======
            // Đóng popup khi bấm ra ngoài vùng kính    
>>>>>>> b953c23e29835fa4a3bbb7d4cbcfb40a892ead7a
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });

            // Nơi dọn đường cho bạn học Cloud Security (Auth)
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault(); // Ngăn trình duyệt tự động load lại trang khi bấm submit

                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;

                console.log("=== BẮT ĐẦU LUỒNG AUTH ===");
                console.log("Username nhập vào:", username);
                console.log("Password nhập vào: [Đã ẩn để bảo mật]");
                
                // TODO: DÀNH CHO BẠN
                // Tại đây, bạn sẽ học cách:
                // 1. Mã hóa password (hash) hoặc gửi dữ liệu qua HTTPS an toàn.
                // 2. Sử dụng fetch() để gọi API tới Server Cloud của bạn.
                // 3. Nhận và lưu trữ Token (JWT) vào localStorage, sessionStorage hoặc HttpOnly Cookies.
                
                // Ví dụ ảo (để bạn test UI):
                /*
<<<<<<< HEAD
                
=======
>>>>>>> b953c23e29835fa4a3bbb7d4cbcfb40a892ead7a
                try {
                    const response = await fetch('YOUR_CLOUD_API_ENDPOINT', {
                        method: 'POST',
                        body: JSON.stringify({ username, password })
                    });
                    // Xử lý response...
                } catch (error) {
                    console.error("Lỗi xác thực:", error);
                }
                */
<<<<<<< HEAD

                try{
                    const response = await fetch('https://db-info.giathinh260307.workers.dev/api/auth/login', {
                        method: 'POST',
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({username, password})
                    });
                    const data = await response.json();
                    if(data.success)



                }catch
                alert(`Giao diện đã sẵn sàng! Bây giờ bạn có thể code phần Auth để xử lý tài khoản: ${username}`);
            });
        });
=======
               try {
                    const response = await fetch('https://db-info.giathinh260307.workers.dev/api/auth/login', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + localStorage.getItem('user_token') // Gửi token cũ nếu có để kiểm tra phiên làm việc
                        },
                        body: JSON.stringify({ username, password })
                    });
                    const data = await response.json();
                    if(data.success) {
                        localStorage.setItem('authToken', data.token); // Lưu token vào localStorage
                        modal.classList.add('hidden'); // Đóng popup sau khi đăng nhập thành công
                    }
                    else {
                        await window.magicPopup("Đăng nhập thất bại: " + (data.message || "Thông tin không chính xác"), "alert");
                    }
                    }catch (error) {
                    console.error("Lỗi khi gọi API xác thực:", error);
                    }

                console.log(`Giao diện đã sẵn sàng! Bây giờ bạn có thể code phần Auth để xử lý tài khoản: ${username}`);
            });
        });
>>>>>>> b953c23e29835fa4a3bbb7d4cbcfb40a892ead7a
