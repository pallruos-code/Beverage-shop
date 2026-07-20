import { store } from '../store.js';

export function renderBottomNav() {
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
