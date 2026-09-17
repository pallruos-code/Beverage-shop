/* --- js/store.js --- */

// store.js
// Google Apps Script Web App URL for syncing orders to Google Sheets
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz3_UyqavWasMSEZDTvB7UCT3whVfPsManAxQNbpNCYOaZjdQFcuC0-eCzJLwHaesu8Jw/exec';

function playNewOrderSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const now = ctx.currentTime;
        
        // Bell note 1 (E5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, now);
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.5);
        
        // Bell note 2 (B5)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(987.77, now + 0.15);
        gain2.gain.setValueAtTime(0.3, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.8);
    } catch (e) {
        console.warn('Audio chime error:', e);
    }
}

function showNewOrderToast(order) {
    try {
        const existing = document.getElementById('order-alert-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.id = 'order-alert-toast';
        toast.className = 'fixed top-4 right-4 z-[9999] bg-primary text-on-primary border-2 border-secondary-container shadow-2xl rounded-2xl p-4 flex items-center gap-3 animate-bounce max-w-sm';
        toast.innerHTML = `
            <span class="material-symbols-outlined text-secondary-container text-[36px]">notifications_active</span>
            <div>
                <h4 class="font-bold text-sm text-secondary-container">มีออเดอร์ใหม่เข้ามา!</h4>
                <p class="text-xs text-white">คิว: <span class="font-bold text-base text-white">${order.queue || order.queue_number}</span> (${order.customer_name || 'ลูกค้า'})</p>
                <p class="text-[11px] text-white/70">ยอดรวม: ฿${(order.total || order.total_amount || 0).toFixed(2)}</p>
            </div>
            <button onclick="this.parentElement.remove()" class="ml-auto text-white/60 hover:text-white p-1">
                <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
        `;
        document.body.appendChild(toast);
        setTimeout(() => { if (toast.parentElement) toast.remove(); }, 6000);
    } catch (e) {
        console.warn('Toast display error:', e);
    }
}

// Chime for customer when their order is completed & ready
function playOrderReadySound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const now = ctx.currentTime;
        
        // 4-note celebration melody (C5, E5, G5, C6)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.16);
            gain.gain.setValueAtTime(0.35, now + idx * 0.16);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.6);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.16);
            osc.stop(now + idx * 0.16 + 0.6);
        });
    } catch (e) {
        console.warn('Audio ready sound error:', e);
    }
}

// Modal notification displayed on customer screen when their drink is ready
function showCustomerOrderReadyModal(order) {
    const existing = document.getElementById('order-ready-modal');
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.id = 'order-ready-modal';
    modal.className = 'fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4';
    modal.innerHTML = `
        <div class="bg-surface w-full max-w-md rounded-3xl p-6 shadow-2xl border-4 border-secondary-container text-center relative overflow-hidden">
            <div class="w-20 h-20 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-4 text-on-secondary-container shadow-xl">
                <span class="material-symbols-outlined text-[48px]">local_cafe</span>
            </div>
            <span class="bg-primary text-white font-bold text-xs px-4 py-1.5 rounded-full inline-block mb-3 shadow-sm">🔔 ทำเครื่องดื่มเสร็จแล้ว!</span>
            <h2 class="font-h1 text-2xl font-extrabold text-text-primary mb-1">เครื่องดื่มพร้อมเสิร์ฟแล้วครับ</h2>
            <div class="my-4 py-4 px-6 bg-surface-container rounded-2xl border-2 border-secondary-container/60 shadow-inner">
                <div class="text-xs text-text-secondary font-medium">หมายเลขคิวของคุณ</div>
                <div class="font-display text-5xl font-black text-primary my-1">${order.queue || order.queue_number}</div>
                <div class="text-xs text-text-secondary">คุณ: <strong>${order.customer_name || 'ลูกค้า'}</strong></div>
            </div>
            <p class="text-body-sm text-text-secondary mb-6 leading-relaxed">
                กรุณานำหมายเลขคิวนี้มารับเครื่องดื่มที่เคาน์เตอร์บาร์น้ำได้เลยครับ ขอให้เพลิดเพลินกับเครื่องดื่มนะครับ! ☕✨
            </p>
            <div class="flex flex-col gap-2">
                <button id="ready-ack-btn" class="w-full h-13 py-3 bg-primary text-on-primary font-bold text-base rounded-xl hover:bg-primary-hover shadow-lg transition-all active:scale-[0.98]">
                    รับเครื่องดื่มเรียบร้อยแล้ว
                </button>
                <button id="ready-print-btn" class="w-full h-11 bg-surface border border-border text-text-primary font-label text-label rounded-xl hover:bg-surface-container flex items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-[18px]">print</span> ดูใบเสร็จ / สั่งพิมพ์
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelector('#ready-ack-btn').addEventListener('click', () => {
        if (store.state.activeOrder) {
            store.state.activeOrder.acknowledged = true;
            localStorage.setItem('active_customer_order', JSON.stringify(store.state.activeOrder));
            store.notify();
        }
        modal.remove();
    });

    modal.querySelector('#ready-print-btn').addEventListener('click', () => {
        modal.remove();
        if (window.showReceiptModal && store.state.activeOrder) {
            window.showReceiptModal(store.state.activeOrder);
        }
    });
}

// Background poller to check if the customer's active order has been completed by staff
let customerTrackingInterval = null;

async function checkCustomerOrderStatus() {
    const active = store.state.activeOrder;
    if (!active || !active.id) {
        if (customerTrackingInterval) {
            clearInterval(customerTrackingInterval);
            customerTrackingInterval = null;
        }
        return;
    }
    
    // If order is already completed and acknowledged, stop polling
    if ((active.status === 'COMPLETED' || active.status === 'SERVED') && active.acknowledged) {
        if (customerTrackingInterval) {
            clearInterval(customerTrackingInterval);
            customerTrackingInterval = null;
        }
        return;
    }

    try {
        const response = await fetch(`${GAS_WEB_APP_URL}?action=getOrders`);
        if (response.ok) {
            const result = await response.json();
            if (result && result.status === 'success' && Array.isArray(result.data)) {
                const found = result.data.find(o => o.id === active.id || o.order_number === active.id);
                if (found) {
                    const oldStatus = active.status;
                    const newStatus = found.status || found.order_status;
                    
                    if (oldStatus !== newStatus) {
                        active.status = newStatus;
                        active.order_status = newStatus;
                        localStorage.setItem('active_customer_order', JSON.stringify(active));
                        store.notify();
                        
                        // If order is now COMPLETED or READY
                        if (newStatus === 'COMPLETED' || newStatus === 'READY' || newStatus === 'SERVED') {
                            playOrderReadySound();
                            if (navigator.vibrate) {
                                try { navigator.vibrate([300, 150, 300, 150, 500]); } catch (e) {}
                            }
                            showCustomerOrderReadyModal(active);
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.warn('Customer tracking poll error:', err);
    }
}

function startCustomerOrderTracking() {
    if (customerTrackingInterval) return;
    checkCustomerOrderStatus();
    customerTrackingInterval = setInterval(checkCustomerOrderStatus, 4000);
}

async function syncOrderToGoogleSheets(order) {
    try {
        const items = (order.items || []).map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.finalPrice || item.price,
            sweetness: item.options && item.options.sweetness ? item.options.sweetness + '%' : '100%',
            toppings: item.options && item.options.toppings ? item.options.toppings.join(', ') : '',
            notes: item.options && item.options.notes ? item.options.notes : ''
        }));

        const payload = {
            action: 'addOrder',
            orderNumber: order.id,
            queueNumber: order.queue,
            customerEmail: order.customer_email || localStorage.getItem('customer_email') || '-',
            customerName: order.customer_name || localStorage.getItem('customer_name') || 'ลูกค้าทั่วไป',
            items: items,
            total: order.total,
            status: order.status,
            timestamp: new Date().toISOString()
        };

        await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });

        console.log('Order synced to Google Sheets successfully');
    } catch (err) {
        console.error('Error syncing order to Google Sheets:', err);
    }
}

async function syncOrderStatusToGoogleSheets(orderNumber, status) {
    try {
        await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'updateStatus',
                orderNumber: orderNumber,
                status: status
            })
        });
    } catch (err) {
        console.warn('Error updating status in Google Sheets:', err);
    }
}

let staffPollingInterval = null;

const store = {
    state: {
        cart: [],
        orders: [], // For KDS
        currentRoute: 'menu', // 'menu', 'cart', 'admin', 'pos', 'kds', 'login'
        isAuthenticated: localStorage.getItem('staff_auth') === 'true',
        customerEmail: localStorage.getItem('customer_email') || '',
        customerName: localStorage.getItem('customer_name') || '',
        activeOrder: (() => {
            try {
                return JSON.parse(localStorage.getItem('active_customer_order') || 'null');
            } catch (e) {
                return null;
            }
        })(),
        pendingRoute: null
    },
    listeners: [],
    
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    },
    
    notify() {
        this.listeners.forEach(listener => listener(this.state));
    },
    
    setCustomer(email, name) {
        this.state.customerEmail = email;
        this.state.customerName = name;
        localStorage.setItem('customer_email', email);
        localStorage.setItem('customer_name', name);
        this.notify();
    },

    verifyPasscode(passcode) {
        const STAFF_PASSCODE = '11333355555';
        if (passcode === STAFF_PASSCODE) {
            this.state.isAuthenticated = true;
            localStorage.setItem('staff_auth', 'true');
            const target = this.state.pendingRoute || 'admin';
            this.state.pendingRoute = null;
            this.navigate(target);
            return true;
        }
        return false;
    },

    logoutStaff() {
        this.state.isAuthenticated = false;
        localStorage.removeItem('staff_auth');
        if (staffPollingInterval) {
            clearInterval(staffPollingInterval);
            staffPollingInterval = null;
        }
        this.navigate('menu');
    },

    navigate(route) {
        const protectedRoutes = ['admin', 'pos', 'kds'];
        if (protectedRoutes.includes(route) && !this.state.isAuthenticated) {
            this.state.pendingRoute = route;
            this.state.currentRoute = 'login';
        } else {
            this.state.currentRoute = route;
        }
        
        // Start background polling when entering staff views so new orders pop up immediately
        if (['admin', 'pos', 'kds'].includes(this.state.currentRoute)) {
            if (!staffPollingInterval) {
                fetchOrders();
                staffPollingInterval = setInterval(() => {
                    fetchOrders();
                }, 4000);
            }
        } else {
            if (staffPollingInterval) {
                clearInterval(staffPollingInterval);
                staffPollingInterval = null;
            }
        }

        this.notify();
    },
    
    addToCart(product, options = null) {
        // Create a unique ID if options are present
        const cartItemId = options ? `${product.id}-${JSON.stringify(options)}` : product.id;
        
        const existing = this.state.cart.find(item => item.cartItemId === cartItemId);
        if (existing) {
            existing.quantity += 1;
        } else {
            // Calculate additional price from toppings
            let additionalPrice = 0;
            if (options && options.toppings) {
                additionalPrice = options.toppings.length * 0.30;
            }
            
            this.state.cart.push({ 
                ...product, 
                cartItemId, 
                options, 
                finalPrice: product.price + additionalPrice,
                quantity: 1 
            });
        }
        this.notify();
    },
    
    updateQuantity(cartItemId, amount) {
        const item = this.state.cart.find(item => item.cartItemId === cartItemId);
        if (item) {
            item.quantity += amount;
            if (item.quantity <= 0) {
                this.removeFromCart(cartItemId);
            } else {
                this.notify();
            }
        }
    },
    
    removeFromCart(cartItemId) {
        this.state.cart = this.state.cart.filter(item => item.cartItemId !== cartItemId);
        this.notify();
    },
    
    getCartTotal() {
        return this.state.cart.reduce((total, item) => total + ((item.finalPrice || item.price) * item.quantity), 0);
    },
    
    getCartCount() {
        return this.state.cart.reduce((count, item) => count + item.quantity, 0);
    },
    
    async checkout(paymentMethod = 'promptpay') {
        if (this.state.cart.length === 0) return null;
        
        const cartItems = [...this.state.cart];
        const totalAmount = this.getCartTotal();
        const orderNum = 'ORD-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
        const queueNum = 'A' + Math.floor(100 + Math.random() * 900);
        const custEmail = this.state.customerEmail || localStorage.getItem('customer_email') || '-';
        const custName = this.state.customerName || localStorage.getItem('customer_name') || 'ลูกค้าทั่วไป';
        
        const newOrder = {
            id: orderNum,
            order_number: orderNum,
            queue: queueNum,
            queue_number: queueNum,
            customer_email: custEmail,
            customer_name: custName,
            items: cartItems,
            total: totalAmount,
            total_amount: totalAmount,
            payment_method: paymentMethod, // 'promptpay' or 'cash'
            status: 'PENDING', // 'PENDING', 'PREPARING', 'COMPLETED'
            order_status: 'PENDING',
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            date: new Date().toLocaleDateString('th-TH')
        };
        
        // Add to front of orders
        this.state.orders.unshift(newOrder);
        this.state.activeOrder = newOrder;
        localStorage.setItem('active_customer_order', JSON.stringify(newOrder));
        this.state.cart = []; // Empty cart
        this.notify();
        
        // Sync to Google Sheets (บันทึกลง Google Sheets ทันที)
        syncOrderToGoogleSheets(newOrder);
        
        // Start live tracking on customer screen
        startCustomerOrderTracking();
        
        return newOrder;
    },
    
    updateOrderStatus(orderId, newStatus) {
        const order = this.state.orders.find(o => o.id === orderId || o.order_number === orderId || o.db_id === orderId);
        if (order) {
            order.status = newStatus;
            order.order_status = newStatus;
            this.notify();
            
            // Sync status update to Google Sheets
            syncOrderStatusToGoogleSheets(order.id || order.order_number, newStatus);
        }
    }
};

const DEFAULT_IMAGES = {
    espresso: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&q=80&w=600',
    cappuccino: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&q=80&w=600',
    latte: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=600',
    americano: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=600',
    tea: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=600',
    refresher: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=600'
};

const defaultProducts = [
    {
        id: 'p-cappuccino',
        name: 'คาปูชิโน่',
        category: 'กาแฟ',
        description: 'เอสเพรสโซ่เข้มข้น ผสมนมนุ่มและฟองนมนุ่มฟูสไตล์อิตาเลียน',
        price: 30,
        icedPrice: 30,
        tag: 'แนะนำ',
        image: DEFAULT_IMAGES.cappuccino
    },
    {
        id: 'p-latte',
        name: 'ลาเต้',
        category: 'กาแฟ',
        description: 'เอสเพรสโซ่ผสมนมสดนุ่มละมุน หอมกลิ่นกาแฟสดแท้',
        price: 30,
        icedPrice: 35,
        tag: 'ยอดฮิต',
        image: DEFAULT_IMAGES.latte
    },
    {
        id: 'p-americano',
        name: 'อเมริกาโน่',
        category: 'กาแฟ',
        description: 'กาแฟดำเอสเพรสโซ่เจือจางด้วยน้ำร้อน/น้ำเย็น ได้รสชาติกาแฟแท้เต็มคำ',
        price: 30,
        icedPrice: 35,
        tag: 'เข้มข้น',
        image: DEFAULT_IMAGES.americano
    },
    {
        id: 'a1111111-1111-1111-1111-111111111111',
        name: 'นอร์ดิกโอ๊ตลาเต้',
        category: 'กาแฟ',
        description: 'เอสเพรสโซ่รสชาติกลมกล่อม ผสมผสานกับนมโอ๊ตสูตรพิเศษของเรา',
        price: 45,
        icedPrice: 45,
        tag: 'เพื่อความยั่งยืน',
        image: DEFAULT_IMAGES.latte
    },
    {
        id: 'a3333333-3333-3333-3333-333333333333',
        name: 'แคลริตี้กรีนที (ชาเขียว)',
        category: 'ชา',
        description: 'ใบชาเซนฉะชั้นดีจากญี่ปุ่น ให้ความรู้สึกสดชื่น ผ่อนคลาย',
        price: 35,
        icedPrice: 35,
        tag: 'ออร์แกนิก',
        image: DEFAULT_IMAGES.tea
    },
    {
        id: 'a4444444-4444-4444-4444-444444444444',
        name: 'ซิตรัสไฮเดรเตอร์',
        category: 'สดชื่น',
        description: 'น้ำโซดาเย็นจัด ผสมเลมอนและส้มสกัดเย็น ให้ความสดชื่นทันทีที่ดื่ม',
        price: 40,
        icedPrice: 40,
        tag: 'สดชื่น',
        image: DEFAULT_IMAGES.refresher
    }
];

let products = [...defaultProducts];

async function fetchProducts() {
    products = [...defaultProducts];
    store.notify();
}

async function fetchOrders() {
    try {
        const response = await fetch(`${GAS_WEB_APP_URL}?action=getOrders`);
        if (response.ok) {
            const result = await response.json();
            if (result && result.status === 'success' && Array.isArray(result.data)) {
                const incomingOrders = result.data;
                const oldIds = new Set(store.state.orders.map(o => o.id || o.order_number));
                
                // If a new order is detected while on staff screen, trigger chime & toast!
                const hasNew = incomingOrders.some(o => !oldIds.has(o.id || o.order_number));
                if (hasNew && store.state.orders.length > 0) {
                    playNewOrderSound();
                    const newest = incomingOrders[0];
                    if (newest) showNewOrderToast(newest);
                }
                
                store.state.orders = incomingOrders;
                store.notify();
                return;
            }
        }
    } catch (err) {
        console.warn('Google Sheets fetchOrders error:', err);
    }
}

function subscribeToOrders() {
    // Orders are polled via fetchOrders() every 4s while on staff screens
}

// Call fetchProducts for menu on load
try {
    fetchProducts();
} catch (e) {
    console.warn('Initial product fetch error:', e);
}

// Automatically resume customer order tracking if an active order is not completed
try {
    if (store.state.activeOrder && (!store.state.activeOrder.acknowledged || store.state.activeOrder.status !== 'COMPLETED')) {
        startCustomerOrderTracking();
    }
} catch (e) {
    console.warn('Initial customer tracking error:', e);
}


/* --- js/components/BottomNav.js --- */

function renderBottomNav() {
    const nav = document.createElement('nav');
    nav.className = 'md:hidden bg-surface text-primary font-caption text-caption fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 border-t border-border rounded-t-xl shadow-md';
    
    const currentRoute = store.state.currentRoute;
    
    const isMenu = currentRoute === 'menu';
    const isCart = currentRoute === 'cart';

    nav.innerHTML = `
        <button id="mob-shop" class="flex flex-col items-center justify-center ${isMenu ? 'bg-secondary-container text-on-secondary-container rounded-full px-5 py-1.5' : 'text-on-surface-variant hover:bg-surface-container-high px-4 py-1 rounded-full'} transition-all">
            <span class="material-symbols-outlined mb-0.5" ${isMenu ? 'style="font-variation-settings: \'FILL\' 1;"' : ''}>local_cafe</span>
            <span class="${isMenu ? 'font-bold' : ''}">เมนูเครื่องดื่ม</span>
        </button>
        <button id="mob-cart" class="flex flex-col items-center justify-center ${isCart ? 'bg-secondary-container text-on-secondary-container rounded-full px-5 py-1.5' : 'text-on-surface-variant hover:bg-surface-container-high px-4 py-1 rounded-full'} relative transition-all">
            <span class="material-symbols-outlined mb-0.5" ${isCart ? 'style="font-variation-settings: \'FILL\' 1;"' : ''}>shopping_cart</span>
            <span class="${isCart ? 'font-bold' : ''}">ตะกร้าสินค้า</span>
            <span id="mob-cart-badge" class="absolute top-0 right-2 bg-error text-on-error text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center scale-0 transition-transform">0</span>
        </button>
        <button id="mob-staff" class="flex flex-col items-center justify-center text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-container-high px-4 py-1 rounded-full transition-all">
            <span class="material-symbols-outlined mb-0.5">lock</span>
            <span class="text-[11px]">พนักงาน</span>
        </button>
    `;

    nav.querySelector('#mob-shop').addEventListener('click', () => {
        store.navigate('menu');
    });

    nav.querySelector('#mob-cart').addEventListener('click', () => {
        store.navigate('cart');
    });

    nav.querySelector('#mob-staff').addEventListener('click', () => {
        store.navigate('login');
    });

    const updateBadge = () => {
        const badge = nav.querySelector('#mob-cart-badge');
        const count = store.getCartCount();
        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('scale-0');
        } else {
            badge.classList.add('scale-0');
        }
    };
    
    store.subscribe(updateBadge);
    setTimeout(updateBadge, 0);

    return nav;
}


/* --- js/components/Navbar.js --- */

function renderNavbar() {
    const header = document.createElement('header');
    header.className = 'hidden md:flex bg-primary/95 backdrop-blur-md text-on-primary font-label text-label border-b border-white/10 fixed top-0 left-0 w-full z-50 justify-center h-[68px] shadow-[0_2px_15px_rgba(0,0,0,0.05)]';
    
    const currentRoute = store.state.currentRoute;
    const isMenu = currentRoute === 'menu';
    const isCart = currentRoute === 'cart';

    header.innerHTML = `
        <div class="w-full flex justify-between items-center px-gutter-desktop max-w-container-max mx-auto h-full">
            <!-- Brand Logo with Nordic accent -->
            <div class="flex items-center gap-xl">
                <div class="font-display text-2xl font-bold tracking-tight cursor-pointer flex items-center gap-xs" id="nav-brand">
                    <span>Fika</span><span class="text-secondary-container">Smart</span>
                </div>
                <!-- Search input with premium glassmorphism -->
                <div class="relative w-64 hidden lg:block">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-[20px]">search</span>
                    <input class="w-full bg-white/10 border border-white/5 hover:bg-white/15 focus:bg-white/20 rounded-full py-2 pl-10 pr-4 text-white placeholder:text-white/40 focus:ring-2 focus:ring-secondary-container outline-none text-body-sm font-body-sm h-[38px] transition-all" placeholder="ค้นหาเครื่องดื่ม..." type="text"/>
                </div>
            </div>
            
            <!-- Center Navigation Links (Clean Customer View) -->
            <nav class="flex gap-md lg:gap-lg items-center">
                <a class="relative text-white/80 hover:text-white transition-colors py-2 cursor-pointer font-medium ${isMenu ? 'text-white border-b-2 border-secondary-container' : ''}" id="nav-shop">หน้าหลัก</a>
                <a class="relative text-white/80 hover:text-white transition-colors py-2 cursor-pointer font-medium ${isCart ? 'text-white border-b-2 border-secondary-container' : ''}" id="nav-cart-link">ตะกร้าสินค้า</a>
            </nav>
            
            <!-- Right Actions -->
            <div class="flex gap-md items-center">
                <!-- Premium Cart Button -->
                <button id="nav-cart-btn" class="relative text-white p-2 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors group" title="ตะกร้าสินค้า">
                    <span class="material-symbols-outlined text-[24px]" ${isCart ? 'style="font-variation-settings: \'FILL\' 1; color:#fdd816;"' : ''}>shopping_cart</span>
                    <span id="cart-badge" class="absolute -top-0.5 -right-0.5 bg-error text-on-error text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center scale-0 transition-transform shadow-md border border-surface">0</span>
                </button>
                
                <!-- Staff Login Lock Button -->
                <button id="nav-login-btn" class="text-white/70 hover:text-white hover:bg-white/10 transition-colors p-2 rounded-full flex items-center justify-center" title="สำหรับพนักงาน / เจ้าของร้าน">
                    <span class="material-symbols-outlined text-[22px]">lock</span>
                </button>
            </div>
        </div>
    `;

    // Attach event listeners
    header.querySelector('#nav-brand').addEventListener('click', () => {
        store.navigate('menu');
    });

    header.querySelector('#nav-shop').addEventListener('click', () => {
        store.navigate('menu');
    });

    header.querySelector('#nav-cart-link').addEventListener('click', () => {
        store.navigate('cart');
    });

    header.querySelector('#nav-cart-btn').addEventListener('click', () => {
        store.navigate('cart');
    });

    header.querySelector('#nav-login-btn').addEventListener('click', () => {
        store.navigate('login');
    });

    // Update cart badge when state changes
    const updateBadge = () => {
        const badge = header.querySelector('#cart-badge');
        const count = store.getCartCount();
        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('scale-0');
        } else {
            badge.classList.add('scale-0');
        }
    };
    
    // Subscribe to store to update badge
    store.subscribe(updateBadge);
    
    // Initial update
    setTimeout(updateBadge, 0);

    return header;
}


/* --- js/views/Admin.js --- */

function renderAdmin() {
    const container = document.createElement('div');
    container.className = 'w-full min-h-screen flex overflow-hidden bg-background text-on-surface font-body';

    const ordersList = store.state.orders || [];
    
    // Calculate total sales from all orders
    const totalSales = ordersList.reduce((sum, o) => {
        const amt = o.total !== undefined ? o.total : (o.total_amount !== undefined ? Number(o.total_amount) : 0);
        return sum + amt;
    }, 0);

    const totalOrdersCount = ordersList.length;

    container.innerHTML = `
        <!-- Sidebar Navigation -->
        <aside class="w-[260px] bg-primary flex flex-col shrink-0 h-screen border-r border-primary-hover shadow-[4px_0_12px_rgba(0,0,0,0.1)] z-20">
            <!-- Brand / Logo -->
            <div class="h-[80px] flex items-center px-lg border-b border-primary-hover cursor-pointer" id="admin-brand">
                <span class="font-h2 text-h2 text-secondary-container tracking-tight">FikaSmart<span class="text-on-primary font-body text-body ml-base">Admin</span></span>
            </div>
            
            <!-- Nav Links -->
            <nav class="flex-1 px-sm py-lg flex flex-col gap-base overflow-y-auto">
                <!-- Active Link -->
                <a class="flex items-center gap-md px-md py-sm bg-secondary-container text-on-secondary-container rounded-lg transition-colors group cursor-pointer">
                    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">dashboard</span>
                    <span class="font-label text-label">แดชบอร์ด</span>
                </a>
                <!-- Inactive Links -->
                <a id="admin-nav-pos" class="flex items-center gap-md px-md py-sm text-on-primary opacity-80 hover:opacity-100 hover:bg-primary-hover rounded-lg transition-colors group cursor-pointer">
                    <span class="material-symbols-outlined">point_of_sale</span>
                    <span class="font-label text-label">จุดขาย (POS)</span>
                </a>
                <a id="admin-nav-kds" class="flex items-center gap-md px-md py-sm text-on-primary opacity-80 hover:opacity-100 hover:bg-primary-hover rounded-lg transition-colors group cursor-pointer">
                    <span class="material-symbols-outlined">receipt_long</span>
                    <span class="font-label text-label">หน้าจอครัว (KDS)</span>
                </a>
                <a class="flex items-center gap-md px-md py-sm text-on-primary opacity-80 hover:opacity-100 hover:bg-primary-hover rounded-lg transition-colors group cursor-pointer">
                    <span class="material-symbols-outlined">inventory_2</span>
                    <span class="font-label text-label">สินค้า</span>
                </a>
            </nav>
            
            <!-- User Profile minimal -->
            <div class="p-lg border-t border-primary-hover flex items-center gap-md">
                <div class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-h3 text-h3">
                    M
                </div>
                <div class="flex flex-col">
                    <span class="font-label text-label text-on-primary">Manager</span>
                    <span class="font-caption text-caption text-on-primary opacity-70">สาขาหลัก</span>
                </div>
            </div>
        </aside>
        
        <!-- Main Content Area -->
        <main class="flex-1 flex flex-col h-screen overflow-hidden bg-background relative">
            <!-- Top Header Area -->
            <header class="h-[80px] bg-surface border-b border-border flex items-center justify-between px-xl shrink-0 z-10 shadow-sm">
                <h1 class="font-h1 text-h1 text-primary">ภาพรวมระบบ</h1>
                <div class="flex items-center gap-md">
                    <button id="admin-logout-btn" class="h-[44px] px-md bg-error/10 hover:bg-error/20 text-error font-label text-label rounded-DEFAULT flex items-center gap-xs transition-colors border border-error/20" title="ออกจากระบบหลังร้าน">
                        <span class="material-symbols-outlined" style="font-size: 20px;">lock</span>
                        ล็อคระบบ
                    </button>
                    <button id="go-to-shop" class="h-[44px] px-lg bg-primary hover:bg-primary-hover text-on-primary font-label text-label rounded-DEFAULT flex items-center gap-xs transition-colors">
                        <span class="material-symbols-outlined" style="font-size: 20px;">storefront</span>
                        กลับไปหน้าร้าน
                    </button>
                </div>
            </header>
            
            <!-- Scrollable Canvas -->
            <div class="flex-1 overflow-y-auto p-xl">
                <div class="max-w-container-max mx-auto flex flex-col gap-xl">
                    <!-- KPI Summary Cards (Bento Style Row 1) -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-lg">
                        <div class="bg-surface border border-border rounded-lg p-lg shadow-[0_1px_3px_rgba(17,17,17,0.06)] flex flex-col relative overflow-hidden">
                            <div class="absolute top-0 left-0 w-full h-1 bg-secondary-container"></div>
                            <div class="flex items-center justify-between mb-sm">
                                <span class="font-label text-label text-outline">ยอดขายทั้งหมด</span>
                                <span class="material-symbols-outlined text-secondary-container bg-surface-container w-8 h-8 flex items-center justify-center rounded-full">payments</span>
                            </div>
                            <div class="flex items-baseline gap-sm mt-auto">
                                <span class="font-display text-display text-primary tracking-tight">฿${totalSales.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                        </div>
                        
                        <div class="bg-surface border border-border rounded-lg p-lg shadow-[0_1px_3px_rgba(17,17,17,0.06)] flex flex-col">
                            <div class="flex items-center justify-between mb-sm">
                                <span class="font-label text-label text-outline">จำนวนคำสั่งซื้อทั้งหมด</span>
                                <span class="material-symbols-outlined text-primary bg-surface-container w-8 h-8 flex items-center justify-center rounded-full">shopping_bag</span>
                            </div>
                            <div class="flex items-baseline gap-sm mt-auto">
                                <span class="font-display text-display text-primary tracking-tight">${totalOrdersCount}</span>
                                <span class="font-body-sm text-body-sm text-outline">ออเดอร์</span>
                            </div>
                        </div>
                        
                        <div class="bg-surface border border-border rounded-lg p-lg shadow-[0_1px_3px_rgba(17,17,17,0.06)] flex flex-col">
                            <div class="flex items-center justify-between mb-sm">
                                <span class="font-label text-label text-outline">เวลารอเฉลี่ย</span>
                                <span class="material-symbols-outlined text-warning bg-surface-container w-8 h-8 flex items-center justify-center rounded-full">timer</span>
                            </div>
                            <div class="flex items-baseline gap-sm mt-auto">
                                <span class="font-dimensions text-display text-primary tracking-tight">04:30</span>
                                <span class="font-body-sm text-body-sm text-outline">นาที</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-surface border border-border rounded-lg shadow-[0_1px_3px_rgba(17,17,17,0.06)] overflow-hidden">
                        <div class="p-lg border-b border-border flex items-center justify-between bg-surface">
                            <h2 class="font-h2 text-h2 text-primary">คำสั่งซื้อล่าสุด</h2>
                        </div>
                        <div class="w-full overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-surface-container-low border-b border-border">
                                        <th class="p-md font-label text-label text-outline whitespace-nowrap">รหัสออเดอร์</th>
                                        <th class="p-md font-label text-label text-outline whitespace-nowrap">ลูกค้า / โต๊ะ</th>
                                        <th class="p-md font-label text-label text-outline whitespace-nowrap">เวลา</th>
                                        <th class="p-md font-label text-label text-outline whitespace-nowrap">รายการ</th>
                                        <th class="p-md font-label text-label text-outline whitespace-nowrap">จำนวนเงิน</th>
                                        <th class="p-md font-label text-label text-outline whitespace-nowrap">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-border">
                                    ${ordersList.map(order => {
                                        const ordNum = order.id || order.order_number || 'N/A';
                                        const ordTime = order.timestamp || (order.created_at ? new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A');
                                        const ordTotal = order.total !== undefined ? order.total : (order.total_amount !== undefined ? Number(order.total_amount) : 0);
                                        const ordStatus = order.status || order.order_status || 'PENDING';
                                        const custName = order.customer_name || 'ลูกค้าทั่วไป';
                                        const custEmail = order.customer_email || '-';
                                        
                                        let itemsText = 'ไม่มีรายละเอียด';
                                        if (order.items && order.items.length > 0) {
                                            itemsText = order.items.map(i => `${i.name} (x${i.quantity})`).join(', ');
                                        } else if (order.itemsSummary) {
                                            itemsText = order.itemsSummary;
                                        }
                                        
                                        let statusBadge = '';
                                        if (ordStatus === 'PENDING' || ordStatus === 'new') {
                                            statusBadge = '<span class="inline-flex items-center px-2 py-1 rounded-sm bg-primary/10 text-primary font-caption text-caption">ออเดอร์ใหม่</span>';
                                        } else if (ordStatus === 'PREPARING' || ordStatus === 'preparing') {
                                            statusBadge = '<span class="inline-flex items-center px-2 py-1 rounded-sm bg-secondary-container text-on-secondary-container font-caption text-caption">กำลังเตรียม</span>';
                                        } else if (ordStatus === 'COMPLETED' || ordStatus === 'ready') {
                                            statusBadge = '<span class="inline-flex items-center px-2 py-1 rounded-sm bg-tertiary-container text-on-tertiary-container font-caption text-caption">พร้อมเสิร์ฟ</span>';
                                        } else {
                                            statusBadge = `<span class="inline-flex items-center px-2 py-1 rounded-sm bg-outline-variant text-on-surface font-caption text-caption">${ordStatus}</span>`;
                                        }
                                        
                                        return `
                                            <tr class="hover:bg-surface-container-lowest transition-colors">
                                                <td class="p-md font-dimensions text-body-sm text-primary font-bold">#${ordNum}</td>
                                                <td class="p-md font-body-sm text-body-sm">
                                                    <div class="font-bold text-primary">${custName}</div>
                                                    <div class="text-[11px] text-text-secondary">${custEmail}</div>
                                                </td>
                                                <td class="p-md font-dimensions text-body-sm text-on-surface-variant">${ordTime}</td>
                                                <td class="p-md font-body-sm text-body-sm text-on-surface max-w-xs truncate" title="${itemsText}">${itemsText}</td>
                                                <td class="p-md font-dimensions text-body-sm text-on-surface">฿${ordTotal.toFixed(2)}</td>
                                                <td class="p-md">
                                                    ${statusBadge}
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                    ${ordersList.length === 0 ? '<tr><td colspan="6" class="p-md text-center text-outline font-body-sm">ไม่มีคำสั่งซื้อที่ค้างอยู่</td></tr>' : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    `;

    container.querySelector('#admin-brand').addEventListener('click', () => {
        store.navigate('menu');
    });

    container.querySelector('#admin-logout-btn').addEventListener('click', () => {
        store.logoutStaff();
    });

    container.querySelector('#go-to-shop').addEventListener('click', () => {
        store.navigate('menu');
    });

    container.querySelector('#admin-nav-pos').addEventListener('click', () => {
        store.navigate('pos');
    });

    container.querySelector('#admin-nav-kds').addEventListener('click', () => {
        store.navigate('kds');
    });

    return container;
}


/* --- js/views/Cart.js --- */

function renderCart() {
    const container = document.createElement('div');
    container.className = 'max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop mt-xl pb-xxl';

    const cartItems = store.state.cart;
    const total = store.getCartTotal();

    let itemsHtml = '';

    if (cartItems.length === 0) {
        itemsHtml = `
            <div class="text-center py-xxl bg-surface border border-border shadow-sm rounded">
                <span class="material-symbols-outlined text-[64px] text-outline mb-md">shopping_bag</span>
                <h2 class="font-h2 text-h2 text-text-primary mb-sm">ตะกร้าสินค้าว่างเปล่า</h2>
                <p class="font-body text-body text-text-secondary mb-lg">คุณยังไม่มีสินค้าใดๆ ในตะกร้า</p>
                <button id="back-to-shop" class="bg-primary text-on-primary px-lg py-sm rounded-DEFAULT font-label text-label hover:bg-primary-hover transition-colors">
                    กลับไปเลือกซื้อสินค้า
                </button>
            </div>
        `;
    } else {
        itemsHtml = cartItems.map(item => `
            <article class="bg-surface border border-border p-md flex gap-md items-start shadow-sm transition-shadow hover:shadow-md mb-md">
                <div class="w-24 h-24 bg-surface-container-low shrink-0 relative">
                    <img class="w-full h-full object-cover absolute inset-0" alt="${item.name}" src="${item.image}"/>
                </div>
                <div class="flex-grow flex flex-col justify-between h-full min-h-[96px]">
                    <div>
                        <div class="flex justify-between items-start mb-xs">
                            <h3 class="font-product-name text-product-name text-text-primary">${item.name}</h3>
                            <span class="font-price text-price text-text-primary whitespace-nowrap ml-md">฿${((item.finalPrice || item.price) * item.quantity).toFixed(2)}</span>
                        </div>
                        ${item.options ? `
                            <div class="font-caption text-caption text-text-secondary mb-2">
                                ${item.options.type ? `<div>ประเภท: ${item.options.type}</div>` : ''}
                                <div>ความหวาน: ${item.options.sweetness}%</div>
                                ${item.options.toppings && item.options.toppings.length > 0 ? `<div>ท็อปปิ้ง: ${item.options.toppings.join(', ')}</div>` : ''}
                                ${item.options.notes ? `<div class="italic">"${item.options.notes}"</div>` : ''}
                            </div>
                        ` : ''}
                    </div>
                    <div class="flex justify-between items-center mt-auto pt-sm border-t border-border border-dashed">
                        <!-- Quantity Stepper -->
                        <div class="flex items-center border border-border rounded w-[100px] h-10 overflow-hidden bg-surface">
                            <button class="dec-btn w-10 h-full flex items-center justify-center text-primary hover:bg-surface-container-low transition-colors active:bg-surface-variant" data-id="${item.cartItemId}">
                                <span class="material-symbols-outlined text-[18px]">remove</span>
                            </button>
                            <span class="flex-1 text-center font-dimensions text-dimensions text-text-primary border-x border-border h-full flex items-center justify-center">${item.quantity}</span>
                            <button class="inc-btn w-10 h-full flex items-center justify-center text-primary hover:bg-surface-container-low transition-colors active:bg-surface-variant" data-id="${item.cartItemId}">
                                <span class="material-symbols-outlined text-[18px]">add</span>
                            </button>
                        </div>
                        <button class="del-btn text-error font-label text-label flex items-center gap-xs hover:bg-error-container hover:text-on-error-container px-sm py-xs rounded transition-colors group" data-id="${item.cartItemId}">
                            <span class="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">delete</span>
                            <span class="hidden sm:inline">ลบออก</span>
                        </button>
                    </div>
                </div>
            </article>
        `).join('');
    }

    container.innerHTML = `
        <header class="mb-lg md:mb-xl border-b border-border pb-md">
            <h1 class="font-h1-mobile text-h1-mobile md:font-h1 md:text-h1 text-text-primary">ตะกร้าสินค้าของคุณ</h1>
        </header>
        <div class="flex flex-col lg:flex-row gap-xl">
            <!-- Cart Items List -->
            <div class="flex-grow flex flex-col" id="cart-list">
                ${itemsHtml}
            </div>

            ${cartItems.length > 0 ? `
            <!-- Order Summary Sidebar -->
            <aside class="w-full lg:w-[380px] shrink-0">
                <div class="bg-surface border border-border p-lg sticky top-[88px] shadow-sm">
                    <h2 class="font-h3 text-h3 text-text-primary mb-lg border-b border-border pb-xs">สรุปรายการสั่งซื้อ</h2>
                    <div class="flex flex-col gap-sm font-body text-body text-text-secondary mb-lg">
                        <div class="flex justify-between">
                            <span>ยอดรวมสินค้า</span>
                            <span class="font-dimensions text-dimensions text-text-primary">฿${total.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>ภาษีโดยประมาณ</span>
                            <span class="font-dimensions text-dimensions text-text-primary">฿0.00</span>
                        </div>
                    </div>
                    <div class="flex justify-between items-center border-t border-border pt-md mb-lg">
                        <span class="font-h3 text-h3 text-text-primary">ยอดสุทธิ</span>
                        <span class="font-price text-price text-text-primary">฿${total.toFixed(2)}</span>
                    </div>
                    <button id="checkout-btn" class="w-full h-[44px] bg-secondary-container text-on-secondary-container font-label text-label hover:bg-secondary-fixed hover:shadow-md transition-all flex items-center justify-center gap-xs active:scale-[0.98]">
                        ดำเนินการชำระเงิน
                        <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                    <p class="font-caption text-caption text-text-secondary text-center mt-md flex items-center justify-center gap-xs">
                        <span class="material-symbols-outlined text-[14px]">lock</span> การเชื่อมต่อที่ปลอดภัย
                    </p>
                </div>
            </aside>
            ` : ''}
        </div>
    `;

    if (cartItems.length === 0) {
        container.querySelector('#back-to-shop').addEventListener('click', () => {
            store.navigate('menu');
        });
    } else {
        // Event listeners for quantity changes
        container.querySelectorAll('.inc-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                store.updateQuantity(e.currentTarget.dataset.id, 1);
            });
        });

        container.querySelectorAll('.dec-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                store.updateQuantity(e.currentTarget.dataset.id, -1);
            });
        });

        container.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                store.removeFromCart(e.currentTarget.dataset.id);
            });
        });

        const checkoutBtn = container.querySelector('#checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                showPaymentModal();
            });
        }

        function showPaymentModal() {
            const savedEmail = localStorage.getItem('customer_email') || '';
            const savedName = localStorage.getItem('customer_name') || '';
            let selectedMethod = 'promptpay'; // 'promptpay' or 'cash'

            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto';
            modal.innerHTML = `
                <div class="bg-surface w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-border my-auto">
                    <div class="flex justify-between items-center pb-3 border-b border-border mb-4">
                        <h3 class="font-h2 text-xl font-bold text-text-primary flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary text-[28px]">payments</span>
                            ยืนยันการชำระเงิน
                        </h3>
                        <button id="pay-close-btn" class="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-surface-variant">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <form id="payment-form" class="flex flex-col gap-4">
                        <!-- Customer Info -->
                        <div class="bg-surface-container-low p-4 rounded-xl border border-border/80">
                            <h4 class="font-label text-sm font-bold text-text-primary mb-3 flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-[18px]">person</span> ข้อมูลลูกค้า
                            </h4>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label class="font-caption text-xs text-text-secondary block mb-1">อีเมลของคุณ <span class="text-error">*</span></label>
                                    <input type="email" id="pay-email" required value="${savedEmail}" placeholder="your.email@example.com" class="w-full h-10 px-3 bg-surface border border-border rounded-lg text-body-sm focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label class="font-caption text-xs text-text-secondary block mb-1">ชื่อลูกค้า หรือ เบอร์โต๊ะ <span class="text-error">*</span></label>
                                    <input type="text" id="pay-name" required value="${savedName}" placeholder="เช่น โต๊ะ 3 / คุณเตวิช" class="w-full h-10 px-3 bg-surface border border-border rounded-lg text-body-sm focus:border-primary outline-none" />
                                </div>
                            </div>
                        </div>

                        <!-- Payment Method Selection -->
                        <div>
                            <label class="font-label text-sm font-bold text-text-primary block mb-2">เลือกวิธีชำระเงิน</label>
                            <div class="grid grid-cols-2 gap-3">
                                <label id="method-promptpay-card" class="cursor-pointer border-2 border-primary bg-primary/5 rounded-xl p-3 flex flex-col items-center text-center transition-all">
                                    <input type="radio" name="pay_method" value="promptpay" checked class="hidden" />
                                    <span class="material-symbols-outlined text-primary text-[28px] mb-1">qr_code_scanner</span>
                                    <span class="font-bold text-xs text-primary">สแกนจ่าย QR Code</span>
                                    <span class="text-[10px] text-text-secondary mt-0.5">พร้อมเพย์ PromptPay</span>
                                </label>
                                <label id="method-cash-card" class="cursor-pointer border-2 border-border bg-surface rounded-xl p-3 flex flex-col items-center text-center transition-all hover:bg-surface-variant">
                                    <input type="radio" name="pay_method" value="cash" class="hidden" />
                                    <span class="material-symbols-outlined text-text-secondary text-[28px] mb-1">payments</span>
                                    <span class="font-bold text-xs text-text-primary">ชำระเงินสด</span>
                                    <span class="text-[10px] text-text-secondary mt-0.5">ชำระที่เคาน์เตอร์บาร์</span>
                                </label>
                            </div>
                        </div>

                        <!-- PromptPay QR Code Box (shown when PromptPay is selected) -->
                        <div id="qr-box" class="bg-surface-container-low p-4 rounded-xl border border-border flex flex-col items-center text-center">
                            <p class="font-bold text-xs text-text-primary mb-1">สแกน QR Code เพื่อชำระเงิน</p>
                            <p class="text-[11px] text-text-secondary mb-3">ยอดชำระสุทธิ: <strong class="text-primary text-sm font-bold">฿${total.toFixed(2)}</strong></p>
                            <div class="bg-white p-3 rounded-xl border-2 border-border shadow-sm mb-2">
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=MAEWA-CAFE-PROMPTPAY-TOTAL-${total.toFixed(2)}" alt="PromptPay QR Code" class="w-40 h-40 object-contain mx-auto" />
                            </div>
                            <p class="text-[10px] text-text-secondary">เปิดแอปธนาคาร สแกน QR แล้วกดยืนยันชำระเงินด้านล่าง</p>
                        </div>

                        <!-- Cash Box (shown when cash is selected) -->
                        <div id="cash-box" class="hidden bg-surface-container-low p-4 rounded-xl border border-border text-center">
                            <span class="material-symbols-outlined text-secondary-container text-[36px] mb-1">storefront</span>
                            <p class="font-bold text-xs text-text-primary mb-1">ชำระเงินสดที่เคาน์เตอร์</p>
                            <p class="text-[11px] text-text-secondary">กดยืนยันเพื่อส่งออเดอร์เข้าครัว แล้วนำเงินสด <strong>฿${total.toFixed(2)}</strong> ไปชำระกับพนักงานที่เคาน์เตอร์บาร์น้ำครับ</p>
                        </div>

                        <!-- Order Summary Line -->
                        <div class="flex justify-between items-center bg-surface-variant p-3 rounded-lg font-bold text-sm">
                            <span>ยอดรวมทั้งสิ้น (${cartItems.reduce((acc, i) => acc + i.quantity, 0)} แก้ว)</span>
                            <span class="text-primary text-base">฿${total.toFixed(2)}</span>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex gap-2 pt-2">
                            <button type="button" id="pay-cancel-btn" class="flex-1 h-12 bg-surface border border-border text-text-secondary rounded-xl font-label text-label hover:bg-surface-container">ยกเลิก</button>
                            <button type="submit" id="pay-confirm-btn" class="flex-[2] h-12 bg-primary text-on-primary rounded-xl font-label text-label hover:bg-primary-hover font-bold shadow-md flex items-center justify-center gap-1.5">
                                <span class="material-symbols-outlined text-[20px]">check_circle</span>
                                ยืนยันการชำระเงินและสั่งซื้อ
                            </button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            // Toggle payment method
            const qrBox = modal.querySelector('#qr-box');
            const cashBox = modal.querySelector('#cash-box');
            const ppCard = modal.querySelector('#method-promptpay-card');
            const cashCard = modal.querySelector('#method-cash-card');

            ppCard.addEventListener('click', () => {
                selectedMethod = 'promptpay';
                ppCard.className = 'cursor-pointer border-2 border-primary bg-primary/5 rounded-xl p-3 flex flex-col items-center text-center transition-all';
                ppCard.querySelector('span.material-symbols-outlined').className = 'material-symbols-outlined text-primary text-[28px] mb-1';
                ppCard.querySelector('span.font-bold').className = 'font-bold text-xs text-primary';
                
                cashCard.className = 'cursor-pointer border-2 border-border bg-surface rounded-xl p-3 flex flex-col items-center text-center transition-all hover:bg-surface-variant';
                cashCard.querySelector('span.material-symbols-outlined').className = 'material-symbols-outlined text-text-secondary text-[28px] mb-1';
                cashCard.querySelector('span.font-bold').className = 'font-bold text-xs text-text-primary';
                
                qrBox.classList.remove('hidden');
                cashBox.classList.add('hidden');
            });

            cashCard.addEventListener('click', () => {
                selectedMethod = 'cash';
                cashCard.className = 'cursor-pointer border-2 border-primary bg-primary/5 rounded-xl p-3 flex flex-col items-center text-center transition-all';
                cashCard.querySelector('span.material-symbols-outlined').className = 'material-symbols-outlined text-primary text-[28px] mb-1';
                cashCard.querySelector('span.font-bold').className = 'font-bold text-xs text-primary';
                
                ppCard.className = 'cursor-pointer border-2 border-border bg-surface rounded-xl p-3 flex flex-col items-center text-center transition-all hover:bg-surface-variant';
                ppCard.querySelector('span.material-symbols-outlined').className = 'material-symbols-outlined text-text-secondary text-[28px] mb-1';
                ppCard.querySelector('span.font-bold').className = 'font-bold text-xs text-text-primary';
                
                cashBox.classList.remove('hidden');
                qrBox.classList.add('hidden');
            });

            modal.querySelector('#pay-close-btn').addEventListener('click', () => modal.remove());
            modal.querySelector('#pay-cancel-btn').addEventListener('click', () => modal.remove());

            modal.querySelector('#payment-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = modal.querySelector('#pay-email').value.trim();
                const name = modal.querySelector('#pay-name').value.trim();

                if (!email || !name) return;

                store.setCustomer(email, name);

                const confirmBtn = modal.querySelector('#pay-confirm-btn');
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[20px]">sync</span> กำลังส่งออเดอร์...`;

                const order = await store.checkout(selectedMethod);
                modal.remove();

                if (order) {
                    showReceiptModal(order);
                }
            });
        }

        function showReceiptModal(order) {
            const existing = document.getElementById('receipt-modal-container');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'receipt-modal-container';
            modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto';

            const itemsRows = (order.items || []).map(item => `
                <tr class="border-b border-dashed border-gray-300">
                    <td class="py-2 text-left align-top">
                        <div class="font-bold text-xs text-gray-900">${item.name}</div>
                        ${item.options ? `
                            <div class="text-[10px] text-gray-600">
                                หวาน ${item.options.sweetness}%
                                ${item.options.toppings && item.options.toppings.length > 0 ? ` | ท็อปปิ้ง: ${item.options.toppings.join(', ')}` : ''}
                                ${item.options.notes ? ` | หมายเหตุ: ${item.options.notes}` : ''}
                            </div>
                        ` : ''}
                    </td>
                    <td class="py-2 text-center align-top text-xs text-gray-800">${item.quantity}</td>
                    <td class="py-2 text-right align-top text-xs font-bold text-gray-900">฿${((item.finalPrice || item.price) * item.quantity).toFixed(2)}</td>
                </tr>
            `).join('');

            modal.innerHTML = `
                <div class="w-full max-w-md my-auto flex flex-col items-center">
                    <!-- Printable Receipt Ticket -->
                    <div id="printable-receipt" class="bg-white text-black p-6 rounded-2xl shadow-2xl border border-gray-200 w-full font-mono text-xs relative">
                        <!-- Receipt Header -->
                        <div class="text-center pb-3 border-b-2 border-dashed border-gray-400">
                            <h2 class="text-xl font-black tracking-tight text-gray-900">ร้านแม่วะคาเฟ่</h2>
                            <p class="text-[11px] text-gray-600 font-sans mt-0.5">Mae Wa Cafe & Beverage</p>
                            <p class="text-[10px] text-gray-500 font-sans mt-1">วันที่: ${order.date || new Date().toLocaleDateString('th-TH')} เวลา: ${order.timestamp}</p>
                        </div>

                        <!-- Queue Number Box -->
                        <div class="my-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-center">
                            <span class="text-[11px] text-gray-600 font-sans font-bold block">หมายเลขคิวของคุณ</span>
                            <span class="text-4xl font-black text-gray-900 tracking-wider my-1 inline-block">${order.queue || order.queue_number}</span>
                            <span class="text-[10px] text-gray-500 font-sans block">เลขออเดอร์: ${order.id}</span>
                        </div>

                        <!-- Customer & Payment Info -->
                        <div class="bg-gray-100 p-2.5 rounded-lg text-[11px] font-sans text-gray-700 mb-3 space-y-0.5">
                            <div>👤 ลูกค้า: <strong>${order.customer_name}</strong></div>
                            <div>✉️ อีเมล: <strong>${order.customer_email}</strong></div>
                            <div>💳 วิธีชำระ: <strong>${order.payment_method === 'cash' ? 'ชำระเงินสด' : 'สแกนจ่าย QR Code'}</strong></div>
                        </div>

                        <!-- Items Table -->
                        <table class="w-full text-left mb-3">
                            <thead>
                                <tr class="border-b-2 border-gray-400 text-[11px] font-bold text-gray-700">
                                    <th class="pb-1">รายการ</th>
                                    <th class="pb-1 text-center">จน.</th>
                                    <th class="pb-1 text-right">ราคา</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsRows}
                            </tbody>
                        </table>

                        <!-- Total -->
                        <div class="border-t-2 border-gray-900 pt-2 mb-3 flex justify-between items-center text-sm font-black">
                            <span>ยอดสุทธิ (TOTAL)</span>
                            <span class="text-base text-gray-900">฿${(order.total || order.total_amount || 0).toFixed(2)}</span>
                        </div>

                        <!-- Footer -->
                        <div class="text-center text-[10px] text-gray-500 pt-2 border-t border-dashed border-gray-300 font-sans">
                            <p class="font-bold text-gray-700">ขอบพระคุณที่อุดหนุนครับ! ☕</p>
                            <p class="mt-0.5">กรุณารอเรียกคิว ระบบจะส่งเสียงแจ้งเตือนเมื่อเครื่องดื่มทำเสร็จครับ</p>
                        </div>
                    </div>

                    <!-- Modal Actions (Hidden on Print) -->
                    <div class="w-full mt-4 flex gap-3 no-print">
                        <button id="print-receipt-btn" class="flex-1 h-12 bg-secondary-container text-on-secondary-container font-bold text-sm rounded-xl hover:bg-secondary-fixed transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95">
                            <span class="material-symbols-outlined text-[22px]">print</span>
                            พิมพ์ใบเสร็จ (Print)
                        </button>
                        <button id="close-receipt-btn" class="flex-1 h-12 bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary-hover transition-all flex items-center justify-center gap-1 shadow-lg active:scale-95">
                            <span class="material-symbols-outlined text-[20px]">done</span>
                            กลับหน้าเมนู
                        </button>
                    </div>

                    <div class="no-print mt-3 text-center text-xs text-white/80 bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[16px] text-secondary-container animate-pulse">notifications_active</span>
                        เมื่อเครื่องดื่มทำเสร็จแล้ว ระบบจะส่งเสียงและแจ้งเตือนที่หน้าจอนี้ทันที
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('#print-receipt-btn').addEventListener('click', () => {
                window.print();
            });

            modal.querySelector('#close-receipt-btn').addEventListener('click', () => {
                modal.remove();
                store.navigate('menu');
            });
        }

        // Expose to window so ready notification can open receipt
        window.showReceiptModal = showReceiptModal;
    }

    return container;
}


/* --- js/views/KDS.js --- */

function renderKDS() {
    const container = document.createElement('div');
    container.className = 'w-full min-h-screen bg-background text-on-background font-body flex flex-col';

    const orders = store.state.orders || [];
    const isNew = o => o.status === 'PENDING' || o.status === 'new' || o.order_status === 'PENDING' || o.order_status === 'new';
    const isPreparing = o => o.status === 'PREPARING' || o.status === 'preparing' || o.order_status === 'PREPARING' || o.order_status === 'preparing';
    const isReady = o => o.status === 'COMPLETED' || o.status === 'ready' || o.order_status === 'COMPLETED' || o.order_status === 'ready';

    const newOrders = orders.filter(isNew);
    const preparingOrders = orders.filter(isPreparing);
    const readyOrders = orders.filter(isReady);

    container.innerHTML = `
        <!-- TopNavBar -->
        <header class="bg-primary text-on-primary w-full z-50 flex justify-between items-center px-gutter-desktop h-[64px] border-b border-outline-variant shadow-md">
            <div class="flex items-center gap-xl cursor-pointer" id="kds-brand">
                <h1 class="font-h2 text-h2 text-on-primary tracking-tight">FikaSmart KDS</h1>
            </div>
            <div class="flex items-center gap-md">
                <button id="kds-to-menu" class="h-[36px] px-md bg-secondary-container text-on-secondary-container font-label text-label rounded hover:bg-secondary-fixed transition-colors">หน้าร้าน (Shop)</button>
            </div>
        </header>
        
        <!-- Main Content Canvas -->
        <main class="flex-grow pt-4 pb-lg px-gutter-desktop md:max-w-container-max md:mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-gutter-desktop overflow-hidden h-[calc(100vh-64px)]">
            
            <!-- Column 1: New Orders -->
            <section class="flex flex-col bg-surface-container-low rounded-lg border border-border h-full overflow-hidden">
                <header class="bg-surface-variant text-on-surface-variant px-md py-sm border-b border-border flex justify-between items-center">
                    <h2 class="font-h3 text-h3 flex items-center gap-xs">
                        <span class="material-symbols-outlined">inbox</span> ออเดอร์ใหม่ (New)
                    </h2>
                    <span class="bg-error text-on-error font-dimensions text-dimensions px-sm py-base rounded-full">${newOrders.length}</span>
                </header>
                <div class="flex-1 overflow-y-auto p-md flex flex-col gap-md">
                    ${newOrders.map(order => {
                        const ordNum = order.queue || order.queue_number || order.id || order.order_number || 'N/A';
                        const ordTime = order.timestamp || (order.created_at ? new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A');
                        const ordId = order.id || order.order_number;
                        const items = order.items || [];
                        return `
                            <article class="bg-surface rounded-lg border border-border p-md shadow-sm relative">
                                <div class="flex justify-between items-start mb-xs">
                                    <span class="font-dimensions text-dimensions font-bold text-primary text-xl">${ordNum}</span>
                                    <span class="font-dimensions text-dimensions text-error">${ordTime}</span>
                                </div>
                                <div class="text-[11px] text-text-secondary mb-2 bg-surface-container-low p-2 rounded flex justify-between">
                                    <span>👤 <strong>${order.customer_name || 'ลูกค้าทั่วไป'}</strong></span>
                                    <span>✉️ ${order.customer_email || '-'}</span>
                                </div>
                                <div class="border-t border-border pt-xs mb-md">
                                    ${items.map(item => `
                                        <div class="flex justify-between items-center py-base font-product-name text-product-name text-on-surface">
                                            <span>${item.quantity}x ${item.name}</span>
                                        </div>
                                        ${item.options ? `
                                            <ul class="font-body-sm text-body-sm text-text-secondary pl-lg list-disc">
                                                <li>หวาน ${item.options.sweetness}%</li>
                                                ${(item.options.toppings || []).map(t => `<li>${t}</li>`).join('')}
                                                ${item.options.notes ? `<li><em>${item.options.notes}</em></li>` : ''}
                                            </ul>
                                        ` : ''}
                                    `).join('')}
                                    ${items.length === 0 ? '<p class="font-body-sm text-text-secondary text-center">ไม่มีรายละเอียดรายการ</p>' : ''}
                                </div>
                                <button data-action="accept" data-id="${ordId}" class="w-full bg-primary text-on-primary font-label text-label h-[44px] rounded-DEFAULT hover:bg-primary-hover transition-colors flex justify-center items-center gap-xs">
                                    <span class="material-symbols-outlined">check</span> รับออเดอร์ (Accept)
                                </button>
                            </article>
                        `;
                    }).join('')}
                    ${newOrders.length === 0 ? '<div class="text-center text-outline p-4 font-body-sm">ไม่มีออเดอร์ใหม่</div>' : ''}
                </div>
            </section>

            <!-- Column 2: Preparing -->
            <section class="flex flex-col bg-surface-container-low rounded-lg border border-border h-full overflow-hidden">
                <header class="bg-surface-variant text-on-surface-variant px-md py-sm border-b border-border flex justify-between items-center">
                    <h2 class="font-h3 text-h3 flex items-center gap-xs">
                        <span class="material-symbols-outlined">blender</span> กำลังเตรียม (Preparing)
                    </h2>
                    <span class="bg-secondary-container text-on-secondary-container font-dimensions text-dimensions px-sm py-base rounded-full">${preparingOrders.length}</span>
                </header>
                <div class="flex-1 overflow-y-auto p-md flex flex-col gap-md">
                    ${preparingOrders.map(order => {
                        const ordNum = order.queue || order.queue_number || order.id || order.order_number || 'N/A';
                        const ordTime = order.timestamp || (order.created_at ? new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A');
                        const ordId = order.id || order.order_number;
                        const items = order.items || [];
                        return `
                            <article class="bg-surface rounded-lg border-2 border-secondary-fixed p-md shadow-md relative">
                                <div class="flex justify-between items-start mb-xs">
                                    <span class="font-dimensions text-dimensions font-bold text-primary text-xl">${ordNum}</span>
                                    <span class="font-dimensions text-dimensions text-text-secondary">${ordTime}</span>
                                </div>
                                <div class="text-[11px] text-text-secondary mb-2 bg-surface-container-low p-2 rounded flex justify-between">
                                    <span>👤 <strong>${order.customer_name || 'ลูกค้าทั่วไป'}</strong></span>
                                    <span>✉️ ${order.customer_email || '-'}</span>
                                </div>
                                <div class="border-t border-border pt-xs mb-md">
                                    ${items.map(item => `
                                        <div class="flex justify-between items-center py-base font-product-name text-product-name text-on-surface">
                                            <span>${item.quantity}x ${item.name}</span>
                                        </div>
                                        ${item.options ? `
                                            <ul class="font-body-sm text-body-sm text-text-secondary pl-lg list-disc">
                                                <li>หวาน ${item.options.sweetness}%</li>
                                                ${(item.options.toppings || []).map(t => `<li>${t}</li>`).join('')}
                                                ${item.options.notes ? `<li><em>${item.options.notes}</em></li>` : ''}
                                            </ul>
                                        ` : ''}
                                    `).join('')}
                                    ${items.length === 0 ? '<p class="font-body-sm text-text-secondary text-center">ไม่มีรายละเอียดรายการ</p>' : ''}
                                </div>
                                <button data-action="complete" data-id="${ordId}" class="w-full bg-tertiary-container text-on-tertiary-container font-label text-label h-[44px] rounded-DEFAULT hover:opacity-90 transition-opacity flex justify-center items-center gap-xs">
                                    <span class="material-symbols-outlined">done_all</span> เสร็จสิ้น (Complete)
                                </button>
                            </article>
                        `;
                    }).join('')}
                    ${preparingOrders.length === 0 ? '<div class="text-center text-outline p-4 font-body-sm">ไม่มีออเดอร์กำลังเตรียม</div>' : ''}
                </div>
            </section>

            <!-- Column 3: Ready -->
            <section class="flex flex-col bg-surface-container-low rounded-lg border border-border h-full overflow-hidden opacity-80">
                <header class="bg-surface-variant text-on-surface-variant px-md py-sm border-b border-border flex justify-between items-center">
                    <h2 class="font-h3 text-h3 flex items-center gap-xs">
                        <span class="material-symbols-outlined">storefront</span> พร้อมเสิร์ฟ (Ready)
                    </h2>
                    <span class="bg-outline-variant text-on-surface-variant font-dimensions text-dimensions px-sm py-base rounded-full">${readyOrders.length}</span>
                </header>
                <div class="flex-1 overflow-y-auto p-md flex flex-col gap-md">
                    ${readyOrders.map(order => {
                        const ordNum = order.queue || order.queue_number || order.id || order.order_number || 'N/A';
                        const itemsCount = order.items ? order.items.reduce((acc, i) => acc + i.quantity, 0) : 0;
                        return `
                            <article class="bg-surface rounded-lg border border-border p-md shadow-sm relative">
                                <div class="flex justify-between items-start mb-xs">
                                    <span class="font-dimensions text-dimensions font-bold text-outline text-xl line-through">${ordNum}</span>
                                    <span class="font-caption text-caption text-text-secondary flex items-center gap-xs bg-surface-container px-sm py-base rounded-full">
                                        <span class="material-symbols-outlined text-sm">check_circle</span>
                                        รอรับ
                                    </span>
                                </div>
                                <div class="border-t border-border pt-xs">
                                    <div class="flex justify-between items-center py-base">
                                        <span class="font-body-sm text-body-sm text-text-secondary">${itemsCount} รายการ</span>
                                    </div>
                                </div>
                            </article>
                        `;
                    }).join('')}
                    ${readyOrders.length === 0 ? '<div class="text-center text-outline p-4 font-body-sm">ไม่มีออเดอร์รอรับ</div>' : ''}
                </div>
            </section>
        </main>
    `;

    // Event Listeners
    container.querySelector('#kds-brand').addEventListener('click', () => store.navigate('menu'));
    container.querySelector('#kds-to-menu').addEventListener('click', () => store.navigate('menu'));

    container.querySelectorAll('button[data-action="accept"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = e.currentTarget.dataset.id;
            store.updateOrderStatus(orderId, 'PREPARING');
        });
    });

    container.querySelectorAll('button[data-action="complete"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = e.currentTarget.dataset.id;
            store.updateOrderStatus(orderId, 'COMPLETED');
        });
    });

    return container;
}


/* --- js/views/Login.js --- */

function renderLogin() {
    const container = document.createElement('div');
    container.className = 'w-full min-h-screen bg-surface flex items-center justify-center font-body text-body text-text-primary antialiased p-4';

    const targetName = store.state.pendingRoute ? store.state.pendingRoute.toUpperCase() : 'หลังร้าน';

    container.innerHTML = `
        <div class="w-full max-w-[420px] mx-auto flex flex-col items-center">
            <!-- Brand Logo Area -->
            <div class="mb-lg w-full flex flex-col items-center cursor-pointer" id="login-brand">
                <div class="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg mb-sm hover:scale-105 transition-transform">
                    <span class="material-symbols-outlined text-[40px] text-on-primary">admin_panel_settings</span>
                </div>
                <h2 class="font-h2 text-h2 text-text-primary">ร้านแม่วะคาเฟ่</h2>
                <p class="font-caption text-caption text-text-secondary">ระบบจัดการหลังร้าน (Staff & Admin Only)</p>
            </div>

            <!-- Login Form Card -->
            <div class="w-full bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-border shadow-xl">
                <div class="text-center mb-6">
                    <h1 class="font-h2 text-h2 text-text-primary mb-1">ยืนยันรหัสเข้าใช้งาน</h1>
                    <p class="font-body-sm text-body-sm text-text-secondary">กรุณากรอกรหัสผ่านพนักงานเพื่อเข้าสู่หน้า ${targetName}</p>
                </div>
                
                <form class="flex flex-col gap-5" id="passcode-form">
                    <!-- Error Alert -->
                    <div id="error-alert" class="hidden bg-error-container text-on-error-container p-3 rounded-lg text-caption flex items-center gap-2 border border-error/20">
                        <span class="material-symbols-outlined text-[18px]">error</span>
                        <span id="error-msg">รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง</span>
                    </div>

                    <!-- Passcode Field -->
                    <div class="flex flex-col gap-1.5 relative">
                        <label class="font-label text-label text-text-primary" for="passcode">รหัสผ่านพนักงาน / เจ้าของร้าน</label>
                        <div class="relative w-full">
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline z-10 pointer-events-none">lock</span>
                            <input class="w-full h-12 pl-10 pr-10 bg-surface border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 font-dimensions text-body tracking-wider text-text-primary placeholder:text-outline transition-all outline-none" id="passcode" placeholder="กรอกรหัสผ่าน 11 หลัก..." required type="password" autocomplete="off" autofocus />
                            <button class="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-text-primary transition-colors focus:outline-none" tabindex="-1" type="button" id="toggle-passcode">
                                <span class="material-symbols-outlined text-[20px]">visibility_off</span>
                            </button>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <div class="flex flex-col gap-3 mt-2">
                        <button class="w-full h-12 bg-primary text-on-primary font-label text-label rounded-xl hover:bg-primary-hover active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 font-bold" type="submit">
                            <span>เข้าสู่ระบบหลังร้าน</span>
                            <span class="material-symbols-outlined text-[20px]">key</span>
                        </button>
                        
                        <button id="back-to-menu-btn" class="w-full h-11 bg-surface text-text-secondary border border-border font-label text-label rounded-xl hover:bg-surface-container transition-all flex items-center justify-center gap-2" type="button">
                            <span class="material-symbols-outlined text-[18px]">arrow_back</span>
                            กลับไปหน้าร้าน (สำหรับลูกค้า)
                        </button>
                    </div>
                </form>
            </div>
            
            <div class="mt-8 font-caption text-caption text-outline text-center flex flex-col gap-1">
                <p>🔒 ระบบการเชื่อมต่อปลอดภัย ร้านแม่วะคาเฟ่</p>
            </div>
        </div>
    `;

    // Form logic
    const form = container.querySelector('#passcode-form');
    const passcodeInput = container.querySelector('#passcode');
    const errorAlert = container.querySelector('#error-alert');
    const errorMsg = container.querySelector('#error-msg');
    const toggleBtn = container.querySelector('#toggle-passcode');

    toggleBtn.addEventListener('click', () => {
        const type = passcodeInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passcodeInput.setAttribute('type', type);
        toggleBtn.innerHTML = `<span class="material-symbols-outlined text-[20px]">${type === 'password' ? 'visibility_off' : 'visibility'}</span>`;
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = passcodeInput.value.trim();
        
        const success = store.verifyPasscode(code);
        if (!success) {
            errorMsg.textContent = 'รหัสผ่านพนักงานไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
            errorAlert.classList.remove('hidden');
            passcodeInput.value = '';
            passcodeInput.focus();
        }
    });

    container.querySelector('#back-to-menu-btn').addEventListener('click', () => {
        store.navigate('menu');
    });

    container.querySelector('#login-brand').addEventListener('click', () => {
        store.navigate('menu');
    });

    return container;
}


/* --- js/views/Menu.js --- */

function renderMenu() {
    const container = document.createElement('div');
    container.className = 'px-gutter-mobile md:px-gutter-desktop max-w-container-max mx-auto mt-lg pb-xxl';

    let activeCategory = 'ทั้งหมด';
    let searchQuery = '';

    const activeOrder = store.state.activeOrder;
    let activeBannerHtml = '';
    if (activeOrder && (!activeOrder.acknowledged || activeOrder.status !== 'COMPLETED')) {
        const isReady = activeOrder.status === 'COMPLETED' || activeOrder.status === 'READY' || activeOrder.status === 'SERVED';
        const isPrep = activeOrder.status === 'PREPARING';
        const statusText = isReady ? 'เครื่องดื่มเสร็จแล้ว! พร้อมรับที่เคาน์เตอร์ 🎉' : isPrep ? 'บาร์กำลังเตรียมเครื่องดื่ม...' : 'รับออเดอร์แล้ว (รอดำเนินการ)';
        const bgClass = isReady ? 'bg-secondary-container text-on-secondary-container border-2 border-primary' : 'bg-primary text-on-primary';
        
        activeBannerHtml = `
            <div class="${bgClass} rounded-2xl p-4 mb-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div class="flex items-center gap-3 w-full sm:w-auto">
                    <div class="w-12 h-12 ${isReady ? 'bg-primary text-white' : 'bg-secondary-container text-on-secondary-container'} rounded-full flex items-center justify-center shrink-0 shadow-md">
                        <span class="material-symbols-outlined text-[28px] ${isReady ? 'animate-bounce' : 'animate-pulse'}">local_cafe</span>
                    </div>
                    <div>
                        <div class="text-xs ${isReady ? 'text-primary font-bold' : 'text-white/70'} font-medium">ติดตามสถานะออเดอร์ของคุณ</div>
                        <div class="font-bold text-base flex flex-wrap items-center gap-2">
                            <span>คิว: <strong class="text-xl">${activeOrder.queue || activeOrder.queue_number}</strong></span>
                            <span class="text-xs px-2.5 py-0.5 rounded-full ${isReady ? 'bg-primary text-white font-bold' : 'bg-white/20 text-white'}">${statusText}</span>
                        </div>
                    </div>
                </div>
                <button id="view-active-receipt-btn" class="w-full sm:w-auto px-4 py-2.5 ${isReady ? 'bg-primary text-white hover:bg-primary-hover' : 'bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed'} font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95">
                    <span class="material-symbols-outlined text-[18px]">receipt_long</span>
                    ดูใบเสร็จ / พิมพ์
                </button>
            </div>
        `;
    }

    container.innerHTML = `
        ${activeBannerHtml}

        <!-- Stunning Hero Section -->
        <div class="relative bg-gradient-to-r from-primary to-primary-hover text-on-primary rounded-2xl p-8 md:p-12 mb-xl overflow-hidden shadow-lg">
            <!-- Background shapes for premium aesthetics -->
            <div class="absolute right-0 top-0 w-80 h-80 bg-secondary-container/20 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
            <div class="absolute left-1/3 bottom-0 w-64 h-64 bg-secondary-container/10 rounded-full blur-2xl -ml-24 -mb-24 pointer-events-none"></div>
            
            <div class="relative z-10 max-w-2xl">
                <span class="bg-secondary-container text-on-surface font-label text-caption px-4 py-1.5 rounded-full uppercase tracking-wider mb-md inline-block shadow-sm">Mae Wa Cafe</span>
                <h1 class="font-display text-display text-white mb-md mt-sm tracking-tight leading-tight">ร้านแม่วะคาเฟ่</h1>
                <p class="font-body text-body text-white/80 leading-relaxed max-w-xl">พบกับเครื่องดื่มรสชาติละมุนที่เราคัดสรรเมล็ดพันธุ์พิเศษอย่างพิถีพิถัน เพื่อสุนทรียภาพในการเริ่มต้นวันใหม่ของคุณ</p>
            </div>
        </div>

        <!-- Section Title & Categories -->
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-lg gap-md">
            <div>
                <h2 class="font-h2 text-h2 text-text-primary mb-1">รายการเมนู</h2>
                <p class="font-body-sm text-body-sm text-text-secondary">เลือกเครื่องดื่มถ้วยโปรดของคุณ</p>
            </div>
            
            <!-- Category Tabs -->
            <div class="flex overflow-x-auto gap-xs pb-2 scrollbar-hide" id="category-bar">
                <button data-cat="ทั้งหมด" class="category-btn flex-shrink-0 bg-primary text-on-primary font-label text-label px-5 py-2.5 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all">ทั้งหมด</button>
                <button data-cat="กาแฟ" class="category-btn flex-shrink-0 bg-surface text-text-secondary border border-border font-label text-label px-5 py-2.5 rounded-full hover:bg-surface-variant hover:scale-105 active:scale-95 transition-all">กาแฟ</button>
                <button data-cat="ชา" class="category-btn flex-shrink-0 bg-surface text-text-secondary border border-border font-label text-label px-5 py-2.5 rounded-full hover:bg-surface-variant hover:scale-105 active:scale-95 transition-all">ชา</button>
                <button data-cat="สดชื่น" class="category-btn flex-shrink-0 bg-surface text-text-secondary border border-border font-label text-label px-5 py-2.5 rounded-full hover:bg-surface-variant hover:scale-105 active:scale-95 transition-all">สดชื่น</button>
            </div>
        </div>
        
        <!-- Products Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="product-grid">
        </div>
    `;

    const grid = container.querySelector('#product-grid');

    const renderGrid = () => {
        grid.innerHTML = '';
        
        const filtered = products.filter(p => {
            const matchCategory = (activeCategory === 'ทั้งหมด') || (p.category === activeCategory);
            const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchCategory && matchSearch;
        });

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-xl text-text-secondary">
                    <span class="material-symbols-outlined text-[48px] mb-sm text-outline">search_off</span>
                    <p class="font-h3 text-h3">ไม่พบรายการเครื่องดื่มที่คุณค้นหา</p>
                </div>
            `;
            return;
        }

        filtered.forEach(product => {
            const article = document.createElement('article');
            article.className = 'bg-surface border border-border/80 rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col group relative cursor-pointer';
            
            const tagHtml = product.tag ? `
                <span class="absolute top-md left-md bg-secondary-container text-on-surface font-caption text-caption font-bold px-3 py-1 rounded-full shadow-sm z-10 backdrop-blur-md">
                    ${product.tag}
                </span>` : '';

            article.innerHTML = `
                <div class="relative w-full aspect-[4/3] overflow-hidden bg-surface-variant">
                    ${tagHtml}
                    <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" alt="${product.name}" src="${product.image}" onerror="this.src='https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=600'"/>
                    <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div class="p-md flex flex-col flex-grow">
                    <h3 class="font-product-name text-product-name text-text-primary group-hover:text-primary transition-colors mb-1 line-clamp-1">${product.name}</h3>
                    <p class="font-body-sm text-body-sm text-text-secondary line-clamp-2 mb-4 flex-grow">${product.description || ''}</p>
                    
                    <div class="flex justify-between items-center mt-auto pt-sm border-t border-border/50">
                        <div class="flex flex-col">
                            <span class="text-[10px] text-outline uppercase tracking-wider">ราคาเริ่มต้น</span>
                            <span class="font-price text-price text-text-primary">฿${product.price.toFixed(2)}</span>
                        </div>
                        <button class="add-to-cart-btn h-[40px] px-4 bg-primary text-on-primary font-label text-label rounded-full flex items-center justify-center gap-xs hover:bg-primary-hover active:scale-95 transition-all shadow-sm">
                            <span class="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                            สั่งซื้อ
                        </button>
                    </div>
                </div>
            `;

            // Open modal on click (entire card or button)
            article.addEventListener('click', () => {
                const modal = renderProductModal(product, () => {});
                document.body.appendChild(modal);
            });

            grid.appendChild(article);
        });
    };

    // Category button click handling
    container.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            activeCategory = e.currentTarget.dataset.cat;
            container.querySelectorAll('.category-btn').forEach(b => {
                if (b.dataset.cat === activeCategory) {
                    b.className = 'category-btn flex-shrink-0 bg-primary text-on-primary font-label text-label px-5 py-2.5 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all';
                } else {
                    b.className = 'category-btn flex-shrink-0 bg-surface text-text-secondary border border-border font-label text-label px-5 py-2.5 rounded-full hover:bg-surface-variant hover:scale-105 active:scale-95 transition-all';
                }
            });
            renderGrid();
        });
    });

    // Subscribe to store updates so products load dynamically
    const unsubscribe = store.subscribe(() => {
        renderGrid();
    });

    // Event listener for view active receipt button
    const receiptBtn = container.querySelector('#view-active-receipt-btn');
    if (receiptBtn) {
        receiptBtn.addEventListener('click', () => {
            if (window.showReceiptModal && store.state.activeOrder) {
                window.showReceiptModal(store.state.activeOrder);
            }
        });
    }

    renderGrid();

    return container;
}


/* --- js/views/POS.js --- */

function renderPOS() {
    const container = document.createElement('div');
    container.className = 'w-full min-h-screen bg-background text-text-primary font-body pb-10';

    // Get the most recent order. If no orders, redirect back to menu.
    const orders = store.state.orders;
    const latestOrder = orders.length > 0 ? orders[orders.length - 1] : null;

    if (!latestOrder) {
        setTimeout(() => store.navigate('menu'), 0);
        return document.createElement('div');
    }

    container.innerHTML = `
        <div class="max-w-container-max mx-auto px-gutter-desktop py-lg grid grid-cols-1 lg:grid-cols-12 gap-lg mt-8">
            <!-- Header Section -->
            <div class="col-span-1 lg:col-span-12 mb-sm flex justify-between items-center">
                <div>
                    <h1 class="font-h1 text-h1 text-text-primary mb-base">ชำระเงินและพิมพ์ใบเสร็จ (POS)</h1>
                    <div class="flex items-center gap-xs text-on-tertiary-container bg-tertiary-fixed-dim px-sm py-base rounded-full inline-flex font-label text-label">
                        <span class="material-symbols-outlined text-[18px]">check_circle</span>
                        Payment Successful
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-caption text-caption text-text-secondary">Order: #${latestOrder.id}</p>
                    <p class="font-dimensions text-dimensions text-text-secondary">Queue: <strong class="text-text-primary text-h3">${latestOrder.queue}</strong></p>
                </div>
            </div>

            <!-- Left Column: Order Summary -->
            <div class="col-span-1 lg:col-span-7 flex flex-col gap-md">
                <div class="bg-surface rounded-lg border border-border p-md shadow-sm">
                    <h2 class="font-h2 text-h2 mb-md border-b border-border pb-xs">Order Summary</h2>
                    <div class="flex flex-col gap-sm">
                        ${latestOrder.items.map(item => `
                            <div class="flex justify-between items-start border-b border-surface-variant pb-sm last:border-0 last:pb-0">
                                <div class="flex-1">
                                    <h3 class="font-product-name text-product-name">${item.name}</h3>
                                    ${item.options ? `
                                        <p class="font-body-sm text-body-sm text-text-secondary">ความหวาน: ${item.options.sweetness}%</p>
                                        ${item.options.toppings.map(t => `<p class="font-body-sm text-body-sm text-text-secondary">+ ${t}</p>`).join('')}
                                        ${item.options.notes ? `<p class="font-body-sm text-body-sm text-text-secondary italic">"${item.options.notes}"</p>` : ''}
                                    ` : ''}
                                </div>
                                <div class="font-dimensions text-dimensions text-right ml-md w-16">
                                    x${item.quantity}
                                </div>
                                <div class="font-price text-price text-right w-24">
                                    $${((item.finalPrice || item.price) * item.quantity).toFixed(2)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="mt-lg pt-md border-t border-border flex flex-col gap-xs font-dimensions text-dimensions">
                        <div class="flex justify-between">
                            <span class="text-text-secondary">Subtotal</span>
                            <span>$${latestOrder.total.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-text-secondary">Tax (8%)</span>
                            <span>$${(latestOrder.total * 0.08).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between font-bold text-h3 mt-xs pt-xs border-t border-surface-variant">
                            <span>Total Paid</span>
                            <span>$${(latestOrder.total * 1.08).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-md mt-sm no-print">
                    <button id="pos-print-btn" class="flex-1 h-[44px] bg-secondary-container text-on-secondary-container font-label text-label rounded-lg hover:bg-secondary-fixed transition-colors flex items-center justify-center gap-xs shadow-sm">
                        <span class="material-symbols-outlined">print</span>
                        Print Receipt (พิมพ์ใบเสร็จ)
                    </button>
                    <button id="pos-new-order" class="flex-1 h-[44px] bg-surface text-primary border-2 border-primary font-label text-label rounded-lg hover:bg-surface-container-low transition-colors flex items-center justify-center gap-xs">
                        <span class="material-symbols-outlined">add_circle</span>
                        New Order (เริ่มออเดอร์ใหม่)
                    </button>
                </div>
            </div>

            <!-- Right Column: Receipt Preview -->
            <div class="col-span-1 lg:col-span-5 flex justify-center">
                <div class="w-full max-w-[320px]">
                    <div id="printable-receipt" class="bg-surface shadow-md border border-border p-lg pb-0 relative">
                        <div class="text-center mb-md border-b border-dashed border-outline-variant pb-md">
                            <h3 class="font-dimensions text-dimensions font-bold">FikaSmart Store #042</h3>
                            <p class="font-dimensions text-[10px] text-text-secondary mt-xs">Date: ${new Date().toLocaleDateString()} ${latestOrder.timestamp}</p>
                        </div>
                        <div class="mb-md border-b border-dashed border-outline-variant pb-md text-center">
                            <p class="font-dimensions text-[12px] uppercase mb-xs">Queue Number</p>
                            <p class="font-dimensions text-display leading-none">${latestOrder.queue}</p>
                            <p class="font-dimensions text-[10px] text-text-secondary mt-sm">Order: ${latestOrder.id}</p>
                        </div>
                        <div class="font-dimensions text-[12px] mb-md border-b border-dashed border-outline-variant pb-md">
                            <table class="w-full text-left">
                                <thead>
                                    <tr class="border-b border-surface-variant">
                                        <th class="pb-xs font-normal">Qty</th>
                                        <th class="pb-xs font-normal">Item</th>
                                        <th class="pb-xs font-normal text-right">Amt</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${latestOrder.items.map(item => `
                                        <tr>
                                            <td class="py-xs align-top">${item.quantity}</td>
                                            <td class="py-xs">${item.name}<br>
                                                ${item.options ? `<span class="text-[10px] text-text-secondary">${item.options.sweetness}%<br>${item.options.toppings.join(', ')}</span>` : ''}
                                            </td>
                                            <td class="py-xs text-right align-top">${((item.finalPrice || item.price) * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        <div class="font-dimensions text-[12px] mb-md">
                            <div class="flex justify-between mb-xs">
                                <span>Subtotal</span>
                                <span>${latestOrder.total.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between mb-xs">
                                <span>Tax</span>
                                <span>${(latestOrder.total * 0.08).toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between font-bold text-[14px] mt-xs pt-xs border-t border-surface-variant">
                                <span>TOTAL</span>
                                <span>$${(latestOrder.total * 1.08).toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="mb-md border-t border-dashed border-outline-variant pt-md text-center">
                            <p class="font-dimensions text-[12px] font-bold mb-sm">Scan to Pay (สแกนเพื่อชำระเงิน)</p>
                            <div class="bg-white p-2 inline-block border border-border mb-sm">
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=FIKASMART-${latestOrder.id}" class="w-24 h-24" alt="QR" />
                            </div>
                        </div>
                        <div class="text-center font-dimensions text-[10px] pb-lg">
                            <p>Thank you for choosing FikaSmart!</p>
                            <p class="mt-xs">Tack så mycket!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const printBtn = container.querySelector('#pos-print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }

    container.querySelector('#pos-new-order').addEventListener('click', () => {
        store.navigate('menu');
    });

    return container;
}


/* --- js/views/ProductModal.js --- */

function renderProductModal(product, onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-surface w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl flex flex-col md:flex-row';

    const hotPrice = product.price || 30;
    const icedPrice = product.icedPrice !== undefined ? product.icedPrice : (product.price + 5);

    modalContent.innerHTML = `
        <div class="md:w-1/2 p-4 md:p-6 bg-surface-container-low flex flex-col items-center justify-center relative">
            <button class="absolute top-4 right-4 md:hidden bg-surface-variant p-2 rounded-full text-on-surface hover:bg-outline-variant transition" id="close-modal-mobile">
                <span class="material-symbols-outlined">close</span>
            </button>
            <img src="${product.image}" alt="${product.name}" class="w-full h-auto aspect-square object-cover rounded-lg shadow-sm" />
            <h2 class="font-h2 text-h2 text-text-primary mt-4 text-center">${product.name}</h2>
            <p class="font-price text-price text-primary text-center mt-2">฿${hotPrice}${hotPrice !== icedPrice ? ` - ฿${icedPrice}` : ''}</p>
        </div>
        
        <div class="md:w-1/2 p-4 md:p-6 flex flex-col gap-6 relative">
            <button class="absolute top-4 right-4 hidden md:block text-outline hover:text-on-surface transition" id="close-modal-desktop">
                <span class="material-symbols-outlined">close</span>
            </button>
            
            <form id="customization-form" class="flex flex-col gap-6">
                <!-- Temperature / Type Selection (Hot / Iced) -->
                <div class="flex flex-col gap-2">
                    <h3 class="font-label text-label text-text-primary">ประเภทเครื่องดื่ม <span class="text-error">*</span></h3>
                    <div class="grid grid-cols-2 gap-3">
                        <label class="cursor-pointer">
                            <input type="radio" name="type" value="ร้อน" checked class="peer sr-only" data-price="${hotPrice}" />
                            <div class="h-11 flex items-center justify-center border border-border rounded-lg text-body-sm peer-checked:bg-primary peer-checked:text-on-primary peer-checked:border-primary transition-all hover:bg-surface-container gap-1 font-medium">
                                <span class="material-symbols-outlined text-[18px]">local_fire_department</span>
                                ร้อน (฿${hotPrice})
                            </div>
                        </label>
                        <label class="cursor-pointer">
                            <input type="radio" name="type" value="เย็น" class="peer sr-only" data-price="${icedPrice}" />
                            <div class="h-11 flex items-center justify-center border border-border rounded-lg text-body-sm peer-checked:bg-primary peer-checked:text-on-primary peer-checked:border-primary transition-all hover:bg-surface-container gap-1 font-medium">
                                <span class="material-symbols-outlined text-[18px]">ac_unit</span>
                                เย็น (฿${icedPrice})
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Sweetness Level -->
                <div class="flex flex-col gap-2">
                    <h3 class="font-label text-label text-text-primary">ระดับความหวาน <span class="text-error">*</span></h3>
                    <div class="grid grid-cols-5 gap-1.5">
                        ${[0, 25, 50, 75, 100].map(level => `
                            <label class="cursor-pointer">
                                <input type="radio" name="sweetness" value="${level}" ${level === 100 ? 'checked' : ''} class="peer sr-only" />
                                <div class="h-10 flex items-center justify-center border border-border rounded-md text-caption peer-checked:bg-secondary-container peer-checked:text-on-secondary-container peer-checked:border-secondary transition-colors hover:bg-surface-container font-medium">
                                    ${level}%
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <!-- Toppings -->
                <div class="flex flex-col gap-2">
                    <h3 class="font-label text-label text-text-primary">ท็อปปิ้ง <span class="font-caption text-caption text-text-secondary">(+฿10)</span></h3>
                    <div class="flex flex-col gap-2 border border-border p-2.5 rounded-lg bg-surface-container-low">
                        ${['วิปครีม', 'บุกไข่มุก', 'ซอสคาราเมล'].map((topping, idx) => `
                            <label class="flex items-center justify-between p-2 hover:bg-surface rounded-md cursor-pointer">
                                <span class="font-body-sm text-body-sm">${topping}</span>
                                <input type="checkbox" name="toppings" value="${topping}" class="w-5 h-5 rounded border-outline text-primary focus:ring-primary" />
                            </label>
                            ${idx < 2 ? '<div class="h-px bg-border w-full"></div>' : ''}
                        `).join('')}
                    </div>
                </div>

                <!-- Notes -->
                <div class="flex flex-col gap-2">
                    <label class="font-label text-label text-text-primary" for="notes">รายละเอียดเพิ่มเติม</label>
                    <textarea id="notes" name="notes" rows="2" class="w-full border border-border rounded-lg p-2.5 text-body-sm resize-none focus:ring-1 focus:ring-primary outline-none" placeholder="เช่น หวานน้อย, แยกน้ำแข็ง..."></textarea>
                </div>

                <!-- Quantity & Submit -->
                <div class="mt-auto border-t border-border pt-4 flex flex-col gap-4">
                    <div class="flex justify-between items-center">
                        <span class="font-body-sm font-medium">จำนวน</span>
                        <div class="flex items-center border border-border rounded-lg h-10 w-32 overflow-hidden">
                            <button type="button" id="qty-dec" class="w-1/3 h-full hover:bg-surface-container text-primary font-bold">-</button>
                            <input type="number" id="qty-val" value="1" min="1" class="w-1/3 h-full text-center border-none p-0 focus:ring-0 text-dimensions bg-transparent" readonly />
                            <button type="button" id="qty-inc" class="w-1/3 h-full hover:bg-surface-container text-primary font-bold">+</button>
                        </div>
                    </div>
                    
                    <button type="submit" class="w-full h-12 bg-secondary-container text-on-secondary-container font-label text-label rounded-xl hover:bg-secondary-fixed transition-colors flex items-center justify-center gap-2 font-bold text-base shadow-sm">
                        <span class="material-symbols-outlined">shopping_basket</span>
                        เพิ่มลงตะกร้า - ฿<span id="total-price">${hotPrice}</span>
                    </button>
                </div>
            </form>
        </div>
    `;

    overlay.appendChild(modalContent);

    // Close logic
    const closeOverlay = (e) => {
        if (e.target === overlay) {
            onClose();
            overlay.remove();
        }
    };
    overlay.addEventListener('click', closeOverlay);
    modalContent.querySelector('#close-modal-mobile').addEventListener('click', () => { onClose(); overlay.remove(); });
    modalContent.querySelector('#close-modal-desktop').addEventListener('click', () => { onClose(); overlay.remove(); });

    // State for modal
    const form = modalContent.querySelector('#customization-form');
    const qtyInput = form.querySelector('#qty-val');
    const priceDisplay = form.querySelector('#total-price');

    const updatePrice = () => {
        const formData = new FormData(form);
        const selectedType = form.querySelector('input[name="type"]:checked');
        const typePrice = selectedType ? parseFloat(selectedType.dataset.price) : hotPrice;
        const toppings = formData.getAll('toppings');
        const qty = parseInt(qtyInput.value);
        const toppingsPrice = toppings.length * 10;
        const total = (typePrice + toppingsPrice) * qty;
        priceDisplay.textContent = total.toFixed(2);
    };

    form.querySelector('#qty-dec').addEventListener('click', () => {
        if (parseInt(qtyInput.value) > 1) {
            qtyInput.value = parseInt(qtyInput.value) - 1;
            updatePrice();
        }
    });

    form.querySelector('#qty-inc').addEventListener('click', () => {
        qtyInput.value = parseInt(qtyInput.value) + 1;
        updatePrice();
    });

    form.addEventListener('change', updatePrice);
    updatePrice();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const selectedType = form.querySelector('input[name="type"]:checked');
        const typeVal = selectedType ? selectedType.value : 'ร้อน';
        const typePrice = selectedType ? parseFloat(selectedType.dataset.price) : hotPrice;

        const options = {
            type: typeVal,
            sweetness: formData.get('sweetness'),
            toppings: formData.getAll('toppings'),
            notes: formData.get('notes')
        };
        const qty = parseInt(qtyInput.value);
        
        const customizedProduct = {
            ...product,
            name: `${product.name} (${typeVal})`,
            price: typePrice
        };

        for (let i = 0; i < qty; i++) {
            store.addToCart(customizedProduct, options);
        }
        
        onClose();
        overlay.remove();
    });

    return overlay;
}


/* --- js/app.js --- */

class App {
    constructor() {
        this.root = document.getElementById('app-root');
        
        // Subscribe to state changes to re-render when route changes
        store.subscribe((state) => {
            this.render(state.currentRoute);
        });
        
        // Initial render
        this.render(store.state.currentRoute);
    }

    render(route) {
        this.root.innerHTML = ''; // Clear current view
        
        const container = document.createElement('div');
        container.className = 'app-container flex flex-col min-h-screen';

        // Render appropriate views based on route
        if (route === 'admin') {
            container.appendChild(renderAdmin());
        } else if (route === 'kds') {
            container.appendChild(renderKDS());
        } else if (route === 'pos') {
            container.appendChild(renderPOS());
        } else if (route === 'login') {
            container.appendChild(renderLogin());
        } else {
            // Standard user views
            container.appendChild(renderNavbar());
            
            const mainContent = document.createElement('main');
            mainContent.className = 'flex-grow w-full pb-[80px] md:pb-0 pt-[64px]';
            
            if (route === 'menu') {
                mainContent.appendChild(renderMenu());
            } else if (route === 'cart') {
                mainContent.appendChild(renderCart());
            }
            
            container.appendChild(mainContent);
            container.appendChild(renderBottomNav());
        }
        
        try {
            this.root.appendChild(container);
        } catch (err) {
            console.error('App render error:', err);
            this.root.innerHTML = `<div class="p-8 text-center"><h1 class="text-xl font-bold">ร้านแม่วะคาเฟ่</h1><p class="mt-2 text-gray-600">กรุณารีเฟรชหน้าใหม่อีกครั้ง</p></div>`;
        }
    }
}

// Safe Initialize App (handles DOMContentLoaded race condition on mobile)
function startApp() {
    try {
        new App();
    } catch (e) {
        console.error('Failed to start App:', e);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

