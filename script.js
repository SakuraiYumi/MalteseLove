// ==================== 【防御层 1】小狗爪特效强制启动 ====================
(function() {
    if (window.hasPawEffectLoaded) return;
    window.hasPawEffectLoaded = true;

    document.addEventListener('mousemove', function(e) {
        if (document.getElementById('auth-lock')) return;
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

function escapeFood(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function parseFoodItem(item) {
    let name = '未命名记忆', rating = '', comment = '', tag = '🍽️ 未分类';
    if (item.caption && item.caption.includes('||')) {
        const parts = item.caption.split('||');
        name = parts[0];
        rating = parts[1] || '';
        comment = parts[2] || '';
        tag = parts[3] || '🍽️ 未分类';
    } else {
        comment = item.caption || '';
    }
    return {
        ...item,
        name,
        rating,
        comment,
        tag,
        location: item.location || '未知地点',
        visit_date: item.visit_date || ''
    };
}

function normalizeShopText(text) {
    return String(text || '').trim().replace(/\s+/g, '').toLowerCase();
}

function shopKey(name, location) {
    return `${normalizeShopText(name)}|${normalizeShopText(location)}`;
}

function ratingScore(rating) {
    return (String(rating || '').match(/⭐/g) || []).length;
}

function averageScore(visits) {
    const scores = visits.map((v) => ratingScore(v.rating)).filter((n) => n > 0);
    if (!scores.length) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function formatAvg(avg) {
    return avg.toFixed(1).replace(/\.0$/, '');
}

function visitNumber(shop, item) {
    const chrono = [...shop.visits].sort((a, b) => {
        const dateCmp = String(a.visit_date || '').localeCompare(String(b.visit_date || ''));
        return dateCmp !== 0 ? dateCmp : (a.id || 0) - (b.id || 0);
    });
    return chrono.findIndex((v) => v.id === item.id) + 1;
}

function groupFoodShops(items) {
    const groups = new Map();
    (items || []).forEach((raw) => {
        const item = parseFoodItem(raw);
        const key = shopKey(item.name, item.location);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(item);
    });
    const shops = [];
    groups.forEach((visits) => {
        visits.sort((a, b) => {
            const dateCmp = String(b.visit_date || '').localeCompare(String(a.visit_date || ''));
            return dateCmp !== 0 ? dateCmp : (b.id || 0) - (a.id || 0);
        });
        shops.push({
            name: visits[0].name,
            location: visits[0].location,
            tag: visits[0].tag,
            visits,
            avg: averageScore(visits)
        });
    });
    shops.sort((a, b) => (b.visits[0].id || 0) - (a.visits[0].id || 0));
    return shops;
}

function fillShopNameList() {
    const list = document.getElementById('food-shop-names');
    if (!list) return;
    const names = [...new Set(groupFoodShops(allFoods).map((shop) => shop.name))];
    list.innerHTML = names.map((name) => `<option value="${escapeFood(name)}"></option>`).join('');
}

function findMatchingShop(name, location) {
    const nameKey = normalizeShopText(name);
    if (!nameKey) return null;
    const shops = groupFoodShops(allFoods).filter((shop) => normalizeShopText(shop.name) === nameKey);
    if (!shops.length) return null;
    if (location) {
        const locKey = normalizeShopText(location);
        return shops.find((shop) => normalizeShopText(shop.location) === locKey) || null;
    }
    return shops[0];
}

window.updateRevisitHint = function () {
    const hint = document.getElementById('food-revisit-hint');
    const addBtn = document.getElementById('add-food-btn');
    const editingId = document.getElementById('editing-id') ? document.getElementById('editing-id').value : '';
    if (!hint) return;
    if (editingId) {
        hint.hidden = true;
        return;
    }
    const nameInput = document.getElementById('food-input-name');
    const locationInput = document.getElementById('food-input-location');
    const name = nameInput ? nameInput.value.trim() : '';
    const location = locationInput ? locationInput.value.trim() : '';
    const shop = findMatchingShop(name, location);
    if (!shop) {
        hint.hidden = true;
        if (addBtn) addBtn.innerText = '收录进美食局 🍔';
        return;
    }
    const n = shop.visits.length;
    hint.hidden = false;
    hint.innerHTML = `这家店已经来过 <b>${n}</b> 次，平均 <b>${formatAvg(shop.avg)}</b> 星。这次会记成第 ${n + 1} 次，评价和照片都会另外存一份。`;
    if (addBtn) addBtn.innerText = `记第 ${n + 1} 次探店 🍔`;
};

function maybeAutofillKnownShop() {
    const editingId = document.getElementById('editing-id');
    if (editingId && editingId.value) return;
    const nameInput = document.getElementById('food-input-name');
    const locationInput = document.getElementById('food-input-location');
    const tagSelect = document.getElementById('food-input-tag');
    if (!nameInput || !locationInput) return;
    const shop = findMatchingShop(nameInput.value.trim(), locationInput.value.trim());
    if (!shop) {
        window.updateRevisitHint();
        return;
    }
    if (!locationInput.value.trim() && shop.location && shop.location !== '未知地点') {
        locationInput.value = shop.location;
    }
    if (tagSelect && shop.tag && [...tagSelect.options].some((o) => o.value === shop.tag)) {
        tagSelect.value = shop.tag;
    }
    window.updateRevisitHint();
}

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
    const shops = groupFoodShops(allFoods);
    const countEl = document.getElementById('food-count');
    if (countEl) countEl.innerText = shops.length;
    const visitCountEl = document.getElementById('food-visit-count');
    if (visitCountEl) visitCountEl.innerText = allFoods.length;
    fillShopNameList();
    const dateParam = new URLSearchParams(location.search).get('date');
    if (dateParam) {
        const dateEl = document.getElementById('search-date');
        if (dateEl) dateEl.value = dateParam;
    }
    searchFood();
}

function renderFoodList(shops) {
    const list = document.getElementById('food-list');
    if (!list) return;
    list.innerHTML = '';
    if (shops.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#999; width:100%; padding:20px;">🔍 没有找到相关的探店记录哦~</p>';
        return;
    }
    shops.forEach((shop) => {
        const latest = shop.visits[0];
        const multi = shop.visits.length > 1;
        const scoreLine = multi
            ? `⭐ 平均 ${formatAvg(shop.avg)} 星 · 来过 ${shop.visits.length} 次`
            : latest.rating;
        const visitsHtml = shop.visits.map((item) => {
            const nth = visitNumber(shop, item);
            const photo = item.url
                ? `<img src="${escapeFood(item.url)}" alt="第${nth}次照片" class="photo-main food-visit-photo" onerror="this.src='${noImagePlaceholder}'">`
                : '';
            return `
                <div class="food-visit">
                    <div class="food-visit-head">
                        <span>第 ${nth} 次 · 📅 ${escapeFood(item.visit_date || '未知日期')}</span>
                        <span>${escapeFood(item.rating)}</span>
                    </div>
                    ${photo}
                    <p class="food-visit-comment">${escapeFood(item.comment)}</p>
                    <div class="food-visit-actions">
                        <button type="button" onclick="startEdit(${item.id})" style="background: #ECECEC; color: #2D2D2D; border: 2px solid #2D2D2D; padding: 2px 8px; border-radius: 12px; font-size: 12px; cursor: pointer; font-weight: bold;">✏️</button>
                        <button type="button" onclick="deleteItem('memories', ${item.id}, loadFoods)" style="background: #FFE4E6; color: #FF4D4D; border: 2px solid #2D2D2D; padding: 2px 8px; border-radius: 12px; font-size: 12px; cursor: pointer; font-weight: bold;">✖</button>
                    </div>
                </div>
            `;
        }).join('');

        const div = document.createElement('div');
        div.className = 'photo-card card box-shadow food-shop-card';
        div.innerHTML = `
            <div class="food-shop-head">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                    <h3 style="margin: 0 0 5px 0; color: #FF4D4D; font-size: 16px;">${escapeFood(shop.name)}</h3>
                    <span style="background: #FFF0F2; color: #FF4D4D; padding: 2px 6px; border-radius: 8px; font-size: 10px; border: 1px solid #FF4D4D; white-space: nowrap;">${escapeFood(shop.tag)}</span>
                </div>
                <div style="font-size:12px; color:#555; margin-bottom: 4px;">
                    <span>📍 ${escapeFood(shop.location)}</span>
                </div>
                <p class="food-avg-score">${escapeFood(scoreLine)}</p>
            </div>
            ${visitsHtml}
            <button type="button" class="food-revisit-btn" onclick="revisitShop(${latest.id})">再探这家 🍔</button>
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

    const filtered = groupFoodShops(allFoods).filter((shop) => {
        const blob = [shop.name, shop.location, shop.tag, ...shop.visits.map((v) => `${v.comment} ${v.rating} ${v.visit_date}`)]
            .join(' ')
            .toLowerCase();
        const matchesText = blob.includes(textKeyword);
        const matchesDate = !dateKeyword || shop.visits.some((v) => v.visit_date === dateKeyword);
        const matchesTag = currentSelectedTag === 'All' || shop.visits.some((v) => v.tag === currentSelectedTag);
        const filterStars = ratingScore(ratingKeyword);
        const matchesRating = ratingKeyword === 'All'
            || Math.round(shop.avg) === filterStars
            || shop.visits.some((v) => (v.rating || '').trim() === ratingKeyword.trim());
        return matchesText && matchesDate && matchesTag && matchesRating;
    });
    renderFoodList(filtered);
}

window.startEdit = function(id) {
    const item = allFoods.find(f => f.id == id);
    if (!item) return;
    isImageRemoved = false;
    const parsed = parseFoodItem(item);
    document.getElementById("editing-id").value = item.id;
    document.getElementById("food-input-name").value = parsed.name;
    document.getElementById("food-input-location").value = parsed.location === '未知地点' ? '' : parsed.location;
    document.getElementById("food-input-rating").value = parsed.rating;
    document.getElementById("food-input-comment").value = parsed.comment;

    const tagSelect = document.getElementById("food-input-tag");
    if(tagSelect && ![...tagSelect.options].map(o => o.value).includes(parsed.tag)) {
        tagSelect.innerHTML += `<option value="${escapeFood(parsed.tag)}">${escapeFood(parsed.tag)}</option>`;
    }
    if (tagSelect) tagSelect.value = parsed.tag;
    if(item.visit_date) document.getElementById("food-input-date").value = item.visit_date;

    currentImageUrl = item.url;
    const previewImg = document.getElementById("image-preview");
    const previewContainer = document.getElementById("image-preview-container");
    const removeBtn = document.getElementById('remove-img-btn');
    if (previewImg && previewContainer) {
        previewImg.src = item.url; previewContainer.style.display = "block";
        if(removeBtn) removeBtn.style.display = 'block';
    }
    const shop = groupFoodShops(allFoods).find((s) => shopKey(s.name, s.location) === shopKey(parsed.name, parsed.location));
    const nth = shop ? visitNumber(shop, parsed) : 1;
    const formTitle = document.getElementById("form-title");
    if (formTitle) { formTitle.innerHTML = `✏️ 正在修改：${escapeFood(parsed.name)}（第 ${nth} 次）`; formTitle.scrollIntoView({ behavior: 'smooth' }); }
    const addBtn = document.getElementById("add-food-btn");
    if (addBtn) addBtn.innerText = "保存修改 💾";
    const cancelBtn = document.getElementById("cancel-edit-btn");
    if (cancelBtn) cancelBtn.style.display = "block";
    window.updateRevisitHint();
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
    window.updateRevisitHint();
}

window.revisitShop = function (id) {
    const item = allFoods.find((f) => f.id == id);
    if (!item) return;
    resetForm();
    const parsed = parseFoodItem(item);
    document.getElementById('food-input-name').value = parsed.name;
    document.getElementById('food-input-location').value = parsed.location === '未知地点' ? '' : parsed.location;
    const tagSelect = document.getElementById('food-input-tag');
    if (tagSelect && parsed.tag && [...tagSelect.options].some((o) => o.value === parsed.tag)) {
        tagSelect.value = parsed.tag;
    }
    const formTitle = document.getElementById('form-title');
    if (formTitle) formTitle.innerHTML = `🍔 再探：${escapeFood(parsed.name)}`;
    window.updateRevisitHint();
    const form = document.getElementById('form-title');
    if (form) form.scrollIntoView({ behavior: 'smooth' });
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
                const existed = findMatchingShop(name, location);
                await supabaseClient.from('memories').insert([dbData]);
                if (existed) {
                    const times = existed.visits.length + 1;
                    const newAvg = averageScore([...existed.visits, { rating }]);
                    alert(`🍔 第 ${times} 次探店已记下！现在平均 ${formatAvg(newAvg)} 星。`);
                } else {
                    alert('🍔 成功收录进美食局！小狗奖励你一根骨头！');
                }
            }
            resetForm(); loadFoods();
        } catch (uploadError) {
            console.error(uploadError); alert('❌ 操作失败，请检查云端设置。');
        } finally {
            addFoodBtn.disabled = false;
            if (!document.getElementById('editing-id').value) window.updateRevisitHint();
            else addFoodBtn.innerText = '保存修改 💾';
        }
    });
}

const foodNameInput = document.getElementById('food-input-name');
const foodLocationInput = document.getElementById('food-input-location');
if (foodNameInput) {
    foodNameInput.addEventListener('input', window.updateRevisitHint);
    foodNameInput.addEventListener('change', maybeAutofillKnownShop);
    foodNameInput.addEventListener('blur', maybeAutofillKnownShop);
}
if (foodLocationInput) {
    foodLocationInput.addEventListener('input', window.updateRevisitHint);
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
        div.className = 'wish-row' + (item.checked ? ' is-done' : '');
        div.dataset.wishId = String(item.id);
        const badge = item.checked ? '<span class="wish-done-badge">已完成</span>' : '';
        div.innerHTML = `<label style="display: flex; align-items: center; cursor: pointer; flex: 1; gap: 8px;">
            <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleWish(${item.id}, ${item.checked})" style="transform: scale(1.3); accent-color: #FF879A;">
            <span class="wish-text">${escapeMem(item.text)}</span>
            ${badge}
        </label><button onclick="deleteItem('wishes', ${item.id}, loadWishes)" style="${deleteBtnStyle} float: none; margin-left: 10px;">删除 ✖</button>`;
        list.appendChild(div);
    });
}

function playWishBurst(row) {
    if (!row) return;
    row.classList.add('wish-burst');
    const marks = ['✨', '💖', '🐾', '⭐', '✨', '💖'];
    marks.forEach((mark, i) => {
        const spark = document.createElement('span');
        spark.className = 'wish-spark';
        spark.textContent = mark;
        const angle = (Math.PI * 2 * i) / marks.length;
        spark.style.setProperty('--dx', Math.cos(angle) * 36 + 'px');
        spark.style.setProperty('--dy', (Math.sin(angle) * 28 - 12) + 'px');
        row.appendChild(spark);
        setTimeout(() => spark.remove(), 800);
    });
    setTimeout(() => row.classList.remove('wish-burst'), 800);
}

window.toggleWish = async function(id, currentStatus) {
    if (!supabaseClient) return;
    const turningOn = !currentStatus;
    const row = document.querySelector(`[data-wish-id="${id}"]`);
    await supabaseClient.from('wishes').update({ checked: turningOn }).eq('id', id);
    if (turningOn) {
        playWishBurst(row);
        setTimeout(loadWishes, 720);
    } else {
        loadWishes();
    }
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

    const [diariesRes, foodsRes, wishesRes, checkinsRes] = await Promise.all([
        supabaseClient.from('diaries').select('*'),
        supabaseClient.from('memories').select('*'),
        supabaseClient.from('wishes').select('*').eq('checked', true),
        supabaseClient.from('checkins').select('*').eq('status', 'done')
    ]);

    const pool = [];
    (diariesRes.data || []).forEach((item) => {
        const img = item.photo_url
            ? `<img src="${escapeMem(item.photo_url)}" alt="日记" class="memory-photo">`
            : '';
        pool.push({
            key: 'diary-' + item.id,
            kind: '日记',
            html: `<span class="memory-kind">📒 日记</span>
                <p style="margin:0;color:#888;font-size:13px;">${escapeMem(item.date || '')}</p>
                <p style="margin:8px 0 0;line-height:1.6;white-space:pre-wrap;">${escapeMem(item.text)}</p>
                ${img}`
        });
    });
    (foodsRes.data || []).forEach((item) => {
        const parsed = parseFoodCaption(item);
        const img = item.url
            ? `<img src="${item.url}" alt="探店" class="memory-photo">`
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
    (checkinsRes.data || []).forEach((item) => {
        const img = item.photo_url
            ? `<img src="${escapeMem(item.photo_url)}" alt="打卡" class="memory-photo">`
            : '';
        const when = item.happen_at ? String(item.happen_at).slice(0, 10) : '';
        pool.push({
            key: 'checkin-' + item.id,
            kind: '打卡',
            html: `<span class="memory-kind">📍 打卡</span>
                <p style="margin:0;font-weight:bold;font-size:18px;">${escapeMem(item.place_name || '地图上的一个点')}</p>
                <p style="margin:4px 0 0;color:#888;font-size:13px;">${escapeMem(item.category || '')} · ${escapeMem(when)}</p>
                ${item.note ? `<p style="margin:8px 0 0;line-height:1.5;">${escapeMem(item.note)}</p>` : ''}
                ${img}`
        });
    });

    if (pool.length === 0) {
        card.innerHTML = '<p style="text-align:center;color:#888;">回忆盒还是空的，先去写日记、探店、打卡或勾上一个心愿吧 ✨</p>';
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