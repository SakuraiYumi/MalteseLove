const HOTEL_PLACEHOLDER = 'https://img.icons8.com/emoji/96/000000/bed-emoji.png';

let allHotels = [];
let hotelImageUrl = '';
let hotelImageRemoved = false;
let hotelSelectedTag = 'All';

function escapeHotel(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function normalizeHotelText(text) {
    return String(text || '').trim().replace(/\s+/g, '').toLowerCase();
}

function hotelKey(name, location) {
    return `${normalizeHotelText(name)}|${normalizeHotelText(location)}`;
}

function hotelRatingScore(rating) {
    return (String(rating || '').match(/⭐/g) || []).length;
}

function hotelAverage(visits) {
    const scores = visits.map((v) => hotelRatingScore(v.rating)).filter((n) => n > 0);
    if (!scores.length) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function formatHotelAvg(avg) {
    return avg.toFixed(1).replace(/\.0$/, '');
}

function hotelVisitNumber(shop, item) {
    const chrono = [...shop.visits].sort((a, b) => {
        const dateCmp = String(a.visit_date || '').localeCompare(String(b.visit_date || ''));
        return dateCmp !== 0 ? dateCmp : (a.id || 0) - (b.id || 0);
    });
    return chrono.findIndex((v) => v.id === item.id) + 1;
}

function normalizeHotel(item) {
    return {
        ...item,
        name: item.name || '未命名酒店',
        location: item.location || '未知地点',
        visit_date: item.visit_date || '',
        tag: item.tag || '🏨 酒店',
        rating: item.rating || '',
        comment: item.comment || '',
        photo_url: item.photo_url || ''
    };
}

function groupHotels(items) {
    const groups = new Map();
    (items || []).forEach((raw) => {
        const item = normalizeHotel(raw);
        const key = hotelKey(item.name, item.location);
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
            avg: hotelAverage(visits)
        });
    });
    shops.sort((a, b) => (b.visits[0].id || 0) - (a.visits[0].id || 0));
    return shops;
}

function fillHotelNameList() {
    const list = document.getElementById('hotel-names');
    if (!list) return;
    const names = [...new Set(groupHotels(allHotels).map((shop) => shop.name))];
    list.innerHTML = names.map((name) => `<option value="${escapeHotel(name)}"></option>`).join('');
}

function findMatchingHotel(name, location) {
    const nameKey = normalizeHotelText(name);
    if (!nameKey) return null;
    const shops = groupHotels(allHotels).filter((shop) => normalizeHotelText(shop.name) === nameKey);
    if (!shops.length) return null;
    if (location) {
        const locKey = normalizeHotelText(location);
        return shops.find((shop) => normalizeHotelText(shop.location) === locKey) || null;
    }
    return shops[0];
}

function updateHotelHint() {
    const hint = document.getElementById('hotel-revisit-hint');
    const addBtn = document.getElementById('add-hotel-btn');
    const editingId = document.getElementById('hotel-editing-id') ? document.getElementById('hotel-editing-id').value : '';
    if (!hint) return;
    if (editingId) {
        hint.hidden = true;
        return;
    }
    const name = (document.getElementById('hotel-input-name').value || '').trim();
    const location = (document.getElementById('hotel-input-location').value || '').trim();
    const shop = findMatchingHotel(name, location);
    if (!shop) {
        hint.hidden = true;
        if (addBtn) addBtn.textContent = '收录进酒店局 🏨';
        return;
    }
    const n = shop.visits.length;
    hint.hidden = false;
    hint.innerHTML = `这家已经住过 <b>${n}</b> 次，平均 <b>${formatHotelAvg(shop.avg)}</b> 星。这次会记成第 ${n + 1} 次，评价和照片都会另外存一份。`;
    if (addBtn) addBtn.textContent = `记第 ${n + 1} 次入住 🏨`;
}

function maybeAutofillHotel() {
    const editingId = document.getElementById('hotel-editing-id');
    if (editingId && editingId.value) return;
    const nameInput = document.getElementById('hotel-input-name');
    const locationInput = document.getElementById('hotel-input-location');
    const tagSelect = document.getElementById('hotel-input-tag');
    const shop = findMatchingHotel(nameInput.value.trim(), locationInput.value.trim());
    if (!shop) {
        updateHotelHint();
        return;
    }
    if (!locationInput.value.trim() && shop.location && shop.location !== '未知地点') {
        locationInput.value = shop.location;
    }
    if (tagSelect && [...tagSelect.options].some((o) => o.value === shop.tag)) {
        tagSelect.value = shop.tag;
    }
    updateHotelHint();
}

function showHotelPreview(src, showRemove) {
    const box = document.getElementById('hotel-preview-box');
    const img = document.getElementById('hotel-preview');
    const removeBtn = document.getElementById('hotel-remove-img');
    img.src = src;
    box.style.display = 'block';
    removeBtn.style.display = showRemove ? 'block' : 'none';
}

function hideHotelPreview() {
    document.getElementById('hotel-preview-box').style.display = 'none';
    document.getElementById('hotel-preview').src = '';
    document.getElementById('hotel-input-file').value = '';
    document.getElementById('hotel-remove-img').style.display = 'none';
}

function renderHotels(shops) {
    const list = document.getElementById('hotel-list');
    if (!list) return;
    if (!shops.length) {
        list.innerHTML = '<p style="text-align:center; color:#999; width:100%; padding:20px;">🔍 没有找到相关的入住记录哦~</p>';
        return;
    }
    list.innerHTML = shops.map((shop) => {
        const latest = shop.visits[0];
        const multi = shop.visits.length > 1;
        const scoreLine = multi
            ? `⭐ 平均 ${formatHotelAvg(shop.avg)} 星 · 住过 ${shop.visits.length} 次`
            : latest.rating;
        const visitsHtml = shop.visits.map((item) => {
            const nth = hotelVisitNumber(shop, item);
            const photo = item.photo_url
                ? `<img src="${escapeHotel(item.photo_url)}" alt="第${nth}次照片" class="hotel-stay-photo" onerror="this.src='${HOTEL_PLACEHOLDER}'">`
                : '';
            return `
                <div class="food-visit">
                    <div class="food-visit-head">
                        <span>第 ${nth} 次 · 📅 ${escapeHotel(item.visit_date || '未知日期')}</span>
                        <span>${escapeHotel(item.rating)}</span>
                    </div>
                    ${photo}
                    <p class="food-visit-comment">${escapeHotel(item.comment)}</p>
                    <div class="food-visit-actions">
                        <button type="button" data-edit="${item.id}" style="background: #ECECEC; color: #2D2D2D; border: 2px solid #2D2D2D; padding: 2px 8px; border-radius: 12px; font-size: 12px; cursor: pointer; font-weight: bold;">✏️</button>
                        <button type="button" data-delete="${item.id}" style="background: #FFE4E6; color: #FF4D4D; border: 2px solid #2D2D2D; padding: 2px 8px; border-radius: 12px; font-size: 12px; cursor: pointer; font-weight: bold;">✖</button>
                    </div>
                </div>
            `;
        }).join('');
        return `
            <div class="photo-card card box-shadow food-shop-card">
                <div class="food-shop-head">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                        <h3 style="margin: 0 0 5px 0; color: #FF4D4D; font-size: 16px;">${escapeHotel(shop.name)}</h3>
                        <span style="background: #FFF0F2; color: #FF4D4D; padding: 2px 6px; border-radius: 8px; font-size: 10px; border: 1px solid #FF4D4D; white-space: nowrap;">${escapeHotel(shop.tag)}</span>
                    </div>
                    <div style="font-size:12px; color:#555; margin-bottom: 4px;">📍 ${escapeHotel(shop.location)}</div>
                    <p class="food-avg-score">${escapeHotel(scoreLine)}</p>
                </div>
                ${visitsHtml}
                <button type="button" class="food-revisit-btn" data-revisit="${latest.id}">再住这家 🏨</button>
            </div>
        `;
    }).join('');
}

function searchHotels() {
    const textKeyword = (document.getElementById('search-hotel').value || '').toLowerCase().trim();
    const dateKeyword = document.getElementById('search-hotel-date').value;
    const ratingKeyword = document.getElementById('search-hotel-rating').value;
    const filtered = groupHotels(allHotels).filter((shop) => {
        const blob = [shop.name, shop.location, shop.tag, ...shop.visits.map((v) => `${v.comment} ${v.rating} ${v.visit_date}`)]
            .join(' ')
            .toLowerCase();
        const matchesText = blob.includes(textKeyword);
        const matchesDate = !dateKeyword || shop.visits.some((v) => v.visit_date === dateKeyword);
        const matchesTag = hotelSelectedTag === 'All' || shop.visits.some((v) => v.tag === hotelSelectedTag);
        const filterStars = hotelRatingScore(ratingKeyword);
        const matchesRating = ratingKeyword === 'All'
            || Math.round(shop.avg) === filterStars
            || shop.visits.some((v) => (v.rating || '').trim() === ratingKeyword.trim());
        return matchesText && matchesDate && matchesTag && matchesRating;
    });
    renderHotels(filtered);
}

async function loadHotels() {
    const list = document.getElementById('hotel-list');
    const client = window.supabaseClient;
    if (!list || !client) return;
    list.innerHTML = '<p style="text-align:center; color:#888; width:100%;">正在加载酒店库... ☁️</p>';
    const { data, error } = await client.from('hotels').select('*').order('id', { ascending: false });
    if (error) {
        list.innerHTML = `<p style="text-align:center;color:#FF4D4D;width:100%;">加载失败：${escapeHotel(error.message)}<br>如果是缺表，把 supabase-setup.sql 末尾的酒店那段在控制台跑一遍。</p>`;
        return;
    }
    allHotels = data || [];
    document.getElementById('hotel-count').textContent = String(groupHotels(allHotels).length);
    document.getElementById('hotel-visit-count').textContent = String(allHotels.length);
    fillHotelNameList();
    searchHotels();
}

function resetHotelForm() {
    document.getElementById('hotel-editing-id').value = '';
    document.getElementById('hotel-input-name').value = '';
    document.getElementById('hotel-input-location').value = '';
    document.getElementById('hotel-input-comment').value = '';
    document.getElementById('hotel-input-tag').value = '🏨 酒店';
    document.getElementById('hotel-input-rating').value = '⭐⭐⭐⭐⭐ 夯';
    document.getElementById('hotel-input-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('hotel-form-title').textContent = '🏨 记录新入住';
    document.getElementById('hotel-cancel-btn').style.display = 'none';
    hotelImageUrl = '';
    hotelImageRemoved = false;
    hideHotelPreview();
    updateHotelHint();
}

function startHotelEdit(id) {
    const item = allHotels.find((row) => row.id == id);
    if (!item) return;
    const parsed = normalizeHotel(item);
    const shop = groupHotels(allHotels).find((s) => hotelKey(s.name, s.location) === hotelKey(parsed.name, parsed.location));
    const nth = shop ? hotelVisitNumber(shop, parsed) : 1;
    document.getElementById('hotel-editing-id').value = item.id;
    document.getElementById('hotel-input-name').value = parsed.name;
    document.getElementById('hotel-input-location').value = parsed.location === '未知地点' ? '' : parsed.location;
    document.getElementById('hotel-input-rating').value = parsed.rating || '⭐⭐⭐⭐⭐ 夯';
    document.getElementById('hotel-input-comment').value = parsed.comment;
    document.getElementById('hotel-input-date').value = parsed.visit_date || '';
    const tagSelect = document.getElementById('hotel-input-tag');
    if (![...tagSelect.options].some((o) => o.value === parsed.tag)) {
        tagSelect.insertAdjacentHTML('beforeend', `<option value="${escapeHotel(parsed.tag)}">${escapeHotel(parsed.tag)}</option>`);
    }
    tagSelect.value = parsed.tag;
    hotelImageUrl = parsed.photo_url;
    hotelImageRemoved = false;
    if (hotelImageUrl) showHotelPreview(hotelImageUrl, true);
    else hideHotelPreview();
    document.getElementById('hotel-form-title').textContent = `正在修改：${parsed.name}（第 ${nth} 次）`;
    document.getElementById('add-hotel-btn').textContent = '保存修改 💾';
    document.getElementById('hotel-cancel-btn').style.display = 'block';
    updateHotelHint();
    document.getElementById('hotel-form-title').scrollIntoView({ behavior: 'smooth' });
}

function revisitHotel(id) {
    const item = allHotels.find((row) => row.id == id);
    if (!item) return;
    resetHotelForm();
    const parsed = normalizeHotel(item);
    document.getElementById('hotel-input-name').value = parsed.name;
    document.getElementById('hotel-input-location').value = parsed.location === '未知地点' ? '' : parsed.location;
    const tagSelect = document.getElementById('hotel-input-tag');
    if ([...tagSelect.options].some((o) => o.value === parsed.tag)) tagSelect.value = parsed.tag;
    document.getElementById('hotel-form-title').textContent = `再住：${parsed.name}`;
    updateHotelHint();
    document.getElementById('hotel-form-title').scrollIntoView({ behavior: 'smooth' });
}

async function uploadHotelPhoto(file) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `hotels/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await window.supabaseClient.storage.from('Food').upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = window.supabaseClient.storage.from('Food').getPublicUrl(fileName);
    return publicUrl;
}

async function saveHotel() {
    const client = window.supabaseClient;
    const btn = document.getElementById('add-hotel-btn');
    if (!client) return alert('云端未连接');
    const editingId = document.getElementById('hotel-editing-id').value;
    const name = document.getElementById('hotel-input-name').value.trim();
    const location = document.getElementById('hotel-input-location').value.trim();
    const comment = document.getElementById('hotel-input-comment').value.trim();
    const visitDate = document.getElementById('hotel-input-date').value;
    const tag = document.getElementById('hotel-input-tag').value;
    const rating = document.getElementById('hotel-input-rating').value;
    const file = document.getElementById('hotel-input-file').files[0];
    if (!name) return alert('酒店名不能为空哦！');
    if (!location) return alert('给这次入住加个地点吧！');
    if (!comment) return alert('随便写点入住评价吧汪~');
    if (!visitDate) return alert('别忘了选择入住日期哦！');
    if (!editingId && !file) return alert('请上传一张入住照片吧！汪！');

    btn.disabled = true;
    btn.textContent = editingId ? '正在保存修改... 💾' : '上传照片并收录中...';
    try {
        let photoUrl = hotelImageUrl;
        if (file) photoUrl = await uploadHotelPhoto(file);
        else if (editingId && hotelImageRemoved) photoUrl = null;
        const row = {
            name,
            location,
            visit_date: visitDate,
            tag,
            rating,
            comment,
            photo_url: photoUrl || null
        };
        if (editingId) {
            const { error } = await client.from('hotels').update(row).eq('id', editingId);
            if (error) throw error;
            alert('修改成功！入住记录已更新。');
        } else {
            const existed = findMatchingHotel(name, location);
            const { error } = await client.from('hotels').insert([row]);
            if (error) throw error;
            if (existed) {
                const times = existed.visits.length + 1;
                const newAvg = hotelAverage([...existed.visits, { rating }]);
                alert(`第 ${times} 次入住已记下！现在平均 ${formatHotelAvg(newAvg)} 星。`);
            } else {
                alert('成功收录进酒店局！');
            }
        }
        resetHotelForm();
        await loadHotels();
    } catch (err) {
        console.error(err);
        const message = err && err.message && err.message.indexOf('hotels') !== -1
            ? '还差一步：请在 Supabase SQL 里跑 supabase-setup.sql 末尾的酒店那段。'
            : ('保存失败：' + ((err && err.message) || '请稍后再试'));
        alert(message);
    } finally {
        btn.disabled = false;
        if (document.getElementById('hotel-editing-id').value) btn.textContent = '保存修改 💾';
        else updateHotelHint();
    }
}

function bootHotels() {
    const dateInput = document.getElementById('hotel-input-date');
    if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().split('T')[0];
    const dateParam = new URLSearchParams(location.search).get('date');
    if (dateParam) document.getElementById('search-hotel-date').value = dateParam;

    document.getElementById('search-hotel').addEventListener('input', searchHotels);
    document.getElementById('search-hotel-date').addEventListener('change', searchHotels);
    document.getElementById('search-hotel-rating').addEventListener('change', searchHotels);
    document.querySelectorAll('.hotel-tag-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            hotelSelectedTag = btn.dataset.tag;
            document.querySelectorAll('.hotel-tag-btn').forEach((el) => {
                el.style.background = 'white';
                el.style.color = '#2D2D2D';
            });
            btn.style.background = '#FF4D4D';
            btn.style.color = 'white';
            searchHotels();
        });
    });

    const nameInput = document.getElementById('hotel-input-name');
    const locationInput = document.getElementById('hotel-input-location');
    nameInput.addEventListener('input', updateHotelHint);
    nameInput.addEventListener('change', maybeAutofillHotel);
    nameInput.addEventListener('blur', maybeAutofillHotel);
    locationInput.addEventListener('input', updateHotelHint);

    document.getElementById('hotel-input-file').addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        hotelImageRemoved = false;
        const reader = new FileReader();
        reader.onload = (ev) => showHotelPreview(ev.target.result, false);
        reader.readAsDataURL(file);
    });
    document.getElementById('hotel-remove-img').addEventListener('click', () => {
        hotelImageRemoved = true;
        hotelImageUrl = '';
        hideHotelPreview();
    });
    document.getElementById('add-hotel-btn').addEventListener('click', saveHotel);
    document.getElementById('hotel-cancel-btn').addEventListener('click', resetHotelForm);
    document.getElementById('hotel-list').addEventListener('click', (e) => {
        const edit = e.target.closest('[data-edit]');
        const del = e.target.closest('[data-delete]');
        const again = e.target.closest('[data-revisit]');
        if (edit) startHotelEdit(edit.dataset.edit);
        else if (del && typeof window.deleteItem === 'function') window.deleteItem('hotels', del.dataset.delete, loadHotels);
        else if (again) revisitHotel(again.dataset.revisit);
    });

    const list = document.getElementById('hotel-list');
    let lastTap = 0;
    let zoomed = null;
    list.addEventListener('touchstart', (e) => {
        if (e.target.tagName.toLowerCase() !== 'img') {
            if (zoomed) {
                zoomed.classList.remove('mobile-zoomed');
                zoomed = null;
            }
            return;
        }
        const now = Date.now();
        if (now - lastTap > 0 && now - lastTap < 300) {
            e.preventDefault();
            if (e.target.classList.contains('mobile-zoomed')) {
                e.target.classList.remove('mobile-zoomed');
                zoomed = null;
            } else {
                if (zoomed) zoomed.classList.remove('mobile-zoomed');
                e.target.classList.add('mobile-zoomed');
                zoomed = e.target;
            }
        }
        lastTap = now;
    });

    loadHotels();
}

const bootHotel = typeof window.onPuppyLoveReady === 'function' ? window.onPuppyLoveReady : (cb) => cb();
bootHotel(bootHotels);
