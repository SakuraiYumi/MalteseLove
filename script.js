// ==================== 【防御层 1】小狗爪特效强制启动 ====================
(function() {
    // 检查是否已经初始化过，防止重复加载报错
    if (window.hasPawEffectLoaded) return;
    window.hasPawEffectLoaded = true;

    document.addEventListener('mousemove', function(e) {
        if (Math.random() > 0.15) return; 
        const paw = document.createElement('div');
        const randomDegree = Math.floor(Math.random() * 40) - 20; 
        paw.className = 'cursor-paw';
        paw.style.left = e.pageX + 'px';
        paw.style.top = e.pageY + 'px';
        paw.style.transform = `translate(-50%, -50%) rotate(${randomDegree}deg)`;
        document.body.appendChild(paw);
        setTimeout(() => paw.remove(), 1000);
    });
    console.log("🐾 小狗爪特效注入成功！");
})();

// 通用删除按钮样式
const deleteBtnStyle = "background: #FFE4E6; color: #FF4D4D; border: 2px solid #2D2D2D; padding: 2px 10px; border-radius: 12px; font-size: 12px; cursor: pointer; font-weight: bold; float: right;";

// ==================== 【防御层 2】连接云端大脑 ====================
const supabaseUrl = 'https://ekaeienirogrgkjxvwtc.supabase.co';
const supabaseKey = 'sb_publishable_mLKLqxXbN75bhUnSxkkA5w_4mwKr0rQ'; 

let supabaseClient = null;

// 新增美食全局状态变量，用来做无刷新本地筛选和编辑图片暂存
let allFoods = []; 
let currentImageUrl = ""; 

try {
    if (window.supabase) {
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

    // 3. 美食页面特有：自动将探店日历初始化为今天
    const foodDateInput = document.getElementById('food-input-date');
    if (foodDateInput) {
        foodDateInput.value = new Date().toISOString().split('T')[0];
    }

    // 4. 动态加载各个页面的列表数据
    if (supabaseClient) {
        if (document.getElementById('diary-list')) loadDiaries();
        if (document.getElementById('anniversary-list')) loadAnniversaries();
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

// ==================== 6. 美食探店功能 (超级重构升级版) ====================

// --- 6.1：图片预览小魔法 ---
window.previewImage = function(input) {
    const previewContainer = document.getElementById('image-preview-container');
    const previewImage = document.getElementById('image-preview');
    const file = input.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            previewContainer.style.display = 'block';
        }
        reader.readAsDataURL(file);
    } else {
        if(!currentImageUrl) {
            previewContainer.style.display = 'none';
        }
    }
}

// --- 6.2：从云端下载美食数据 ---
async function loadFoods() {
    const list = document.getElementById('food-list');
    if (!list || !supabaseClient) return;
    
    list.innerHTML = '<p style="text-align:center; color:#888; width:100%;">正在加载美食库... ☁️</p>';
    
    // 下载全部数据，包含新加的 location 和 visit_date
    const { data, error } = await supabaseClient
        .from('memories')
        .select('id, url, caption, location, visit_date')
        .order('id', { ascending: false });
        
    if (error) return console.error(error);
    
    // 将数据存入全局数组，方便本地搜索和编辑回填
    allFoods = data || [];
    
    // 渲染数据并更新打卡总店数统计
    const countEl = document.getElementById('food-count');
    if (countEl) countEl.innerText = allFoods.length;
    
    renderFoodList(allFoods);
}

// 核心渲染器：将卡片渲染到 HTML 中
function renderFoodList(foodsArray) {
    const list = document.getElementById('food-list');
    if (!list) return;
    list.innerHTML = '';
    
    if (foodsArray.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#999; width:100%; padding:20px;">🔍 没有找到相关的探店记录哦~</p>';
        return;
    }

    foodsArray.forEach(item => {
        let name = "未命名记忆", rating = "", comment = item.caption;
        if (item.caption && item.caption.includes('||')) {
            const parts = item.caption.split('||');
            name = parts[0];
            rating = parts[1];
            comment = parts[2] || '';
        }

        let location = item.location || '未知';
        let showDate = item.visit_date || '未知日期';

        const div = document.createElement('div');
        div.className = "photo-card card box-shadow";
        div.style.cssText = "display: flex; flex-direction: column; overflow: hidden; background: white; position: relative;";
        
        div.innerHTML = `
            <img src="${item.url}" alt="美食照片" class="photo-main" style="width:100%; height:150px; object-fit:cover; border-bottom: 2px solid #2D2D2D;" onerror="this.src='https://i.pinimg.com/736x/84/4c/02/844c02c8639038d394ccb7af8e7b74ba.jpg'">
            <div style="padding: 12px; text-align: left; padding-bottom: 45px;">
                <h3 style="margin: 0 0 5px 0; color: #FF4D4D; font-size: 16px;">${name}</h3>
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#555; margin-bottom: 5px;">
                    <span>📍 ${location}</span>
                    <span>📅 ${showDate}</span>
                </div>
                <p style="margin: 0 0 8px 0; font-size: 12px;">${rating}</p>
                <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.4; word-break: break-all;">${comment}</p>
                
                <div style="position: absolute; right: 10px; bottom: 10px; display: flex; gap: 5px;">
                    <button onclick="startEdit(${item.id})" style="background: #ECECEC; color: #2D2D2D; border: 2px solid #2D2D2D; padding: 2px 8px; border-radius: 12px; font-size: 12px; cursor: pointer; font-weight: bold; font-family: inherit;">✏️ 编辑</button>
                    <button onclick="deleteItem('memories', ${item.id}, loadFoods)" style="background: #FFE4E6; color: #FF4D4D; border: 2px solid #2D2D2D; padding: 2px 8px; border-radius: 12px; font-size: 12px; cursor: pointer; font-weight: bold; font-family: inherit;">✖</button>
                </div>
            </div>
        `;
        list.appendChild(div);
    });
}

// --- 6.3：双重本地实时筛选功能（店名/地点/评价 + 日期） ---
window.searchFood = function() {
    const textKeyword = document.getElementById('search-food').value.toLowerCase().trim();
    const dateKeyword = document.getElementById('search-date').value;

    const filtered = allFoods.filter(item => {
        let name = "未命名记忆", rating = "", comment = item.caption || "";
        if (item.caption && item.caption.includes('||')) {
            const parts = item.caption.split('||');
            name = parts[0];
            rating = parts[1];
            comment = parts[2] || '';
        }
        const location = item.location || '未知';
        const visitDate = item.visit_date || '';

        // 1. 文字关键字过滤（对比店名、地点、评价内容）
        const matchesText = 
            name.toLowerCase().includes(textKeyword) ||
            comment.toLowerCase().includes(textKeyword) ||
            location.toLowerCase().includes(textKeyword);
        
        // 2. 日期日历过滤（若没选日期，则默认放行所有）
        const matchesDate = !dateKeyword || (visitDate === dateKeyword);

        return matchesText && matchesDate;
    });

    renderFoodList(filtered);
}

// --- 6.4：触发编辑状态：将数据抓回输入框 ---
window.startEdit = function(id) {
    const item = allFoods.find(f => f.id == id);
    if (!item) return;

    let name = "未命名记忆", rating = "⭐⭐⭐⭐⭐ 绝赞推荐！", comment = item.caption;
    if (item.caption && item.caption.includes('||')) {
        const parts = item.caption.split('||');
        name = parts[0];
        rating = parts[1];
        comment = parts[2] || '';
    }

    // 1. 回填各个表单
    document.getElementById("editing-id").value = item.id;
    document.getElementById("food-input-name").value = name;
    document.getElementById("food-input-location").value = item.location || "";
    document.getElementById("food-input-rating").value = rating;
    document.getElementById("food-input-comment").value = comment;
    if(item.visit_date) {
        document.getElementById("food-input-date").value = item.visit_date;
    }

    // 2. 记住原来的旧照片链接，进行显示预览
    currentImageUrl = item.url;
    const previewImg = document.getElementById("image-preview");
    const previewContainer = document.getElementById("image-preview-container");
    previewImg.src = item.url;
    previewContainer.style.display = "block";

    // 3. 改变外观按钮提示，展示取消按钮
    document.getElementById("form-title").innerHTML = `✏️ 正在修改：${name}`;
    document.getElementById("add-food-btn").innerText = "保存修改 💾";
    document.getElementById("cancel-edit-btn").style.display = "block";

    // 4. 丝滑滚动到最顶端，方便修改
    document.getElementById("form-title").scrollIntoView({ behavior: 'smooth' });
}

// 重置并退出编辑表单状态
window.resetForm = function() {
    document.getElementById("editing-id").value = "";
    document.getElementById("food-input-name").value = "";
    document.getElementById("food-input-location").value = "";
    document.getElementById("food-input-comment").value = "";
    document.getElementById("food-input-file").value = "";
    document.getElementById("image-preview-container").style.display = "none";
    document.getElementById("image-preview").src = "";
    currentImageUrl = "";

    // 重置日历为今天
    document.getElementById("food-input-date").value = new Date().toISOString().split('T')[0];

    // 恢复按钮和标题
    document.getElementById("form-title").innerHTML = `<img src="https://img.icons8.com/emoji/48/000000/hamburger-emoji.png" alt="icon"> 记录新探店`;
    document.getElementById("add-food-btn").innerText = "收录进美食局 🍔";
    document.getElementById("cancel-edit-btn").style.display = "none";
}

// --- 6.5：添加与保存修改复合提交功能 ---
const addFoodBtn = document.getElementById('add-food-btn');
if (addFoodBtn) {
    addFoodBtn.addEventListener('click', async () => {
        if (!supabaseClient) return alert('云端未连接');
        
        const editingId = document.getElementById('editing-id').value;
        const nameInput = document.getElementById('food-input-name');
        const locationInput = document.getElementById('food-input-location'); 
        const ratingInput = document.getElementById('food-input-rating');
        const fileInput = document.getElementById('food-input-file'); 
        const commentInput = document.getElementById('food-input-comment');
        const dateInput = document.getElementById('food-input-date');
        
        let name = nameInput.value.trim();
        let location = locationInput.value.trim();
        let comment = commentInput.value.trim();
        let visitDate = dateInput.value;
        let file = fileInput.files[0];
        
        if (!name) return alert('店名不能为空哦！');
        if (!location) return alert('📍 给探店局加个地点吧！');
        if (!comment) return alert('随便写点干饭评价吧汪~');
        if (!visitDate) return alert('📅 别忘了选择探店日期哦！');
        
        // 如果是新增记录，而且没有选照片，强行拦截
        if (!editingId && !file) {
            return alert('📷 请上传一张诱人的美食照片吧！汪！');
        }

        addFoodBtn.innerText = editingId ? "正在保存修改... 💾" : "上传照片并收录中... 🕊️";
        addFoodBtn.disabled = true;

        let finalImageUrl = currentImageUrl; // 如果是编辑状态且未换照片，默认继续用老图

        try {
            // 如果选了新照片，则启动云端抽屉重命名上传
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;     
                const { data: uploadData, error: uploadError } = await supabaseClient.storage.from('Food').upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabaseClient.storage.from('Food').getPublicUrl(fileName);
                finalImageUrl = publicUrl;
            }

            // 魔法数据组装
            let combinedCaption = `${name}||${ratingInput.value}||${comment}`;
            const dbData = { 
                url: finalImageUrl, 
                caption: combinedCaption, 
                location: location,
                visit_date: visitDate
            };

            if (editingId) {
                // 【更新分支】
                const { error: updateError } = await supabaseClient.from('memories').update(dbData).eq('id', editingId);
                if (updateError) throw updateError;
                alert('🎉 修改成功！美食记录已悄悄更新！');
            } else {
                // 【新增分支】
                const { error: insertError } = await supabaseClient.from('memories').insert([dbData]);
                if (insertError) throw insertError;
                alert('🍔 成功收录进美食局！小狗奖励你一根骨头！');
            }
            
            resetForm();
            loadFoods();
        } catch (uploadError) {
            console.error(uploadError);
            alert('❌ 操作失败，请检查云端设置、Bucket策略或网速。');
        } finally {
            addFoodBtn.innerText = "收录进美食局 🍔";
            addFoodBtn.disabled = false;
        }
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