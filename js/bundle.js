
/* --- js/supabase.js --- */
// supabase.js
const SUPABASE_URL = 'https://lpwljgptpvtwgdsizvbg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8gMezicicJYtIZk-dS27KQ_tDm_Co7z';

function getSupabase() {
    if (window.supabaseClientInstance) {
        return window.supabaseClientInstance;
    }
    if (window.supabase) {
        window.supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return window.supabaseClientInstance;
    }
    return null;
}


/* --- js/store.js --- */
// store.js
const getClient = () => (typeof getSupabase !== 'undefined' ? getSupabase() : null);

const store = {
    state: {
        cart: [],
        orders: [], // For KDS
        currentRoute: 'menu' // 'menu', 'cart', 'admin', 'pos', 'kds', 'login'
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
    
    navigate(route) {
        this.state.currentRoute = route;
        this.notify();
    },
    
    async checkout() {
        if (this.state.cart.length === 0) return null;
        
        const cartItems = [...this.state.cart];
        const totalAmount = this.getCartTotal();
        const orderNum = 'ORD-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
        const queueNum = 'A' + Math.floor(100 + Math.random() * 900);
        
        const newOrder = {
            id: orderNum,
            queue: queueNum,
            items: cartItems,
            total: totalAmount,
            status: 'PENDING', // 'PENDING', 'PREPARING', 'COMPLETED'
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        
        this.state.orders.push(newOrder);
        this.state.cart = []; // Empty cart
        this.notify();
        
        // Insert into Supabase (Relational Database Inserts)
        const client = getClient();
        if (client) {
            try {
                // 1. Insert into orders
                const { data: orderData, error: orderError } = await client
                    .from('orders')
                    .insert([
                        {
                            order_number: orderNum,
                            queue_number: queueNum,
                            total_amount: totalAmount,
                            order_status: 'PENDING',
                            payment_status: 'PENDING',
                            estimated_waiting_time: 10
                        }
                    ])
                    .select();
                
                if (orderError) throw orderError;
                if (orderData && orderData.length > 0) {
                    const orderUuid = orderData[0].id;
                    newOrder.db_id = orderUuid; // Cache the UUID key locally
                    
                    // 2. Insert into order_details (bulk insert)
                    const detailsToInsert = cartItems.map(item => {
                        // Find matching product UUID from products state
                        let prodId = item.id;
                        const match = products.find(p => p.name === item.name || p.id === item.id);
                        if (match) prodId = match.id;
                        
                        return {
                            order_id: orderUuid,
                            product_id: prodId,
                            quantity: item.quantity,
                            sweetness_level: item.options && item.options.sweetness ? `${item.options.sweetness}%` : '100%',
                            unit_price: item.price,
                            subtotal_price: (item.finalPrice || item.price) * item.quantity,
                            note: item.options && item.options.notes ? item.options.notes : null
                        };
                    });
                    
                    const { data: detailsData, error: detailsError } = await client
                        .from('order_details')
                        .insert(detailsToInsert)
                        .select();
                        
                    if (detailsError) throw detailsError;
                    
                    // 3. Insert into order_toppings (if any)
                    const toppingsToInsert = [];
                    cartItems.forEach((item, index) => {
                        if (item.options && item.options.toppings && item.options.toppings.length > 0) {
                            const detailRow = detailsData[index];
                            if (detailRow) {
                                item.options.toppings.forEach(toppingName => {
                                    const toppingProduct = products.find(p => p.name.toLowerCase() === toppingName.toLowerCase() || p.id === toppingName);
                                    if (toppingProduct) {
                                        toppingsToInsert.push({
                                            order_detail_id: detailRow.id,
                                            topping_product_id: toppingProduct.id,
                                            quantity: 1,
                                            price_per_unit: toppingProduct.price || 0.30
                                        });
                                    }
                                });
                            }
                        }
                    });
                    
                    if (toppingsToInsert.length > 0) {
                        const { error: toppingsError } = await client
                            .from('order_toppings')
                            .insert(toppingsToInsert);
                        if (toppingsError) throw toppingsError;
                    }
                }
            } catch (err) {
                console.error('Error saving order relationally to Supabase:', err);
            }
        }
        
        return newOrder;
    },
    
    updateOrderStatus(orderId, newStatus) {
        const order = this.state.orders.find(o => o.id === orderId || o.order_number === orderId || o.db_id === orderId);
        if (order) {
            order.status = newStatus;
            order.order_status = newStatus;
            this.notify();
            
            // Sync with Supabase
            const client = getClient();
            if (client) {
                // Update both potential column names (status or order_status)
                const updatePayload = {
                    status: newStatus,
                    order_status: newStatus
                };
                
                // Match either id, order_number or db_id matching orderId
                const matchId = order.db_id || orderId;
                client.from('orders')
                    .update(updatePayload)
                    .or(`id.eq.${matchId},order_number.eq.${orderId}`)
                    .then(({ error }) => {
                        if (error) console.error('Error updating order status in Supabase:', error);
                    });
            }
        }
    }
};

let products = [];

async function fetchProducts() {
    const defaultProducts = [
        {
            id: 'a1111111-1111-1111-1111-111111111111',
            name: 'นอร์ดิกโอ๊ตลาเต้',
            description: 'เอสเพรสโซ่รสชาติกลมกล่อม ผสมผสานกับนมโอ๊ตสูตรพิเศษของเรา',
            price: 4.50,
            tag: 'เพื่อความยั่งยืน',
            image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=600'
        },
        {
            id: 'a2222222-2222-2222-2222-222222222222',
            name: 'ฟังก์ชันนัลเอสเพรสโซ่',
            description: 'เอสเพรสโซ่เข้มข้น 2 ช็อตจากเมล็ดคั่วเข้ม เพื่อพลังงานสูงสุดในการเริ่มต้นวันใหม่',
            price: 3.00,
            tag: 'ขายดี',
            image: 'https://images.unsplash.com/photo-1510707577719-ee7c18304e3c?auto=format&fit=crop&q=80&w=600'
        },
        {
            id: 'a3333333-3333-3333-3333-333333333333',
            name: 'แคลริตี้กรีนที (ชาเขียว)',
            description: 'ใบชาเซนฉะชั้นดีจากญี่ปุ่น ให้ความรู้สึกสดชื่น ผ่อนคลาย และเบาสบายตลอดวัน',
            price: 3.50,
            tag: 'ออร์แกนิก',
            image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=600'
        },
        {
            id: 'a4444444-4444-4444-4444-444444444444',
            name: 'ซิตรัสไฮเดรเตอร์',
            description: 'น้ำโซดาเย็นจัด ผสมเลมอนและส้มสกัดเย็น ให้ความสดชื่นทันทีที่ดื่ม',
            price: 4.00,
            tag: 'สดชื่น',
            image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=600'
        }
    ];

    const client = getClient();
    if (client) {
        const { data, error } = await client.from('products').select('*');
        if (error) {
            console.error('Error fetching products from Supabase:', error);
            products = defaultProducts;
        } else {
            const mapped = (data || []).map(p => ({
                ...p,
                price: Number(p.price)
            }));
            products = mapped.length > 0 ? mapped : defaultProducts;
        }
    } else {
        products = defaultProducts;
    }
    store.notify();
}

async function fetchOrders() {
    const client = getClient();
    if (client) {
        // Query orders with nested relation data (order_details, order_toppings, products)
        const { data, error } = await client
            .from('orders')
            .select(`
                *,
                order_details (
                    *,
                    product:products (
                        name
                    ),
                    order_toppings (
                        *,
                        topping_product:products (
                            name
                        )
                    )
                )
            `);
            
        if (error) {
            console.error('Error fetching orders from Supabase:', error);
        } else {
            // Map database relational structure back to flat frontend structure
            const mappedOrders = (data || []).map(order => {
                const items = (order.order_details || []).map(detail => {
                    const toppings = (detail.order_toppings || []).map(topping => {
                        const tp = topping.topping_product || topping.products || topping.product;
                        return tp ? tp.name : 'Unknown Topping';
                    });
                    
                    const prod = detail.product || detail.products;
                    const prodName = prod ? prod.name : 'Unknown Drink';
                    
                    return {
                        id: detail.product_id,
                        name: prodName,
                        quantity: detail.quantity,
                        price: Number(detail.unit_price),
                        finalPrice: Number(detail.subtotal_price) / detail.quantity,
                        options: {
                            sweetness: parseFloat(detail.sweetness_level) || 100,
                            toppings: toppings,
                            notes: detail.note
                        }
                    };
                });
                
                return {
                    id: order.order_number,
                    db_id: order.id,
                    queue: order.queue_number,
                    items: items,
                    total: Number(order.total_amount),
                    status: order.order_status,
                    timestamp: order.created_at ? new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'
                };
            });
            
            store.state.orders = mappedOrders;
            store.notify();
        }
    }
}

function subscribeToOrders() {
    const client = getClient();
    if (client) {
        client
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders'
                },
                (payload) => {
                    fetchOrders();
                }
            )
            .subscribe();
    }
}

// Call fetch on load
fetchProducts();
fetchOrders();
subscribeToOrders();


/* --- js/components/BottomNav.js --- */

function renderBottomNav() {
    const nav = document.createElement('nav');
    nav.className = 'md:hidden bg-surface text-primary font-caption text-caption fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 border-t border-border rounded-t-xl shadow-md';
    
    const currentRoute = store.state.currentRoute;
    
    const isMenu = currentRoute === 'menu';
    const isCart = currentRoute === 'cart';

    nav.innerHTML = `
        <button id="mob-shop" class="flex flex-col items-center justify-center ${isMenu ? 'bg-secondary-container text-on-secondary-container rounded-full px-4 py-1' : 'text-on-surface-variant hover:bg-surface-container-high px-4 py-1 rounded-full'} transition-all">
            <span class="material-symbols-outlined mb-1" ${isMenu ? 'style="font-variation-settings: \'FILL\' 1;"' : ''}>local_cafe</span>
            <span class="${isMenu ? 'font-bold' : ''}">Shop</span>
        </button>
        <button class="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high px-4 py-1 rounded-full transition-colors">
            <span class="material-symbols-outlined mb-1">map</span>
            <span>Track</span>
        </button>
        <button id="mob-cart" class="flex flex-col items-center justify-center ${isCart ? 'bg-secondary-container text-on-secondary-container rounded-full px-4 py-1' : 'text-on-surface-variant hover:bg-surface-container-high px-4 py-1 rounded-full'} relative transition-all">
            <span class="material-symbols-outlined mb-1" ${isCart ? 'style="font-variation-settings: \'FILL\' 1;"' : ''}>shopping_cart</span>
            <span class="${isCart ? 'font-bold' : ''}">Cart</span>
            <span id="mob-cart-badge" class="absolute top-0 right-1 bg-error text-on-error text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center scale-0 transition-transform">0</span>
        </button>
        <button id="mob-admin" class="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high px-4 py-1 rounded-full transition-colors">
            <span class="material-symbols-outlined mb-1">admin_panel_settings</span>
            <span>Admin</span>
        </button>
    `;

    nav.querySelector('#mob-shop').addEventListener('click', () => {
        store.navigate('menu');
    });

    nav.querySelector('#mob-cart').addEventListener('click', () => {
        store.navigate('cart');
    });

    nav.querySelector('#mob-admin').addEventListener('click', () => {
        store.navigate('admin');
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
            
            <!-- Center Navigation Links -->
            <nav class="flex gap-lg items-center">
                <a class="relative text-white/80 hover:text-white transition-colors py-2 cursor-pointer font-medium ${isMenu ? 'text-white border-b-2 border-secondary-container' : ''}" id="nav-shop">หน้าหลัก</a>
                <a class="relative text-white/80 hover:text-white transition-colors py-2 cursor-pointer font-medium" id="nav-admin">จัดการหลังบ้าน (Admin)</a>
                <a class="relative text-white/80 hover:text-white transition-colors py-2 cursor-pointer font-medium" href="#">โปรโมชั่น</a>
            </nav>
            
            <!-- Right Actions -->
            <div class="flex gap-md items-center">
                <!-- Premium Cart Button -->
                <button id="nav-cart-btn" class="relative text-white p-2 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors group">
                    <span class="material-symbols-outlined text-[24px]" ${isCart ? 'style="font-variation-settings: \'FILL\' 1; color:#fdd816;"' : ''}>shopping_cart</span>
                    <span id="cart-badge" class="absolute -top-0.5 -right-0.5 bg-error text-on-error text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center scale-0 transition-transform shadow-md border border-surface">0</span>
                </button>
                
                <!-- Account Button -->
                <button id="nav-login-btn" class="text-white/80 hover:text-white hover:bg-white/10 transition-colors p-2 rounded-full flex items-center justify-center">
                    <span class="material-symbols-outlined text-[24px]">account_circle</span>
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

    header.querySelector('#nav-cart-btn').addEventListener('click', () => {
        store.navigate('cart');
    });

    header.querySelector('#nav-admin').addEventListener('click', () => {
        store.navigate('admin');
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
                    <button class="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors border border-border">
                        <span class="material-symbols-outlined">notifications</span>
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
                                        
                                        let itemsText = 'ไม่มีรายละเอียด';
                                        if (order.items && order.items.length > 0) {
                                            itemsText = order.items.map(i => `${i.name} (x${i.quantity})`).join(', ');
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
                                                <td class="p-md font-dimensions text-body-sm text-on-surface-variant">${ordTime}</td>
                                                <td class="p-md font-body-sm text-body-sm text-on-surface">${itemsText}</td>
                                                <td class="p-md font-dimensions text-body-sm text-on-surface">฿${ordTotal.toFixed(2)}</td>
                                                <td class="p-md">
                                                    ${statusBadge}
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                    ${ordersList.length === 0 ? '<tr><td colspan="5" class="p-md text-center text-outline font-body-sm">ไม่มีคำสั่งซื้อที่ค้างอยู่</td></tr>' : ''}
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
                            <span class="font-price text-price text-text-primary whitespace-nowrap ml-md">$${((item.finalPrice || item.price) * item.quantity).toFixed(2)}</span>
                        </div>
                        ${item.options ? `
                            <div class="font-caption text-caption text-text-secondary mb-2">
                                <div>ความหวาน: ${item.options.sweetness}%</div>
                                ${item.options.toppings.length > 0 ? `<div>ท็อปปิ้ง: ${item.options.toppings.join(', ')}</div>` : ''}
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
                            <span class="font-dimensions text-dimensions text-text-primary">$${total.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>ภาษีโดยประมาณ</span>
                            <span class="font-dimensions text-dimensions text-text-primary">$0.00</span>
                        </div>
                    </div>
                    <div class="flex justify-between items-center border-t border-border pt-md mb-lg">
                        <span class="font-h3 text-h3 text-text-primary">ยอดสุทธิ</span>
                        <span class="font-price text-price text-text-primary">$${total.toFixed(2)}</span>
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
                const order = store.checkout();
                if (order) {
                    store.navigate('pos');
                }
            });
        }
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
    container.className = 'w-full min-h-screen bg-surface flex items-center justify-center font-body text-body text-text-primary antialiased pb-[80px] md:pb-0';

    container.innerHTML = `
        <div class="w-full max-w-[400px] px-gutter-desktop mx-auto flex flex-col items-center">
            <!-- Brand Logo Area -->
            <div class="mb-xxl w-full flex justify-center cursor-pointer" id="login-brand">
                <div class="w-[120px] h-[120px] bg-primary rounded-full flex items-center justify-center shadow-lg group hover:scale-105 transition-transform">
                    <span class="font-h1 text-h1 text-on-primary">F</span>
                </div>
            </div>

            <!-- Login Form -->
            <div class="w-full bg-surface-container-lowest p-lg rounded-xl border border-border shadow-[0_1px_3px_rgba(17,17,17,0.06)]">
                <h1 class="font-h1-mobile md:font-h1 text-h1-mobile md:text-h1 text-center text-text-primary mb-xl tracking-tight">เข้าสู่ระบบ</h1>
                
                <form class="flex flex-col gap-lg" id="login-form">
                    <!-- Email Field -->
                    <div class="flex flex-col gap-xs relative">
                        <label class="font-label text-label text-text-primary" for="email">อีเมล</label>
                        <div class="relative w-full">
                            <span class="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline z-10 pointer-events-none">mail</span>
                            <input class="w-full h-[44px] pl-xl pr-sm bg-surface border border-border rounded-DEFAULT focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm text-text-primary placeholder:text-outline transition-colors outline-none" id="email" placeholder="example@email.com" required="" type="email" />
                        </div>
                    </div>
                    
                    <!-- Password Field -->
                    <div class="flex flex-col gap-xs relative">
                        <div class="flex justify-between items-center">
                            <label class="font-label text-label text-text-primary" for="password">รหัสผ่าน</label>
                            <a class="font-caption text-caption text-primary hover:text-primary-hover hover:underline transition-colors" href="#">ลืมรหัสผ่าน?</a>
                        </div>
                        <div class="relative w-full">
                            <span class="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline z-10 pointer-events-none">lock</span>
                            <input class="w-full h-[44px] px-xl bg-surface border border-border rounded-DEFAULT focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm text-text-primary placeholder:text-outline transition-colors outline-none" id="password" placeholder="••••••••" required="" type="password" />
                            <button class="absolute right-sm top-1/2 -translate-y-1/2 text-outline hover:text-text-primary transition-colors focus:outline-none" tabindex="-1" type="button" id="toggle-password">
                                <span class="material-symbols-outlined" style="font-size: 20px;">visibility_off</span>
                            </button>
                        </div>
                    </div>

                    <!-- Remember Me -->
                    <div class="flex items-center gap-sm">
                        <label class="relative flex items-center cursor-pointer p-1 rounded-full hover:bg-surface-container-low transition-colors" for="remember">
                            <input class="peer relative h-5 w-5 cursor-pointer appearance-none rounded-sm border border-outline transition-all checked:border-primary checked:bg-primary" id="remember" type="checkbox" />
                            <span class="absolute text-white transition-opacity opacity-0 pointer-events-none top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 peer-checked:opacity-100">
                                <span class="material-symbols-outlined" style="font-size: 16px;">check</span>
                            </span>
                        </label>
                        <label class="font-body-sm text-body-sm text-text-primary cursor-pointer select-none" for="remember">จำฉันไว้ในระบบ</label>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex flex-col gap-md mt-sm">
                        <button class="w-full h-[44px] bg-primary text-on-primary font-label text-label rounded-DEFAULT hover:bg-primary-hover transition-colors shadow-sm active:scale-[0.98] flex items-center justify-center gap-sm" type="submit">
                            เข้าสู่ระบบ
                            <span class="material-symbols-outlined" style="font-size: 18px;">arrow_forward</span>
                        </button>
                        
                        <div class="relative flex items-center py-sm">
                            <div class="flex-grow border-t border-border"></div>
                            <span class="flex-shrink-0 mx-md font-caption text-caption text-text-secondary uppercase tracking-wider">หรือ</span>
                            <div class="flex-grow border-t border-border"></div>
                        </div>

                        <button class="w-full h-[44px] bg-surface text-text-primary border border-border font-label text-label rounded-DEFAULT hover:bg-surface-container-low transition-colors shadow-sm active:scale-[0.98] flex items-center justify-center gap-sm" type="button">
                            เข้าสู่ระบบด้วย Google
                        </button>
                    </div>
                </form>

                <p class="mt-lg text-center font-body-sm text-body-sm text-text-secondary">
                    ยังไม่มีบัญชี? 
                    <a class="font-label text-label text-primary hover:text-primary-hover hover:underline transition-colors" href="#">สมัครสมาชิก</a>
                </p>
            </div>
            
            <div class="mt-xl font-caption text-caption text-outline text-center flex flex-col gap-xs">
                <p>2023 © FikaSmart.</p>
                <div class="flex gap-md justify-center">
                    <a class="hover:text-text-primary transition-colors" href="#">Terms</a>
                    <a class="hover:text-text-primary transition-colors" href="#">Privacy</a>
                </div>
            </div>
        </div>
    `;

    // Functionality
    const loginForm = container.querySelector('#login-form');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('#email').value;
        const password = loginForm.querySelector('#password').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'กำลังตรวจสอบ...';
        
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });
            
            if (error) {
                alert('เกิดข้อผิดพลาด: ' + error.message);
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'เข้าสู่ระบบ <span class="material-symbols-outlined" style="font-size: 18px;">arrow_forward</span>';
            } else {
                store.navigate('admin');
            }
        } else {
            // Fallback for offline/no supabase configuration
            store.navigate('admin');
        }
    });

    const togglePasswordBtn = container.querySelector('#toggle-password');
    const passwordInput = container.querySelector('#password');
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePasswordBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 20px;">${type === 'password' ? 'visibility_off' : 'visibility'}</span>`;
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

    container.innerHTML = `
        <!-- Stunning Hero Section -->
        <div class="relative bg-gradient-to-r from-primary to-primary-hover text-on-primary rounded-2xl p-8 md:p-12 mb-xl overflow-hidden shadow-lg">
            <!-- Background shapes for premium aesthetics -->
            <div class="absolute right-0 top-0 w-80 h-80 bg-secondary-container/20 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
            <div class="absolute left-1/3 bottom-0 w-64 h-64 bg-secondary-container/10 rounded-full blur-2xl -ml-24 -mb-24 pointer-events-none"></div>
            
            <div class="relative z-10 max-w-2xl">
                <span class="bg-secondary-container text-on-surface font-label text-caption px-4 py-1.5 rounded-full uppercase tracking-wider mb-md inline-block shadow-sm">Nordic Yellow Fika</span>
                <h1 class="font-display text-display text-white mb-md mt-sm tracking-tight leading-tight">สัมผัสสุนทรียภาพ<br/>แห่งกาแฟสไตล์นอร์ดิก</h1>
                <p class="font-body text-body text-white/80 leading-relaxed max-w-xl">พบกับเครื่องดื่มรสชาติละมุนที่เราคัดสรรเมล็ดพันธุ์พิเศษอย่างพิถีพิถัน เพื่อสุนทรียภาพในการเริ่มต้นวันใหม่ของคุณ</p>
            </div>
        </div>

        <!-- Section Title & Categories -->
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-lg gap-md">
            <div>
                <h2 class="font-h2 text-h2 text-text-primary mb-1">รายการเมนู</h2>
                <p class="font-body-sm text-body-sm text-text-secondary">เลือกเครื่องดื่มถ้วยโปรดของคุณ</p>
            </div>
            
            <!-- Category Tabs with subtle scale-on-hover -->
            <div class="flex overflow-x-auto gap-xs pb-2 scrollbar-hide">
                <button class="category-btn flex-shrink-0 bg-primary text-on-primary font-label text-label px-5 py-2.5 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all">ทั้งหมด</button>
                <button class="category-btn flex-shrink-0 bg-surface text-text-secondary border border-border font-label text-label px-5 py-2.5 rounded-full hover:bg-surface-variant hover:scale-105 active:scale-95 transition-all">กาแฟ</button>
                <button class="category-btn flex-shrink-0 bg-surface text-text-secondary border border-border font-label text-label px-5 py-2.5 rounded-full hover:bg-surface-variant hover:scale-105 active:scale-95 transition-all">ชา</button>
                <button class="category-btn flex-shrink-0 bg-surface text-text-secondary border border-border font-label text-label px-5 py-2.5 rounded-full hover:bg-surface-variant hover:scale-105 active:scale-95 transition-all">สดชื่น</button>
            </div>
        </div>
        
        <!-- Products Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="product-grid">
        </div>
    `;

    const grid = container.querySelector('#product-grid');

    products.forEach(product => {
        const article = document.createElement('article');
        article.className = 'bg-surface border border-border/80 rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col group relative';
        
        const tagHtml = product.tag ? `
            <span class="absolute top-md left-md bg-secondary-container text-on-surface font-caption text-caption font-bold px-3 py-1 rounded-full shadow-sm z-10 backdrop-blur-md">
                ${product.tag}
            </span>` : '';

        article.innerHTML = `
            <div class="relative w-full aspect-[4/3] overflow-hidden bg-surface-variant">
                ${tagHtml}
                <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" alt="${product.name}" src="${product.image}"/>
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div class="p-md flex flex-col flex-grow">
                <h3 class="font-product-name text-product-name text-text-primary group-hover:text-primary transition-colors mb-1 line-clamp-1">${product.name}</h3>
                <p class="font-body-sm text-body-sm text-text-secondary line-clamp-2 mb-4 flex-grow">${product.description}</p>
                
                <div class="flex justify-between items-center mt-auto pt-sm border-t border-border/50">
                    <div class="flex flex-col">
                        <span class="text-[10px] text-outline uppercase tracking-wider">ราคาเริ่มต้น</span>
                        <span class="font-price text-price text-text-primary">$${product.price.toFixed(2)}</span>
                    </div>
                    <button class="add-to-cart-btn h-[40px] px-4 bg-primary text-on-primary font-label text-label rounded-full flex items-center justify-center gap-xs hover:bg-primary-hover active:scale-95 transition-all shadow-sm">
                        <span class="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                        สั่งซื้อ
                    </button>
                </div>
            </div>
        `;

        article.querySelector('.add-to-cart-btn').addEventListener('click', () => {
            const modal = renderProductModal(product, () => {
                // Modal closed callback
            });
            document.body.appendChild(modal);
        });

        grid.appendChild(article);
    });

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
                <div class="flex gap-md mt-sm">
                    <button class="flex-1 h-[44px] bg-secondary-container text-on-secondary-container font-label text-label rounded-lg hover:bg-secondary-fixed transition-colors flex items-center justify-center gap-xs shadow-sm">
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
                    <div class="bg-surface shadow-md border border-border p-lg pb-0 relative">
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

    modalContent.innerHTML = `
        <div class="md:w-1/2 p-4 md:p-6 bg-surface-container-low flex flex-col items-center justify-center relative">
            <button class="absolute top-4 right-4 md:hidden bg-surface-variant p-2 rounded-full text-on-surface hover:bg-outline-variant transition" id="close-modal-mobile">
                <span class="material-symbols-outlined">close</span>
            </button>
            <img src="${product.image}" alt="${product.name}" class="w-full h-auto aspect-square object-cover rounded-lg shadow-sm" />
            <h2 class="font-h2 text-h2 text-text-primary mt-4 text-center">${product.name}</h2>
            <p class="font-price text-price text-primary text-center mt-2">$${product.price.toFixed(2)}</p>
        </div>
        
        <div class="md:w-1/2 p-4 md:p-6 flex flex-col gap-6 relative">
            <button class="absolute top-4 right-4 hidden md:block text-outline hover:text-on-surface transition" id="close-modal-desktop">
                <span class="material-symbols-outlined">close</span>
            </button>
            
            <form id="customization-form" class="flex flex-col gap-6">
                <!-- Sweetness Level -->
                <div class="flex flex-col gap-2">
                    <h3 class="font-label text-label text-text-primary">ระดับความหวาน (Sweetness) <span class="text-error">*</span></h3>
                    <div class="grid grid-cols-5 gap-2">
                        ${[0, 25, 50, 75, 100].map(level => `
                            <label class="cursor-pointer">
                                <input type="radio" name="sweetness" value="${level}" ${level === 100 ? 'checked' : ''} class="peer sr-only" />
                                <div class="h-10 flex items-center justify-center border border-border rounded text-body-sm peer-checked:bg-primary-fixed peer-checked:text-on-primary-fixed peer-checked:border-primary transition-colors hover:bg-surface-container">
                                    ${level}%
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <!-- Toppings -->
                <div class="flex flex-col gap-2">
                    <h3 class="font-label text-label text-text-primary">ท็อปปิ้ง (Toppings) <span class="font-caption text-caption text-text-secondary">(+$0.30)</span></h3>
                    <div class="flex flex-col gap-2 border border-border p-2 rounded bg-surface-container-low">
                        ${['Oat Flakes', 'Honey Drop', 'Caramel Drizzle'].map((topping, idx) => `
                            <label class="flex items-center justify-between p-2 hover:bg-surface rounded cursor-pointer">
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
                    <textarea id="notes" name="notes" rows="2" class="w-full border border-border rounded p-2 text-body-sm resize-none focus:ring-1 focus:ring-primary outline-none" placeholder="เช่น หวานน้อย, ไม่ใส่น้ำแข็ง..."></textarea>
                </div>

                <!-- Quantity & Submit -->
                <div class="mt-auto border-t border-border pt-4 flex flex-col gap-4">
                    <div class="flex justify-between items-center">
                        <span class="font-body-sm">จำนวน</span>
                        <div class="flex items-center border border-border rounded h-10 w-32">
                            <button type="button" id="qty-dec" class="w-1/3 h-full hover:bg-surface-container text-primary font-bold">-</button>
                            <input type="number" id="qty-val" value="1" min="1" class="w-1/3 h-full text-center border-none p-0 focus:ring-0 text-dimensions bg-transparent" readonly />
                            <button type="button" id="qty-inc" class="w-1/3 h-full hover:bg-surface-container text-primary font-bold">+</button>
                        </div>
                    </div>
                    
                    <button type="submit" class="w-full h-12 bg-secondary-container text-on-secondary-container font-label text-label rounded-lg hover:bg-secondary-fixed transition-colors flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined">shopping_basket</span>
                        เพิ่มลงตะกร้า - $<span id="total-price">${product.price.toFixed(2)}</span>
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
        const toppings = formData.getAll('toppings');
        const qty = parseInt(qtyInput.value);
        const basePrice = product.price;
        const toppingsPrice = toppings.length * 0.30;
        const total = (basePrice + toppingsPrice) * qty;
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

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const options = {
            sweetness: formData.get('sweetness'),
            toppings: formData.getAll('toppings'),
            notes: formData.get('notes')
        };
        const qty = parseInt(qtyInput.value);
        
        // Add to cart N times
        for (let i = 0; i < qty; i++) {
            store.addToCart(product, options);
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
        
        this.root.appendChild(container);
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    new App();
});

