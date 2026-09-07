const DEFAULT_CHECKIN_TYPES = ['约会', '旅行', '散步', '电影演出', '其他'];

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

function isLikelyChina(lng, lat) {
    return lng >= 73 && lng <= 135 && lat >= 18 && lat <= 54;
}

function getCheckinPinIcon() {
    return L.icon({
        iconUrl: 'images/checkin-pin.jpg?v=7',
        iconRetinaUrl: 'images/checkin-pin.jpg?v=7',
        iconSize: [52, 52],
        iconAnchor: [26, 50],
        shadowUrl: '',
        shadowSize: [0, 0],
        className: 'checkin-pin-img'
    });
}

function setPlace(lng, lat, placeName, address, moveMap, zoom) {
    currentLng = lng;
    currentLat = lat;
    if (!checkinMap || typeof L === 'undefined') return;
    const pos = [lat, lng];
    if (!checkinMarker) {
        checkinMarker = L.marker(pos, { icon: getCheckinPinIcon() }).addTo(checkinMap);
    } else {
        checkinMarker.setLatLng(pos);
        checkinMarker.setIcon(getCheckinPinIcon());
    }
    if (moveMap !== false) {
        const z = zoom || Math.max(checkinMap.getZoom() || 13, 14);
        checkinMap.setView(pos, z);
    }
    if (placeName) document.getElementById('checkin-place').value = placeName;
    if (address) document.getElementById('checkin-address').value = address;
}

function escapeSearchText(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

let searchSeq = 0;
let searchTimer = null;

const FOREIGN_INTENT_RE = /澳大利亚|澳洲|美国|日本|韩国|英国|英国|法国|德国|意大利|西班牙|葡萄牙|荷兰|比利时|瑞士|瑞典|挪威|芬兰|丹麦|俄罗斯|加拿大|墨西哥|巴西|阿根廷|新西兰|泰国|新加坡|马来西亚|越南|印尼|印度|菲律宾|柬埔寨|阿联酋|迪拜|土耳其|希腊|埃及|南非|冰岛|爱尔兰|波兰|捷克|匈牙利|奥地利|夏威夷|巴黎|伦敦|纽约|东京|大阪|京都|首尔|釜山|悉尼|墨尔本|布里斯班|洛杉矶|旧金山|西雅图|温哥华|多伦多|罗马|米兰|威尼斯|巴塞罗那|阿姆斯特丹|布拉格|维也纳|柏林|慕尼黑|苏黎世|日内瓦|北海道|冲绳|富士山|Australia|Japan|Korea|France|Italy|Germany|London|Paris|Tokyo|Sydney|New York|Singapore|Thailand/i;

function looksForeignIntent(keyword) {
    if (/[A-Za-z]{3,}/.test(keyword)) return true;
    return FOREIGN_INTENT_RE.test(keyword);
}

function itemLooksChina(item) {
    const blob = `${item.name || ''} ${item.address || ''} ${item.country || ''}`;
    if (/Australia|澳大利亚|日本|美国|France|Italy|United Kingdom|Korea/i.test(blob) && !/China|中国|长沙|深圳|北京|上海/.test(blob)) {
        return false;
    }
    return isLikelyChina(item.lng, item.lat) || /中国|China|长沙|深圳/.test(blob);
}

function dedupePlaces(items) {
    const seen = new Set();
    const out = [];
    items.forEach((item) => {
        const key = `${item.name}|${Number(item.lng).toFixed(3)}|${Number(item.lat).toFixed(3)}`;
        if (seen.has(key)) return;
        seen.add(key);
        out.push(item);
    });
    return out;
}

function hideSearchResults() {
    const box = document.getElementById('checkin-search-results');
    if (!box) return;
    box.hidden = true;
    box.innerHTML = '';
}

function showSearchResults(items) {
    const box = document.getElementById('checkin-search-results');
    if (!box) return;
    if (!items.length) {
        box.hidden = false;
        box.innerHTML = '<p style="margin:0;padding:12px;color:#888;font-size:13px;">没有找到这个地方，换个写法再试试（可加国家名，或用英文）</p>';
        return;
    }
    box.hidden = false;
    box.innerHTML = items.map((item, i) => {
        const abroad = !itemLooksChina(item);
        const tag = abroad ? '国外' : '国内';
        return `
        <button type="button" class="checkin-search-item" data-idx="${i}">
            <strong>${escapeSearchText(item.name)} <em class="checkin-place-tag">${tag}</em></strong>
            <span>${escapeSearchText(item.address || '')}</span>
        </button>`;
    }).join('');
    box.querySelectorAll('.checkin-search-item').forEach((btn) => {
        btn.addEventListener('click', () => {
            const item = items[Number(btn.dataset.idx)];
            if (!item) return;
            pickSearchResult(item);
        });
    });
}

function pickSearchResult(item) {
    hideSearchResults();
    setPlace(item.lng, item.lat, item.name, item.address || item.name, true, item.zoom || 16);
}

function amapPoiToItem(poi) {
    if (!poi || !poi.location) return null;
    const lng = typeof poi.location.getLng === 'function' ? poi.location.getLng() : poi.location.lng;
    const lat = typeof poi.location.getLat === 'function' ? poi.location.getLat() : poi.location.lat;
    if (lng == null || lat == null) return null;
    const bits = [poi.pname, poi.cityname, poi.adname, poi.address].filter(Boolean);
    return {
        name: poi.name || '未命名地点',
        address: bits.join(' ') || poi.district || '',
        country: poi.pname || '',
        lng,
        lat,
        zoom: 16
    };
}

function photonToItem(feature) {
    const coords = feature && feature.geometry && feature.geometry.coordinates;
    const props = (feature && feature.properties) || {};
    if (!coords || coords.length < 2) return null;
    const name = props.name || props.street || props.city || props.country || '未命名地点';
    const address = [props.street, props.housenumber, props.city, props.state, props.country]
        .filter(Boolean)
        .join(', ');
    return {
        name,
        address,
        country: props.country || '',
        lng: coords[0],
        lat: coords[1],
        zoom: props.osm_value === 'country' ? 5 : 16
    };
}

function nominatimToItem(row) {
    if (!row || row.lat == null || row.lon == null) return null;
    const display = row.display_name || '';
    const name = row.name || display.split(',')[0] || '未命名地点';
    const country = (row.address && (row.address.country || row.address.country_code)) || '';
    return {
        name,
        address: display,
        country,
        lng: parseFloat(row.lon),
        lat: parseFloat(row.lat),
        zoom: row.type === 'country' || row.addresstype === 'country' ? 5 : 16
    };
}

async function searchPhoton(keyword) {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(keyword)}&limit=6`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || []).map(photonToItem).filter(Boolean);
}

async function searchNominatim(keyword) {
    const urls = [
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=1&q=${encodeURIComponent(keyword)}&accept-language=zh-CN,zh,en`,
        `https://geocode.maps.co/search?q=${encodeURIComponent(keyword)}`
    ];
    for (const url of urls) {
        try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const data = await res.json();
            const rows = Array.isArray(data) ? data : [];
            const items = rows.map(nominatimToItem).filter(Boolean);
            if (items.length) return items;
        } catch (err) {
            console.warn('nominatim fallback', err);
        }
    }
    return [];
}

async function reverseWorldwide(lng, lat) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=zh-CN,zh,en`;
        const res = await fetch(url);
        if (res.ok) {
            const row = await res.json();
            const item = nominatimToItem(row);
            if (item) {
                setPlace(lng, lat, item.name, item.address, false);
                return;
            }
        }
    } catch (err) {
        console.warn(err);
    }
    try {
        const url = `https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const item = data.features && data.features[0] ? photonToItem(data.features[0]) : null;
        if (item) setPlace(lng, lat, item.name, item.address, false);
    } catch (err) {
        console.error(err);
        setPlace(lng, lat, '地图上的一个点', `${lat.toFixed(5)}, ${lng.toFixed(5)}`, false);
    }
}

function searchWithAmap(keyword) {
    return new Promise((resolve) => {
        if (typeof AMap === 'undefined') return resolve([]);
        AMap.plugin('AMap.PlaceSearch', () => {
            const placeSearch = new AMap.PlaceSearch({
                city: '全国',
                citylimit: false,
                pageSize: 6
            });
            placeSearch.search(keyword, (status, result) => {
                if (status !== 'complete' || !result.poiList || !result.poiList.pois) {
                    return resolve([]);
                }
                resolve(result.poiList.pois.map(amapPoiToItem).filter(Boolean));
            });
        });
    });
}

async function searchWorldwide(keyword) {
    const [nom, pho] = await Promise.all([
        searchNominatim(keyword).catch(() => []),
        searchPhoton(keyword).catch(() => [])
    ]);
    return dedupePlaces([...nom, ...pho]);
}

window.searchCheckinPlace = async function (fromTyping) {
    const input = document.getElementById('checkin-search');
    const keyword = (input && input.value || '').trim();
    if (!keyword) {
        hideSearchResults();
        if (!fromTyping) alert('先写下要找的地方汪');
        return;
    }
    if (fromTyping && keyword.length < 2) {
        hideSearchResults();
        return;
    }
    const seq = ++searchSeq;
    const btn = document.getElementById('checkin-search-btn');
    if (btn && !fromTyping) {
        btn.disabled = true;
        btn.textContent = '搜索中';
    }
    try {
        const [worldItems, amapItems] = await Promise.all([
            searchWorldwide(keyword),
            searchWithAmap(keyword).catch(() => [])
        ]);
        if (seq !== searchSeq) return;
        let items;
        if (looksForeignIntent(keyword)) {
            const abroadWorld = worldItems.filter((item) => !itemLooksChina(item));
            const abroadAmap = amapItems.filter((item) => !itemLooksChina(item));
            items = dedupePlaces([...(abroadWorld.length ? abroadWorld : worldItems), ...abroadAmap]);
            if (!items.length) items = dedupePlaces([...worldItems, ...amapItems]);
        } else {
            items = dedupePlaces([...amapItems, ...worldItems]);
        }
        showSearchResults(items);
    } catch (err) {
        if (seq !== searchSeq) return;
        console.error(err);
        showSearchResults([]);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '搜索';
        }
    }
};

function scheduleSearch() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => window.searchCheckinPlace(true), 380);
}

function reverseGeocode(lng, lat) {
    reverseWorldwide(lng, lat);
}

function initMap() {
    const holder = document.getElementById('checkin-map');
    if (!holder || typeof L === 'undefined') {
        if (holder) holder.innerHTML = '<p style="padding:20px;text-align:center;color:#888;">地图加载失败，请刷新后再试</p>';
        return;
    }
    holder.innerHTML = '';
    checkinMap = L.map(holder, { zoomControl: true }).setView([32.060255, 118.796877], 12);
    const worldTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri'
    });
    const osmTiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
    });
    worldTiles.addTo(checkinMap);
    worldTiles.on('tileerror', () => {
        if (!checkinMap.hasLayer(osmTiles)) osmTiles.addTo(checkinMap);
    });
    checkinMarker = L.marker([32.060255, 118.796877], { icon: getCheckinPinIcon() }).addTo(checkinMap);
    checkinMap.on('click', (e) => {
        setPlace(e.latlng.lng, e.latlng.lat, '', '', false);
        reverseGeocode(e.latlng.lng, e.latlng.lat);
    });
    setTimeout(() => checkinMap.invalidateSize(), 250);
}

window.locateNow = function () {
    if (!navigator.geolocation) return alert('这台设备不支持定位汪');
    navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPlace(lng, lat, '', '', true, 16);
        reverseGeocode(lng, lat);
    }, () => {
        alert('没拿到定位，请允许定位权限，或改成在地图上点选');
    }, { enableHighAccuracy: true, timeout: 12000 });
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
    setPlace(item.lng, item.lat, item.place_name, item.address, true, 16);
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

window.onPuppyLoveReady(async () => {
    const now = new Date();
    document.getElementById('checkin-date').value = localDateValue(now);
    document.getElementById('checkin-time').value = localTimeValue(now);
    fillTypeSelect();
    const searchInput = document.getElementById('checkin-search');
    const searchBtn = document.getElementById('checkin-search-btn');
    if (searchBtn) searchBtn.addEventListener('click', () => window.searchCheckinPlace());
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.searchCheckinPlace();
            }
        });
        searchInput.addEventListener('input', scheduleSearch);
        searchInput.addEventListener('focus', () => {
            if ((searchInput.value || '').trim().length >= 2) scheduleSearch();
        });
    }
    try {
        initMap();
    } catch (e) {
        console.error(e);
        document.getElementById('checkin-map').innerHTML = '<p style="padding:20px;text-align:center;color:#888;">地图脚本加载失败</p>';
    }
    loadCheckins();
});
