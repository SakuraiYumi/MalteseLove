// 共用账号邮箱（必须和 Supabase 控制台里创建的用户一致）
const PUPPYLOVE_AUTH_EMAIL = 'couple@puppylove.app';
const SUPABASE_URL = 'https://ekaeienirogrgkjxvwtc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mLKLqxXbN75bhUnSxkkA5w_4mwKr0rQ';
const PIN_LENGTH = 8;

window.puppyLoveIsReady = false;
window.onPuppyLoveReady = function (cb) {
    if (window.puppyLoveIsReady) cb();
    else window.addEventListener('puppylove-ready', cb);
};

try {
    if (window.supabase && !window.supabaseClient) {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storage: window.localStorage
            }
        });
    }
} catch (error) {
    console.error('❌ 初始化云端失败:', error);
}

(function () {
    let pinValue = '';
    let submitting = false;

    function markReady() {
        if (window.puppyLoveIsReady) return;
        window.puppyLoveIsReady = true;
        document.body.classList.add('puppylove-unlocked');
        hideLock();
        injectLogout();
        window.dispatchEvent(new Event('puppylove-ready'));
    }

    function hideLock() {
        const lock = document.getElementById('auth-lock');
        if (lock) lock.remove();
    }

    function injectLogout() {
        const nav = document.querySelector('.nav-links');
        if (!nav || document.getElementById('logout-btn')) return;
        const btn = document.createElement('button');
        btn.id = 'logout-btn';
        btn.type = 'button';
        btn.className = 'nav-btn logout-btn';
        btn.textContent = '退出';
        btn.addEventListener('click', async () => {
            if (!window.supabaseClient) return;
            await window.supabaseClient.auth.signOut();
            window.location.reload();
        });
        nav.appendChild(btn);
    }

    function renderDots() {
        const dots = document.getElementById('pin-dots');
        if (!dots) return;
        dots.innerHTML = '';
        for (let i = 0; i < PIN_LENGTH; i++) {
            const span = document.createElement('span');
            span.className = 'pin-dot' + (i < pinValue.length ? ' filled' : '');
            dots.appendChild(span);
        }
    }

    function setLockError(msg) {
        const el = document.getElementById('pin-error');
        if (el) el.textContent = msg || '';
    }

    async function submitPin() {
        if (submitting || pinValue.length !== PIN_LENGTH || !window.supabaseClient) return;
        submitting = true;
        setLockError('正在开门...');
        const { error } = await window.supabaseClient.auth.signInWithPassword({
            email: PUPPYLOVE_AUTH_EMAIL,
            password: pinValue
        });
        submitting = false;
        if (error) {
            pinValue = '';
            renderDots();
            setLockError('口令不对，再试一次汪');
            return;
        }
        markReady();
    }

    function pressKey(key) {
        if (submitting) return;
        setLockError('');
        if (key === 'del') {
            pinValue = pinValue.slice(0, -1);
        } else if (key === 'clear') {
            pinValue = '';
        } else if (pinValue.length < PIN_LENGTH) {
            pinValue += key;
        }
        renderDots();
        if (pinValue.length === PIN_LENGTH) submitPin();
    }

    function showLock() {
        if (document.getElementById('auth-lock')) return;
        if (!document.body) {
            document.addEventListener('DOMContentLoaded', showLock);
            return;
        }
        const wrap = document.createElement('div');
        wrap.id = 'auth-lock';
        wrap.innerHTML = `
            <div class="auth-lock-card">
                <p class="auth-lock-title">🐕 小狗汪汪队</p>
                <p class="auth-lock-sub">输入我们的 8 位口令才能进门</p>
                <div id="pin-dots" class="pin-dots"></div>
                <p id="pin-error" class="pin-error"></p>
                <div class="pin-pad">
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0, 'del'].map((k) => {
                        const label = k === 'clear' ? '清空' : k === 'del' ? '⌫' : k;
                        return `<button type="button" class="pin-key" data-key="${k}">${label}</button>`;
                    }).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(wrap);
        renderDots();
        wrap.addEventListener('click', (e) => {
            const btn = e.target.closest('.pin-key');
            if (!btn) return;
            pressKey(String(btn.dataset.key));
        });
    }

    async function boot() {
        const client = window.supabaseClient;
        if (!client) {
            showLock();
            setTimeout(() => setLockError('云端组件还没加载好，请刷新一下'), 0);
            return;
        }
        try {
            const { data: { session } } = await client.auth.getSession();
            if (session) {
                markReady();
                return;
            }
        } catch (error) {
            console.error('❌ 检查登录状态失败:', error);
        }
        showLock();
    }

    boot();
})();
