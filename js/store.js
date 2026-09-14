// store.js
const getClient = () => (typeof getSupabase !== 'undefined' ? getSupabase() : null);

// Google Apps Script Web App URL for syncing orders to Google Sheets
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyAbWrvkNrfQFg3h9txk0e1r_fLTYNw1qwTFZJiwWhdMCpIpMkCUDstiQFaNefstanaYg/exec';

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
            items: items,
            total: order.total,
            status: order.status,
            timestamp: new Date().toISOString()
        };

        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log('Order synced to Google Sheets successfully');
    } catch (err) {
        console.error('Error syncing order to Google Sheets:', err);
    }
}

export const store = {
    state: {
        cart: [],
        orders: [], // For KDS
        currentRoute: 'menu', // 'menu', 'cart', 'admin', 'pos', 'kds', 'login'
        isAuthenticated: localStorage.getItem('staff_auth') === 'true',
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
        
        // Sync to Google Sheets (ส่งข้อมูลออเดอร์ไปบันทึกใน Google Sheets ด้วย)
        syncOrderToGoogleSheets(newOrder);
        
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
    const client = getClient();
    if (client) {
        try {
            const { data, error } = await client
                .from('orders')
                .select(`
                    *,
                    order_details (
                        *,
                        product:products ( name ),
                        order_toppings (
                            *,
                            topping_product:products ( name )
                        )
                    )
                `);
                
            if (!error && data) {
                const mappedOrders = data.map(order => {
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
        } catch (err) {
            console.warn('Error fetching orders:', err);
        }
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

