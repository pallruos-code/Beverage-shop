import { store } from '../store.js';

export function renderNavbar() {
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
