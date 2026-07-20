import { store, products } from '../store.js';
import { renderProductModal } from './ProductModal.js';

export function renderMenu() {
    const container = document.createElement('div');
    container.className = 'px-gutter-mobile md:px-gutter-desktop max-w-container-max mx-auto mt-xl pb-xxl';

    container.innerHTML = `
        <header class="mb-xl text-center md:text-left">
            <h1 class="font-display text-display text-text-primary mb-xs">เมนู</h1>
            <p class="font-body text-body text-text-secondary max-w-2xl">พบกับเครื่องดื่มที่เราคัดสรรมาเป็นอย่างดี เพื่อประสิทธิภาพและสุนทรียภาพในทุกวันของคุณ</p>
        </header>

        <!-- Category Tabs -->
        <div class="flex overflow-x-auto gap-sm mb-xl pb-2 scrollbar-hide">
            <button class="flex-shrink-0 bg-primary text-on-primary font-label text-label px-6 py-2 rounded-full shadow-sm">กาแฟ</button>
            <button class="flex-shrink-0 bg-surface text-text-secondary border border-border font-label text-label px-6 py-2 rounded-full hover:bg-surface-variant transition-colors">ชา</button>
            <button class="flex-shrink-0 bg-surface text-text-secondary border border-border font-label text-label px-6 py-2 rounded-full hover:bg-surface-variant transition-colors">เครื่องดื่มเติมความสดชื่น</button>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="product-grid">
        </div>
    `;

    const grid = container.querySelector('#product-grid');

    products.forEach(product => {
        const article = document.createElement('article');
        article.className = 'bg-surface border border-border card-elevation flex flex-col group relative';
        
        const tagHtml = product.tag ? `<span class="absolute top-sm left-sm bg-tertiary text-on-tertiary font-caption text-caption px-2 py-1 z-10">${product.tag}</span>` : '';

        article.innerHTML = `
            <div class="relative w-full aspect-square overflow-hidden bg-surface-variant">
                ${tagHtml}
                <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="${product.name}" src="${product.image}"/>
            </div>
            <div class="p-md flex flex-col flex-grow">
                <h2 class="font-product-name text-product-name text-text-primary mb-1">${product.name}</h2>
                <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-4 flex-grow">${product.description}</p>
                <div class="flex justify-between items-end mt-auto">
                    <span class="font-price text-price text-text-primary">$${product.price.toFixed(2)}</span>
                </div>
                <button class="add-to-cart-btn mt-4 h-[44px] w-full bg-secondary-container text-on-surface font-label text-label rounded-DEFAULT flex items-center justify-center hover:bg-secondary-fixed transition-colors active:scale-95">
                    เพิ่มลงตะกร้า
                </button>
            </div>
        `;

        article.querySelector('.add-to-cart-btn').addEventListener('click', () => {
            const modal = renderProductModal(product, () => {
                // Modal closed callback (optional logic here)
            });
            document.body.appendChild(modal);
        });

        grid.appendChild(article);
    });

    return container;
}
