//-----STATE-----
const state = {
    popupTexts: ["Kya! (≧◡≦)", "UwU", "Baka~ (＃￣ω￣)", "💕", "Nyaha!", "Stop it! ✨"],
    audioCtx: new (window.AudioContext || window.webkitAudioContext)()
};
//-----------------
let API_URL = "";
const currentHost = window.location.hostname;

if (currentHost === "localhost" || currentHost === "127.0.0.1") {
    API_URL = "http://localhost:8787"; 
} else if (currentHost === "ethan-cloud-testing.pages.dev") {
    API_URL = "https://backend.giathinh260307.workers.dev"; 
} else {
    API_URL = "https://backend-dev.giathinh260307.workers.dev"; 
}

// Hàm giải mã JWT Token để tự động lấy Username hiển thị lên UI
function getUsernameFromToken(token) {
    try {
        if (!token) return null;
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload).username;
    } catch (e) {
        return null;
    }
}

// Hàm kiểm tra trạng thái đăng nhập và hoán đổi Đăng nhập <=> Avatar
function checkAuthUI() {
    const activeToken = localStorage.getItem("authToken") || localStorage.getItem("user_token"); 
    const loginBtn = document.getElementById("auth-login-btn");
    const avatarWrapper = document.getElementById("user-avatar-wrapper");
    const displayNameSpan = document.getElementById("user-display-name");
    const avatarImg = document.getElementById("user-avatar-img");

    if (activeToken) {
        if (loginBtn) loginBtn.classList.add("hidden");
        if (avatarWrapper) avatarWrapper.classList.remove("hidden");
        
        const username = getUsernameFromToken(activeToken) || "Ethan";
        if (displayNameSpan) displayNameSpan.textContent = username;

        const savedAvatar = localStorage.getItem("localUserAvatar");
        if (savedAvatar && avatarImg) {
            avatarImg.src = savedAvatar;
        }
    } else {
        if (loginBtn) loginBtn.classList.remove("hidden");
        if (avatarWrapper) avatarWrapper.classList.add("hidden");
    }
}

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
if(Hiura_cow) Hiura_cow.addEventListener('click', interactWaifu);

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
if(createPostBtn) createPostBtn.addEventListener('click', checkAuthBeforeSubmit);

async function checkAuthBeforeSubmit() {
    const currentToken = localStorage.getItem('authToken') || localStorage.getItem('user_token');
    if (!currentToken) {
        await window.magicPopup("Bạn chưa đăng nhập! (＃￣ω￣)", "alert");
        return;
    }
    const loggedUsername = getUsernameFromToken(currentToken) || "Ethan";
    const authorInput = document.getElementById('postAuthor');
    if (authorInput) {
        authorInput.value = loggedUsername;
        authorInput.disabled = true;
        authorInput.style.opacity = '0.7';
    }
    toggleModal(true);
}

const cancelBtn = document.getElementById('cancelBtn');
if(cancelBtn) cancelBtn.addEventListener('click', () => toggleModal(false));

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
if(modalOverlay) modalOverlay.addEventListener('click', checkCloseModal);
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

window.enhancePost = async function() {
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

const chillBubble = document.getElementById('chillBubble');
if(chillBubble) chillBubble.addEventListener('click', toggleChillSpace);
const ChillCloseBtn = document.getElementById('chillClose');
if(ChillCloseBtn) ChillCloseBtn.addEventListener('click', toggleChillSpace);
       
function toggleChillSpace() {
    const panel = document.getElementById('chillPanel');
    if (panel) panel.classList.toggle('active');
}

const musicVideos = { 'HoYoHoYo': 'https://files.catbox.moe/mdyu13.mp4' };
const musicImages = {
    'Anamanaguchi - Miku': './imgs/Anamanaguchi - Miku.jpg',
    'Khaim - Mad Trick': './imgs/Khaim-Madtrick.jpg',
    'Resonance': './imgs/Resonance.png',
};

window.selectChillMusic = function(audioPath, title, coverImgPath) {
    const audio = document.getElementById('chillAudio');
    const bgVideo = document.getElementById('bg-video');
    const bgImageContainer = document.getElementById('bg-image-container'); 
    const recordImg = document.getElementById('chill-record-img');
    const songInfo = document.getElementById('chillSongInfo');
    const songTitle = document.getElementById('chillSongTitle');
    const bubble = document.querySelector('.chill-bubble'); 
    
    if (audio.src.includes(audioPath.replace('./', ''))) {
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
        audio.src = audioPath;
        audio.play().catch(e => console.error(e));
        
        if (bgVideo) {
            if (musicVideos && musicVideos[title]) {
                bgVideo.src = musicVideos[title];
                bgVideo.play();
                bgVideo.classList.add('active');
                bgImageContainer.style.opacity = 0; 
            } 
            else if (musicImages && musicImages[title]) {
                bgVideo.classList.remove('active');
                setTimeout(() => bgVideo.pause(), 1000); 
                bgImageContainer.style.opacity = 0; 
                setTimeout(() => {
                    bgImageContainer.style.backgroundImage = `url('${musicImages[title]}')`;
                    bgImageContainer.style.opacity = 1; 
                }, 800);
            } 
            else {
                bgVideo.classList.remove('active');
                setTimeout(() => bgVideo.pause(), 1000);
                bgImageContainer.style.opacity = 0; 
                setTimeout(() => {
                    bgImageContainer.style.backgroundImage = 'none';
                    bgImageContainer.style.backgroundColor = 'var(--bg-color)';
                    bgImageContainer.style.opacity = 1; 
                }, 800);
            }
        }
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

const musicItems = document.querySelectorAll('.music-item');
musicItems.forEach(item => {
    item.addEventListener('click', getInfoOfChillMusic);
});
function getInfoOfChillMusic() {
    const path = this.getAttribute('data-path');
    const title = this.getAttribute('data-title');
    const img = this.getAttribute('data-img');
    window.selectChillMusic(path, title, img);
}

window.selectChillBackground = function(bgPath) {
    const bgVideo = document.getElementById('bg-video');
    const bgImageContainer = document.getElementById('bg-image-container'); 
    const bubble = document.querySelector('.chill-bubble');
    const audio = document.getElementById('chillAudio');

    if(bgVideo) {
        bgVideo.classList.remove('active');
        setTimeout(() => bgVideo.pause(), 1000);
    }
    bgImageContainer.style.opacity = 0;
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
        bgImageContainer.style.opacity = 1;
    }, 800);
}

//-----------------------------------
//PHẦN CỦA DATABASE / CẬP NHẬT
//-----------------------------------
import { createClient } from "https://esm.sh/@libsql/client/web";

const TURSO_URL = 'https://db-info.giathinh260307.workers.dev/';
const TURSO_TOKEN = 'aHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1kUXc0dzlXZ1hjUQ==';

let db;
let currentBase64Image = null;

try {
    db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
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
            canvas.width = width; canvas.height = height;
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
    if (!modal || !modal.classList.contains('active')) return;
    const items = (e.clipboardData || window.clipboardData).items;
    for (let index in items) {
        const item = items[index];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
            const file = item.getAsFile();
            window.processImageFile(file);
            const previewContainer = document.getElementById('imagePreviewContainer');
            if(previewContainer) {
                previewContainer.style.boxShadow = '0 0 20px #00ff88';
                setTimeout(() => previewContainer.style.boxShadow = 'none', 500);
            }
        }
    }
});

window.removeImage = function() {
    currentBase64Image = null;
    document.getElementById('postImage').value = '';
    document.getElementById('imagePreviewContainer').style.display = 'none';
}

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
            const safeauthor = DOMPurify.sanitize(post.author || "Ẩn danh");
            const authorAvatar = post.avatar || "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Cat%20with%20Wry%20Smile.png";
            
            // Lưu ý: Đoạn code cũ của bạn dùng biến postContent ở trên nhưng ở dưới innerHTML lại gọi safeContent. 
            // Mình xin phép chuẩn hóa lại thành safeContent để tránh lỗi crash Javascript nhé!
            const safeContent = DOMPurify.sanitize(post.content);
            const date = new Date(post.created_at + "Z").toLocaleString('vi-VN');
            const postId = post.id;

            // --- ĐOẠN XỬ LÝ ẢNH BÀI VIẾT (MỚI THÊM) ---
            // Kiểm tra xem bài viết có chứa trường link ảnh bài viết (image_url) hay không
            const postImage = post.image_url ? DOMPurify.sanitize(post.image_url) : null;
            let imageHTML = "";
            if (postImage) {
                imageHTML = `
                    <div class="post-attached-image" style="margin-top: 15px; margin-bottom: 5px; border-radius: 12px; overflow: hidden; max-height: 350px; border: 1px solid rgba(255, 255, 255, 0.1);">
                        <img src="${postImage}" alt="Attached Image" style="width: 100%; height: auto; display: block; object-fit: cover;" onerror="this.style.display='none';">
                    </div>
                `;
            }
            // ------------------------------------------

            feed.innerHTML += `
                <div id="post-wrapper-${postId}" style="margin-bottom: 20px;">
                    <article class="glass-panel" id="post-article-${postId}" style="margin-bottom: 0;">
                        <div class="post-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                            
                            <img src="${authorAvatar}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary-pink); background: var(--glass-bg);" onerror="this.src='https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Cat%20with%20Wry%20Smile.png';'">
                            
                            <div>
                                <h3 style="color: var(--soft-pink); margin: 0; font-size: 1rem;">${safeauthor}</h3>
                                <span class="post-meta" style="font-size: 0.8rem; opacity: 0.7;">Đăng lúc: ${date}</span>
                            </div>
                        </div>
                        
                        <div class="post-content">${safeContent}</div>
                        
                        ${imageHTML}
                        
                        <div class="flex-between" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; margin-top: 15px;">
                            <div>
                                <button class="liquid-btn" style="padding: 8px 15px; font-size: 0.9rem;">💖 Thích</button>
                                <button class="liquid-btn" style="padding: 8px 15px; font-size: 0.9rem;">💬 Bình luận</button>
                            </div>
                            <button class="liquid-btn" style="padding: 8px 15px; font-size: 0.9rem; background: rgba(255, 50, 50, 0.3); border-color: rgba(255, 50, 50, 0.5);" onclick="window.deletePost(${postId})">🗑️ Xóa</button>
                        </div>
                    </article>
                </div>
            `;
        });
    } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        feed.innerHTML = `<div style="text-align: center; color: red;">Lỗi tải dữ liệu. Lỗi chi tiết: ${error.message}</div>`;
    }
};

const submitBtn = document.getElementById('submitBtn');
if(submitBtn) {
    submitBtn.addEventListener('click', async function() {
        await window.submitPost();
    });
}

window.submitPost = async function() {
    // 1. Kiểm tra quyền đăng nhập và lấy Token chính xác từ hệ thống cũ của bạn
    const tokenSubmit = localStorage.getItem('user_token') || localStorage.getItem('authToken');
    if (!tokenSubmit) {
        await window.magicPopup("Vui lòng đăng nhập để có quyền đăng bài viết! ⚠️", "alert");
        return;
    }

    // 2. Lấy nội dung chữ trong ô textarea
    const text = document.getElementById('postText').value;
    if (!text.trim()) return; // Nếu trống thì dừng lại luôn, tránh gửi request rác

    // 3. Giải mã tokenSubmit (đã lấy ở bước 1) để lấy Username của người đăng bài
    const currentUsername = getUsernameFromToken(tokenSubmit) || "Ẩn danh";

    // 4. Lấy link avatar của người dùng hiện tại từ localStorage
    const currentAvatar = localStorage.getItem("localUserAvatar") || "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Cat%20with%20Wry%20Smile.png";

    // 5. Đóng gói dữ liệu (Payload) sạch sẽ gửi sang Backend Worker
    const postPayload = {
        content: text,
        username: currentUsername,
        avatar: currentAvatar,
        image: currentBase64Image
    };
    
    const btn = document.getElementById('submitBtn');
    btn.innerText = "⏳ Đang phóng lên đám mây...";
    btn.disabled = true;

    try {
        // 6. Gửi API đến Backend (Worker đảm nhận việc thực thi xuống Turso DB)
        const response = await fetch(`${API_URL}/api/posts/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenSubmit}`
            },
            body: JSON.stringify(postPayload)
        });
        
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Đăng bài thất bại");
        
        // 7. Reset Form và cập nhật lại giao diện sau khi Backend báo thành công
        document.getElementById('postText').value = '';
        if (typeof window.removeImage === 'function') window.removeImage(); 
        if (typeof toggleModal === 'function') toggleModal(false); 
        await window.fetchPosts(); 
        
    } catch (error) {
        await window.magicPopup("Lỗi khi đăng: " + error.message, "alert");
    } finally {
        btn.innerText = "🚀 Đăng bài";
        btn.disabled = false;
    }
}

window.deletePost = async function(postId) {
    const tokenDelete = localStorage.getItem('user_token') || localStorage.getItem('authToken');
    if (!tokenDelete) {
        await window.magicPopup("Vui lòng đăng nhập để có quyền xóa bài viết! ⚠️", "alert");
        return;
    }
    const isSure = await window.magicPopup("Bạn có chắc chắn muốn ném bài viết này<br>vào hố đen vũ trụ không?", "confirm");
    if (!isSure) return;
    const passcode = await window.magicPopup("Nhập mật mã Quản trị viên<br>để thi triển ma pháp phá hủy:", "prompt");
    if (!passcode) return;

    try {
        const ketQua = await fetch(`${API_URL}/api/posts/delete`, {
            method: "DELETE", 
            headers: {
                "Content-Type": "application/json",
                "X-Admin-Password": passcode,
                'Authorization': 'Bearer ' + tokenDelete,
            },
            body: JSON.stringify({ postId: postId })
        });
        const data = await ketQua.json();
        if (!data.success){ 
            await window.magicPopup("Xóa thất bại: " + data.message, "alert");
            return; 
        }

        const wrapper = document.getElementById(`post-wrapper-${postId}`);
        const article = document.getElementById(`post-article-${postId}`);
        if (wrapper && article) {
            const rect = article.getBoundingClientRect();
            const polygons = [
                'polygon(0% 0%, 100% 0%, 50% 50%)', 'polygon(100% 0%, 100% 100%, 50% 50%)',
                'polygon(0% 100%, 50% 50%, 100% 100%)', 'polygon(0% 0%, 50% 50%, 0% 100%)'
            ];
            polygons.forEach((poly, index) => {
                const shard = article.cloneNode(true); shard.id = ''; 
                shard.style.position = 'fixed'; shard.style.top = rect.top + 'px'; shard.style.left = rect.left + 'px';
                shard.style.width = rect.width + 'px'; shard.style.height = rect.height + 'px'; shard.style.margin = '0';
                shard.style.zIndex = '9999'; shard.style.clipPath = poly; shard.style.transition = 'all 1s cubic-bezier(0.25, 1, 0.5, 1)';
                document.body.appendChild(shard); shard.offsetHeight;
                const moveX = (index === 1 ? 100 : (index === 3 ? -100 : 0)) + (Math.random() * 60 - 30);
                const moveY = (index === 2 ? 150 : (index === 0 ? 50 : 100)) + Math.random() * 100;
                shard.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${(Math.random() - 0.5) * 90}deg) scale(0.6)`;
                shard.style.opacity = '0'; setTimeout(() => shard.remove(), 1000);
            });
            article.style.display = 'none'; wrapper.style.height = rect.height + 'px'; wrapper.style.overflow = 'hidden';
            wrapper.style.transition = 'all 0.5s ease-in-out'; wrapper.offsetHeight; 
            wrapper.style.height = '0'; wrapper.style.marginBottom = '0'; wrapper.style.opacity = '0';
        }
    } catch (error) {
        await window.magicPopup("Lỗi không thể xóa: " + error.message, "alert");
    }
}

// ==========================================
// KHU VỰC KHỞI TẠO & LẮNG NGHE SỰ KIỆN AUTH
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Kiểm tra trạng thái UI ngay khi load trang
    checkAuthUI();

    const loginBtn = document.getElementById('auth-login-btn');
    const modal = document.getElementById('auth-modal');
    const closeBtn = document.getElementById('auth-close-btn');
    const loginForm = document.getElementById('auth-login-form');

    if(loginBtn) loginBtn.addEventListener('click', () => modal.classList.remove('hidden'));
    if(closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    if(modal) {
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
    }

    // Luồng xử lý gửi Form Đăng nhập
    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            try {
                const log_response = await fetch(`${API_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await log_response.json();
                if(data.success) {
                    localStorage.setItem('authToken', data.token); 
                    localStorage.setItem('user_token', data.token); // Đồng bộ cho tính năng viết bài
                    if (data.avatar) {
                        localStorage.setItem('localUserAvatar', data.avatar);
                    }
                    modal.classList.add('hidden'); 
                    checkAuthUI(); // Kích hoạt biến hình nút Đăng nhập thành Avatar ngay lập tức!
                } else {
                    await window.magicPopup("Đăng nhập thất bại: " + (data.message || "Thông tin sai"), "alert");
                }
            } catch (error) {
                console.error("Lỗi xác thực:", error);
            }
        });
    }

    // Chuyển đổi qua lại giữa Login / Register
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const authRegisterLink = document.getElementById('auth-register-link');
    const authLoginLink = document.getElementById('auth-login-link');
    const registerForm = document.getElementById('auth-register-form');
    const regErrorMsg = document.getElementById('reg-error-msg');

    if(authRegisterLink) {
        authRegisterLink.addEventListener('click', (e) => {
            e.preventDefault(); loginSection.classList.add('form-hidden'); registerSection.classList.remove('form-hidden'); if(regErrorMsg) regErrorMsg.innerText = "";
        });
    }
    if(authLoginLink) {
        authLoginLink.addEventListener('click', (e) => { e.preventDefault(); registerSection.classList.add('form-hidden'); loginSection.classList.remove('form-hidden'); });
    }

    // Luồng đăng ký tài khoản mới
    if(registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('reg-username').value.trim();
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;
            if(regErrorMsg) regErrorMsg.innerText = "";

            if (password !== confirmPassword) {
                if(regErrorMsg) regErrorMsg.innerText = "❌ Mật khẩu xác nhận không khớp!";
                return; 
            }
            try {
                const reg_response = await fetch(`${API_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const reg_data = await reg_response.json();
                if(reg_data.success) {
                    await window.magicPopup("Đăng ký thành công! Hãy đăng nhập nhé! 🎉", "alert");
                    registerSection.classList.add('form-hidden'); loginSection.classList.remove('form-hidden'); registerForm.reset();
                } else {
                    await window.magicPopup("Đăng ký thất bại: " + (reg_data.message || "Lỗi đầu vào"), "alert");
                }
            } catch (error) {
                console.error("Lỗi đăng ký:", error);
            }
        });
    }

    // Kích hoạt vùng đổi ảnh Avatar từ máy tính cục bộ
    document.getElementById("avatar-click-zone")?.addEventListener("click", () => {
        document.getElementById("avatar-file-input").click();
    });

    document.getElementById("avatar-file-input")?.addEventListener("change", function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                const base64Image = e.target.result;
                document.getElementById("user-avatar-img").src = base64Image;
                localStorage.setItem("localUserAvatar", base64Image); // Lưu trữ ảnh lại để F5 không mất

                // Gửi đồng bộ lên Turso Database qua Cloudflare Worker
                const activeToken = localStorage.getItem("authToken") || localStorage.getItem("user_token");
                if (activeToken) {
                    try {
                        const response = await fetch(`${API_URL}/api/users/update-avatar`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${activeToken}`
                            },
                            body: JSON.stringify({ avatar: base64Image })
                        });
                        const resData = await response.json();
                        if (!response.ok || !resData.success) {
                            console.error("Không thể đồng bộ ảnh đại diện lên máy chủ:", resData.message);
                        } else {
                            console.log("Đồng bộ ảnh đại diện thành công!");
                            if (resData.avatar) {
                                // Thay thế Base64 tạm thời bằng đường dẫn R2 cực nhẹ từ server!
                                localStorage.setItem("localUserAvatar", resData.avatar);
                                document.getElementById("user-avatar-img").src = resData.avatar;
                            }
                        }
                    } catch (err) {
                        console.error("Lỗi đồng bộ ảnh đại diện:", err);
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    });

    // Xử lý nút Đăng xuất
    document.getElementById("auth-logout-btn")?.addEventListener("click", () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user_token"); 
        localStorage.removeItem("localUserAvatar");
        document.getElementById("user-avatar-img").src = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Cat%20with%20Wry%20Smile.png";
        checkAuthUI();
    });

    // Cập nhật tiến trình cho trình phát nhạc
    const audio = document.getElementById('chillAudio');
    const progressFill = document.getElementById('chillProgressFill');
    const timeRemainingText = document.getElementById('chillTimeRemaining');

    if(audio) {
        audio.addEventListener('timeupdate', () => {
            if(!isNaN(audio.duration)) {
                const progressPercent = (audio.currentTime / audio.duration) * 100;
                if(progressFill) progressFill.style.width = `${progressPercent}%`;
                const remaining = audio.duration - audio.currentTime;
                const mins = Math.floor(remaining / 60); const secs = Math.floor(remaining % 60);
                if(timeRemainingText) timeRemainingText.innerText = `-${mins}:${secs < 10 ? '0' : ''}${secs}`;
            }
        });
    }
});

// Tự động đóng bảng điều khiển nhạc nếu bấm ra ngoài
document.addEventListener('click', (e) => {
    const container = document.querySelector('.chill-widget-container');
    const panel = document.getElementById('chillPanel');
    if (container && !container.contains(e.target) && panel && panel.classList.contains('active')) {
        panel.classList.remove('active');
    }
});