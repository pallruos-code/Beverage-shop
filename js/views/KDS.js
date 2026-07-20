import { store } from '../store.js';

export function renderKDS() {
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
                <button id="kds-to-menu" class="h-[36px] px-md bg-secondary-container text-on-secondary-container font-label text-label rounded hover:bg-secondary-fixed transition-colors">หน้าร้าน (Shop)</button>
            </div>
        </header>
        
        <!-- Main Content Canvas -->
        <main class="flex-grow pt-4 pb-lg px-gutter-desktop md:max-w-container-max md:mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-gutter-desktop overflow-hidden h-[calc(100vh-64px)]">
            
            <!-- Column 1: New Orders -->
            <section class="flex flex-col bg-surface-container-low rounded-lg border border-border h-full overflow-hidden">
                <header class="bg-surface-variant text-on-surface-variant px-md py-sm border-b border-border flex justify-between items-center">
                    <h2 class="font-h3 text-h3 flex items-center gap-xs">
                        <span class="material-symbols-outlined">inbox</span> ออเดอร์ใหม่ (New)
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
                                            <li>หวาน ${item.options.sweetness}%</li>
                                            ${item.options.toppings.map(t => `<li>${t}</li>`).join('')}
                                            ${item.options.notes ? `<li><em>${item.options.notes}</em></li>` : ''}
                                        </ul>
                                    ` : ''}
                                `).join('')}
                            </div>
                            <button data-action="accept" data-id="${order.id}" class="w-full bg-primary text-on-primary font-label text-label h-[44px] rounded-DEFAULT hover:bg-primary-hover transition-colors flex justify-center items-center gap-xs">
                                <span class="material-symbols-outlined">check</span> รับออเดอร์ (Accept)
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
                        <span class="material-symbols-outlined">blender</span> กำลังเตรียม (Preparing)
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
                                            <li>หวาน ${item.options.sweetness}%</li>
                                            ${item.options.toppings.map(t => `<li>${t}</li>`).join('')}
                                        </ul>
                                    ` : ''}
                                `).join('')}
                            </div>
                            <button data-action="complete" data-id="${order.id}" class="w-full bg-tertiary-container text-on-tertiary-container font-label text-label h-[44px] rounded-DEFAULT hover:opacity-90 transition-opacity flex justify-center items-center gap-xs">
                                <span class="material-symbols-outlined">done_all</span> เสร็จสิ้น (Complete)
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
                        <span class="material-symbols-outlined">storefront</span> พร้อมเสิร์ฟ (Ready)
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
                                    รอรับ
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
