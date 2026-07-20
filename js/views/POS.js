import { store } from '../store.js';

export function renderPOS() {
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
                    <h1 class="font-h1 text-h1 text-text-primary mb-base">ชำระเงินและพิมพ์ใบเสร็จ (POS)</h1>
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
                                        <p class="font-body-sm text-body-sm text-text-secondary">ความหวาน: ${item.options.sweetness}%</p>
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
                        Print Receipt (พิมพ์ใบเสร็จ)
                    </button>
                    <button id="pos-new-order" class="flex-1 h-[44px] bg-surface text-primary border-2 border-primary font-label text-label rounded-lg hover:bg-surface-container-low transition-colors flex items-center justify-center gap-xs">
                        <span class="material-symbols-outlined">add_circle</span>
                        New Order (เริ่มออเดอร์ใหม่)
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
                            <p class="font-dimensions text-[12px] font-bold mb-sm">Scan to Pay (สแกนเพื่อชำระเงิน)</p>
                            <div class="bg-white p-2 inline-block border border-border mb-sm">
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=FIKASMART-${latestOrder.id}" class="w-24 h-24" alt="QR" />
                            </div>
                        </div>
                        <div class="text-center font-dimensions text-[10px] pb-lg">
                            <p>Thank you for choosing FikaSmart!</p>
                            <p class="mt-xs">Tack så mycket!</p>
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
