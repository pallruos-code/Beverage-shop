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
                showPaymentModal();
            });
        }

        function showPaymentModal() {
            const savedEmail = localStorage.getItem('customer_email') || '';
            const savedName = localStorage.getItem('customer_name') || '';
            let selectedMethod = 'promptpay'; // 'promptpay' or 'cash'

            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto';
            modal.innerHTML = `
                <div class="bg-surface w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-border my-auto">
                    <div class="flex justify-between items-center pb-3 border-b border-border mb-4">
                        <h3 class="font-h2 text-xl font-bold text-text-primary flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary text-[28px]">payments</span>
                            ยืนยันการชำระเงิน
                        </h3>
                        <button id="pay-close-btn" class="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-surface-variant">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <form id="payment-form" class="flex flex-col gap-4">
                        <!-- Customer Info -->
                        <div class="bg-surface-container-low p-4 rounded-xl border border-border/80">
                            <h4 class="font-label text-sm font-bold text-text-primary mb-3 flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-[18px]">person</span> ข้อมูลลูกค้า
                            </h4>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label class="font-caption text-xs text-text-secondary block mb-1">อีเมลของคุณ <span class="text-error">*</span></label>
                                    <input type="email" id="pay-email" required value="${savedEmail}" placeholder="your.email@example.com" class="w-full h-10 px-3 bg-surface border border-border rounded-lg text-body-sm focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label class="font-caption text-xs text-text-secondary block mb-1">ชื่อลูกค้า หรือ เบอร์โต๊ะ <span class="text-error">*</span></label>
                                    <input type="text" id="pay-name" required value="${savedName}" placeholder="เช่น โต๊ะ 3 / คุณเตวิช" class="w-full h-10 px-3 bg-surface border border-border rounded-lg text-body-sm focus:border-primary outline-none" />
                                </div>
                            </div>
                        </div>

                        <!-- Payment Method Selection -->
                        <div>
                            <label class="font-label text-sm font-bold text-text-primary block mb-2">เลือกวิธีชำระเงิน</label>
                            <div class="grid grid-cols-2 gap-3">
                                <label id="method-promptpay-card" class="cursor-pointer border-2 border-primary bg-primary/5 rounded-xl p-3 flex flex-col items-center text-center transition-all">
                                    <input type="radio" name="pay_method" value="promptpay" checked class="hidden" />
                                    <span class="material-symbols-outlined text-primary text-[28px] mb-1">qr_code_scanner</span>
                                    <span class="font-bold text-xs text-primary">สแกนจ่าย QR Code</span>
                                    <span class="text-[10px] text-text-secondary mt-0.5">พร้อมเพย์ PromptPay</span>
                                </label>
                                <label id="method-cash-card" class="cursor-pointer border-2 border-border bg-surface rounded-xl p-3 flex flex-col items-center text-center transition-all hover:bg-surface-variant">
                                    <input type="radio" name="pay_method" value="cash" class="hidden" />
                                    <span class="material-symbols-outlined text-text-secondary text-[28px] mb-1">payments</span>
                                    <span class="font-bold text-xs text-text-primary">ชำระเงินสด</span>
                                    <span class="text-[10px] text-text-secondary mt-0.5">ชำระที่เคาน์เตอร์บาร์</span>
                                </label>
                            </div>
                        </div>

                        <!-- PromptPay QR Code Box (shown when PromptPay is selected) -->
                        <div id="qr-box" class="bg-surface-container-low p-4 rounded-xl border border-border flex flex-col items-center text-center">
                            <p class="font-bold text-xs text-text-primary mb-1">สแกน QR Code เพื่อชำระเงิน</p>
                            <p class="text-[11px] text-text-secondary mb-3">ยอดชำระสุทธิ: <strong class="text-primary text-sm font-bold">฿${total.toFixed(2)}</strong></p>
                            <div class="bg-white p-3 rounded-xl border-2 border-border shadow-sm mb-2">
                                <img src="https://promptpay.io/0647040484/${total.toFixed(2)}.png" alt="สแกนผ่านแอปธนาคาร" class="w-40 h-40 object-contain mx-auto" />
                            </div>
                            <p class="text-[10px] text-text-secondary">เปิดแอปธนาคาร สแกน QR แล้วกดยืนยันชำระเงินด้านล่าง</p>
                        </div>

                        <!-- Cash Box (shown when cash is selected) -->
                        <div id="cash-box" class="hidden bg-surface-container-low p-4 rounded-xl border border-border text-center">
                            <span class="material-symbols-outlined text-secondary-container text-[36px] mb-1">storefront</span>
                            <p class="font-bold text-xs text-text-primary mb-1">ชำระเงินสดที่เคาน์เตอร์</p>
                            <p class="text-[11px] text-text-secondary">กดยืนยันเพื่อส่งออเดอร์เข้าครัว แล้วนำเงินสด <strong>฿${total.toFixed(2)}</strong> ไปชำระกับพนักงานที่เคาน์เตอร์บาร์น้ำครับ</p>
                        </div>

                        <!-- Order Summary Line -->
                        <div class="flex justify-between items-center bg-surface-variant p-3 rounded-lg font-bold text-sm">
                            <span>ยอดรวมทั้งสิ้น (${cartItems.reduce((acc, i) => acc + i.quantity, 0)} แก้ว)</span>
                            <span class="text-primary text-base">฿${total.toFixed(2)}</span>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex gap-2 pt-2">
                            <button type="button" id="pay-cancel-btn" class="flex-1 h-12 bg-surface border border-border text-text-secondary rounded-xl font-label text-label hover:bg-surface-container">ยกเลิก</button>
                            <button type="submit" id="pay-confirm-btn" class="flex-[2] h-12 bg-primary text-on-primary rounded-xl font-label text-label hover:bg-primary-hover font-bold shadow-md flex items-center justify-center gap-1.5">
                                <span class="material-symbols-outlined text-[20px]">check_circle</span>
                                ยืนยันการชำระเงินและสั่งซื้อ
                            </button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            // Toggle payment method
            const qrBox = modal.querySelector('#qr-box');
            const cashBox = modal.querySelector('#cash-box');
            const ppCard = modal.querySelector('#method-promptpay-card');
            const cashCard = modal.querySelector('#method-cash-card');

            ppCard.addEventListener('click', () => {
                selectedMethod = 'promptpay';
                ppCard.className = 'cursor-pointer border-2 border-primary bg-primary/5 rounded-xl p-3 flex flex-col items-center text-center transition-all';
                ppCard.querySelector('span.material-symbols-outlined').className = 'material-symbols-outlined text-primary text-[28px] mb-1';
                ppCard.querySelector('span.font-bold').className = 'font-bold text-xs text-primary';
                
                cashCard.className = 'cursor-pointer border-2 border-border bg-surface rounded-xl p-3 flex flex-col items-center text-center transition-all hover:bg-surface-variant';
                cashCard.querySelector('span.material-symbols-outlined').className = 'material-symbols-outlined text-text-secondary text-[28px] mb-1';
                cashCard.querySelector('span.font-bold').className = 'font-bold text-xs text-text-primary';
                
                qrBox.classList.remove('hidden');
                cashBox.classList.add('hidden');
            });

            cashCard.addEventListener('click', () => {
                selectedMethod = 'cash';
                cashCard.className = 'cursor-pointer border-2 border-primary bg-primary/5 rounded-xl p-3 flex flex-col items-center text-center transition-all';
                cashCard.querySelector('span.material-symbols-outlined').className = 'material-symbols-outlined text-primary text-[28px] mb-1';
                cashCard.querySelector('span.font-bold').className = 'font-bold text-xs text-primary';
                
                ppCard.className = 'cursor-pointer border-2 border-border bg-surface rounded-xl p-3 flex flex-col items-center text-center transition-all hover:bg-surface-variant';
                ppCard.querySelector('span.material-symbols-outlined').className = 'material-symbols-outlined text-text-secondary text-[28px] mb-1';
                ppCard.querySelector('span.font-bold').className = 'font-bold text-xs text-text-primary';
                
                cashBox.classList.remove('hidden');
                qrBox.classList.add('hidden');
            });

            modal.querySelector('#pay-close-btn').addEventListener('click', () => modal.remove());
            modal.querySelector('#pay-cancel-btn').addEventListener('click', () => modal.remove());

            modal.querySelector('#payment-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = modal.querySelector('#pay-email').value.trim();
                const name = modal.querySelector('#pay-name').value.trim();

                if (!email || !name) return;

                store.setCustomer(email, name);

                const confirmBtn = modal.querySelector('#pay-confirm-btn');
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[20px]">sync</span> กำลังส่งออเดอร์...`;

                const order = await store.checkout(selectedMethod);
                modal.remove();

                if (order) {
                    showReceiptModal(order);
                }
            });
        }

        function showReceiptModal(order) {
            const existing = document.getElementById('receipt-modal-container');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'receipt-modal-container';
            modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto';

            const itemsRows = (order.items || []).map(item => `
                <tr class="border-b border-dashed border-gray-300">
                    <td class="py-2 text-left align-top">
                        <div class="font-bold text-xs text-gray-900">${item.name}</div>
                        ${item.options ? `
                            <div class="text-[10px] text-gray-600">
                                หวาน ${item.options.sweetness}%
                                ${item.options.toppings && item.options.toppings.length > 0 ? ` | ท็อปปิ้ง: ${item.options.toppings.join(', ')}` : ''}
                                ${item.options.notes ? ` | หมายเหตุ: ${item.options.notes}` : ''}
                            </div>
                        ` : ''}
                    </td>
                    <td class="py-2 text-center align-top text-xs text-gray-800">${item.quantity}</td>
                    <td class="py-2 text-right align-top text-xs font-bold text-gray-900">฿${((item.finalPrice || item.price) * item.quantity).toFixed(2)}</td>
                </tr>
            `).join('');

            modal.innerHTML = `
                <div class="w-full max-w-md my-auto flex flex-col items-center">
                    <!-- Printable Receipt Ticket -->
                    <div id="printable-receipt" class="bg-white text-black p-6 rounded-2xl shadow-2xl border border-gray-200 w-full font-mono text-xs relative">
                        <!-- Receipt Header -->
                        <div class="text-center pb-3 border-b-2 border-dashed border-gray-400">
                            <h2 class="text-xl font-black tracking-tight text-gray-900">ร้านแม่วะคาเฟ่</h2>
                            <p class="text-[11px] text-gray-600 font-sans mt-0.5">Mae Wa Cafe & Beverage</p>
                            <p class="text-[10px] text-gray-500 font-sans mt-1">วันที่: ${order.date || new Date().toLocaleDateString('th-TH')} เวลา: ${order.timestamp}</p>
                        </div>

                        <!-- Queue Number Box -->
                        <div class="my-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-center">
                            <span class="text-[11px] text-gray-600 font-sans font-bold block">หมายเลขคิวของคุณ</span>
                            <span class="text-4xl font-black text-gray-900 tracking-wider my-1 inline-block">${order.queue || order.queue_number}</span>
                            <span class="text-[10px] text-gray-500 font-sans block">เลขออเดอร์: ${order.id}</span>
                        </div>

                        <!-- Customer & Payment Info -->
                        <div class="bg-gray-100 p-2.5 rounded-lg text-[11px] font-sans text-gray-700 mb-3 space-y-0.5">
                            <div>👤 ลูกค้า: <strong>${order.customer_name}</strong></div>
                            <div>✉️ อีเมล: <strong>${order.customer_email}</strong></div>
                            <div>💳 วิธีชำระ: <strong>${order.payment_method === 'cash' ? 'ชำระเงินสด' : 'สแกนจ่าย QR Code'}</strong></div>
                        </div>

                        <!-- Items Table -->
                        <table class="w-full text-left mb-3">
                            <thead>
                                <tr class="border-b-2 border-gray-400 text-[11px] font-bold text-gray-700">
                                    <th class="pb-1">รายการ</th>
                                    <th class="pb-1 text-center">จน.</th>
                                    <th class="pb-1 text-right">ราคา</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsRows}
                            </tbody>
                        </table>

                        <!-- Total -->
                        <div class="border-t-2 border-gray-900 pt-2 mb-3 flex justify-between items-center text-sm font-black">
                            <span>ยอดสุทธิ (TOTAL)</span>
                            <span class="text-base text-gray-900">฿${(order.total || order.total_amount || 0).toFixed(2)}</span>
                        </div>

                        <!-- Footer -->
                        <div class="text-center text-[10px] text-gray-500 pt-2 border-t border-dashed border-gray-300 font-sans">
                            <p class="font-bold text-gray-700">ขอบพระคุณที่อุดหนุนครับ! ☕</p>
                            <p class="mt-0.5">กรุณารอเรียกคิว ระบบจะส่งเสียงแจ้งเตือนเมื่อเครื่องดื่มทำเสร็จครับ</p>
                        </div>
                    </div>

                    <!-- Modal Actions (Hidden on Print) -->
                    <div class="w-full mt-4 flex gap-3 no-print">
                        <button id="print-receipt-btn" class="flex-1 h-12 bg-secondary-container text-on-secondary-container font-bold text-sm rounded-xl hover:bg-secondary-fixed transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95">
                            <span class="material-symbols-outlined text-[22px]">print</span>
                            พิมพ์ใบเสร็จ (Print)
                        </button>
                        <button id="close-receipt-btn" class="flex-1 h-12 bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary-hover transition-all flex items-center justify-center gap-1 shadow-lg active:scale-95">
                            <span class="material-symbols-outlined text-[20px]">done</span>
                            กลับหน้าเมนู
                        </button>
                    </div>

                    <div class="no-print mt-3 text-center text-xs text-white/80 bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[16px] text-secondary-container animate-pulse">notifications_active</span>
                        เมื่อเครื่องดื่มทำเสร็จแล้ว ระบบจะส่งเสียงและแจ้งเตือนที่หน้าจอนี้ทันที
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('#print-receipt-btn').addEventListener('click', () => {
                window.print();
            });

            modal.querySelector('#close-receipt-btn').addEventListener('click', () => {
                modal.remove();
                store.navigate('menu');
            });
        }

        // Expose to window so ready notification can open receipt
        window.showReceiptModal = showReceiptModal;
    }

    return container;
}
