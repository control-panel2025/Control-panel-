const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// تقديم الملفات الثابتة
app.use(express.static('public'));

// بيانات المحاكاة
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
    }
};

// وظائف مساعدة
function addActivityLog(message, severity = 'info', icon = 'ℹ️', pumpId = null, reason = null) {
    const log = {
        id: activityLogs.length + 1,
        message,
        severity,
        icon,
        pumpId,
        reason,
        timestamp: new Date()
    };
    activityLogs.push(log);
    console.log(`[${severity.toUpperCase()}] ${message}${reason ? ` - السبب: ${reason}` : ''}`);
}

function updateSystemStats() {
    const activePumps = pumps.filter(p => p.status === 'active').length;
    const maintenancePumps = pumps.filter(p => p.status === 'maintenance').length;
    const stoppedPumps = pumps.filter(p => p.status === 'stopped').length;
    
    systemStats.activePumps = activePumps;
    systemStats.maintenancePumps = maintenancePumps;
    systemStats.stoppedPumps = stoppedPumps;
    systemStats.dailyProduction = Math.floor(2450 + (activePumps * 50) + (Math.random() - 0.5) * 100);
    systemStats.efficiency = Math.round((systemStats.dailyProduction / systemStats.targetProduction) * 100);
}

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

// النظام التلقائي للمراقبة والتشخيص
function autoControlSystem() {
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
                        '🚨',
                        pump.id,
                        criticalAlert.reason
                    );
                }

                // ضبط تلقائي للقيم
                pump.temperature = Math.max(25, Math.min(pump.temperature, 100));
                pump.pressure = Math.max(0, Math.min(pump.pressure, 200));
                pump.flow = Math.max(0, Math.min(pump.flow, 50));
            }
        }
    });

    updateSystemStats();
}

// تشغيل النظام التلقائي كل 5 ثوان
setInterval(autoControlSystem, 5000);

// APIs
// تسجيل الدخول
app.post('/api/auth/login', (req, res) => {
    const { employeeId, password } = req.body;
    
    const user = users.find(u => u.employeeId === employeeId && u.password === password);
    
    if (!user) {
        return res.status(401).json({ error: 'الرقم الوظيفي أو كلمة المرور غير صحيحة' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
});

// الحصول على جميع المضخات
app.get('/api/pumps', (req, res) => {
    res.json(pumps);
});

// تحديث حالة المضخة
app.patch('/api/pumps/:id/status', (req, res) => {
    const id = parseInt(req.params.id);
    const { status, reason } = req.body;
    
    const pump = pumps.find(p => p.id === id);
    if (!pump) {
        return res.status(404).json({ error: 'المضخة غير موجودة' });
    }

    pump.status = status;

    // إعادة تعيين القيم حسب الحالة
    if (status === 'stopped') {
        pump.pressure = 0;
        pump.flow = 0;
        pump.temperature = 25;
        pump.uptime = 0;
    } else if (status === 'maintenance') {
        pump.pressure = 0;
        pump.flow = 0;
        pump.temperature = 25;
        pump.uptime = 0;
        pump.autoMode = false;
    } else if (status === 'active') {
        pump.pressure = 130 + Math.random() * 40;
        pump.flow = 25 + Math.random() * 15;
        pump.temperature = 70 + Math.random() * 20;
    }

    const statusMap = {
        active: 'تشغيل',
        stopped: 'إيقاف',
        maintenance: 'صيانة'
    };

    const iconMap = {
        active: '▶️',
        stopped: '⏹️',
        maintenance: '🔧'
    };

    addActivityLog(
        `${pump.name} تم ${statusMap[status]}`,
        status === 'active' ? 'success' : status === 'stopped' ? 'error' : 'warning',
        iconMap[status],
        id,
        reason
    );

    updateSystemStats();
    res.json(pump);
});

// تبديل الوضع التلقائي للمضخة
app.patch('/api/pumps/:id/auto-mode', (req, res) => {
    const id = parseInt(req.params.id);
    const { autoMode } = req.body;
    
    const pump = pumps.find(p => p.id === id);
    if (!pump) {
        return res.status(404).json({ error: 'المضخة غير موجودة' });
    }

    pump.autoMode = autoMode;
    
    addActivityLog(
        `${pump.name} ${autoMode ? 'تم تفعيل' : 'تم إلغاء'} الوضع التلقائي`,
        'info',
        autoMode ? '🤖' : '👨‍💼',
        id
    );

    res.json(pump);
});

// تحديث إعدادات المضخة (للمدير)
app.patch('/api/pumps/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { pressure, flow, temperature } = req.body;
    
    const pump = pumps.find(p => p.id === id);
    if (!pump) {
        return res.status(404).json({ error: 'المضخة غير موجودة' });
    }

    if (pressure !== undefined) pump.pressure = pressure;
    if (flow !== undefined) pump.flow = flow;
    if (temperature !== undefined) pump.temperature = temperature;

    // التشخيص التلقائي بعد التحديث
    const alerts = checkPumpAlerts(pump);
    
    if (alerts.some(alert => alert.type === 'critical')) {
        const criticalAlert = alerts.find(alert => alert.type === 'critical');
        pump.status = 'stopped';
        pump.pressure = 0;
        pump.flow = 0;
        pump.uptime = 0;
        
        addActivityLog(
            `${pump.name} تم إيقافها تلقائياً بعد التحديث - ${criticalAlert.message}`,
            'error',
            '🚨',
            id,
            criticalAlert.reason
        );
    } else {
        addActivityLog(
            `${pump.name} تم تحديث الإعدادات بواسطة المدير`,
            'info',
            '🔧',
            id
        );
    }

    res.json(pump);
});

// الحصول على سجل النشاط
app.get('/api/activity-logs', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const recentLogs = activityLogs.slice(-limit).reverse();
    res.json(recentLogs);
});

// الحصول على إحصائيات النظام
app.get('/api/system-stats', (req, res) => {
    updateSystemStats();
    res.json(systemStats);
});

// إيقاف الطوارئ
app.post('/api/emergency-stop', (req, res) => {
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

    addActivityLog(
        `تم تنفيذ إيقاف الطوارئ - ${stoppedCount} مضخات متوقفة`,
        'error',
        '🚨'
    );

    updateSystemStats();
    res.json({ message: 'تم تنفيذ إيقاف الطوارئ لجميع المضخات', stoppedCount });
});

// تشغيل الخادم
app.listen(PORT, '0.0.0.0', () => {
    console.log(`الخادم يعمل على المنفذ ${PORT}`);
    
    // إضافة سجل نشاط أولي
    addActivityLog("النظام بدأ العمل بنجاح", "success", "✅");
    addActivityLog("جميع المضخات جاهزة للتشغيل", "info", "ℹ️");
    addActivityLog("النظام التلقائي للمراقبة مفعل", "info", "🤖");
    
    updateSystemStats();
});