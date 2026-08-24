// store.js
const getClient = () => (typeof getSupabase !== 'undefined' ? getSupabase() : null);

export const store = {
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

export let products = [];

export async function fetchProducts() {
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

export async function fetchOrders() {
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

export function subscribeToOrders() {
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
