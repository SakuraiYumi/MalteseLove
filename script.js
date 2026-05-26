// ==================== 1. 恋爱计时器（增加了防错保护） ====================
const startDate = new Date(2025, 6, 22); // 设置成你们在一起的真实日期 (年, 月-1, 日)

function updateTimer() {
    const now = new Date();
    const difference = now - startDate;
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));

    // 【核心修复】：先判断页面上有没有 days 标签，有才写入！
    // 这样在没有计时器的子页面（如daily、wish）或者加载慢时就不会卡死报错了
    const daysElement = document.getElementById('days');
    if (daysElement) {
        daysElement.innerText = days;
    }
}

// 页面加载时先跑一次
updateTimer();

// 如果在主页，就每隔一天更新一次
if (document.getElementById('days')) {
    setInterval(updateTimer, 1000 * 60 * 60 * 24);
}


// ==================== 2. 鼠标移动：小狗爪子特效（粉色💖） ====================
document.addEventListener('mousemove', function(e) {
    if (Math.random() > 0.15) return; 

    const paw = document.createElement('div');
    paw.className = 'cursor-paw';
    
    paw.style.left = e.pageX + 'px';
    paw.style.top = e.pageY + 'px';
    
    const randomDegree = Math.floor(Math.random() * 40) - 20; 
    paw.style.transform = `translate(-50%, -50%) rotate(${randomDegree}deg)`;
    
    document.body.appendChild(paw);
    
    setTimeout(() => {
        paw.remove();
    }, 1000);
});

// ==================== 3. 纪念日倒计时 ====================
function updateAnniversary() {
    const countdownElement = document.getElementById('ann-countdown');
    if (countdownElement) {
        // 设置你们的一周年纪念日（注意格式：YYYY-MM-DD）
        const targetDate = new Date('2026-06-22T00:00:00'); 
        const now = new Date();
        const difference = targetDate - now;
        
        if (difference > 0) {
            // 计算还剩多少天（向上取整）
            const daysLeft = Math.ceil(difference / (1000 * 60 * 60 * 24));
            countdownElement.innerText = `还有 ${daysLeft} 天`;
        } else {
            // 如果日子到了或者过了
            countdownElement.innerText = "就是今天！🎉";
        }
    }
}

// 执行倒计时计算
updateAnniversary();