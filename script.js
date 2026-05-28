// ==================== 1. 核心运行环境检查 & 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    updateTimer();
    updateAnniversary();
    loadDiaries();
    loadAnniversaries();
    loadMemories();
    loadWishes(); // 自动加载心愿清单
});

// 通用删除按钮样式
const deleteBtnStyle = "background: #FFE4E6; color: #FF4D4D; border: 2px solid #2D2D2D; padding: 2px 10px; border-radius: 12px; font-size: 12px; cursor: pointer; font-weight: bold; float: right;";


// ==================== 2. 恋爱计时器 ====================
function updateTimer() {
    const daysElement = document.getElementById('days');
    if (daysElement) {
        const startDate = new Date(2025, 5, 22); // 2025年06月22日
        const now = new Date();
        const difference = now - startDate;
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        daysElement.innerText = days;
    }
}
if (document.getElementById('days')) {
    setInterval(updateTimer, 1000 * 60 * 60 * 24);
}


// ==================== 3. 小狗爪子特效 ====================
document.addEventListener('mousemove', function(e) {
    if (Math.random() > 0.15) return; 
    const paw = document.createElement('div');
    paw.className = 'cursor-paw';
    paw.style.left = e.pageX + 'px';
    paw.style.top = e.pageY + 'px';
    const randomDegree = Math.floor(Math.random() * 40) - 20; 
    paw.style.transform = `translate(-50%, -50%) rotate(${randomDegree}deg)`;
    document.body.appendChild(paw);
    setTimeout(() => { paw.remove(); }, 1000);
});


// ==================== 4. 主页一周年倒计时 ====================
function updateAnniversary() {
    const countdownElement = document.getElementById('ann-countdown');
    if (countdownElement) {
        const targetDate = new Date('2026-06-22T00:00:00'); 
        const now = new Date();
        const difference = targetDate - now;
        if (difference > 0) {
            const daysLeft = Math.ceil(difference / (1000 * 60 * 60 * 24));
            countdownElement.innerText = `还有 ${daysLeft} 天`;
        } else {
            countdownElement.innerText = "就是今天！🎉";
        }
    }
}


// ==================== 5. 日常记录页功能 (daily.html) ====================
function loadDiaries() {
    const list = document.getElementById('diary-list');
    if (!list) return;
    const data = JSON.parse(localStorage.getItem('my_diaries')) || [];
    list.innerHTML = ''; 
    data.slice().reverse().forEach((item, index) => {
        const realIndex = data.length - 1 - index; 
        const div = document.createElement('div');
        div.style.cssText = "border-bottom: 2px dashed #FF879A; padding: 15px 0; text-align: left; overflow: hidden;";
        div.innerHTML = `
            <button onclick="deleteItem('my_diaries', ${realIndex}, loadDiaries)" style="${deleteBtnStyle}">删除 ✖</button>
            <p style="font-size: 13px; color: #888;">${item.date} 🐾</p>
            <p style="font-size: 16px; color: #333; margin-top: 6px;">${item.text}</p>
        `;
        list.appendChild(div);
    });
}
const addDiaryBtn = document.getElementById('add-diary-btn');
if (addDiaryBtn) {
    addDiaryBtn.addEventListener('click', function() {
        const diaryInput = document.getElementById('diary-input');
        const text = diaryInput.value.trim();
        if (!text) return alert('内容不能为空哦！');
        const now = new Date();
        const dateString = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日`;
        const data = JSON.parse(localStorage.getItem('my_diaries')) || [];
        data.push({ text: text, date: dateString });
        localStorage.setItem('my_diaries', JSON.stringify(data));
        diaryInput.value = '';
        loadDiaries();
    });
}


// ==================== 6. 纪念日规划页功能 (anniversary.html) ====================
function loadAnniversaries() {
    const list = document.getElementById('anniversary-list');
    if (!list) return;
    const data = JSON.parse(localStorage.getItem('my_anniversaries')) || [];
    list.innerHTML = '';
    data.forEach((item, index) => {
        const targetDate = new Date(item.date + 'T00:00:00');
        const now = new Date();
        const diff = targetDate - now;
        let countdownText = diff > 0 ? `还有 ${Math.ceil(diff / (1000 * 60 * 60 * 24))} 天` : "就是今天/已过去 🎉";
        const div = document.createElement('div');
        div.className = "anniversary-details";
        div.style.cssText = "border-bottom: 2px dashed #2D2D2D; padding: 15px 0; margin-bottom: 5px;";
        div.innerHTML = `
            <div class="ann-item">
                <img src="https://i.pinimg.com/736x/b2/4b/ab/b24babcb8298538e26c2425b699402a2.jpg" alt="icon">
                <div class="text" style="text-align:left;">
                    <p class="ann-title">${item.title}</p>
                    <p class="ann-countdown" style="color: #666; font-size:14px;">目标日: ${item.date} (${countdownText})</p>
                </div>
            </div>
            <button onclick="deleteItem('my_anniversaries', ${index}, loadAnniversaries)" style="${deleteBtnStyle} margin-top: 10px;">删除 ✖</button>
        `;
        list.appendChild(div);
    });
}
const addAnnBtn = document.getElementById('add-ann-btn');
if (addAnnBtn) {
    addAnnBtn.addEventListener('click', () => {
        const titleInput = document.getElementById('ann-input-title');
        const dateInput = document.getElementById('ann-input-date');
        if (!titleInput.value.trim() || !dateInput.value) return alert('请填全纪念日名称和日期！');
        const data = JSON.parse(localStorage.getItem('my_anniversaries')) || [];
        data.push({ title: titleInput.value.trim(), date: dateInput.value });
        localStorage.setItem('my_anniversaries', JSON.stringify(data));
        titleInput.value = ''; dateInput.value = '';
        loadAnniversaries();
    });
}


// ==================== 7. 回艺相册页功能 (memory.html) ====================
function loadMemories() {
    const list = document.getElementById('memory-list');
    if (!list) return;
    const data = JSON.parse(localStorage.getItem('my_memories')) || [];
    list.innerHTML = '';
    data.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = "photo-card card box-shadow";
        div.innerHTML = `
            <img src="${item.url}" alt="回忆" class="photo-main" onerror="this.src='https://i.pinimg.com/736x/6e/a6/ad/6ea6ad6c307fd568b2379c20df95760e.jpg'">
            <p class="photo-caption" style="text-align: left; position: relative;">
                ${item.caption}
                <button onclick="deleteItem('my_memories', ${index}, loadMemories)" style="${deleteBtnStyle} float: right; margin-top: -5px;">删除 ✖</button>
            </p>
        `;
        list.appendChild(div);
    });
}
const addMemBtn = document.getElementById('add-mem-btn');
if (addMemBtn) {
    addMemBtn.addEventListener('click', () => {
        const urlInput = document.getElementById('mem-input-url');
        const capInput = document.getElementById('mem-input-caption');
        let url = urlInput.value.trim() || "https://i.pinimg.com/736x/6e/a6/ad/6ea6ad6c307fd568b2379c20df95760e.jpg"; 
        const data = JSON.parse(localStorage.getItem('my_memories')) || [];
        data.push({ url: url, caption: capInput.value.trim() || "未命名美好瞬间" });
        localStorage.setItem('my_memories', JSON.stringify(data));
        urlInput.value = ''; capInput.value = '';
        loadMemories();
    });
}


// ==================== 8. 心愿清单页功能 (wish.html) ====================
function loadWishes() {
    const list = document.getElementById('wish-list');
    if (!list) return;

    // 如果本地完全没有心愿数据，就用你原本的 5 个心愿作为初始值
    if (!localStorage.getItem('my_wishes')) {
        const defaultWishes = [
            { text: "razem 一起去海边看日出 🌅", checked: true },
            { text: "养一只属于我们的小狗 🐶", checked: true },
            { text: "去一次迪士尼乐园看烟花 🎆", checked: false },
            { text: "狂吃一整条街的夜市小吃 🍡", checked: false },
            { text: "一起通宵拼完一千块的拼图 🧩", checked: false }
        ];
        localStorage.setItem('my_wishes', JSON.stringify(defaultWishes));
    }

    const data = JSON.parse(localStorage.getItem('my_wishes')) || [];
    list.innerHTML = '';

    data.forEach((item, index) => {
        const div = document.createElement('div');
        div.style.cssText = "display: flex; align-items: center; justify-content: space-between; padding: 5px 0;";
        
        // 根据是否勾选，动态决定文字颜色
        const textColor = item.checked ? "#666" : "#333";
        const textDecoration = item.checked ? "line-through" : "none"; // 勾选的可以加条删除线，不想要可以删掉这一行

        div.innerHTML = `
            <label style="display: flex; align-items: center; cursor: pointer; color: ${textColor}; text-decoration: ${textDecoration}; flex: 1;">
                <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleWish(${index})" style="transform: scale(1.3); margin-right: 10px; accent-color: #FF879A;">
                <span>${item.text}</span>
            </label>
            <button onclick="deleteItem('my_wishes', ${index}, loadWishes)" style="${deleteBtnStyle} float: none; margin-left: 10px;">删除 ✖</button>
        `;
        list.appendChild(div);
    });
}

// 勾选或取消勾选心愿时，改变状态并保存
window.toggleWish = function(index) {
    const data = JSON.parse(localStorage.getItem('my_wishes')) || [];
    if (data[index]) {
        data[index].checked = !data[index].checked; // 状态反转
        localStorage.setItem('my_wishes', JSON.stringify(data));
        loadWishes(); // 重新渲染样式
    }
}

const addWishBtn = document.getElementById('add-wish-btn');
if (addWishBtn) {
    addWishBtn.addEventListener('click', () => {
        const input = document.getElementById('wish-input');
        const text = input.value.trim();
        if (!text) return alert('心愿不能为空哦，快写下一个浪漫的点子吧！');

        const data = JSON.parse(localStorage.getItem('my_wishes')) || [];
        data.push({ text: text, checked: false }); // 新增的心愿默认是未完成(false)
        localStorage.setItem('my_wishes', JSON.stringify(data));
        
        input.value = '';
        loadWishes();
    });
}


// ==================== 9. 统一全局小狗橡皮擦 ====================
window.deleteItem = function(storageKey, index, reloadFunction) {
    if (confirm('小狗提示：确定要擦除这条珍贵的数据吗？')) {
        const data = JSON.parse(localStorage.getItem(storageKey)) || [];
        data.splice(index, 1); 
        localStorage.setItem(storageKey, JSON.stringify(data)); 
        reloadFunction(); 
    }
}