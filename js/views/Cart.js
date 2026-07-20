import { store } from '../store.js';

export function renderCart() {
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
