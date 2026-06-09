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
        // === 修改这里：把 memory 换成 food ===
        if (document.getElementById('food-list')) loadFoods();
        if (document.getElementById('wish-list')) loadWishes(); 
    } else {
        ['diary-list', 'anniversary-list', 'food-list', 'wish-list'].forEach(id => {
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

// ==================== 6. 美食探店功能（本地上传+地点+检索） ====================

// --- 6.1：图片预览小魔法 ---
// 这个函数在 HTML 里通过 onchange 调用，负责把手机里选的照片先显示在网页上预览
window.previewImage = function(input) {
    const previewContainer = document.getElementById('image-preview-container');
    const previewImage = document.getElementById('image-preview');
    const file = input.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result; // 将读取的图片内容塞给预览图
            previewContainer.style.display = 'block'; // 显示预览区域
        }
        reader.readAsDataURL(file); // 读取图片文件
    } else {
        previewContainer.style.display = 'none'; // 如果没选，就隐藏预览区域
    }
}

// --- 6.2：从云端加载美食数据（增加了地点显示和检索） ---
async function loadFoods(searchQuery = '') {
    const list = document.getElementById('food-list');
    if (!list || !supabaseClient) return;
    
    // 查询时，同时也查出刚才新建的 'location' 列
    const { data, error } = await supabaseClient.from('memories').select('id, url, caption, location').order('id', { ascending: false });
    if (error) return console.error(error);
    
    list.innerHTML = '';
    data.forEach(item => {
        // 1. 魔法解包：拆解店名、评分和评价
        let name = "未命名记忆", rating = "", comment = item.caption;
        if (item.caption && item.caption.includes('||')) {
            const parts = item.caption.split('||');
            name = parts[0];
            rating = parts[1];
            comment = parts[2] || '';
        }

        // 2. 获取数据库里原本的地点（如果没有填，就给一个默认的📍未知）
        let location = item.location || '未知';

        // 3. 实时检索逻辑：如果输入了搜索词，且店名、评价、地点里都没有这个词，就隐藏卡片
        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            const isInName = name.toLowerCase().includes(searchLower);
            const isInComment = comment.toLowerCase().includes(searchLower);
            const isInLocation = location.toLowerCase().includes(searchLower); // 新增：地点检索
            
            if (!isInName && !isInComment && !isInLocation) {
                return; // 跳过这条数据
            }
        }

        const div = document.createElement('div');
        div.className = "photo-card card box-shadow";
        div.style.cssText = "display: flex; flex-direction: column; overflow: hidden; background: white;";
        
        div.innerHTML = `
            <img src="${item.url}" alt="美食照片" class="photo-main" style="width:100%; height:150px; object-fit:cover; border-bottom: 2px solid #2D2D2D;" onerror="this.src='https://i.pinimg.com/736x/84/4c/02/844c02c8639038d394ccb7af8e7b74ba.jpg'">
            <div style="padding: 12px; text-align: left; position: relative;">
                <h3 style="margin: 0 0 5px 0; color: #FF4D4D; font-size: 16px;">${name}</h3>
                
                <p style="margin: 0 0 5px 0; font-size: 12px; color: #555;">📍 ${location}</p>
                
                <p style="margin: 0 0 8px 0; font-size: 12px;">${rating}</p>
                <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.4;">${comment}</p>
                <button onclick="deleteItem('memories', ${item.id}, loadFoods)" style="${deleteBtnStyle} position: absolute; right: 10px; bottom: 10px;">删除 ✖</button>
            </div>
        `;
        list.appendChild(div);
    });
}

// 绑定搜索框实时触发
window.searchFood = function() {
    const query = document.getElementById('search-food').value.trim();
    loadFoods(query);
}

// --- 6.3：添加新探店（核心：上传图片+存地点+存其他信息） ---
const addFoodBtn = document.getElementById('add-food-btn');
if (addFoodBtn) {
    addFoodBtn.addEventListener('click', async () => {
        if (!supabaseClient) return alert('云端未连接');
        
        const nameInput = document.getElementById('food-input-name');
        const locationInput = document.getElementById('food-input-location'); // 地点输入框
        const ratingInput = document.getElementById('food-input-rating');
        const fileInput = document.getElementById('food-input-file'); // 文件输入框
        const commentInput = document.getElementById('food-input-comment');
        
        // 1. 基础验证
        let name = nameInput.value.trim();
        let location = locationInput.value.trim();
        let comment = commentInput.value.trim();
        let file = fileInput.files[0];
        
        if (!name) return alert('店名不能为空哦！');
        if (!location) return alert('📍 给探店局加个地点吧（如：夫子庙）！');
        if (!comment) return alert('随便写点干饭评价吧汪~');
        if (!file) return alert('📷 请上传一张诱人的美食照片吧！汪！');

        // 按钮变灰提示上传中，防止重复点击
        addFoodBtn.innerText = "上传照片并收录中... 🕊️";
        addFoodBtn.disabled = true;

        // 2. 超核心动作：上传图片到 Supabase Storage
        // 生成一个唯一的文件名（时间戳 + 原文件名），防止文件冲突
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;     
        // 执行上传动作，飞去 '干饭局照片' 存储桶
        const { data: uploadData, error: uploadError } = await supabaseClient.storage.from('Food').upload(fileName, file);

        if (uploadError) {
            addFoodBtn.innerText = "收录进美食局 🍔";
            addFoodBtn.disabled = false;
            console.error(uploadError);
            return alert('❌ 上传照片到云端抽屉失败，检查一下 Bucket 设置或者网速吧。');
        }

        // 3. 上传成功，获取它的全网公开访问链接
        const { data: { publicUrl } } = supabaseClient.storage.from('Food').getPublicUrl(fileName);

        // 4. 将所有信息（公开图片链接、魔法打包评价、地点）存入 memories 数据库
        // 魔法打包：依然用 "||" 隔开
        let combinedCaption = `${name}||${ratingInput.value}||${comment}`;
        
        await supabaseClient.from('memories').insert([{ 
            url: publicUrl, // 公开链接
            caption: combinedCaption, // 店名+评分+评价
            location: location // 地点（新列）
        }]);
        
        // 5. 恢复初始状态
        nameInput.value = ''; locationInput.value = ''; commentInput.value = ''; fileInput.value = '';
        document.getElementById('image-preview-container').style.display = 'none'; // 隐藏预览
        addFoodBtn.innerText = "收录进美食局 🍔";
        addFoodBtn.disabled = false;
        
        loadFoods();
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