// ==================== 【防御层 1】小狗爪特效强制启动 ====================
(function() {
    // 检查是否已经初始化过，防止重复加载报错
    if (window.hasPawEffectLoaded) return;
    window.hasPawEffectLoaded = true;

    document.addEventListener('mousemove', function(e) {
        if (Math.random() > 0.15) return; 
        const paw = document.createElement('div');
        paw.className = 'cursor-paw';
        paw.style.left = e.pageX + 'px';
        paw.style.top = e.pageY + 'px';
        const randomDegree = Math.floor(Math.random() * 40) - 20; 
        paw.style.transform = `translate(-50%, -50%) rotate(${randomDegree}deg)`;
        document.body.appendChild(paw);
        setTimeout(() => paw.remove(), 1000);
    });
    console.log("🐾 小狗爪特效注入成功！");
})();

// 通用删除按钮样式
const deleteBtnStyle = "background: #FFE4E6; color: #FF4D4D; border: 2px solid #2D2D2D; padding: 2px 10px; border-radius: 12px; font-size: 12px; cursor: pointer; font-weight: bold; float: right;";

// ==================== 【防御层 2】连接云端大脑（改名为 supabaseClient 避让） ====================
const supabaseUrl = 'https://ekaeienirogrgkjxvwtc.supabase.co';
const supabaseKey = 'sb_publishable_mLKLqxXbN75bhUnSxkkA5w_4mwKr0rQ'; 

let supabaseClient = null;

try {
    if (window.supabase) {
        // 使用官方的 window.supabase 来创建我们的客户端
        supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log("☁️ 云端大脑连接成功，名字已安全避让！");
    } else {
        console.warn("🐾 小狗提示：未检测到三方 Supabase 核心库，云端暂未开启。");
    }
} catch (error) {
    console.error("❌ 初始化错误:", error);
}

// ==================== 【防御层 3】页面长好后排队执行 ====================
document.addEventListener('DOMContentLoaded', () => {
    // 1. 恋爱计时器
    const daysElement = document.getElementById('days');
    if (daysElement) {
        const updateTimer = () => {
            const startDate = new Date(2025, 5, 22); 
            const now = new Date();
            daysElement.innerText = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
        };
        updateTimer();
        setInterval(updateTimer, 1000 * 60 * 60 * 24);
    }

    // 2. 一周年倒计时
    const countdownElement = document.getElementById('ann-countdown');
    if (countdownElement) {
        const targetDate = new Date('2026-06-22T00:00:00'); 
        const now = new Date();
        const difference = targetDate - now;
        countdownElement.innerText = difference > 0 ? `还有 ${Math.ceil(difference / (1000 * 60 * 60 * 24))} 天` : "就是今天！🎉";
    }

    // 3. 动态加载列表
    if (supabaseClient) {
        if (document.getElementById('diary-list')) loadDiaries();
        if (document.getElementById('anniversary-list')) loadAnniversaries();
        if (document.getElementById('memory-list')) loadMemories();
        if (document.getElementById('wish-list')) loadWishes(); 
    } else {
        ['diary-list', 'anniversary-list', 'memory-list', 'wish-list'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<p style="text-align:center; color:#ff879a;">云端未连接，本地特效守护中 🐾</p>';
        });
    }
});

// ==================== 4. 日常记录功能 ====================
async function loadDiaries() {
    const list = document.getElementById('diary-list');
    if (!list || !supabaseClient) return;
    list.innerHTML = '<p style="text-align:center; color:#888;">正在从云端读取日记... ☁️</p>'; 
    const { data, error } = await supabaseClient.from('diaries').select('*').order('id', { ascending: false });
    if (error) return console.error(error);
    list.innerHTML = ''; 
    data.forEach(item => {
        const div = document.createElement('div');
        div.style.cssText = "border-bottom: 2px dashed #FF879A; padding: 15px 0; text-align: left; overflow: hidden;";
        div.innerHTML = `<button onclick="deleteItem('diaries', ${item.id}, loadDiaries)" style="${deleteBtnStyle}">删除 ✖</button><p style="font-size: 13px; color: #888;">${item.date} 🐾</p><p style="font-size: 16px; color: #333; margin-top: 6px;">${item.text}</p>`;
        list.appendChild(div);
    });
}
const addDiaryBtn = document.getElementById('add-diary-btn');
if (addDiaryBtn) {
    addDiaryBtn.addEventListener('click', async function() {
        if (!supabaseClient) return alert('云端未连接');
        const input = document.getElementById('diary-input');
        const text = input.value.trim();
        if (!text) return alert('内容不能为空哦！');
        const now = new Date();
        const dateString = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日`;
        input.value = '正在飞往云端... 🕊️'; input.disabled = true;
        await supabaseClient.from('diaries').insert([{ text: text, date: dateString }]);
        input.value = ''; input.disabled = false;
        loadDiaries();
    });
}

// ==================== 5. 纪念日规划功能 ====================
async function loadAnniversaries() {
    const list = document.getElementById('anniversary-list');
    if (!list || !supabaseClient) return;
    const { data, error } = await supabaseClient.from('anniversaries').select('*').order('date', { ascending: true });
    if (error) return console.error(error);
    list.innerHTML = '';
    data.forEach(item => {
        const targetDate = new Date(item.date + 'T00:00:00');
        const now = new Date();
        const diff = targetDate - now;
        let countdownText = diff > 0 ? `还有 ${Math.ceil(diff / (1000 * 60 * 60 * 24))} 天` : "就是今天/已过去 🎉";
        const div = document.createElement('div');
        div.className = "anniversary-details";
        div.style.cssText = "border-bottom: 2px dashed #2D2D2D; padding: 15px 0; margin-bottom: 5px;";
        div.innerHTML = `<div class="ann-item"><img src="https://i.pinimg.com/736x/b2/4b/ab/b24babcb8298538e26c2425b699402a2.jpg" alt="icon"><div class="text" style="text-align:left;"><p class="ann-title">${item.title}</p><p class="ann-countdown" style="color: #666; font-size:14px;">目标日: ${item.date} (${countdownText})</p></div></div><button onclick="deleteItem('anniversaries', ${item.id}, loadAnniversaries)" style="${deleteBtnStyle} margin-top: 10px;">删除 ✖</button>`;
        list.appendChild(div);
    });
}
const addAnnBtn = document.getElementById('add-ann-btn');
if (addAnnBtn) {
    addAnnBtn.addEventListener('click', async () => {
        if (!supabaseClient) return alert('云端未连接');
        const titleInput = document.getElementById('ann-input-title');
        const dateInput = document.getElementById('ann-input-date');
        if (!titleInput.value.trim() || !dateInput.value) return alert('请填全纪念日名称和日期！');
        await supabaseClient.from('anniversaries').insert([{ title: titleInput.value.trim(), date: dateInput.value }]);
        titleInput.value = ''; dateInput.value = '';
        loadAnniversaries();
    });
}

// ==================== 6. 回艺相册功能 ====================
async function loadMemories() {
    const list = document.getElementById('memory-list');
    if (!list || !supabaseClient) return;
    const { data, error } = await supabaseClient.from('memories').select('*').order('id', { ascending: false });
    if (error) return console.error(error);
    list.innerHTML = '';
    data.forEach(item => {
        const div = document.createElement('div');
        div.className = "photo-card card box-shadow";
        div.innerHTML = `<img src="${item.url}" alt="回忆" class="photo-main" onerror="this.src='https://i.pinimg.com/736x/6e/a6/ad/6ea6ad6c307fd568b2379c20df95760e.jpg'"><p class="photo-caption" style="text-align: left; position: relative;">${item.caption}<button onclick="deleteItem('memories', ${item.id}, loadMemories)" style="${deleteBtnStyle} float: right; margin-top: -5px;">删除 ✖</button></p>`;
        list.appendChild(div);
    });
}
const addMemBtn = document.getElementById('add-mem-btn');
if (addMemBtn) {
    addMemBtn.addEventListener('click', async () => {
        if (!supabaseClient) return alert('云端未连接');
        const urlInput = document.getElementById('mem-input-url');
        const capInput = document.getElementById('mem-input-caption');
        let url = urlInput.value.trim() || "https://i.pinimg.com/736x/6e/a6/ad/6ea6ad6c307fd568b2379c20df95760e.jpg"; 
        await supabaseClient.from('memories').insert([{ url: url, caption: capInput.value.trim() || "未命名美好瞬间" }]);
        urlInput.value = ''; capInput.value = '';
        loadMemories();
    });
}

// ==================== 7. 心愿清单功能 ====================
async function loadWishes() {
    const list = document.getElementById('wish-list');
    if (!list || !supabaseClient) return;
    const { data, error } = await supabaseClient.from('wishes').select('*').order('id', { ascending: true });
    if (error) return console.error(error);
    if (data.length === 0) {
        const defaultWishes = [
            { text: "razem 一起去海边看日出 🌅", checked: true },
            { text: "养一只属于我们的小狗 🐶", checked: true },
            { text: "去一次迪士尼乐园看烟花 🎆", checked: false },
            { text: "狂吃一整条街的夜市小吃 🍡", checked: false },
            { text: "一起通宵拼完一千块的拼图 🧩", checked: false }
        ];
        await supabaseClient.from('wishes').insert(defaultWishes);
        return loadWishes(); 
    }
    list.innerHTML = '';
    data.forEach(item => {
        const div = document.createElement('div');
        div.style.cssText = "display: flex; align-items: center; justify-content: space-between; padding: 5px 0;";
        const textColor = item.checked ? "#666" : "#333";
        const textDecoration = item.checked ? "line-through" : "none"; 
        div.innerHTML = `<label style="display: flex; align-items: center; cursor: pointer; color: ${textColor}; text-decoration: ${textDecoration}; flex: 1;"><input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleWish(${item.id}, ${item.checked})" style="transform: scale(1.3); margin-right: 10px; accent-color: #FF879A;"><span>${item.text}</span></label><button onclick="deleteItem('wishes', ${item.id}, loadWishes)" style="${deleteBtnStyle} float: none; margin-left: 10px;">删除 ✖</button>`;
        list.appendChild(div);
    });
}
window.toggleWish = async function(id, currentStatus) {
    if (!supabaseClient) return;
    await supabaseClient.from('wishes').update({ checked: !currentStatus }).eq('id', id);
    loadWishes(); 
}
const addWishBtn = document.getElementById('add-wish-btn');
if (addWishBtn) {
    addWishBtn.addEventListener('click', async () => {
        if (!supabaseClient) return alert('云端未连接');
        const input = document.getElementById('wish-input');
        const text = input.value.trim();
        if (!text) return alert('心愿不能为空哦！');
        await supabaseClient.from('wishes').insert([{ text: text, checked: false }]);
        input.value = '';
        loadWishes();
    });
}

// ==================== 8. 全局小狗橡皮擦 ====================
window.deleteItem = async function(tableName, id, reloadFunction) {
    if (!supabaseClient) return;
    if (confirm('小狗提示：确定要擦除这条珍贵的数据吗？')) {
        await supabaseClient.from(tableName).delete().eq('id', id);
        reloadFunction(); 
    }
}