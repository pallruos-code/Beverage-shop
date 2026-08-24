import { store } from '../store.js';

export function renderNavbar() {
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
