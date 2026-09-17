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
                            <span class="font-price text-price text-text-primary whitespace-nowrap ml-md">฿${((item.finalPrice || item.price) * item.quantity).toFixed(2)}</span>
                        </div>
                        ${item.options ? `
                            <div class="font-caption text-caption text-text-secondary mb-2">
                                ${item.options.type ? `<div>ประเภท: ${item.options.type}</div>` : ''}
                                <div>ความหวาน: ${item.options.sweetness}%</div>
                                ${item.options.toppings && item.options.toppings.length > 0 ? `<div>ท็อปปิ้ง: ${item.options.toppings.join(', ')}</div>` : ''}
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
                            <span class="font-dimensions text-dimensions text-text-primary">฿${total.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>ภาษีโดยประมาณ</span>
                            <span class="font-dimensions text-dimensions text-text-primary">฿0.00</span>
                        </div>
                    </div>
                    <div class="flex justify-between items-center border-t border-border pt-md mb-lg">
                        <span class="font-h3 text-h3 text-text-primary">ยอดสุทธิ</span>
                        <span class="font-price text-price text-text-primary">฿${total.toFixed(2)}</span>
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
                const customerEmail = localStorage.getItem('customer_email');
                const customerName = localStorage.getItem('customer_name');
                
                // If customer hasn't provided email yet, show registration prompt
                if (!customerEmail) {
                    showCustomerModal(() => {
                        processCheckout();
                    });
                } else {
                    processCheckout();
                }
            });
        }

        function showCustomerModal(onSuccess) {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
            modal.innerHTML = `
                <div class="bg-surface w-full max-w-md rounded-2xl shadow-2xl p-6 border border-border">
                    <div class="text-center mb-6">
                        <div class="w-14 h-14 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-3 text-on-secondary-container">
                            <span class="material-symbols-outlined text-[32px]">person_add</span>
                        </div>
                        <h3 class="font-h2 text-h2 text-text-primary mb-1">ยินดีต้อนรับสู่ ร้านแม่วะคาเฟ่</h3>
                        <p class="font-body-sm text-body-sm text-text-secondary">กรุณากรอกอีเมลของคุณเพื่อยืนยันออเดอร์และรับการแจ้งเตือน</p>
                    </div>

                    <form id="cust-form" class="flex flex-col gap-4">
                        <div>
                            <label class="font-label text-label text-text-primary block mb-1">อีเมลของคุณ <span class="text-error">*</span></label>
                            <input type="email" id="cust-email" required placeholder="your.email@example.com" class="w-full h-11 px-3 bg-surface-container-low border border-border rounded-lg text-body-sm focus:border-primary outline-none" />
                        </div>
                        <div>
                            <label class="font-label text-label text-text-primary block mb-1">ชื่อเล่น หรือ เบอร์โต๊ะ <span class="text-error">*</span></label>
                            <input type="text" id="cust-name" required placeholder="เช่น โต๊ะ 3 / คุณส้ม" class="w-full h-11 px-3 bg-surface-container-low border border-border rounded-lg text-body-sm focus:border-primary outline-none" />
                        </div>
                        <div class="flex gap-2 mt-2">
                            <button type="button" id="cust-cancel" class="flex-1 h-11 bg-surface border border-border text-text-secondary rounded-lg font-label text-label hover:bg-surface-container">ยกเลิก</button>
                            <button type="submit" class="flex-1 h-11 bg-primary text-on-primary rounded-lg font-label text-label hover:bg-primary-hover font-bold">ยืนยันและสั่งซื้อ</button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('#cust-cancel').addEventListener('click', () => modal.remove());
            modal.querySelector('#cust-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const email = modal.querySelector('#cust-email').value.trim();
                const name = modal.querySelector('#cust-name').value.trim();
                if (email && name) {
                    store.setCustomer(email, name);
                    modal.remove();
                    if (onSuccess) onSuccess();
                }
            });
        }

        async function processCheckout() {
            const checkoutBtn = container.querySelector('#checkout-btn');
            if (checkoutBtn) {
                checkoutBtn.disabled = true;
                checkoutBtn.innerHTML = `
                    <span class="material-symbols-outlined animate-spin text-[20px]">sync</span>
                    กำลังส่งออเดอร์...
                `;
            }

            const order = await store.checkout();
            if (order) {
                showSuccessModal(order);
            }
        }

        function showSuccessModal(order) {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
            modal.innerHTML = `
                <div class="bg-surface w-full max-w-md rounded-2xl shadow-2xl p-6 border border-border text-center">
                    <div class="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-4 text-on-secondary-container shadow-sm">
                        <span class="material-symbols-outlined text-[40px]">check_circle</span>
                    </div>
                    <span class="bg-secondary-container text-on-secondary-container font-bold text-xs px-3 py-1 rounded-full inline-block mb-2">สั่งซื้อสำเร็จแล้ว</span>
                    <h3 class="font-h1 text-h1 text-text-primary mb-1">คิวของคุณ</h3>
                    <div class="my-4 py-4 px-6 bg-surface-container-low border border-border rounded-xl">
                        <div class="font-display text-4xl font-extrabold text-primary">${order.queue}</div>
                        <div class="text-caption text-text-secondary mt-1">เลขออเดอร์: ${order.id}</div>
                    </div>
                    <div class="text-left bg-surface-variant p-3 rounded-lg text-caption text-text-secondary mb-5 space-y-1">
                        <div>👤 ลูกค้า: <strong>${order.customer_name}</strong></div>
                        <div>✉️ อีเมล: <strong>${order.customer_email}</strong></div>
                        <div>💰 ยอดรวม: <strong class="text-primary text-sm">฿${order.total.toFixed(2)}</strong></div>
                    </div>
                    <p class="text-body-sm text-text-secondary mb-6">
                        ข้อมูลของคุณถูกส่งไปยังห้องครัวและบันทึกลงระบบ Google Sheets เรียบร้อยแล้ว กรุณารอเรียกคิวที่หน้าร้านครับ
                    </p>
                    <button id="finish-btn" class="w-full h-12 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-md">
                        กลับไปหน้าเมนูเครื่องดื่ม
                    </button>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('#finish-btn').addEventListener('click', () => {
                modal.remove();
                store.navigate('menu');
            });
        }
    }

    return container;
}
