// store.js
const getClient = () => (typeof getSupabase !== 'undefined' ? getSupabase() : null);

// Google Apps Script Web App URL for syncing orders to Google Sheets
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyAbWrvkNrfQFg3h9txk0e1r_fLTYNw1qwTFZJiwWhdMCpIpMkCUDstiQFaNefstanaYg/exec';

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

export const store = {
    state: {
        cart: [],
        orders: [], // For KDS
        currentRoute: 'menu', // 'menu', 'cart', 'admin', 'pos', 'kds', 'login'
        isAuthenticated: localStorage.getItem('staff_auth') === 'true',
        customerEmail: localStorage.getItem('customer_email') || '',
        customerName: localStorage.getItem('customer_name') || '',
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
    
    async checkout() {
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
            status: 'PENDING', // 'PENDING', 'PREPARING', 'COMPLETED'
            order_status: 'PENDING',
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        
        // Add to front of orders
        this.state.orders.unshift(newOrder);
        this.state.cart = []; // Empty cart
        this.notify();
        
        // Sync to Google Sheets (บันทึกลง Google Sheets ทันที)
        syncOrderToGoogleSheets(newOrder);
        
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

export const defaultProducts = [
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

export let products = [...defaultProducts];

export async function fetchProducts() {
    const client = getClient();
    if (client) {
        try {
            // 2-second timeout promise to prevent mobile 4G/5G hanging
            const fetchPromise = client.from('products').select('*');
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Fetch timeout')), 2000)
            );
            
            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
            
            if (error) {
                console.warn('Supabase fetch error, using default products:', error);
                products = defaultProducts;
            } else if (data && data.length > 0) {
                const mapped = data.map((p) => {
                    let fallbackImg = DEFAULT_IMAGES.latte;
                    if (p.name && p.name.includes('เอสเพรสโซ่')) fallbackImg = DEFAULT_IMAGES.espresso;
                    else if (p.name && (p.name.includes('ชา') || p.name.includes('ที'))) fallbackImg = DEFAULT_IMAGES.tea;
                    else if (p.name && (p.name.includes('ซิตรัส') || p.name.includes('โซดา'))) fallbackImg = DEFAULT_IMAGES.refresher;

                    return {
                        ...p,
                        category: p.category || (p.name.includes('ชา') ? 'ชา' : p.name.includes('โซดา') || p.name.includes('ซิตรัส') ? 'สดชื่น' : 'กาแฟ'),
                        price: Number(p.price),
                        image: (p.image && p.image.startsWith('http')) ? p.image : fallbackImg
                    };
                });
                products = mapped;
            } else {
                products = defaultProducts;
            }
        } catch (e) {
            console.warn('Network timeout or offline mode, using default products:', e);
            products = defaultProducts;
        }
    } else {
        products = defaultProducts;
    }
    store.notify();
}

export async function fetchOrders() {
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

export function subscribeToOrders() {
    const client = getClient();
    if (client) {
        try {
            client
                .channel('schema-db-changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'orders'
                    },
                    () => {
                        fetchOrders();
                    }
                )
                .subscribe();
        } catch (e) {
            console.warn('Realtime subscription skipped:', e);
        }
    }
}

// Call fetchProducts for menu on load (non-blocking)
try {
    fetchProducts();
} catch (e) {
    console.warn('Initial product fetch error:', e);
}

