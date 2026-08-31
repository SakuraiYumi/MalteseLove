const DEFAULT_CHECKIN_TYPES = ['约会', '旅行', '散步', '电影演出', '其他'];
const AMAP_KEY = '25a6b0cded2ed000294953ca70f53119';
const AMAP_SECRET = 'd950d6e7f839005adca23315fd952b7c';

window._AMapSecurityConfig = { securityJsCode: AMAP_SECRET };

let checkinMap = null;
let checkinMarker = null;
let currentLat = null;
let currentLng = null;
let allCheckins = [];
let extraTypes = [];
let checkinPreviewUrl = '';
let checkinFile = null;

function pad2(n) {
    return String(n).padStart(2, '0');
}

function localDateValue(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function localTimeValue(d) {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function combineHappenAt() {
    const date = document.getElementById('checkin-date').value;
    const time = document.getElementById('checkin-time').value || '12:00';
    if (!date) return null;
    return new Date(`${date}T${time}:00`).toISOString();
}

function fillTypeSelect(selected) {
    const select = document.getElementById('checkin-type');
    const filter = document.getElementById('filter-type');
    const types = [...new Set([...DEFAULT_CHECKIN_TYPES, ...extraTypes, ...allCheckins.map((c) => c.category).filter(Boolean)])];
    const current = selected || (select ? select.value : '约会');
    if (select) {
        select.innerHTML = types.map((t) => `<option value="${t}">${t}</option>`).join('')
            + '<option value="__new__">＋ 添加新种类...</option>';
        select.value = types.includes(current) ? current : types[0];
    }
    if (filter) {
        const keep = filter.value || 'All';
        filter.innerHTML = '<option value="All">全部种类</option>'
            + types.map((t) => `<option value="${t}">${t}</option>`).join('');
        filter.value = [...filter.options].some((o) => o.value === keep) ? keep : 'All';
    }
}

function setPlace(lng, lat, placeName, address, moveMap) {
    currentLng = lng;
    currentLat = lat;
    if (!checkinMap) return;
    const pos = [lng, lat];
    if (!checkinMarker) {
        checkinMarker = new AMap.Marker({ position: pos, map: checkinMap });
    } else {
        checkinMarker.setPosition(pos);
    }
    if (moveMap !== false) checkinMap.setCenter(pos);
    if (placeName) document.getElementById('checkin-place').value = placeName;
    if (address) document.getElementById('checkin-address').value = address;
}

function reverseGeocode(lng, lat) {
    AMap.plugin('AMap.Geocoder', () => {
        const geocoder = new AMap.Geocoder();
        geocoder.getAddress([lng, lat], (status, result) => {
            if (status !== 'complete' || !result.regeocode) return;
            const addr = result.regeocode.formattedAddress || '';
            const poi = (result.regeocode.pois && result.regeocode.pois[0] && result.regeocode.pois[0].name) || '';
            setPlace(lng, lat, poi || addr, addr, false);
        });
    });
}

function initMap() {
    const holder = document.getElementById('checkin-map');
    if (!holder || typeof AMap === 'undefined') {
        if (holder) holder.innerHTML = '<p style="padding:20px;text-align:center;color:#888;">地图加载失败，请检查高德 Key 和域名白名单</p>';
        return;
    }
    checkinMap = new AMap.Map('checkin-map', {
        zoom: 13,
        center: [118.796877, 32.060255],
        viewMode: '2D'
    });
    checkinMap.on('click', (e) => {
        const lng = e.lnglat.getLng();
        const lat = e.lnglat.getLat();
        setPlace(lng, lat, '', '', false);
        reverseGeocode(lng, lat);
    });
    AMap.plugin(['AMap.AutoComplete', 'AMap.PlaceSearch'], () => {
        const auto = new AMap.AutoComplete({ input: 'checkin-search' });
        auto.on('select', (e) => {
            if (!e.poi || !e.poi.location) return;
            const { lng, lat } = e.poi.location;
            setPlace(lng, lat, e.poi.name || '', e.poi.address || '', true);
            checkinMap.setZoom(16);
        });
    });
}

window.locateNow = function () {
    if (typeof AMap === 'undefined') return alert('地图还没准备好汪');
    AMap.plugin('AMap.Geolocation', () => {
        const geo = new AMap.Geolocation({
            enableHighAccuracy: true,
            timeout: 12000,
            zoomToAccuracy: true
        });
        geo.getCurrentPosition((status, result) => {
            if (status !== 'complete' || !result.position) {
                return alert('没拿到定位，请允许定位权限，或改成在地图上点选');
            }
            const lng = result.position.lng;
            const lat = result.position.lat;
            const addr = result.formattedAddress || '';
            setPlace(lng, lat, addr, addr, true);
            checkinMap.setZoom(16);
            reverseGeocode(lng, lat);
        });
    });
};

window.onCheckinTypeChange = function () {
    const select = document.getElementById('checkin-type');
    if (select.value !== '__new__') return;
    const name = (prompt('给新种类起个名字：') || '').trim();
    if (!name) {
        select.value = DEFAULT_CHECKIN_TYPES[0];
        return;
    }
    extraTypes.push(name);
    fillTypeSelect(name);
};

window.previewCheckinImage = function (input) {
    const file = input.files[0];
    const box = document.getElementById('checkin-preview-box');
    const img = document.getElementById('checkin-preview');
    if (!file) {
        checkinFile = null;
        checkinPreviewUrl = '';
        box.style.display = 'none';
        return;
    }
    checkinFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        checkinPreviewUrl = e.target.result;
        img.src = e.target.result;
        box.style.display = 'block';
    };
    reader.readAsDataURL(file);
};

window.clearCheckinImage = function () {
    checkinFile = null;
    checkinPreviewUrl = '';
    document.getElementById('checkin-file').value = '';
    document.getElementById('checkin-preview-box').style.display = 'none';
};

function resetCheckinForm() {
    const now = new Date();
    document.getElementById('checkin-date').value = localDateValue(now);
    document.getElementById('checkin-time').value = localTimeValue(now);
    document.getElementById('checkin-note').value = '';
    document.getElementById('checkin-place').value = '';
    document.getElementById('checkin-address').value = '';
    document.getElementById('checkin-search').value = '';
    clearCheckinImage();
    fillTypeSelect(DEFAULT_CHECKIN_TYPES[0]);
}

async function uploadCheckinPhoto() {
    if (!checkinFile || !window.supabaseClient) return '';
    const ext = (checkinFile.name.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `checkins/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await window.supabaseClient.storage.from('Food').upload(fileName, checkinFile);
    if (error) throw error;
    const { data: { publicUrl } } = window.supabaseClient.storage.from('Food').getPublicUrl(fileName);
    return publicUrl;
}

window.saveCheckin = async function (asPlan) {
    const client = window.supabaseClient;
    if (!client) return alert('云端还没连上');
    if (currentLat == null || currentLng == null) return alert('先在地图上选个点，或点「此刻定位」汪');
    const happenAt = combineHappenAt();
    if (!happenAt) return alert('日期时间要填哦');
    const category = document.getElementById('checkin-type').value;
    if (!category || category === '__new__') return alert('选一个打卡种类');
    const placeName = document.getElementById('checkin-place').value.trim();
    const address = document.getElementById('checkin-address').value.trim();
    const note = document.getElementById('checkin-note').value.trim();
    const btnPlan = document.getElementById('btn-plan');
    const btnDone = document.getElementById('btn-done');
    btnPlan.disabled = true;
    btnDone.disabled = true;
    try {
        let photoUrl = '';
        if (checkinFile) photoUrl = await uploadCheckinPhoto();
        const row = {
            category,
            note,
            place_name: placeName,
            address,
            lat: currentLat,
            lng: currentLng,
            happen_at: happenAt,
            photo_url: photoUrl || null,
            status: asPlan ? 'planned' : 'done',
            checked_in_at: asPlan ? null : happenAt
        };
        const { error } = await client.from('checkins').insert([row]);
        if (error) throw error;
        alert(asPlan ? '计划钉好啦，到时候来打卡！📌' : '打卡成功！我们来过这儿 🐾');
        resetCheckinForm();
        loadCheckins();
    } catch (err) {
        console.error(err);
        alert('保存失败：' + (err.message || '请确认已经运行过 supabase-setup.sql'));
    } finally {
        btnPlan.disabled = false;
        btnDone.disabled = false;
    }
};

window.completeCheckin = async function (id) {
    const client = window.supabaseClient;
    if (!client) return;
    const { error } = await client.from('checkins').update({
        status: 'done',
        checked_in_at: new Date().toISOString()
    }).eq('id', id);
    if (error) return alert('打卡失败：' + error.message);
    loadCheckins();
};

window.focusCheckinOnMap = function (id) {
    const item = allCheckins.find((c) => c.id === id);
    if (!item || !checkinMap) return;
    setPlace(item.lng, item.lat, item.place_name, item.address, true);
    checkinMap.setZoom(16);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.filterCheckins = function () {
    renderCheckins();
};

window.loadCheckins = async function loadCheckins() {
    const list = document.getElementById('checkin-list');
    const client = window.supabaseClient;
    if (!list || !client) return;
    list.innerHTML = '<p style="text-align:center;color:#888;grid-column:1/-1;">正在同步打卡点... ☁️</p>';
    const { data, error } = await client.from('checkins').select('*').order('happen_at', { ascending: false });
    if (error) {
        list.innerHTML = `<p style="text-align:center;color:#FF4D4D;grid-column:1/-1;">加载失败：${error.message}<br>如果是缺表，把 supabase-setup.sql 在控制台跑一遍。</p>`;
        return;
    }
    allCheckins = data || [];
    fillTypeSelect();
    renderCheckins();
}

function renderCheckins() {
    const list = document.getElementById('checkin-list');
    if (!list) return;
    const type = document.getElementById('filter-type').value;
    const status = document.getElementById('filter-status').value;
    const date = document.getElementById('filter-date').value;
    const filtered = allCheckins.filter((item) => {
        const matchType = type === 'All' || item.category === type;
        const matchStatus = status === 'All' || item.status === status;
        const happenDate = (item.happen_at || '').slice(0, 10);
        const matchDate = !date || happenDate === date;
        return matchType && matchStatus && matchDate;
    });
    if (filtered.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#888;grid-column:1/-1;padding:20px;">还没有符合条件的打卡哦，去地图上钉一个吧！</p>';
        return;
    }
    list.innerHTML = filtered.map((item) => {
        const when = new Date(item.happen_at);
        const whenText = isNaN(when.getTime()) ? item.happen_at : `${localDateValue(when)} ${localTimeValue(when)}`;
        const done = item.status === 'done';
        const photo = item.photo_url
            ? `<img src="${item.photo_url}" alt="打卡照片" style="width:100%;border-radius:12px;border:2px solid #2D2D2D;margin-top:8px;">`
            : '';
        const completeBtn = done
            ? ''
            : `<button type="button" onclick="completeCheckin(${item.id})" style="background:#4ADE80;color:#2D2D2D;border:2px solid #2D2D2D;padding:4px 10px;border-radius:12px;font-size:12px;cursor:pointer;font-weight:bold;">我到了，打卡 ✓</button>`;
        return `
            <div class="card box-shadow" style="padding:14px;margin:0;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                    <div>
                        <p style="margin:0;font-weight:bold;font-size:16px;">${item.place_name || '未命名地点'}</p>
                        <p style="margin:4px 0 0;font-size:12px;color:#888;">📍 ${item.address || '地图上的一个点'}</p>
                    </div>
                    <span style="background:${done ? '#DCFCE7' : '#FEF3C7'};border:2px solid #2D2D2D;border-radius:10px;padding:2px 8px;font-size:12px;white-space:nowrap;">
                        ${done ? '已完成' : '计划中'} · ${item.category}
                    </span>
                </div>
                <p style="margin:8px 0 0;font-size:13px;color:#555;">🕒 ${whenText}</p>
                ${item.note ? `<p style="margin:8px 0 0;font-size:14px;color:#333;white-space:pre-wrap;">${item.note}</p>` : ''}
                ${photo}
                <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
                    <button type="button" onclick="focusCheckinOnMap(${item.id})" style="background:#E0F2FE;border:2px solid #2D2D2D;padding:4px 10px;border-radius:12px;font-size:12px;cursor:pointer;font-weight:bold;">看地图</button>
                    ${completeBtn}
                    <button type="button" onclick="deleteItem('checkins', ${item.id}, loadCheckins)" style="background:#FFE4E6;color:#FF4D4D;border:2px solid #2D2D2D;padding:4px 10px;border-radius:12px;font-size:12px;cursor:pointer;font-weight:bold;">删除 ✖</button>
                </div>
            </div>
        `;
    }).join('');
}

function loadAmapScript() {
    return new Promise((resolve, reject) => {
        if (typeof AMap !== 'undefined') return resolve();
        const script = document.createElement('script');
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}`;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

window.onPuppyLoveReady(async () => {
    const now = new Date();
    document.getElementById('checkin-date').value = localDateValue(now);
    document.getElementById('checkin-time').value = localTimeValue(now);
    fillTypeSelect();
    try {
        await loadAmapScript();
        initMap();
    } catch (e) {
        console.error(e);
        document.getElementById('checkin-map').innerHTML = '<p style="padding:20px;text-align:center;color:#888;">地图脚本加载失败</p>';
    }
    loadCheckins();
});
