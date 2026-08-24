import { store } from '../store.js';

export function renderAdmin() {
    const container = document.createElement('div');
    container.className = 'w-full min-h-screen flex overflow-hidden bg-background text-on-surface font-body';

    const ordersList = store.state.orders || [];
    
    // Calculate total sales from all orders
    const totalSales = ordersList.reduce((sum, o) => {
        const amt = o.total !== undefined ? o.total : (o.total_amount !== undefined ? Number(o.total_amount) : 0);
        return sum + amt;
    }, 0);

    const totalOrdersCount = ordersList.length;

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
                    <span class="font-label text-label">แดชบอร์ด</span>
                </a>
                <!-- Inactive Links -->
                <a id="admin-nav-pos" class="flex items-center gap-md px-md py-sm text-on-primary opacity-80 hover:opacity-100 hover:bg-primary-hover rounded-lg transition-colors group cursor-pointer">
                    <span class="material-symbols-outlined">point_of_sale</span>
                    <span class="font-label text-label">จุดขาย (POS)</span>
                </a>
                <a id="admin-nav-kds" class="flex items-center gap-md px-md py-sm text-on-primary opacity-80 hover:opacity-100 hover:bg-primary-hover rounded-lg transition-colors group cursor-pointer">
                    <span class="material-symbols-outlined">receipt_long</span>
                    <span class="font-label text-label">หน้าจอครัว (KDS)</span>
                </a>
                <a class="flex items-center gap-md px-md py-sm text-on-primary opacity-80 hover:opacity-100 hover:bg-primary-hover rounded-lg transition-colors group cursor-pointer">
                    <span class="material-symbols-outlined">inventory_2</span>
                    <span class="font-label text-label">สินค้า</span>
                </a>
            </nav>
            
            <!-- User Profile minimal -->
            <div class="p-lg border-t border-primary-hover flex items-center gap-md">
                <div class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-h3 text-h3">
                    M
                </div>
                <div class="flex flex-col">
                    <span class="font-label text-label text-on-primary">Manager</span>
                    <span class="font-caption text-caption text-on-primary opacity-70">สาขาหลัก</span>
                </div>
            </div>
        </aside>
        
        <!-- Main Content Area -->
        <main class="flex-1 flex flex-col h-screen overflow-hidden bg-background relative">
            <!-- Top Header Area -->
            <header class="h-[80px] bg-surface border-b border-border flex items-center justify-between px-xl shrink-0 z-10 shadow-sm">
                <h1 class="font-h1 text-h1 text-primary">ภาพรวมระบบ</h1>
                <div class="flex items-center gap-md">
                    <button class="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors border border-border">
                        <span class="material-symbols-outlined">notifications</span>
                    </button>
                    <button id="go-to-shop" class="h-[44px] px-lg bg-primary hover:bg-primary-hover text-on-primary font-label text-label rounded-DEFAULT flex items-center gap-xs transition-colors">
                        <span class="material-symbols-outlined" style="font-size: 20px;">storefront</span>
                        กลับไปหน้าร้าน
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
                                <span class="font-label text-label text-outline">ยอดขายทั้งหมด</span>
                                <span class="material-symbols-outlined text-secondary-container bg-surface-container w-8 h-8 flex items-center justify-center rounded-full">payments</span>
                            </div>
                            <div class="flex items-baseline gap-sm mt-auto">
                                <span class="font-display text-display text-primary tracking-tight">฿${totalSales.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                        </div>
                        
                        <div class="bg-surface border border-border rounded-lg p-lg shadow-[0_1px_3px_rgba(17,17,17,0.06)] flex flex-col">
                            <div class="flex items-center justify-between mb-sm">
                                <span class="font-label text-label text-outline">จำนวนคำสั่งซื้อทั้งหมด</span>
                                <span class="material-symbols-outlined text-primary bg-surface-container w-8 h-8 flex items-center justify-center rounded-full">shopping_bag</span>
                            </div>
                            <div class="flex items-baseline gap-sm mt-auto">
                                <span class="font-display text-display text-primary tracking-tight">${totalOrdersCount}</span>
                                <span class="font-body-sm text-body-sm text-outline">ออเดอร์</span>
                            </div>
                        </div>
                        
                        <div class="bg-surface border border-border rounded-lg p-lg shadow-[0_1px_3px_rgba(17,17,17,0.06)] flex flex-col">
                            <div class="flex items-center justify-between mb-sm">
                                <span class="font-label text-label text-outline">เวลารอเฉลี่ย</span>
                                <span class="material-symbols-outlined text-warning bg-surface-container w-8 h-8 flex items-center justify-center rounded-full">timer</span>
                            </div>
                            <div class="flex items-baseline gap-sm mt-auto">
                                <span class="font-dimensions text-display text-primary tracking-tight">04:30</span>
                                <span class="font-body-sm text-body-sm text-outline">นาที</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-surface border border-border rounded-lg shadow-[0_1px_3px_rgba(17,17,17,0.06)] overflow-hidden">
                        <div class="p-lg border-b border-border flex items-center justify-between bg-surface">
                            <h2 class="font-h2 text-h2 text-primary">คำสั่งซื้อล่าสุด</h2>
                        </div>
                        <div class="w-full overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-surface-container-low border-b border-border">
                                        <th class="p-md font-label text-label text-outline whitespace-nowrap">รหัสออเดอร์</th>
                                        <th class="p-md font-label text-label text-outline whitespace-nowrap">เวลา</th>
                                        <th class="p-md font-label text-label text-outline whitespace-nowrap">รายการ</th>
                                        <th class="p-md font-label text-label text-outline whitespace-nowrap">จำนวนเงิน</th>
                                        <th class="p-md font-label text-label text-outline whitespace-nowrap">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-border">
                                    ${ordersList.map(order => {
                                        const ordNum = order.id || order.order_number || 'N/A';
                                        const ordTime = order.timestamp || (order.created_at ? new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A');
                                        const ordTotal = order.total !== undefined ? order.total : (order.total_amount !== undefined ? Number(order.total_amount) : 0);
                                        const ordStatus = order.status || order.order_status || 'PENDING';
                                        
                                        let itemsText = 'ไม่มีรายละเอียด';
                                        if (order.items && order.items.length > 0) {
                                            itemsText = order.items.map(i => `${i.name} (x${i.quantity})`).join(', ');
                                        }
                                        
                                        let statusBadge = '';
                                        if (ordStatus === 'PENDING' || ordStatus === 'new') {
                                            statusBadge = '<span class="inline-flex items-center px-2 py-1 rounded-sm bg-primary/10 text-primary font-caption text-caption">ออเดอร์ใหม่</span>';
                                        } else if (ordStatus === 'PREPARING' || ordStatus === 'preparing') {
                                            statusBadge = '<span class="inline-flex items-center px-2 py-1 rounded-sm bg-secondary-container text-on-secondary-container font-caption text-caption">กำลังเตรียม</span>';
                                        } else if (ordStatus === 'COMPLETED' || ordStatus === 'ready') {
                                            statusBadge = '<span class="inline-flex items-center px-2 py-1 rounded-sm bg-tertiary-container text-on-tertiary-container font-caption text-caption">พร้อมเสิร์ฟ</span>';
                                        } else {
                                            statusBadge = `<span class="inline-flex items-center px-2 py-1 rounded-sm bg-outline-variant text-on-surface font-caption text-caption">${ordStatus}</span>`;
                                        }
                                        
                                        return `
                                            <tr class="hover:bg-surface-container-lowest transition-colors">
                                                <td class="p-md font-dimensions text-body-sm text-primary font-bold">#${ordNum}</td>
                                                <td class="p-md font-dimensions text-body-sm text-on-surface-variant">${ordTime}</td>
                                                <td class="p-md font-body-sm text-body-sm text-on-surface">${itemsText}</td>
                                                <td class="p-md font-dimensions text-body-sm text-on-surface">฿${ordTotal.toFixed(2)}</td>
                                                <td class="p-md">
                                                    ${statusBadge}
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                    ${ordersList.length === 0 ? '<tr><td colspan="5" class="p-md text-center text-outline font-body-sm">ไม่มีคำสั่งซื้อที่ค้างอยู่</td></tr>' : ''}
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
