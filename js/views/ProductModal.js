import { store } from '../store.js';

export function renderProductModal(product, onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-surface w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl flex flex-col md:flex-row';

    modalContent.innerHTML = `
        <div class="md:w-1/2 p-4 md:p-6 bg-surface-container-low flex flex-col items-center justify-center relative">
            <button class="absolute top-4 right-4 md:hidden bg-surface-variant p-2 rounded-full text-on-surface hover:bg-outline-variant transition" id="close-modal-mobile">
                <span class="material-symbols-outlined">close</span>
            </button>
            <img src="${product.image}" alt="${product.name}" class="w-full h-auto aspect-square object-cover rounded-lg shadow-sm" />
            <h2 class="font-h2 text-h2 text-text-primary mt-4 text-center">${product.name}</h2>
            <p class="font-price text-price text-primary text-center mt-2">$${product.price.toFixed(2)}</p>
        </div>
        
        <div class="md:w-1/2 p-4 md:p-6 flex flex-col gap-6 relative">
            <button class="absolute top-4 right-4 hidden md:block text-outline hover:text-on-surface transition" id="close-modal-desktop">
                <span class="material-symbols-outlined">close</span>
            </button>
            
            <form id="customization-form" class="flex flex-col gap-6">
                <!-- Sweetness Level -->
                <div class="flex flex-col gap-2">
                    <h3 class="font-label text-label text-text-primary">ระดับความหวาน (Sweetness) <span class="text-error">*</span></h3>
                    <div class="grid grid-cols-5 gap-2">
                        ${[0, 25, 50, 75, 100].map(level => `
                            <label class="cursor-pointer">
                                <input type="radio" name="sweetness" value="${level}" ${level === 100 ? 'checked' : ''} class="peer sr-only" />
                                <div class="h-10 flex items-center justify-center border border-border rounded text-body-sm peer-checked:bg-primary-fixed peer-checked:text-on-primary-fixed peer-checked:border-primary transition-colors hover:bg-surface-container">
                                    ${level}%
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <!-- Toppings -->
                <div class="flex flex-col gap-2">
                    <h3 class="font-label text-label text-text-primary">ท็อปปิ้ง (Toppings) <span class="font-caption text-caption text-text-secondary">(+$0.30)</span></h3>
                    <div class="flex flex-col gap-2 border border-border p-2 rounded bg-surface-container-low">
                        ${['Oat Flakes', 'Honey Drop', 'Caramel Drizzle'].map((topping, idx) => `
                            <label class="flex items-center justify-between p-2 hover:bg-surface rounded cursor-pointer">
                                <span class="font-body-sm text-body-sm">${topping}</span>
                                <input type="checkbox" name="toppings" value="${topping}" class="w-5 h-5 rounded border-outline text-primary focus:ring-primary" />
                            </label>
                            ${idx < 2 ? '<div class="h-px bg-border w-full"></div>' : ''}
                        `).join('')}
                    </div>
                </div>

                <!-- Notes -->
                <div class="flex flex-col gap-2">
                    <label class="font-label text-label text-text-primary" for="notes">รายละเอียดเพิ่มเติม</label>
                    <textarea id="notes" name="notes" rows="2" class="w-full border border-border rounded p-2 text-body-sm resize-none focus:ring-1 focus:ring-primary outline-none" placeholder="เช่น หวานน้อย, ไม่ใส่น้ำแข็ง..."></textarea>
                </div>

                <!-- Quantity & Submit -->
                <div class="mt-auto border-t border-border pt-4 flex flex-col gap-4">
                    <div class="flex justify-between items-center">
                        <span class="font-body-sm">จำนวน</span>
                        <div class="flex items-center border border-border rounded h-10 w-32">
                            <button type="button" id="qty-dec" class="w-1/3 h-full hover:bg-surface-container text-primary font-bold">-</button>
                            <input type="number" id="qty-val" value="1" min="1" class="w-1/3 h-full text-center border-none p-0 focus:ring-0 text-dimensions bg-transparent" readonly />
                            <button type="button" id="qty-inc" class="w-1/3 h-full hover:bg-surface-container text-primary font-bold">+</button>
                        </div>
                    </div>
                    
                    <button type="submit" class="w-full h-12 bg-secondary-container text-on-secondary-container font-label text-label rounded-lg hover:bg-secondary-fixed transition-colors flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined">shopping_basket</span>
                        เพิ่มลงตะกร้า - $<span id="total-price">${product.price.toFixed(2)}</span>
                    </button>
                </div>
            </form>
        </div>
    `;

    overlay.appendChild(modalContent);

    // Close logic
    const closeOverlay = (e) => {
        if (e.target === overlay) {
            onClose();
            overlay.remove();
        }
    };
    overlay.addEventListener('click', closeOverlay);
    modalContent.querySelector('#close-modal-mobile').addEventListener('click', () => { onClose(); overlay.remove(); });
    modalContent.querySelector('#close-modal-desktop').addEventListener('click', () => { onClose(); overlay.remove(); });

    // State for modal
    const form = modalContent.querySelector('#customization-form');
    const qtyInput = form.querySelector('#qty-val');
    const priceDisplay = form.querySelector('#total-price');

    const updatePrice = () => {
        const formData = new FormData(form);
        const toppings = formData.getAll('toppings');
        const qty = parseInt(qtyInput.value);
        const basePrice = product.price;
        const toppingsPrice = toppings.length * 0.30;
        const total = (basePrice + toppingsPrice) * qty;
        priceDisplay.textContent = total.toFixed(2);
    };

    form.querySelector('#qty-dec').addEventListener('click', () => {
        if (parseInt(qtyInput.value) > 1) {
            qtyInput.value = parseInt(qtyInput.value) - 1;
            updatePrice();
        }
    });

    form.querySelector('#qty-inc').addEventListener('click', () => {
        qtyInput.value = parseInt(qtyInput.value) + 1;
        updatePrice();
    });

    form.addEventListener('change', updatePrice);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const options = {
            sweetness: formData.get('sweetness'),
            toppings: formData.getAll('toppings'),
            notes: formData.get('notes')
        };
        const qty = parseInt(qtyInput.value);
        
        // Add to cart N times
        for (let i = 0; i < qty; i++) {
            store.addToCart(product, options);
        }
        
        onClose();
        overlay.remove();
    });

    return overlay;
}
