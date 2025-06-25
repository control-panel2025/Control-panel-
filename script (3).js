// بيانات المحاكاة
let currentUser = null;
let pumps = [
    { id: 1, name: "مضخة #1", status: "active", pressure: 145, flow: 32.5, temperature: 78, uptime: 52335, autoMode: false },
    { id: 2, name: "مضخة #2", status: "active", pressure: 152, flow: 28.7, temperature: 82, uptime: 60322, autoMode: true },
    { id: 3, name: "مضخة #3", status: "maintenance", pressure: 0, flow: 0, temperature: 25, uptime: 0, autoMode: false },
    { id: 4, name: "مضخة #4", status: "active", pressure: 139, flow: 35.2, temperature: 75, uptime: 44325, autoMode: true },
    { id: 5, name: "مضخة #5", status: "stopped", pressure: 0, flow: 0, temperature: 25, uptime: 0, autoMode: false },
    { id: 6, name: "مضخة #6", status: "active", pressure: 148, flow: 30.1, temperature: 79, uptime: 66131, autoMode: true }
];

let activityLogs = [];
let systemStats = {
    activePumps: 4,
    maintenancePumps: 1,
    stoppedPumps: 1,
    dailyProduction: 2450,
    targetProduction: 2500,
    efficiency: 98
};

const users = [
    { employeeId: "38859", password: "12345", firstName: "سند", lastName: "الشارف", role: "admin" },
    { employeeId: "admin", password: "admin", firstName: "مشغل", lastName: "النظام", role: "operator" }
];

let currentPumpForAdmin = null;
let globalAutoMode = false;

// أسباب التشخيص التلقائي
const diagnosticReasons = {
    temperature: {
        high_95: "انسداد في نظام التهوية - فحص المراوح فوراً",
        high_90: "المروحة تدور ببطء - فحص المحرك الكهربائي",
        high_85: "لا يوجد ماء في مبرد المياه - إعادة ملء الخزان",
        high_80: "ارتفاع درجة حرارة البيئة المحيطة"
    },
    pressure: {
        low_100: "انسداد في خط الإمداد - فحص المرشحات",
        low_120: "تسريب في النظام - فحص الوصلات",
        high_200: "عطل في صمام الأمان - استبدال فوري",
        high_180: "انسداد في خط التصريف"
    },
    flow: {
        low_10: "انسداد في المرشحات - تنظيف أو استبدال",
        low_15: "تآكل في الأنابيب - فحص شامل مطلوب",
        high_40: "عطل في صمام التحكم - ضبط الإعدادات"
    },
    electrical: {
        high_current: "التيار قوي - فحص الأحمال الكهربائية",
        low_voltage: "انخفاض الجهد - فحص مصدر الطاقة",
        phase_imbalance: "خلل في توازن الأطوار - فحص اللوحة الكهربائية"
    }
};

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateTime();
    setInterval(updateTime, 1000);
    setInterval(simulateRealTimeData, 5000);
    
    // إضافة سجل نشاط أولي
    addActivityLog("النظام بدأ العمل بنجاح", "success", "✅");
    addActivityLog("جميع المضخات جاهزة للتشغيل", "info", "ℹ️");
});

function initializeApp() {
    showPage('loginPage');
}

function setupEventListeners() {
    // تسجيل الدخول
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);

    // أزرار الهيدر
    document.getElementById('refreshBtn').addEventListener('click', refreshData);
    document.getElementById('emergencyBtn').addEventListener('click', handleEmergencyStop);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('autoControlBtn').addEventListener('click', toggleGlobalAutoMode);

    // المودال
    document.getElementById('closeModal').addEventListener('click', closeAdminModal);
    document.getElementById('updatePumpBtn').addEventListener('click', handleAdminUpdate);

    // تحديث سجل النشاط
    document.getElementById('refreshLogBtn').addEventListener('click', updateActivityLog);

    // إغلاق المودال عند النقر خارجه
    document.getElementById('adminModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeAdminModal();
        }
    });
}

// تسجيل الدخول
function handleLogin(e) {
    e.preventDefault();
    
    const employeeId = document.getElementById('employeeId').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');

    if (!employeeId || !password) {
        showToast('يرجى إدخال الرقم الوظيفي وكلمة المرور', 'error');
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'جاري تسجيل الدخول...';

    setTimeout(() => {
        const user = users.find(u => u.employeeId === employeeId && u.password === password);
        
        if (user) {
            currentUser = user;
            
            if (user.role === 'admin') {
                showToast('مرحبا بك سند الشارف - مدير النظام', 'success');
            } else {
                showToast('تم تسجيل الدخول بنجاح', 'success');
            }

            setTimeout(() => {
                showPage('dashboardPage');
                updateDashboard();
            }, 1000);
        } else {
            showToast('الرقم الوظيفي أو كلمة المرور غير صحيحة', 'error');
        }

        loginBtn.disabled = false;
        loginBtn.textContent = 'تسجيل الدخول';
    }, 1500);
}

// تسجيل الخروج
function handleLogout() {
    currentUser = null;
    showToast('تم تسجيل الخروج', 'success');
    setTimeout(() => {
        showPage('loginPage');
        document.getElementById('loginForm').reset();
    }, 1000);
}

// عرض الصفحة
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

// تبديل الوضع التلقائي العام
function toggleGlobalAutoMode() {
    globalAutoMode = !globalAutoMode;
    const btn = document.getElementById('autoControlBtn');
    const icon = document.getElementById('autoControlIcon');
    const text = document.getElementById('autoControlText');
    
    if (globalAutoMode) {
        btn.classList.add('active');
        icon.textContent = '🤖';
        text.textContent = 'تلقائي مفعل';
        addActivityLog("تم تفعيل الوضع التلقائي العام لجميع المضخات", "success", "🤖");
        
        // تفعيل الوضع التلقائي لجميع المضخات النشطة
        pumps.forEach(pump => {
            if (pump.status === 'active') {
                pump.autoMode = true;
            }
        });
        
        showToast('تم تفعيل الوضع التلقائي العام', 'success');
    } else {
        btn.classList.remove('active');
        icon.textContent = '👨‍💼';
        text.textContent = 'تحكم يدوي';
        addActivityLog("تم إلغاء الوضع التلقائي العام - التحكم اليدوي", "warning", "👨‍💼");
        
        // إلغاء الوضع التلقائي لجميع المضخات
        pumps.forEach(pump => {
            pump.autoMode = false;
        });
        
        showToast('تم تفعيل الوضع اليدوي', 'info');
    }
    
    updatePumpsGrid();
}

// تحديث لوحة التحكم
function updateDashboard() {
    updateUserInfo();
    updateSystemStats();
    updatePumpsGrid();
    updateActivityLog();
    updatePerformanceChart();
}

// تحديث معلومات المستخدم
function updateUserInfo() {
    if (!currentUser) return;

    const userBadge = document.getElementById('userBadge');
    const userName = document.getElementById('userName');

    if (currentUser.role === 'admin') {
        userBadge.textContent = '🔧 مدير النظام';
        userBadge.classList.add('admin');
    } else {
        userBadge.textContent = '👤 مشغل';
        userBadge.classList.remove('admin');
    }

    userName.textContent = `مرحباً ${currentUser.firstName} ${currentUser.lastName}`;
}

// تحديث إحصائيات النظام
function updateSystemStats() {
    const activePumps = pumps.filter(p => p.status === 'active').length;
    const maintenancePumps = pumps.filter(p => p.status === 'maintenance').length;
    const stoppedPumps = pumps.filter(p => p.status === 'stopped').length;
    
    systemStats.activePumps = activePumps;
    systemStats.maintenancePumps = maintenancePumps;
    systemStats.stoppedPumps = stoppedPumps;
    systemStats.dailyProduction = Math.floor(2450 + (activePumps * 50) + (Math.random() - 0.5) * 100);
    systemStats.efficiency = Math.round((systemStats.dailyProduction / systemStats.targetProduction) * 100);

    document.getElementById('activePumps').textContent = systemStats.activePumps;
    document.getElementById('maintenancePumps').textContent = systemStats.maintenancePumps;
    document.getElementById('stoppedPumps').textContent = systemStats.stoppedPumps;
    document.getElementById('dailyProduction').textContent = systemStats.dailyProduction.toLocaleString();
}

// تحديث شبكة المضخات
function updatePumpsGrid() {
    const grid = document.getElementById('pumpsGrid');
    grid.innerHTML = '';

    pumps.forEach(pump => {
        const pumpCard = createPumpCard(pump);
        grid.appendChild(pumpCard);
    });
}

// إنشاء بطاقة مضخة
function createPumpCard(pump) {
    const card = document.createElement('div');
    card.className = 'pump-card';

    const statusMap = {
        active: { text: 'نشطة', class: 'active' },
        stopped: { text: 'متوقفة', class: 'stopped' },
        maintenance: { text: 'صيانة', class: 'maintenance' }
    };

    const status = statusMap[pump.status];
    const alerts = checkPumpAlerts(pump);
    
    card.innerHTML = `
        <div class="pump-header ${status.class}">
            <div class="pump-title">
                <span>⛽</span>
                <h3>${pump.name}</h3>
                ${pump.autoMode ? '<span class="auto-mode-badge">🤖 تلقائي</span>' : '<span class="manual-mode-badge">👨‍💼 يدوي</span>'}
            </div>
            <div class="pump-status">
                <div class="status-dot"></div>
                <span>${status.text}</span>
            </div>
        </div>
        <div class="pump-body">
            ${alerts.length > 0 ? `<div class="pump-alerts">
                ${alerts.map(alert => `<div class="alert ${alert.type}">
                    <span>${alert.type === 'critical' ? '🚨' : '⚠️'}</span>
                    <strong>${alert.message}</strong>
                    <br><small>السبب: ${alert.reason}</small>
                </div>`).join('')}
            </div>` : ''}
            <div class="pump-metrics">
                <div class="metric">
                    <div class="metric-label">الضغط</div>
                    <div class="metric-value pressure">
                        ${pump.status === 'active' ? `${Math.round(pump.pressure)} PSI` : '--- PSI'}
                    </div>
                </div>
                <div class="metric">
                    <div class="metric-label">التدفق</div>
                    <div class="metric-value flow">
                        ${pump.status === 'active' ? `${pump.flow.toFixed(1)} L/min` : '-- L/min'}
                    </div>
                </div>
                <div class="metric">
                    <div class="metric-label">الحرارة</div>
                    <div class="metric-value temperature">
                        ${Math.round(pump.temperature)}°C
                    </div>
                </div>
                <div class="metric">
                    <div class="metric-label">
                        ${pump.status === 'active' ? 'وقت التشغيل' : 
                          pump.status === 'maintenance' ? 'الصيانة' : 'الحالة'}
                    </div>
                    <div class="metric-value uptime">
                        ${pump.status === 'active' ? formatUptime(pump.uptime) :
                          pump.status === 'maintenance' ? '🔧 جاري' : '🛑 متوقف'}
                    </div>
                </div>
            </div>
            <div class="pump-controls">
                <button class="control-btn start-btn" 
                        ${pump.status === 'active' ? 'disabled' : ''} 
                        onclick="changePumpStatus(${pump.id}, 'active')">
                    ▶️ تشغيل
                </button>
                <button class="control-btn stop-btn" 
                        ${pump.status === 'stopped' ? 'disabled' : ''} 
                        onclick="changePumpStatus(${pump.id}, 'stopped')">
                    ⏹️ إيقاف
                </button>
                <button class="control-btn maintenance-btn" 
                        onclick="changePumpStatus(${pump.id}, 'maintenance')">
                    🔧 صيانة
                </button>
                <button class="control-btn auto-btn ${pump.autoMode ? 'active' : ''}" 
                        onclick="togglePumpAutoMode(${pump.id})">
                    ${pump.autoMode ? '🤖 تلقائي' : '👨‍💼 يدوي'}
                </button>
            </div>
            ${currentUser?.role === 'admin' ? createAdminControls(pump) : ''}
        </div>
    `;

    return card;
}

// تبديل الوضع التلقائي للمضخة
function togglePumpAutoMode(pumpId) {
    const pump = pumps.find(p => p.id === pumpId);
    if (!pump) return;

    pump.autoMode = !pump.autoMode;
    
    const modeText = pump.autoMode ? 'التلقائي' : 'اليدوي';
    const icon = pump.autoMode ? '🤖' : '👨‍💼';
    
    addActivityLog(`${pump.name} تم تبديل الوضع إلى ${modeText}`, "info", icon);
    showToast(`${pump.name} - تم تفعيل الوضع ${modeText}`, 'info');
    
    updatePumpsGrid();
}

// فحص تحذيرات المضخة مع تشخيص تلقائي
function checkPumpAlerts(pump) {
    const alerts = [];

    // فحص درجة الحرارة
    if (pump.temperature >= 95) {
        alerts.push({ 
            type: "critical", 
            message: "درجة حرارة عالية جداً!", 
            reason: diagnosticReasons.temperature.high_95 
        });
    } else if (pump.temperature >= 90) {
        alerts.push({ 
            type: "critical", 
            message: "درجة حرارة عالية!", 
            reason: diagnosticReasons.temperature.high_90 
        });
    } else if (pump.temperature >= 85) {
        alerts.push({ 
            type: "warning", 
            message: "درجة حرارة مرتفعة", 
            reason: diagnosticReasons.temperature.high_85 
        });
    }

    // فحص الضغط
    if (pump.pressure <= 100 && pump.status === 'active') {
        alerts.push({ 
            type: "critical", 
            message: "ضغط منخفض جداً!", 
            reason: diagnosticReasons.pressure.low_100 
        });
    } else if (pump.pressure <= 120 && pump.status === 'active') {
        alerts.push({ 
            type: "warning", 
            message: "ضغط منخفض", 
            reason: diagnosticReasons.pressure.low_120 
        });
    } else if (pump.pressure >= 200) {
        alerts.push({ 
            type: "critical", 
            message: "ضغط عالي جداً!", 
            reason: diagnosticReasons.pressure.high_200 
        });
    }

    // فحص التدفق
    if (pump.flow <= 10 && pump.status === 'active') {
        alerts.push({ 
            type: "critical", 
            message: "معدل تدفق منخفض جداً!", 
            reason: diagnosticReasons.flow.low_10 
        });
    } else if (pump.flow >= 40) {
        alerts.push({ 
            type: "warning", 
            message: "معدل تدفق عالي", 
            reason: diagnosticReasons.flow.high_40 
        });
    }

    return alerts;
}

// إنشاء تحكم المدير
function createAdminControls(pump) {
    return `
        <div class="admin-controls-container">
            <div class="admin-header">
                <h4>🔧 تحكم المدير - ${pump.name}</h4>
                <span class="admin-badge">مدير النظام</span>
            </div>
            <button class="update-btn" onclick="openAdminModal(${pump.id})">
                تحديث الإعدادات
            </button>
            <div class="admin-note">
                <p><strong>ملاحظة للمدير:</strong></p>
                <p>• النظام التلقائي سيراقب القيم ويتخذ الإجراءات اللازمة</p>
                <p>• التغييرات ستظهر فوراً مع التشخيص التلقائي</p>
            </div>
        </div>
    `;
}

// تغيير حالة المضخة
function changePumpStatus(pumpId, newStatus) {
    const pump = pumps.find(p => p.id === pumpId);
    if (!pump) return;

    const oldStatus = pump.status;
    pump.status = newStatus;

    // إعادة تعيين القيم حسب الحالة
    if (newStatus === 'stopped') {
        pump.pressure = 0;
        pump.flow = 0;
        pump.temperature = 25;
        pump.uptime = 0;
    } else if (newStatus === 'maintenance') {
        pump.pressure = 0;
        pump.flow = 0;
        pump.temperature = 25;
        pump.uptime = 0;
        pump.autoMode = false;
    } else if (newStatus === 'active') {
        pump.pressure = 130 + Math.random() * 40;
        pump.flow = 25 + Math.random() * 15;
        pump.temperature = 70 + Math.random() * 20;
        if (globalAutoMode) pump.autoMode = true;
    }

    const statusText = {
        active: 'تشغيل',
        stopped: 'إيقاف',
        maintenance: 'صيانة'
    };

    const statusIcon = {
        active: '▶️',
        stopped: '⏹️',
        maintenance: '🔧'
    };

    addActivityLog(
        `${pump.name} تم ${statusText[newStatus]}`,
        newStatus === 'active' ? 'success' : newStatus === 'stopped' ? 'error' : 'warning',
        statusIcon[newStatus]
    );

    showToast(`${pump.name} - تم ${statusText[newStatus]} المضخة`, 
              newStatus === 'active' ? 'success' : 'info');

    updateDashboard();
}

// محاكاة البيانات في الوقت الفعلي مع النظام التلقائي
function simulateRealTimeData() {
    pumps.forEach(pump => {
        if (pump.status === 'active') {
            // زيادة وقت التشغيل
            pump.uptime += 5;

            if (pump.autoMode) {
                // تقلبات طبيعية في البيانات
                pump.temperature += (Math.random() - 0.5) * 3;
                pump.pressure += (Math.random() - 0.5) * 10;
                pump.flow += (Math.random() - 0.5) * 2;

                // التحكم التلقائي والتشخيص
                const alerts = checkPumpAlerts(pump);
                
                if (alerts.some(alert => alert.type === 'critical')) {
                    // إيقاف تلقائي للمضخة عند وجود مشكلة حرجة
                    const criticalAlert = alerts.find(alert => alert.type === 'critical');
                    pump.status = 'stopped';
                    pump.pressure = 0;
                    pump.flow = 0;
                    pump.uptime = 0;
                    
                    addActivityLog(
                        `${pump.name} تم إيقافها تلقائياً - ${criticalAlert.message}`,
                        'error',
                        '🚨'
                    );
                    
                    addActivityLog(
                        `السبب: ${criticalAlert.reason}`,
                        'error',
                        '🔍'
                    );

                    showToast(`${pump.name} - إيقاف تلقائي: ${criticalAlert.message}`, 'error');
                }

                // ضبط تلقائي للقيم
                pump.temperature = Math.max(25, Math.min(pump.temperature, 100));
                pump.pressure = Math.max(0, Math.min(pump.pressure, 200));
                pump.flow = Math.max(0, Math.min(pump.flow, 50));
            }
        }
    });

    updateSystemStats();
    updatePumpsGrid();
}

// إيقاف طوارئ
function handleEmergencyStop() {
    if (!confirm('هل أنت متأكد من تنفيذ إيقاف الطوارئ لجميع المضخات؟')) {
        return;
    }

    let stoppedCount = 0;
    pumps.forEach(pump => {
        if (pump.status === 'active') {
            pump.status = 'stopped';
            pump.pressure = 0;
            pump.flow = 0;
            pump.temperature = 25;
            pump.uptime = 0;
            stoppedCount++;
        }
    });

    addActivityLog(`تم تنفيذ إيقاف الطوارئ - ${stoppedCount} مضخات متوقفة`, 'error', '🚨');
    showToast(`تم إيقاف ${stoppedCount} مضخات في حالة الطوارئ`, 'error');
    
    updateDashboard();
}

// فتح مودال المدير
function openAdminModal(pumpId) {
    const pump = pumps.find(p => p.id === pumpId);
    if (!pump) return;

    currentPumpForAdmin = pump;
    
    document.getElementById('pressureInput').value = Math.round(pump.pressure);
    document.getElementById('flowInput').value = pump.flow.toFixed(1);
    document.getElementById('temperatureInput').value = Math.round(pump.temperature);
    
    document.getElementById('adminModal').classList.add('active');
}

// إغلاق مودال المدير
function closeAdminModal() {
    document.getElementById('adminModal').classList.remove('active');
    currentPumpForAdmin = null;
}

// تحديث إعدادات المضخة (المدير)
function handleAdminUpdate() {
    if (!currentPumpForAdmin) return;

    const pressure = parseFloat(document.getElementById('pressureInput').value);
    const flow = parseFloat(document.getElementById('flowInput').value);
    const temperature = parseFloat(document.getElementById('temperatureInput').value);

    if (isNaN(pressure) || isNaN(flow) || isNaN(temperature)) {
        showToast('يرجى إدخال قيم صحيحة', 'error');
        return;
    }

    // تحديث القيم
    currentPumpForAdmin.pressure = pressure;
    currentPumpForAdmin.flow = flow;
    currentPumpForAdmin.temperature = temperature;

    // التشخيص التلقائي بعد التحديث
    const alerts = checkPumpAlerts(currentPumpForAdmin);
    
    if (alerts.some(alert => alert.type === 'critical')) {
        const criticalAlert = alerts.find(alert => alert.type === 'critical');
        currentPumpForAdmin.status = 'stopped';
        
        addActivityLog(
            `${currentPumpForAdmin.name} تم إيقافها تلقائياً بعد التحديث - ${criticalAlert.message}`,
            'error',
            '🚨'
        );
        
        addActivityLog(
            `السبب: ${criticalAlert.reason}`,
            'error',
            '🔍'
        );
        
        showToast(`تم إيقاف المضخة تلقائياً: ${criticalAlert.message}`, 'error');
    } else {
        addActivityLog(`${currentPumpForAdmin.name} تم تحديث الإعدادات بواسطة المدير`, 'info', '🔧');
        showToast('تم تحديث إعدادات المضخة بنجاح', 'success');
    }

    closeAdminModal();
    updateDashboard();
}

// تحديث سجل النشاط
function updateActivityLog() {
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';

    const recentLogs = activityLogs.slice(-10).reverse();
    
    recentLogs.forEach(log => {
        const logItem = document.createElement('div');
        logItem.className = `activity-item ${log.severity}`;
        
        logItem.innerHTML = `
            <div class="activity-content">
                <div class="activity-icon">${log.icon}</div>
                <div class="activity-text">
                    <p>${log.message}</p>
                    <span class="activity-time">${formatTimeAgo(log.timestamp)}</span>
                </div>
            </div>
        `;
        
        activityList.appendChild(logItem);
    });
}

// إضافة سجل نشاط
function addActivityLog(message, severity = 'info', icon = 'ℹ️') {
    const log = {
        id: activityLogs.length + 1,
        message,
        severity,
        icon,
        timestamp: new Date()
    };
    
    activityLogs.push(log);
    updateActivityLog();
}

// تحديث الرسم البياني
function updatePerformanceChart() {
    document.getElementById('chartProduction').textContent = systemStats.dailyProduction.toLocaleString();
    document.getElementById('targetProduction').textContent = systemStats.targetProduction.toLocaleString();
    document.getElementById('avgProduction').textContent = '2,380';
    document.getElementById('efficiency').textContent = systemStats.efficiency + '%';
}

// تحديث الوقت
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ar-SA', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('currentTime').textContent = timeString;
}

// تحديث البيانات
function refreshData() {
    addActivityLog("تم تحديث جميع البيانات", "info", "🔄");
    updateDashboard();
    showToast('تم تحديث البيانات', 'success');
}

// عرض رسالة
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toast.className = `toast ${type}`;
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// تنسيق وقت التشغيل
function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days}د ${remainingHours}س`;
    }
    
    return `${hours}س ${minutes}د`;
}

// تنسيق وقت النشاط
function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
}