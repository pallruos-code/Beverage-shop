
/* --- js\store.js --- */
// store.js
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
const products = [
    {
        id: 'p1',
        name: 'เธเธญเธฃเนเธ”เธดเธเนเธญเนเธ•เธฅเธฒเน€เธ•เน',
        description: 'เน€เธญเธชเน€เธเธฃเธชเนเธเนเธฃเธชเธเธฒเธ•เธดเธเธฅเธกเธเธฅเนเธญเธก เธเธชเธกเธเธชเธฒเธเธเธฑเธเธเธกเนเธญเนเธ•เธชเธนเธ•เธฃเธเธดเน€เธจเธฉเธเธญเธเน€เธฃเธฒ',
        price: 4.50,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA99hU035zko4CccqvPNBxtbuecMpqphwFBzq_eVscHGFW5sdrOoPposRxfSRViteQWpWAmuq2Hl11vx-WPc98MUMy99oWX4o_V3gnEUqKRSHxxP9JvICHJvbS2EUhTfsNaMreTAcKOHlfM0TTyY40WpAO0rbIvDs8AOtTP_FoKLpaE0_WirhfS9fhurLFp81eCcWCKTxpTfbIBIWifrJuDM72OCK7Veqj3wyb1z4T2XQQ8j-Y7kACVyhZl2uEJrh6jx7myuGHGp9g',
        tag: 'เน€เธเธทเนเธญเธเธงเธฒเธกเธขเธฑเนเธเธขเธทเธ'
    },
    {
        id: 'p2',
        name: 'เธเธฑเธเธเนเธเธฑเธเธเธฑเธฅเน€เธญเธชเน€เธเธฃเธชเนเธเน',
        description: 'เน€เธญเธชเน€เธเธฃเธชเนเธเนเน€เธเนเธกเธเนเธ 2 เธเนเธญเธ•เธเธฒเธเน€เธกเธฅเนเธ”เธเธฑเนเธงเน€เธเนเธก เน€เธเธทเนเธญเธเธฅเธฑเธเธเธฒเธ...',
        price: 3.00,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUe1lmWVWobh8HD_c4dVOfu3WIHFvLWz_Vq41hG3pbLCiIfw72mpYpXZyfOxnnLdJloNLkQmZY_Nl5t5ucANB4GwsnV14tgPZ7eXFMxE-K6b8eVY7hy0pEZMixbzhyylZnaxjqK544SD5W9sT0I18V-pyt3XfX2r5kCodDlbtXdwKhpvt8WFGxQ1UI4t3YO-n3fVV-QHAkyvSDJAuWmO-03HKVjvFmQ-LC2OQx9bgLNoROpZ0l3378XsTxOE3RayGnjPgKf37cKBY'
    },
    {
        id: 'p3',
        name: 'เนเธเธฅเธฃเธดเธ•เธตเนเธเธฃเธตเธเธ—เธต (เธเธฒเน€เธเธตเธขเธง)',
        description: 'เนเธเธเธฒเน€เธเธเธเธฐเธเธฑเนเธเธ”เธต เนเธซเนเธเธงเธฒเธกเธฃเธนเนเธชเธถเธเธชเธ”เธเธทเนเธเน€เธเธฒเธชเธเธฒเธข...',
        price: 3.50,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARSEvQVMz71-aI1HiLqamp5ik21567ajyGPxI9E9rvuWLtbQHoQvUK2LGCdrrNc8VukhtkViRgnb16WJPb07CzYm1AC9ClmYz-L8ZqGohEB7qIRfIPYlErbHVQKIDBo6Wps6FOAZVpMvnDWGPWrsEL-xhk7ycne__PNe_H_Pw1ioJZ6UuOmPyN4E5uLDXHmbkNiXoC9Hq9t8p8_4Yi2zRo4x4a42afl0Hog1Hxj7FD040EnowsDgC5vUp_63o-CR0-BtN3_0Jw-Nc',
        tag: 'เน€เธเธทเนเธญเธเธงเธฒเธกเธขเธฑเนเธเธขเธทเธ'
    },
    {
        id: 'p4',
        name: 'เธเธดเธ•เธฃเธฑเธชเนเธฎเน€เธ”เธฃเน€เธ•เธญเธฃเน',
        description: 'เธเนเธณเนเธเธ”เธฒเน€เธขเนเธเธเธฑเธ” เธเธชเธกเน€เธฅเธกเธญเธเธชเธเธฑเธ”เน€เธขเนเธ เนเธฅเธฐ...',
        price: 4.00,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCy0S_gglJsHJfAAYRkJlcDNVRlcxKjcI8LZQQsflVIMD6GdO2zGqNAJ6CiB5W3YKAcz5haCdMriq7leqRcN70EQIx1D-AHyijwQuSNKuVwGTgeRjDxl3oCTcZAni9xDyr1wTpnTJnFWA3iN3mWum_CJ5NUEH5TfnPmKTN17ZbRcaB568vPBpVoqnuU63QvHTmCmJS5G90D4x1cRtdm98AEZAF7RLJ_GxcVBMSy25pVw1Qb2wdc9mTrUwNYRCHDXT55oFy5__c05SQ'
    }
];


/* --- js\views\ProductModal.js --- */

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
                    <h3 class="font-label text-label text-text-primary">เธฃเธฐเธ”เธฑเธเธเธงเธฒเธกเธซเธงเธฒเธ (Sweetness) <span class="text-error">*</span></h3>
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
                    <h3 class="font-label text-label text-text-primary">เธ—เนเธญเธเธเธดเนเธ (Toppings) <span class="font-caption text-caption text-text-secondary">(+$0.30)</span></h3>
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
                    <label class="font-label text-label text-text-primary" for="notes">เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เน€เธเธดเนเธกเน€เธ•เธดเธก</label>
                    <textarea id="notes" name="notes" rows="2" class="w-full border border-border rounded p-2 text-body-sm resize-none focus:ring-1 focus:ring-primary outline-none" placeholder="เน€เธเนเธ เธซเธงเธฒเธเธเนเธญเธข, เนเธกเนเนเธชเนเธเนเธณเนเธเนเธ..."></textarea>
                </div>

                <!-- Quantity & Submit -->
                <div class="mt-auto border-t border-border pt-4 flex flex-col gap-4">
                    <div class="flex justify-between items-center">
                        <span class="font-body-sm">เธเธณเธเธงเธ</span>
                        <div class="flex items-center border border-border rounded h-10 w-32">
                            <button type="button" id="qty-dec" class="w-1/3 h-full hover:bg-surface-container text-primary font-bold">-</button>
                            <input type="number" id="qty-val" value="1" min="1" class="w-1/3 h-full text-center border-none p-0 focus:ring-0 text-dimensions bg-transparent" readonly />
                            <button type="button" id="qty-inc" class="w-1/3 h-full hover:bg-surface-container text-primary font-bold">+</button>
                        </div>
                    </div>
                    
                    <button type="submit" class="w-full h-12 bg-secondary-container text-on-secondary-container font-label text-label rounded-lg hover:bg-secondary-fixed transition-colors flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined">shopping_basket</span>
                        เน€เธเธดเนเธกเธฅเธเธ•เธฐเธเธฃเนเธฒ - $<span id="total-price">${product.price.toFixed(2)}</span>
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


/* --- js\components\Navbar.js --- */

function renderNavbar() {
    const header = document.createElement('header');
    header.className = 'hidden md:flex bg-primary text-on-primary font-label text-label border-b border-outline-variant fixed top-0 left-0 w-full z-50 justify-center h-[64px] shadow-sm';
    
    header.innerHTML = `
        <div class="w-full flex justify-between items-center px-gutter-desktop max-w-container-max mx-auto h-full">
            <div class="flex items-center gap-xl">
                <div class="font-h2 text-h2 text-on-primary tracking-tight cursor-pointer" id="nav-brand">FikaSmart</div>
                <div class="relative w-64 hidden lg:block">
                    <span class="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-primary opacity-70">search</span>
                    <input class="w-full bg-primary-hover border-none rounded-DEFAULT py-xs pl-xl pr-sm text-on-primary placeholder:text-on-primary placeholder:opacity-50 focus:ring-2 focus:ring-secondary-fixed outline-none text-body-sm font-body-sm h-10 transition-colors" placeholder="Search..." type="text"/>
                </div>
            </div>
            
            <nav class="flex gap-lg items-center">
                <a class="text-on-primary opacity-80 hover:bg-primary-hover transition-colors px-2 py-1 rounded-DEFAULT cursor-pointer" id="nav-admin">Admin Dashboard</a>
                <a class="text-on-primary opacity-80 hover:bg-primary-hover transition-colors px-2 py-1 rounded-DEFAULT" href="#">Offers</a>
                <a class="text-on-primary opacity-80 hover:bg-primary-hover transition-colors px-2 py-1 rounded-DEFAULT" href="#">Sustainability</a>
            </nav>
            
            <div class="flex gap-md items-center">
                <button id="nav-cart-btn" class="relative text-secondary-fixed font-bold p-1 rounded-full flex items-center justify-center hover:bg-primary-hover transition-colors group">
                    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">shopping_cart</span>
                    <span id="cart-badge" class="absolute -top-1 -right-1 bg-error text-on-error text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center scale-0 transition-transform">0</span>
                </button>
                <button id="nav-login-btn" class="text-on-primary opacity-80 hover:bg-primary-hover transition-colors p-1 rounded-full flex items-center justify-center">
                    <span class="material-symbols-outlined">account_circle</span>
                </button>
            </div>
        </div>
    `;

    // Attach event listeners
    header.querySelector('#nav-brand').addEventListener('click', () => {
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


/* --- js\components\BottomNav.js --- */

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


/* --- js\views\Menu.js --- */

function renderMenu() {
    const container = document.createElement('div');
    container.className = 'px-gutter-mobile md:px-gutter-desktop max-w-container-max mx-auto mt-xl pb-xxl';

    container.innerHTML = `
        <header class="mb-xl text-center md:text-left">
            <h1 class="font-display text-display text-text-primary mb-xs">เน€เธกเธเธน</h1>
            <p class="font-body text-body text-text-secondary max-w-2xl">เธเธเธเธฑเธเน€เธเธฃเธทเนเธญเธเธ”เธทเนเธกเธ—เธตเนเน€เธฃเธฒเธเธฑเธ”เธชเธฃเธฃเธกเธฒเน€เธเนเธเธญเธขเนเธฒเธเธ”เธต เน€เธเธทเนเธญเธเธฃเธฐเธชเธดเธ—เธเธดเธ เธฒเธเนเธฅเธฐเธชเธธเธเธ—เธฃเธตเธขเธ เธฒเธเนเธเธ—เธธเธเธงเธฑเธเธเธญเธเธเธธเธ“</p>
        </header>

        <!-- Category Tabs -->
        <div class="flex overflow-x-auto gap-sm mb-xl pb-2 scrollbar-hide">
            <button class="flex-shrink-0 bg-primary text-on-primary font-label text-label px-6 py-2 rounded-full shadow-sm">เธเธฒเนเธ</button>
            <button class="flex-shrink-0 bg-surface text-text-secondary border border-border font-label text-label px-6 py-2 rounded-full hover:bg-surface-variant transition-colors">เธเธฒ</button>
            <button class="flex-shrink-0 bg-surface text-text-secondary border border-border font-label text-label px-6 py-2 rounded-full hover:bg-surface-variant transition-colors">เน€เธเธฃเธทเนเธญเธเธ”เธทเนเธกเน€เธ•เธดเธกเธเธงเธฒเธกเธชเธ”เธเธทเนเธ</button>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="product-grid">
        </div>
    `;

    const grid = container.querySelector('#product-grid');

    products.forEach(product => {
        const article = document.createElement('article');
        article.className = 'bg-surface border border-border card-elevation flex flex-col group relative';
        
        const tagHtml = product.tag ? `<span class="absolute top-sm left-sm bg-tertiary text-on-tertiary font-caption text-caption px-2 py-1 z-10">${product.tag}</span>` : '';

        article.innerHTML = `
            <div class="relative w-full aspect-square overflow-hidden bg-surface-variant">
                ${tagHtml}
                <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="${product.name}" src="${product.image}"/>
            </div>
            <div class="p-md flex flex-col flex-grow">
                <h2 class="font-product-name text-product-name text-text-primary mb-1">${product.name}</h2>
                <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-4 flex-grow">${product.description}</p>
                <div class="flex justify-between items-end mt-auto">
                    <span class="font-price text-price text-text-primary">$${product.price.toFixed(2)}</span>
                </div>
                <button class="add-to-cart-btn mt-4 h-[44px] w-full bg-secondary-container text-on-surface font-label text-label rounded-DEFAULT flex items-center justify-center hover:bg-secondary-fixed transition-colors active:scale-95">
                    เน€เธเธดเนเธกเธฅเธเธ•เธฐเธเธฃเนเธฒ
                </button>
            </div>
        `;

        article.querySelector('.add-to-cart-btn').addEventListener('click', () => {
            const modal = renderProductModal(product, () => {
                // Modal closed callback (optional logic here)
            });
            document.body.appendChild(modal);
        });

        grid.appendChild(article);
    });

    return container;
}


/* --- js\views\Cart.js --- */

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
                <h2 class="font-h2 text-h2 text-text-primary mb-sm">เธ•เธฐเธเธฃเนเธฒเธชเธดเธเธเนเธฒเธงเนเธฒเธเน€เธเธฅเนเธฒ</h2>
                <p class="font-body text-body text-text-secondary mb-lg">เธเธธเธ“เธขเธฑเธเนเธกเนเธกเธตเธชเธดเธเธเนเธฒเนเธ”เน เนเธเธ•เธฐเธเธฃเนเธฒ</p>
                <button id="back-to-shop" class="bg-primary text-on-primary px-lg py-sm rounded-DEFAULT font-label text-label hover:bg-primary-hover transition-colors">
                    เธเธฅเธฑเธเนเธเน€เธฅเธทเธญเธเธเธทเนเธญเธชเธดเธเธเนเธฒ
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
                                <div>เธเธงเธฒเธกเธซเธงเธฒเธ: ${item.options.sweetness}%</div>
                                ${item.options.toppings.length > 0 ? `<div>เธ—เนเธญเธเธเธดเนเธ: ${item.options.toppings.join(', ')}</div>` : ''}
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
                            <span class="hidden sm:inline">เธฅเธเธญเธญเธ</span>
                        </button>
                    </div>
                </div>
            </article>
        `).join('');
    }

    container.innerHTML = `
        <header class="mb-lg md:mb-xl border-b border-border pb-md">
            <h1 class="font-h1-mobile text-h1-mobile md:font-h1 md:text-h1 text-text-primary">เธ•เธฐเธเธฃเนเธฒเธชเธดเธเธเนเธฒเธเธญเธเธเธธเธ“</h1>
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
                    <h2 class="font-h3 text-h3 text-text-primary mb-lg border-b border-border pb-xs">เธชเธฃเธธเธเธฃเธฒเธขเธเธฒเธฃเธชเธฑเนเธเธเธทเนเธญ</h2>
                    <div class="flex flex-col gap-sm font-body text-body text-text-secondary mb-lg">
                        <div class="flex justify-between">
                            <span>เธขเธญเธ”เธฃเธงเธกเธชเธดเธเธเนเธฒ</span>
                            <span class="font-dimensions text-dimensions text-text-primary">$${total.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>เธ เธฒเธฉเธตเนเธ”เธขเธเธฃเธฐเธกเธฒเธ“</span>
                            <span class="font-dimensions text-dimensions text-text-primary">$0.00</span>
                        </div>
                    </div>
                    <div class="flex justify-between items-center border-t border-border pt-md mb-lg">
                        <span class="font-h3 text-h3 text-text-primary">เธขเธญเธ”เธชเธธเธ—เธเธด</span>
                        <span class="font-price text-price text-text-primary">$${total.toFixed(2)}</span>
                    </div>
                    <button id="checkout-btn" class="w-full h-[44px] bg-secondary-container text-on-secondary-container font-label text-label hover:bg-secondary-fixed hover:shadow-md transition-all flex items-center justify-center gap-xs active:scale-[0.98]">
                        เธ”เธณเน€เธเธดเธเธเธฒเธฃเธเธณเธฃเธฐเน€เธเธดเธ
                        <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                    <p class="font-caption text-caption text-text-secondary text-center mt-md flex items-center justify-center gap-xs">
                        <span class="material-symbols-outlined text-[14px]">lock</span> เธเธฒเธฃเน€เธเธทเนเธญเธกเธ•เนเธญเธ—เธตเนเธเธฅเธญเธ”เธ เธฑเธข
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


/* --- js\views\Admin.js --- */

function renderAdmin() {
    const container = document.createElement('div');
    container.className = 'w-full min-h-screen flex overflow-hidden bg-background text-on-surface font-body';

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
                    <span class="font-label text-label">เนเธ”เธเธเธญเธฃเนเธ”</span>
                </a>
                <!-- Inactive Links -->
                <a id="admin-nav-pos" class="flex items-center gap-md px-md py-sm text-on-primary opacity-80 hover:opacity-100 hover:bg-primary-hover rounded-lg transition-colors group cursor-pointer">
                    <span class="material-symbols-outlined">point_of_sale</span>
                    <span class="font-label text-label">เธเธธเธ”เธเธฒเธข (POS)</span>
                </a>
                <a id="admin-nav-kds" class="flex items-center gap-md px-md py-sm text-on-primary opacity-80 hover:opacity-100 hover:bg-primary-hover rounded-lg transition-colors group cursor-pointer">
                    <span class="material-symbols-outlined">receipt_long</span>
                    <span class="font-label text-label">เธซเธเนเธฒเธเธญเธเธฃเธฑเธง (KDS)</span>
                </a>
                <a class="flex items-center gap-md px-md py-sm text-on-primary opacity-80 hover:opacity-100 hover:bg-primary-hover rounded-lg transition-colors group cursor-pointer">
                    <span class="material-symbols-outlined">inventory_2</span>
                    <span class="font-label text-label">เธชเธดเธเธเนเธฒ</span>
                </a>
            </nav>
            
            <!-- User Profile minimal -->
            <div class="p-lg border-t border-primary-hover flex items-center gap-md">
                <div class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-h3 text-h3">
                    M
                </div>
                <div class="flex flex-col">
                    <span class="font-label text-label text-on-primary">Manager</span>
                    <span class="font-caption text-caption text-on-primary opacity-70">เธชเธฒเธเธฒเธซเธฅเธฑเธ</span>
                </div>
            </div>
        </aside>
        
        <!-- Main Content Area -->
        <main class="flex-1 flex flex-col h-screen overflow-hidden bg-background relative">
            <!-- Top Header Area -->
            <header class="h-[80px] bg-surface border-b border-border flex items-center justify-between px-xl shrink-0 z-10 shadow-sm">
                <h1 class="font-h1 text-h1 text-primary">เธ เธฒเธเธฃเธงเธกเธฃเธฐเธเธ</h1>
                <div class="flex items-center gap-md">
                    <button class="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors border border-border">
                        <span class="material-symbols-outlined">notifications</span>
                    </button>
                    <button id="go-to-shop" class="h-[44px] px-lg bg-primary hover:bg-primary-hover text-on-primary font-label text-label rounded-DEFAULT flex items-center gap-xs transition-colors">
                        <span class="material-symbols-outlined" style="font-size: 20px;">storefront</span>
                        เธเธฅเธฑเธเนเธเธซเธเนเธฒเธฃเนเธฒเธ
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
                                <span class="font-label text-label text-outline">เธขเธญเธ”เธเธฒเธขเธงเธฑเธเธเธตเน</span>
                                <span class="material-symbols-outlined text-secondary-container bg-surface-container w-8 h-8 flex items-center justify-center rounded-full">payments</span>
                            </div>
                            <div class="flex items-baseline gap-sm mt-auto">
                                <span class="font-display text-display text-primary tracking-tight">เธฟ42,500</span>
                                <span class="font-body-sm text-body-sm text-tertiary-container bg-tertiary-fixed-dim px-2 py-0.5 rounded-sm flex items-center gap-1">
                                    <span class="material-symbols-outlined" style="font-size: 14px;">trending_up</span> 12%
                                </span>
                            </div>
                        </div>
                        
                        <div class="bg-surface border border-border rounded-lg p-lg shadow-[0_1px_3px_rgba(17,17,17,0.06)] flex flex-col">
                            <div class="flex items-center justify-between mb-sm">
                                <span class="font-label text-label text-outline">เธเธณเธเธงเธเธเธณเธชเธฑเนเธเธเธทเนเธญเธ—เธฑเนเธเธซเธกเธ”</span>
                                <span class="material-symbols-outlined text-primary bg-surface-container w-8 h-8 flex items-center justify-center rounded-full">shopping_bag</span>
                            </div>
                            <div class="flex items-baseline gap-sm mt-auto">
                                <span class="font-display text-display text-primary tracking-tight">142</span>
                                <span class="font-body-sm text-body-sm text-outline">เธญเธญเน€เธ”เธญเธฃเน</span>
                            </div>
                        </div>
                        
                        <div class="bg-surface border border-border rounded-lg p-lg shadow-[0_1px_3px_rgba(17,17,17,0.06)] flex flex-col">
                            <div class="flex items-center justify-between mb-sm">
                                <span class="font-label text-label text-outline">เน€เธงเธฅเธฒเธฃเธญเน€เธเธฅเธตเนเธข</span>
                                <span class="material-symbols-outlined text-warning bg-surface-container w-8 h-8 flex items-center justify-center rounded-full">timer</span>
                            </div>
                            <div class="flex items-baseline gap-sm mt-auto">
                                <span class="font-dimensions text-display text-primary tracking-tight">04:30</span>
                                <span class="font-body-sm text-body-sm text-outline">เธเธฒเธ—เธต</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-surface border border-border rounded-lg shadow-[0_1px_3px_rgba(17,17,17,0.06)] overflow-hidden">
                        <div class="p-lg border-b border-border flex items-center justify-between bg-surface">
                            <h2 class="font-h2 text-h2 text-primary">เธเธณเธชเธฑเนเธเธเธทเนเธญเธฅเนเธฒเธชเธธเธ”</h2>
                        </div>
                        <div class="w-full overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-surface-container-low border-b border-border">
                                        <th class="p-md font-label text-label text-outline whitespace-nowrap">เธฃเธซเธฑเธชเธญเธญเน€เธ”เธญเธฃเน</th>
                                        <th class="p-md font-label text-label text-outline whitespace-nowrap">เน€เธงเธฅเธฒ</th>
                                        <th class="p-md font-label text-label text-outline whitespace-nowrap">เธฃเธฒเธขเธเธฒเธฃ</th>
                                        <th class="p-md font-label text-label text-outline whitespace-nowrap">เธเธณเธเธงเธเน€เธเธดเธ</th>
                                        <th class="p-md font-label text-label text-outline whitespace-nowrap">เธชเธ–เธฒเธเธฐ</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-border">
                                    <tr class="hover:bg-surface-container-lowest transition-colors">
                                        <td class="p-md font-dimensions text-body-sm text-primary font-bold">#ORD-8901</td>
                                        <td class="p-md font-dimensions text-body-sm text-on-surface-variant">14:22</td>
                                        <td class="p-md font-body-sm text-body-sm text-on-surface">เธฅเธฒเน€เธ•เนเน€เธขเนเธ (x2), เธเธฃเธฑเธงเธเธญเธเธ•เน</td>
                                        <td class="p-md font-dimensions text-body-sm text-on-surface">เธฟ240</td>
                                        <td class="p-md">
                                            <span class="inline-flex items-center px-2 py-1 rounded-sm bg-secondary-container text-on-secondary-container font-caption text-caption">เธเธณเธฅเธฑเธเน€เธ•เธฃเธตเธขเธก</span>
                                        </td>
                                    </tr>
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


/* --- js\views\POS.js --- */

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
                    <h1 class="font-h1 text-h1 text-text-primary mb-base">เธเธณเธฃเธฐเน€เธเธดเธเนเธฅเธฐเธเธดเธกเธเนเนเธเน€เธชเธฃเนเธ (POS)</h1>
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
                                        <p class="font-body-sm text-body-sm text-text-secondary">เธเธงเธฒเธกเธซเธงเธฒเธ: ${item.options.sweetness}%</p>
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
                        Print Receipt (เธเธดเธกเธเนเนเธเน€เธชเธฃเนเธ)
                    </button>
                    <button id="pos-new-order" class="flex-1 h-[44px] bg-surface text-primary border-2 border-primary font-label text-label rounded-lg hover:bg-surface-container-low transition-colors flex items-center justify-center gap-xs">
                        <span class="material-symbols-outlined">add_circle</span>
                        New Order (เน€เธฃเธดเนเธกเธญเธญเน€เธ”เธญเธฃเนเนเธซเธกเน)
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
                            <p class="font-dimensions text-[12px] font-bold mb-sm">Scan to Pay (เธชเนเธเธเน€เธเธทเนเธญเธเธณเธฃเธฐเน€เธเธดเธ)</p>
                            <div class="bg-white p-2 inline-block border border-border mb-sm">
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=FIKASMART-${latestOrder.id}" class="w-24 h-24" alt="QR" />
                            </div>
                        </div>
                        <div class="text-center font-dimensions text-[10px] pb-lg">
                            <p>Thank you for choosing FikaSmart!</p>
                            <p class="mt-xs">Tack sรฅ mycket!</p>
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


/* --- js\views\KDS.js --- */

function renderKDS() {
    const container = document.createElement('div');
    container.className = 'w-full min-h-screen bg-background text-on-background font-body flex flex-col';

    const orders = store.state.orders;
    const newOrders = orders.filter(o => o.status === 'new');
    const preparingOrders = orders.filter(o => o.status === 'preparing');
    const readyOrders = orders.filter(o => o.status === 'ready');

    container.innerHTML = `
        <!-- TopNavBar -->
        <header class="bg-primary text-on-primary w-full z-50 flex justify-between items-center px-gutter-desktop h-[64px] border-b border-outline-variant shadow-md">
            <div class="flex items-center gap-xl cursor-pointer" id="kds-brand">
                <h1 class="font-h2 text-h2 text-on-primary tracking-tight">FikaSmart KDS</h1>
            </div>
            <div class="flex items-center gap-md">
                <button id="kds-to-menu" class="h-[36px] px-md bg-secondary-container text-on-secondary-container font-label text-label rounded hover:bg-secondary-fixed transition-colors">เธซเธเนเธฒเธฃเนเธฒเธ (Shop)</button>
            </div>
        </header>
        
        <!-- Main Content Canvas -->
        <main class="flex-grow pt-4 pb-lg px-gutter-desktop md:max-w-container-max md:mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-gutter-desktop overflow-hidden h-[calc(100vh-64px)]">
            
            <!-- Column 1: New Orders -->
            <section class="flex flex-col bg-surface-container-low rounded-lg border border-border h-full overflow-hidden">
                <header class="bg-surface-variant text-on-surface-variant px-md py-sm border-b border-border flex justify-between items-center">
                    <h2 class="font-h3 text-h3 flex items-center gap-xs">
                        <span class="material-symbols-outlined">inbox</span> เธญเธญเน€เธ”เธญเธฃเนเนเธซเธกเน (New)
                    </h2>
                    <span class="bg-error text-on-error font-dimensions text-dimensions px-sm py-base rounded-full">${newOrders.length}</span>
                </header>
                <div class="flex-1 overflow-y-auto p-md flex flex-col gap-md">
                    ${newOrders.map(order => `
                        <article class="bg-surface rounded-lg border border-border p-md shadow-sm relative">
                            <div class="flex justify-between items-start mb-xs">
                                <span class="font-dimensions text-dimensions font-bold text-primary text-xl">${order.queue}</span>
                                <span class="font-dimensions text-dimensions text-error">${order.timestamp}</span>
                            </div>
                            <div class="border-t border-border pt-xs mb-md">
                                ${order.items.map(item => `
                                    <div class="flex justify-between items-center py-base font-product-name text-product-name text-on-surface">
                                        <span>${item.quantity}x ${item.name}</span>
                                    </div>
                                    ${item.options ? `
                                        <ul class="font-body-sm text-body-sm text-text-secondary pl-lg list-disc">
                                            <li>เธซเธงเธฒเธ ${item.options.sweetness}%</li>
                                            ${item.options.toppings.map(t => `<li>${t}</li>`).join('')}
                                            ${item.options.notes ? `<li><em>${item.options.notes}</em></li>` : ''}
                                        </ul>
                                    ` : ''}
                                `).join('')}
                            </div>
                            <button data-action="accept" data-id="${order.id}" class="w-full bg-primary text-on-primary font-label text-label h-[44px] rounded-DEFAULT hover:bg-primary-hover transition-colors flex justify-center items-center gap-xs">
                                <span class="material-symbols-outlined">check</span> เธฃเธฑเธเธญเธญเน€เธ”เธญเธฃเน (Accept)
                            </button>
                        </article>
                    `).join('')}
                    ${newOrders.length === 0 ? '<div class="text-center text-outline p-4 font-body-sm">No new orders</div>' : ''}
                </div>
            </section>

            <!-- Column 2: Preparing -->
            <section class="flex flex-col bg-surface-container-low rounded-lg border border-border h-full overflow-hidden">
                <header class="bg-surface-variant text-on-surface-variant px-md py-sm border-b border-border flex justify-between items-center">
                    <h2 class="font-h3 text-h3 flex items-center gap-xs">
                        <span class="material-symbols-outlined">blender</span> เธเธณเธฅเธฑเธเน€เธ•เธฃเธตเธขเธก (Preparing)
                    </h2>
                    <span class="bg-secondary-container text-on-secondary-container font-dimensions text-dimensions px-sm py-base rounded-full">${preparingOrders.length}</span>
                </header>
                <div class="flex-1 overflow-y-auto p-md flex flex-col gap-md">
                    ${preparingOrders.map(order => `
                        <article class="bg-surface rounded-lg border-2 border-secondary-fixed p-md shadow-md relative">
                            <div class="flex justify-between items-start mb-xs">
                                <span class="font-dimensions text-dimensions font-bold text-primary text-xl">${order.queue}</span>
                                <span class="font-dimensions text-dimensions text-text-secondary">${order.timestamp}</span>
                            </div>
                            <div class="border-t border-border pt-xs mb-md">
                                ${order.items.map(item => `
                                    <div class="flex justify-between items-center py-base font-product-name text-product-name text-on-surface">
                                        <span>${item.quantity}x ${item.name}</span>
                                    </div>
                                    ${item.options ? `
                                        <ul class="font-body-sm text-body-sm text-text-secondary pl-lg list-disc">
                                            <li>เธซเธงเธฒเธ ${item.options.sweetness}%</li>
                                            ${item.options.toppings.map(t => `<li>${t}</li>`).join('')}
                                        </ul>
                                    ` : ''}
                                `).join('')}
                            </div>
                            <button data-action="complete" data-id="${order.id}" class="w-full bg-tertiary-container text-on-tertiary-container font-label text-label h-[44px] rounded-DEFAULT hover:opacity-90 transition-opacity flex justify-center items-center gap-xs">
                                <span class="material-symbols-outlined">done_all</span> เน€เธชเธฃเนเธเธชเธดเนเธ (Complete)
                            </button>
                        </article>
                    `).join('')}
                    ${preparingOrders.length === 0 ? '<div class="text-center text-outline p-4 font-body-sm">No orders in preparation</div>' : ''}
                </div>
            </section>

            <!-- Column 3: Ready -->
            <section class="flex flex-col bg-surface-container-low rounded-lg border border-border h-full overflow-hidden opacity-80">
                <header class="bg-surface-variant text-on-surface-variant px-md py-sm border-b border-border flex justify-between items-center">
                    <h2 class="font-h3 text-h3 flex items-center gap-xs">
                        <span class="material-symbols-outlined">storefront</span> เธเธฃเนเธญเธกเน€เธชเธดเธฃเนเธ (Ready)
                    </h2>
                    <span class="bg-outline-variant text-on-surface-variant font-dimensions text-dimensions px-sm py-base rounded-full">${readyOrders.length}</span>
                </header>
                <div class="flex-1 overflow-y-auto p-md flex flex-col gap-md">
                    ${readyOrders.map(order => `
                        <article class="bg-surface rounded-lg border border-border p-md shadow-sm relative">
                            <div class="flex justify-between items-start mb-xs">
                                <span class="font-dimensions text-dimensions font-bold text-outline text-xl line-through">${order.queue}</span>
                                <span class="font-caption text-caption text-text-secondary flex items-center gap-xs bg-surface-container px-sm py-base rounded-full">
                                    <span class="material-symbols-outlined text-sm">check_circle</span>
                                    เธฃเธญเธฃเธฑเธ
                                </span>
                            </div>
                            <div class="border-t border-border pt-xs">
                                <div class="flex justify-between items-center py-base">
                                    <span class="font-body-sm text-body-sm text-text-secondary">${order.items.reduce((acc, i)=>acc+i.quantity,0)} Items</span>
                                </div>
                            </div>
                        </article>
                    `).join('')}
                    ${readyOrders.length === 0 ? '<div class="text-center text-outline p-4 font-body-sm">No orders ready</div>' : ''}
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
            store.updateOrderStatus(orderId, 'preparing');
        });
    });

    container.querySelectorAll('button[data-action="complete"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = e.currentTarget.dataset.id;
            store.updateOrderStatus(orderId, 'ready');
        });
    });

    return container;
}


/* --- js\views\Login.js --- */

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
                <h1 class="font-h1-mobile md:font-h1 text-h1-mobile md:text-h1 text-center text-text-primary mb-xl tracking-tight">เน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธ</h1>
                
                <form class="flex flex-col gap-lg" id="login-form">
                    <!-- Email Field -->
                    <div class="flex flex-col gap-xs relative">
                        <label class="font-label text-label text-text-primary" for="email">เธญเธตเน€เธกเธฅ</label>
                        <div class="relative w-full">
                            <span class="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline z-10 pointer-events-none">mail</span>
                            <input class="w-full h-[44px] pl-xl pr-sm bg-surface border border-border rounded-DEFAULT focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm text-text-primary placeholder:text-outline transition-colors outline-none" id="email" placeholder="example@email.com" required="" type="email" />
                        </div>
                    </div>
                    
                    <!-- Password Field -->
                    <div class="flex flex-col gap-xs relative">
                        <div class="flex justify-between items-center">
                            <label class="font-label text-label text-text-primary" for="password">เธฃเธซเธฑเธชเธเนเธฒเธ</label>
                            <a class="font-caption text-caption text-primary hover:text-primary-hover hover:underline transition-colors" href="#">เธฅเธทเธกเธฃเธซเธฑเธชเธเนเธฒเธ?</a>
                        </div>
                        <div class="relative w-full">
                            <span class="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline z-10 pointer-events-none">lock</span>
                            <input class="w-full h-[44px] px-xl bg-surface border border-border rounded-DEFAULT focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm text-text-primary placeholder:text-outline transition-colors outline-none" id="password" placeholder="โ€ขโ€ขโ€ขโ€ขโ€ขโ€ขโ€ขโ€ข" required="" type="password" />
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
                        <label class="font-body-sm text-body-sm text-text-primary cursor-pointer select-none" for="remember">เธเธณเธเธฑเธเนเธงเนเนเธเธฃเธฐเธเธ</label>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex flex-col gap-md mt-sm">
                        <button class="w-full h-[44px] bg-primary text-on-primary font-label text-label rounded-DEFAULT hover:bg-primary-hover transition-colors shadow-sm active:scale-[0.98] flex items-center justify-center gap-sm" type="submit">
                            เน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธ
                            <span class="material-symbols-outlined" style="font-size: 18px;">arrow_forward</span>
                        </button>
                        
                        <div class="relative flex items-center py-sm">
                            <div class="flex-grow border-t border-border"></div>
                            <span class="flex-shrink-0 mx-md font-caption text-caption text-text-secondary uppercase tracking-wider">เธซเธฃเธทเธญ</span>
                            <div class="flex-grow border-t border-border"></div>
                        </div>

                        <button class="w-full h-[44px] bg-surface text-text-primary border border-border font-label text-label rounded-DEFAULT hover:bg-surface-container-low transition-colors shadow-sm active:scale-[0.98] flex items-center justify-center gap-sm" type="button">
                            เน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธเธ”เนเธงเธข Google
                        </button>
                    </div>
                </form>

                <p class="mt-lg text-center font-body-sm text-body-sm text-text-secondary">
                    เธขเธฑเธเนเธกเนเธกเธตเธเธฑเธเธเธต? 
                    <a class="font-label text-label text-primary hover:text-primary-hover hover:underline transition-colors" href="#">เธชเธกเธฑเธเธฃเธชเธกเธฒเธเธดเธ</a>
                </p>
            </div>
            
            <div class="mt-xl font-caption text-caption text-outline text-center flex flex-col gap-xs">
                <p>2023 ยฉ FikaSmart.</p>
                <div class="flex gap-md justify-center">
                    <a class="hover:text-text-primary transition-colors" href="#">Terms</a>
                    <a class="hover:text-text-primary transition-colors" href="#">Privacy</a>
                </div>
            </div>
        </div>
    `;

    // Functionality
    const loginForm = container.querySelector('#login-form');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        store.navigate('admin'); // Simulate successful login navigating to admin
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


/* --- js\app.js --- */

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


