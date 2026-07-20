// store.js
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
    
    checkout() {
        if (this.state.cart.length === 0) return null;
        
        const newOrder = {
            id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
            queue: 'A' + Math.floor(100 + Math.random() * 900),
            items: [...this.state.cart],
            total: this.getCartTotal(),
            status: 'new', // 'new', 'preparing', 'ready'
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        
        this.state.orders.push(newOrder);
        this.state.cart = []; // Empty cart
        this.notify();
        
        return newOrder;
    },
    
    updateOrderStatus(orderId, newStatus) {
        const order = this.state.orders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
            this.notify();
        }
    }
};

// Default product data based on HTML prototypes
export const products = [
    {
        id: 'p1',
        name: 'นอร์ดิกโอ๊ตลาเต้',
        description: 'เอสเพรสโซ่รสชาติกลมกล่อม ผสมผสานกับนมโอ๊ตสูตรพิเศษของเรา',
        price: 4.50,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA99hU035zko4CccqvPNBxtbuecMpqphwFBzq_eVscHGFW5sdrOoPposRxfSRViteQWpWAmuq2Hl11vx-WPc98MUMy99oWX4o_V3gnEUqKRSHxxP9JvICHJvbS2EUhTfsNaMreTAcKOHlfM0TTyY40WpAO0rbIvDs8AOtTP_FoKLpaE0_WirhfS9fhurLFp81eCcWCKTxpTfbIBIWifrJuDM72OCK7Veqj3wyb1z4T2XQQ8j-Y7kACVyhZl2uEJrh6jx7myuGHGp9g',
        tag: 'เพื่อความยั่งยืน'
    },
    {
        id: 'p2',
        name: 'ฟังก์ชันนัลเอสเพรสโซ่',
        description: 'เอสเพรสโซ่เข้มข้น 2 ช็อตจากเมล็ดคั่วเข้ม เพื่อพลังงาน...',
        price: 3.00,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUe1lmWVWobh8HD_c4dVOfu3WIHFvLWz_Vq41hG3pbLCiIfw72mpYpXZyfOxnnLdJloNLkQmZY_Nl5t5ucANB4GwsnV14tgPZ7eXFMxE-K6b8eVY7hy0pEZMixbzhyylZnaxjqK544SD5W9sT0I18V-pyt3XfX2r5kCodDlbtXdwKhpvt8WFGxQ1UI4t3YO-n3fVV-QHAkyvSDJAuWmO-03HKVjvFmQ-LC2OQx9bgLNoROpZ0l3378XsTxOE3RayGnjPgKf37cKBY'
    },
    {
        id: 'p3',
        name: 'แคลริตี้กรีนที (ชาเขียว)',
        description: 'ใบชาเซนฉะชั้นดี ให้ความรู้สึกสดชื่นเบาสบาย...',
        price: 3.50,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARSEvQVMz71-aI1HiLqamp5ik21567ajyGPxI9E9rvuWLtbQHoQvUK2LGCdrrNc8VukhtkViRgnb16WJPb07CzYm1AC9ClmYz-L8ZqGohEB7qIRfIPYlErbHVQKIDBo6Wps6FOAZVpMvnDWGPWrsEL-xhk7ycne__PNe_H_Pw1ioJZ6UuOmPyN4E5uLDXHmbkNiXoC9Hq9t8p8_4Yi2zRo4x4a42afl0Hog1Hxj7FD040EnowsDgC5vUp_63o-CR0-BtN3_0Jw-Nc',
        tag: 'เพื่อความยั่งยืน'
    },
    {
        id: 'p4',
        name: 'ซิตรัสไฮเดรเตอร์',
        description: 'น้ำโซดาเย็นจัด ผสมเลมอนสกัดเย็น และ...',
        price: 4.00,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCy0S_gglJsHJfAAYRkJlcDNVRlcxKjcI8LZQQsflVIMD6GdO2zGqNAJ6CiB5W3YKAcz5haCdMriq7leqRcN70EQIx1D-AHyijwQuSNKuVwGTgeRjDxl3oCTcZAni9xDyr1wTpnTJnFWA3iN3mWum_CJ5NUEH5TfnPmKTN17ZbRcaB568vPBpVoqnuU63QvHTmCmJS5G90D4x1cRtdm98AEZAF7RLJ_GxcVBMSy25pVw1Qb2wdc9mTrUwNYRCHDXT55oFy5__c05SQ'
    }
];
