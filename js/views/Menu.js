import { store, products } from '../store.js';
import { renderProductModal } from './ProductModal.js';

export function renderMenu() {
    const container = document.createElement('div');
    container.className = 'px-gutter-mobile md:px-gutter-desktop max-w-container-max mx-auto mt-lg pb-xxl';

    container.innerHTML = `
        <!-- Stunning Hero Section -->
        <div class="relative bg-gradient-to-r from-primary to-primary-hover text-on-primary rounded-2xl p-8 md:p-12 mb-xl overflow-hidden shadow-lg">
            <!-- Background shapes for premium aesthetics -->
            <div class="absolute right-0 top-0 w-80 h-80 bg-secondary-container/20 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
            <div class="absolute left-1/3 bottom-0 w-64 h-64 bg-secondary-container/10 rounded-full blur-2xl -ml-24 -mb-24 pointer-events-none"></div>
            
            <div class="relative z-10 max-w-2xl">
                <span class="bg-secondary-container text-on-surface font-label text-caption px-4 py-1.5 rounded-full uppercase tracking-wider mb-md inline-block shadow-sm">Nordic Yellow Fika</span>
                <h1 class="font-display text-display text-white mb-md mt-sm tracking-tight leading-tight">สัมผัสสุนทรียภาพ<br/>แห่งกาแฟสไตล์นอร์ดิก</h1>
                <p class="font-body text-body text-white/80 leading-relaxed max-w-xl">พบกับเครื่องดื่มรสชาติละมุนที่เราคัดสรรเมล็ดพันธุ์พิเศษอย่างพิถีพิถัน เพื่อสุนทรียภาพในการเริ่มต้นวันใหม่ของคุณ</p>
            </div>
        </div>

        <!-- Section Title & Categories -->
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-lg gap-md">
            <div>
                <h2 class="font-h2 text-h2 text-text-primary mb-1">รายการเมนู</h2>
                <p class="font-body-sm text-body-sm text-text-secondary">เลือกเครื่องดื่มถ้วยโปรดของคุณ</p>
            </div>
            
            <!-- Category Tabs with subtle scale-on-hover -->
            <div class="flex overflow-x-auto gap-xs pb-2 scrollbar-hide">
                <button class="category-btn flex-shrink-0 bg-primary text-on-primary font-label text-label px-5 py-2.5 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all">ทั้งหมด</button>
                <button class="category-btn flex-shrink-0 bg-surface text-text-secondary border border-border font-label text-label px-5 py-2.5 rounded-full hover:bg-surface-variant hover:scale-105 active:scale-95 transition-all">กาแฟ</button>
                <button class="category-btn flex-shrink-0 bg-surface text-text-secondary border border-border font-label text-label px-5 py-2.5 rounded-full hover:bg-surface-variant hover:scale-105 active:scale-95 transition-all">ชา</button>
                <button class="category-btn flex-shrink-0 bg-surface text-text-secondary border border-border font-label text-label px-5 py-2.5 rounded-full hover:bg-surface-variant hover:scale-105 active:scale-95 transition-all">สดชื่น</button>
            </div>
        </div>
        
        <!-- Products Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="product-grid">
        </div>
    `;

    const grid = container.querySelector('#product-grid');

    products.forEach(product => {
        const article = document.createElement('article');
        article.className = 'bg-surface border border-border/80 rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col group relative';
        
        const tagHtml = product.tag ? `
            <span class="absolute top-md left-md bg-secondary-container text-on-surface font-caption text-caption font-bold px-3 py-1 rounded-full shadow-sm z-10 backdrop-blur-md">
                ${product.tag}
            </span>` : '';

        article.innerHTML = `
            <div class="relative w-full aspect-[4/3] overflow-hidden bg-surface-variant">
                ${tagHtml}
                <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" alt="${product.name}" src="${product.image}"/>
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div class="p-md flex flex-col flex-grow">
                <h3 class="font-product-name text-product-name text-text-primary group-hover:text-primary transition-colors mb-1 line-clamp-1">${product.name}</h3>
                <p class="font-body-sm text-body-sm text-text-secondary line-clamp-2 mb-4 flex-grow">${product.description}</p>
                
                <div class="flex justify-between items-center mt-auto pt-sm border-t border-border/50">
                    <div class="flex flex-col">
                        <span class="text-[10px] text-outline uppercase tracking-wider">ราคาเริ่มต้น</span>
                        <span class="font-price text-price text-text-primary">$${product.price.toFixed(2)}</span>
                    </div>
                    <button class="add-to-cart-btn h-[40px] px-4 bg-primary text-on-primary font-label text-label rounded-full flex items-center justify-center gap-xs hover:bg-primary-hover active:scale-95 transition-all shadow-sm">
                        <span class="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                        สั่งซื้อ
                    </button>
                </div>
            </div>
        `;

        article.querySelector('.add-to-cart-btn').addEventListener('click', () => {
            const modal = renderProductModal(product, () => {
                // Modal closed callback
            });
            document.body.appendChild(modal);
        });

        grid.appendChild(article);
    });

    return container;
}
