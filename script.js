// ==================== 【防御层 1】小狗爪特效强制启动 ====================
(function() {
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

const deleteBtnStyle = "background: #FFE4E6; color: #FF4D4D; border: 2px solid #2D2D2D; padding: 2px 10px; border-radius: 12px; font-size: 12px; cursor: pointer; font-weight: bold; float: right;";

// ==================== 【防御层 2】连接云端大脑 ====================
let supabaseClient = window.supabaseClient || null;

// 美食全局状态变量
let allFoods = []; 
let currentImageUrl = ""; 
let isImageRemoved = false; 
let currentSelectedTag = 'All'; 
let lastMemoryKey = '';

// ==================== 【防御层 3】页面长好后排队执行 ====================
document.addEventListener('DOMContentLoaded', () => {
    // 1. 恋爱天数计算
    const daysElement = document.getElementById('days');
    if (daysElement) {
        const updateTimer = () => {
            const startDate = new Date(2025, 5, 22); // 2025年6月22日 (5代表6月)
            const now = new Date();
            daysElement.innerText = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
        };
        updateTimer();
        setInterval(updateTimer, 1000 * 60 * 60 * 24);
    }

    // 2. 最近纪念日大看板倒计时
    const countdownElement = document.getElementById('ann-countdown');
    if (countdownElement) {
        const targetDate = new Date('2026-06-22T00:00:00'); 
        const now = new Date();
        const difference = targetDate - now;
        countdownElement.innerText = difference > 0 ? `还有 ${Math.ceil(difference / (1000 * 60 * 60 * 24))} 天` : "就是今天！🎉";
    }

    // 3. 探店日期默认今天
    const foodDateInput = document.getElementById('food-input-date');
    if (foodDateInput) {
        foodDateInput.value = new Date().toISOString().split('T')[0];
    }

    const bootCloud = typeof window.onPuppyLoveReady === 'function' ? window.onPuppyLoveReady : (cb) => cb();
    bootCloud(() => {
        supabaseClient = window.supabaseClient || supabaseClient;
        if (supabaseClient) {
            if (document.getElementById('diary-list') && !document.getElementById('add-diary-btn-new')) loadDiaries();
            if (document.getElementById('anniversary-list')) loadAnniversaries();
            if (document.getElementById('food-list')) loadFoods();
            if (document.getElementById('wish-list')) loadWishes();
            if (document.getElementById('random-memory-card')) loadRandomMemory();
        } else {
            const annList = document.getElementById('anniversary-list');
            if (annList) annList.innerHTML = "<p style='color:orange; text-align:center;'>☁️ 等待云端组件加载中...</p>";
        }
    });
});

// ==================== 4. 日常记录功能 ====================
async function loadDiaries() {
    const list = document.getElementById('diary-list');
    if (!list || !supabaseClient) return;
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
        if (!supabaseClient) return;
        const input = document.getElementById('diary-input');
        if (!input.value.trim()) return alert('内容不能为空哦！');
        const now = new Date();
        const dateString = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日`;
        await supabaseClient.from('diaries').insert([{ text: input.value.trim(), date: dateString }]);
        input.value = '';
        loadDiaries();
    });
}

// ==================== 5. 纪念日规划功能 (🌟 智能倒计时核心修复) ====================

// ⚙️ 内部辅助工具：智能倒计时大脑
function calculateSmartCountdown(dateStr, isYearly) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 抹平时间误差

    // 格式化传入的目标日期
    const targetDate = new Date(dateStr + 'T00:00:00');
    if (isNaN(targetDate.getTime())) return "日期格式有误";

    if (!isYearly) {
        // 【单次日子】比如认识1000天
        const diffTime = targetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return "✨ 就是今天！ ✨";
        if (diffDays > 0) return `还有 <span style="color:#E76F51; font-weight:bold;">${diffDays}</span> 天`;
        return `已过去 <span style="color:#888;">${Math.abs(diffDays)}</span> 天`;
    } else {
        // 【每年重复】比如生日、结婚纪念日
        const currentYear = today.getFullYear();
        let nextOccur = new Date(currentYear, targetDate.getMonth(), targetDate.getDate());
        
        // 如果今年的生日/纪念日已经过去了，自动计算明年的
        if (nextOccur < today) {
            nextOccur.setFullYear(currentYear + 1);
        }

        const diffTime = nextOccur - today;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const totalYears = nextOccur.getFullYear() - targetDate.getFullYear();

        if (diffDays === 0) {
            return `🎉 <span style="color:#E76F51; font-weight:bold;">今天正日子！${totalYears}周年</span> 🎉`;
        } else if (diffDays === 1) {
            return `🎂 <span style="color:#F4A261; font-weight:bold;">明天就是啦！</span> 🎂`;
        } else {
            return `还有 <span style="color:#E76F51; font-weight:bold;">${diffDays}</span> 天 (第${totalYears}年)`;
        }
    }
}

async function loadAnniversaries() {
    const list = document.getElementById('anniversary-list');
    if (!list || !supabaseClient) return;

    // 🐾 只要一进函数，立刻把“正在计算...”刷掉，防止卡死显示
    list.innerHTML = '<p style="text-align:center; color:#888;">正在同步纪念日清单... 🚀</p>';

    const { data, error } = await supabaseClient.from('anniversaries').select('*');
    if (error) {
        list.innerHTML = '<p style="text-align:center; color:red;">加载失败了...</p>';
        return console.error(error);
    }
    
    if (!data || data.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#888;">目前还没有纪念日哦汪~</p>';
        return;
    }

    // 智能化排序：让快到的日子排在前面
    const sortedData = data.map(item => {
        // 临时算一下还有几天，用来做本地排序
        const today = new Date();
        today.setHours(0,0,0,0);
        const tDate = new Date(item.date + 'T00:00:00');
        let daysLeft = 9999;
        if(tDate && !isNaN(tDate.getTime())) {
            if(item.is_yearly) {
                let next = new Date(today.getFullYear(), tDate.getMonth(), tDate.getDate());
                if(next < today) next.setFullYear(today.getFullYear() + 1);
                daysLeft = Math.round((next - today) / (1000*60*60*24));
            } else {
                daysLeft = Math.ceil((tDate - today) / (1000*60*60*24));
                if(daysLeft < 0) daysLeft = 5000 + Math.abs(daysLeft); // 已过去的单次日子靠后排
            }
        }
        return { ...item, daysLeft };
    }).sort((a, b) => a.daysLeft - b.daysLeft);

    list.innerHTML = '';
    sortedData.forEach(item => {
        // 调用我们上方缝合的【智能倒计时大脑】
        const countdownText = calculateSmartCountdown(item.date, item.is_yearly);
        
        const div = document.createElement('div');
        div.className = "anniversary-details";
        div.style.cssText = "border-bottom: 2px dashed #2D2D2D; padding: 15px 0; margin-bottom: 5px; overflow: hidden;";
        div.innerHTML = `
            <div class="ann-item" style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="https://i.pinimg.com/736x/b2/4b/ab/b24babcb8298538e26c2425b699402a2.jpg" alt="icon" style="width:40px; height:40px; border-radius:50%;">
                    <div class="text" style="text-align:left;">
                        <p class="ann-title" style="margin:0; font-weight:bold; color:#2D2D2D;">${item.title}</p>
                        <p style="margin:4px 0 0 0; color: #888; font-size:12px;">
                            📅 初始日: ${item.date} ${item.is_yearly ? '<span style="color:#2A9D8F;">[每年过]</span>' : '<span style="color:#E76F51;">[过一次]</span>'}
                        </p>
                    </div>
                </div>
                <div style="text-align:right; font-weight:bold; font-size:14px;">
                    ${countdownText}
                </div>
            </div>
            <button onclick="deleteItem('anniversaries', ${item.id}, loadAnniversaries)" style="${deleteBtnStyle} margin-top: 5px;">删除 ✖</button>
        `;
        list.appendChild(div);
    });
}

const addAnnBtn = document.getElementById('add-ann-btn');
if (addAnnBtn) {
    addAnnBtn.addEventListener('click', async () => {
        if (!supabaseClient) return;
        const titleInput = document.getElementById('ann-input-title');
        const dateInput = document.getElementById('ann-input-date');
        if (!titleInput.value.trim() || !dateInput.value) return alert('请填全纪念日名称和日期！');
        await supabaseClient.from('anniversaries').insert([{ title: titleInput.value.trim(), date: dateInput.value }]);
        titleInput.value = ''; dateInput.value = '';
        loadAnniversaries();
    });
}

// ==================== 6. 美食探店功能 ====================
const noImagePlaceholder = "https://i.pinimg.com/736x/84/4c/02/844c02c8639038d394ccb7af8e7b74ba.jpg";

window.previewImage = function(input) {
    const previewContainer = document.getElementById('image-preview-container');
    const previewImage = document.getElementById('image-preview');
    const removeBtn = document.getElementById('remove-img-btn');
    const file = input.files[0];

    if (file) {
        isImageRemoved = false;
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            previewContainer.style.display = 'block';
            if(removeBtn) removeBtn.style.display = 'none'; 
        }
        reader.readAsDataURL(file);
    } else {
        if(!currentImageUrl || isImageRemoved) {
            previewContainer.style.display = 'none';
        }
    }
}

window.removeEditImage = function() {
    isImageRemoved = true; 
    currentImageUrl = ""; 
    document.getElementById("food-input-file").value = ""; 
    document.getElementById("image-preview-container").style.display = "none"; 
    document.getElementById('remove-img-btn').style.display = 'none';
}

async function loadFoods() {
    const list = document.getElementById('food-list');
    if (!list || !supabaseClient) return;
    list.innerHTML = '<p style="text-align:center; color:#888; width:100%;">正在加载美食库... ☁️</p>';
    const { data, error } = await supabaseClient.from('memories').select('id, url, caption, location, visit_date').order('id', { ascending: false });
    if (error) return console.error(error);
    allFoods = data || [];
    const countEl = document.getElementById('food-count');
    if (countEl) countEl.innerText = allFoods.length;
    searchFood();
}

function renderFoodList(foodsArray) {
    const list = document.getElementById('food-list');
    if (!list) return;
    list.innerHTML = '';
    if (foodsArray.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#999; width:100%; padding:20px;">🔍 没有找到相关的探店记录哦~</p>';
        return;
    }
    foodsArray.forEach(item => {
        let name = "未命名记忆", rating = "", comment = "", tag = "🍽️ 未分类";
        if (item.caption && item.caption.includes('||')) {
            const parts = item.caption.split('||');
            name = parts[0];
            rating = parts[1];
            comment = parts[2] || '';
            tag = parts[3] || '🍽️ 未分类';
        } else {
            comment = item.caption;
        }
        let location = item.location || '未知地点';
        let showDate = item.visit_date || '未知日期';

        const div = document.createElement('div');
        div.className = "photo-card card box-shadow";
        div.style.cssText = "display: flex; flex-direction: column; overflow: hidden; background: white; position: relative;";
        div.innerHTML = `
            <img src="${item.url}" alt="美食照片" class="photo-main" style="width:100%; height:150px; object-fit:cover; border-bottom: 2px solid #2D2D2D;" onerror="this.src='${noImagePlaceholder}'">
            <div style="padding: 12px; text-align: left; padding-bottom: 45px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <h3 style="margin: 0 0 5px 0; color: #FF4D4D; font-size: 16px;">${name}</h3>
                    <span style="background: #FFF0F2; color: #FF4D4D; padding: 2px 6px; border-radius: 8px; font-size: 10px; border: 1px solid #FF4D4D; white-space: nowrap;">${tag}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#555; margin-bottom: 5px;">
                    <span>📍 ${location}</span>
                    <span>📅 ${showDate}</span>
                </div>
                <p style="margin: 0 0 8px 0; font-size: 12px;">${rating}</p>
                <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.4; word-break: break-all;">${comment}</p>
                <div style="position: absolute; right: 10px; bottom: 10px; display: flex; gap: 5px;">
                    <button onclick="startEdit(${item.id})" style="background: #ECECEC; color: #2D2D2D; border: 2px solid #2D2D2D; padding: 2px 8px; border-radius: 12px; font-size: 12px; cursor: pointer; font-weight: bold;">✏️</button>
                    <button onclick="deleteItem('memories', ${item.id}, loadFoods)" style="background: #FFE4E6; color: #FF4D4D; border: 2px solid #2D2D2D; padding: 2px 8px; border-radius: 12px; font-size: 12px; cursor: pointer; font-weight: bold;">✖</button>
                </div>
            </div>
        `;
        list.appendChild(div);
    });
}

window.filterByTag = function(tagValue, btnElement) {
    currentSelectedTag = tagValue;
    const btns = document.querySelectorAll('.tag-filter-btn');
    btns.forEach(btn => { btn.style.background = 'white'; btn.style.color = '#2D2D2D'; });
    btnElement.style.background = '#FF4D4D';
    btnElement.style.color = 'white';
    searchFood();
}

window.searchFood = function() {
    const textEl = document.getElementById('search-food');
    const textKeyword = textEl ? textEl.value.toLowerCase().trim() : "";
    const dateEl = document.getElementById('search-date');
    const dateKeyword = dateEl ? dateEl.value : "";
    const ratingFilterEl = document.getElementById('search-rating');
    const ratingKeyword = ratingFilterEl ? ratingFilterEl.value : "All";

    const filtered = allFoods.filter(item => {
        let name = "未命名记忆", rating = "", comment = "", tag = "🍽️ 未分类";
        if (item.caption && item.caption.includes('||')) {
            const parts = item.caption.split('||');
            name = parts[0];
            rating = parts[1] || '';
            comment = parts[2] || '';
            tag = parts[3] || '🍽️ 未分类';
        } else { comment = item.caption || ""; }
        const location = item.location || '未知';
        const visitDate = item.visit_date || '';

        const matchesText = name.toLowerCase().includes(textKeyword) || comment.toLowerCase().includes(textKeyword) || location.toLowerCase().includes(textKeyword);
        const matchesDate = !dateKeyword || (visitDate === dateKeyword);
        const matchesTag = (currentSelectedTag === 'All') || (tag === currentSelectedTag);
        const matchesRating = (ratingKeyword === 'All') || (rating.trim() === ratingKeyword.trim());

        return matchesText && matchesDate && matchesTag && matchesRating;
    });
    renderFoodList(filtered);
}

window.startEdit = function(id) {
    const item = allFoods.find(f => f.id == id);
    if (!item) return;
    isImageRemoved = false; 
    let name = "未命名记忆", rating = "⭐⭐⭐⭐微 绝赞推荐！", comment = item.caption, tag = "🍱 正餐饱腹";
    if (item.caption && item.caption.includes('||')) {
        const parts = item.caption.split('||');
        name = parts[0]; rating = parts[1]; comment = parts[2] || ''; tag = parts[3] || '🍽️ 未分类';
    }
    document.getElementById("editing-id").value = item.id;
    document.getElementById("food-input-name").value = name;
    document.getElementById("food-input-location").value = item.location || "";
    document.getElementById("food-input-rating").value = rating;
    document.getElementById("food-input-comment").value = comment;
    
    const tagSelect = document.getElementById("food-input-tag");
    if(tagSelect && ![...tagSelect.options].map(o => o.value).includes(tag)) {
        tagSelect.innerHTML += `<option value="${tag}">${tag}</option>`;
    }
    if (tagSelect) tagSelect.value = tag;
    if(item.visit_date) document.getElementById("food-input-date").value = item.visit_date;

    currentImageUrl = item.url;
    const previewImg = document.getElementById("image-preview");
    const previewContainer = document.getElementById("image-preview-container");
    const removeBtn = document.getElementById('remove-img-btn');
    if (previewImg && previewContainer) {
        previewImg.src = item.url; previewContainer.style.display = "block";
        if(removeBtn) removeBtn.style.display = 'block';
    }
    const formTitle = document.getElementById("form-title");
    if (formTitle) { formTitle.innerHTML = `✏️ 正在修改：${name}`; formTitle.scrollIntoView({ behavior: 'smooth' }); }
    const addBtn = document.getElementById("add-food-btn");
    if (addBtn) addBtn.innerText = "保存修改 💾";
    const cancelBtn = document.getElementById("cancel-edit-btn");
    if (cancelBtn) cancelBtn.style.display = "block";
}

window.resetForm = function() {
    document.getElementById("editing-id").value = "";
    document.getElementById("food-input-name").value = "";
    document.getElementById("food-input-location").value = "";
    document.getElementById("food-input-comment").value = "";
    document.getElementById("food-input-file").value = "";
    const tagSelect = document.getElementById("food-input-tag");
    if (tagSelect) tagSelect.value = "🍱 正餐饱腹";
    const previewContainer = document.getElementById("image-preview-container");
    if (previewContainer) previewContainer.style.display = "none";
    currentImageUrl = ""; isImageRemoved = false; 
    const dateInput = document.getElementById("food-input-date");
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    const formTitle = document.getElementById("form-title");
    if (formTitle) formTitle.innerHTML = `<img src="https://img.icons8.com/emoji/48/000000/hamburger-emoji.png" alt="icon"> 记录新探店`;
    const addBtn = document.getElementById("add-food-btn");
    if (addBtn) addBtn.innerText = "收录进美食局 🍔";
    const cancelBtn = document.getElementById("cancel-edit-btn");
    if (cancelBtn) cancelBtn.style.display = "none";
}

const addFoodBtn = document.getElementById('add-food-btn');
if (addFoodBtn) {
    addFoodBtn.addEventListener('click', async () => {
        if (!supabaseClient) return alert('云端未连接');
        const editingId = document.getElementById('editing-id').value;
        const nameInput = document.getElementById('food-input-name');
        const locationInput = document.getElementById('food-input-location'); 
        const ratingInput = document.getElementById('food-input-rating');
        const tagInput = document.getElementById('food-input-tag'); 
        const fileInput = document.getElementById('food-input-file'); 
        const commentInput = document.getElementById('food-input-comment');
        const dateInput = document.getElementById('food-input-date');
        
        let name = nameInput.value.trim();
        let location = locationInput.value.trim();
        let comment = commentInput.value.trim();
        let visitDate = dateInput.value;
        let file = fileInput.files[0];
        let tag = tagInput ? tagInput.value : "🍽️ 未分类";
        let rating = ratingInput ? ratingInput.value : "";
        
        if (!name) return alert('店名不能为空哦！');
        if (!location) return alert('📍 给探店局加个地点吧！');
        if (!comment) return alert('随便写点干饭评价吧汪~');
        if (!visitDate) return alert('📅 别忘了选择探店日期哦！');
        if (!editingId && !file) return alert('📷 请上传一张诱人的美食照片吧！汪！');

        addFoodBtn.innerText = editingId ? "正在保存修改... 💾" : "上传照片并收录中... 🕊️";
        addFoodBtn.disabled = true;
        let finalImageUrl = currentImageUrl; 

        try {
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;     
                const { data: uploadData, error: uploadError } = await supabaseClient.storage.from('Food').upload(fileName, file);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabaseClient.storage.from('Food').getPublicUrl(fileName);
                finalImageUrl = publicUrl; isImageRemoved = false;
            } else if (editingId && isImageRemoved) { finalImageUrl = noImagePlaceholder; }

            let combinedCaption = `${name}||${rating}||${comment}||${tag}`;
            const dbData = { url: finalImageUrl, caption: combinedCaption, location: location, visit_date: visitDate };

            if (editingId) {
                await supabaseClient.from('memories').update(dbData).eq('id', editingId);
                alert('🎉 修改成功！美食记录已悄悄更新！');
            } else {
                await supabaseClient.from('memories').insert([dbData]);
                alert('🍔 成功收录进美食局！小狗奖励你一根骨头！');
            }
            resetForm(); loadFoods();
        } catch (uploadError) {
            console.error(uploadError); alert('❌ 操作失败，请检查云端设置。');
        } finally {
            addFoodBtn.innerText = "收录进美食局 🍔"; addFoodBtn.disabled = false;
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
        await supabaseClient.from('wishes').insert([{ text: "razem 一起去海边看日出 🌅", checked: true }, { text: "养一只属于我们的小狗 🐶", checked: true }]);
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
        if (!supabaseClient) return;
        const input = document.getElementById('wish-input');
        if (!input.value.trim()) return alert('心愿不能为空哦！');
        await supabaseClient.from('wishes').insert([{ text: input.value.trim(), checked: false }]);
        input.value = ''; loadWishes();
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

function escapeMem(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function parseFoodCaption(item) {
    let name = '未命名记忆', comment = '', location = item.location || '';
    if (item.caption && item.caption.includes('||')) {
        const parts = item.caption.split('||');
        name = parts[0];
        comment = parts[2] || '';
    } else {
        comment = item.caption || '';
    }
    return { name, comment, location };
}

window.loadRandomMemory = async function () {
    const card = document.getElementById('random-memory-card');
    if (!card || !supabaseClient) return;
    card.innerHTML = '<p style="text-align:center;color:#888;">正在翻旧相册... 🐾</p>';

    const [diariesRes, foodsRes, wishesRes] = await Promise.all([
        supabaseClient.from('diaries').select('*'),
        supabaseClient.from('memories').select('*'),
        supabaseClient.from('wishes').select('*').eq('checked', true)
    ]);

    const pool = [];
    (diariesRes.data || []).forEach((item) => {
        pool.push({
            key: 'diary-' + item.id,
            kind: '日记',
            html: `<span class="memory-kind">📒 日记</span>
                <p style="margin:0;color:#888;font-size:13px;">${escapeMem(item.date || '')}</p>
                <p style="margin:8px 0 0;line-height:1.6;white-space:pre-wrap;">${escapeMem(item.text)}</p>`
        });
    });
    (foodsRes.data || []).forEach((item) => {
        const parsed = parseFoodCaption(item);
        const img = item.url
            ? `<img src="${item.url}" alt="探店" style="width:100%;border-radius:12px;border:2px solid #2D2D2D;margin-top:10px;">`
            : '';
        pool.push({
            key: 'food-' + item.id,
            kind: '探店',
            html: `<span class="memory-kind">🍔 探店</span>
                <p style="margin:0;font-weight:bold;font-size:18px;">${escapeMem(parsed.name)}</p>
                <p style="margin:4px 0 0;color:#888;font-size:13px;">📍 ${escapeMem(parsed.location)} · ${escapeMem(item.visit_date || '')}</p>
                <p style="margin:8px 0 0;line-height:1.5;">${escapeMem(parsed.comment)}</p>
                ${img}`
        });
    });
    (wishesRes.data || []).forEach((item) => {
        pool.push({
            key: 'wish-' + item.id,
            kind: '心愿',
            html: `<span class="memory-kind">🌟 已实现的心愿</span>
                <p style="margin:8px 0 0;font-size:18px;line-height:1.5;">${escapeMem(item.text)}</p>`
        });
    });

    if (pool.length === 0) {
        card.innerHTML = '<p style="text-align:center;color:#888;">回忆盒还是空的，先去写日记、探店或勾上一个心愿吧 ✨</p>';
        return;
    }

    let pick = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1) {
        let guard = 0;
        while (pick.key === lastMemoryKey && guard < 8) {
            pick = pool[Math.floor(Math.random() * pool.length)];
            guard++;
        }
    }
    lastMemoryKey = pick.key;
    card.innerHTML = pick.html;
};

document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'reshuffle-memory-btn') {
        loadRandomMemory();
    }
});