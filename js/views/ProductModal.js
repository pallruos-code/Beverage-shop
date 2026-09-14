import { store } from '../store.js';

export function renderProductModal(product, onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-surface w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl flex flex-col md:flex-row';

    const hotPrice = product.price || 30;
    const icedPrice = product.icedPrice !== undefined ? product.icedPrice : (product.price + 5);

    modalContent.innerHTML = `
        <div class="md:w-1/2 p-4 md:p-6 bg-surface-container-low flex flex-col items-center justify-center relative">
            <button class="absolute top-4 right-4 md:hidden bg-surface-variant p-2 rounded-full text-on-surface hover:bg-outline-variant transition" id="close-modal-mobile">
                <span class="material-symbols-outlined">close</span>
            </button>
            <img src="${product.image}" alt="${product.name}" class="w-full h-auto aspect-square object-cover rounded-lg shadow-sm" />
            <h2 class="font-h2 text-h2 text-text-primary mt-4 text-center">${product.name}</h2>
            <p class="font-price text-price text-primary text-center mt-2">฿${hotPrice}${hotPrice !== icedPrice ? ` - ฿${icedPrice}` : ''}</p>
        </div>
        
        <div class="md:w-1/2 p-4 md:p-6 flex flex-col gap-6 relative">
            <button class="absolute top-4 right-4 hidden md:block text-outline hover:text-on-surface transition" id="close-modal-desktop">
                <span class="material-symbols-outlined">close</span>
            </button>
            
            <form id="customization-form" class="flex flex-col gap-6">
                <!-- Temperature / Type Selection (Hot / Iced) -->
                <div class="flex flex-col gap-2">
                    <h3 class="font-label text-label text-text-primary">ประเภทเครื่องดื่ม <span class="text-error">*</span></h3>
                    <div class="grid grid-cols-2 gap-3">
                        <label class="cursor-pointer">
                            <input type="radio" name="type" value="ร้อน" checked class="peer sr-only" data-price="${hotPrice}" />
                            <div class="h-11 flex items-center justify-center border border-border rounded-lg text-body-sm peer-checked:bg-primary peer-checked:text-on-primary peer-checked:border-primary transition-all hover:bg-surface-container gap-1 font-medium">
                                <span class="material-symbols-outlined text-[18px]">local_fire_department</span>
                                ร้อน (฿${hotPrice})
                            </div>
                        </label>
                        <label class="cursor-pointer">
                            <input type="radio" name="type" value="เย็น" class="peer sr-only" data-price="${icedPrice}" />
                            <div class="h-11 flex items-center justify-center border border-border rounded-lg text-body-sm peer-checked:bg-primary peer-checked:text-on-primary peer-checked:border-primary transition-all hover:bg-surface-container gap-1 font-medium">
                                <span class="material-symbols-outlined text-[18px]">ac_unit</span>
                                เย็น (฿${icedPrice})
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Sweetness Level -->
                <div class="flex flex-col gap-2">
                    <h3 class="font-label text-label text-text-primary">ระดับความหวาน <span class="text-error">*</span></h3>
                    <div class="grid grid-cols-5 gap-1.5">
                        ${[0, 25, 50, 75, 100].map(level => `
                            <label class="cursor-pointer">
                                <input type="radio" name="sweetness" value="${level}" ${level === 100 ? 'checked' : ''} class="peer sr-only" />
                                <div class="h-10 flex items-center justify-center border border-border rounded-md text-caption peer-checked:bg-secondary-container peer-checked:text-on-secondary-container peer-checked:border-secondary transition-colors hover:bg-surface-container font-medium">
                                    ${level}%
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <!-- Toppings -->
                <div class="flex flex-col gap-2">
                    <h3 class="font-label text-label text-text-primary">ท็อปปิ้ง <span class="font-caption text-caption text-text-secondary">(+฿10)</span></h3>
                    <div class="flex flex-col gap-2 border border-border p-2.5 rounded-lg bg-surface-container-low">
                        ${['วิปครีม', 'บุกไข่มุก', 'ซอสคาราเมล'].map((topping, idx) => `
                            <label class="flex items-center justify-between p-2 hover:bg-surface rounded-md cursor-pointer">
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
                    <textarea id="notes" name="notes" rows="2" class="w-full border border-border rounded-lg p-2.5 text-body-sm resize-none focus:ring-1 focus:ring-primary outline-none" placeholder="เช่น หวานน้อย, แยกน้ำแข็ง..."></textarea>
                </div>

                <!-- Quantity & Submit -->
                <div class="mt-auto border-t border-border pt-4 flex flex-col gap-4">
                    <div class="flex justify-between items-center">
                        <span class="font-body-sm font-medium">จำนวน</span>
                        <div class="flex items-center border border-border rounded-lg h-10 w-32 overflow-hidden">
                            <button type="button" id="qty-dec" class="w-1/3 h-full hover:bg-surface-container text-primary font-bold">-</button>
                            <input type="number" id="qty-val" value="1" min="1" class="w-1/3 h-full text-center border-none p-0 focus:ring-0 text-dimensions bg-transparent" readonly />
                            <button type="button" id="qty-inc" class="w-1/3 h-full hover:bg-surface-container text-primary font-bold">+</button>
                        </div>
                    </div>
                    
                    <button type="submit" class="w-full h-12 bg-secondary-container text-on-secondary-container font-label text-label rounded-xl hover:bg-secondary-fixed transition-colors flex items-center justify-center gap-2 font-bold text-base shadow-sm">
                        <span class="material-symbols-outlined">shopping_basket</span>
                        เพิ่มลงตะกร้า - ฿<span id="total-price">${hotPrice}</span>
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
        const selectedType = form.querySelector('input[name="type"]:checked');
        const typePrice = selectedType ? parseFloat(selectedType.dataset.price) : hotPrice;
        const toppings = formData.getAll('toppings');
        const qty = parseInt(qtyInput.value);
        const toppingsPrice = toppings.length * 10;
        const total = (typePrice + toppingsPrice) * qty;
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
    updatePrice();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const selectedType = form.querySelector('input[name="type"]:checked');
        const typeVal = selectedType ? selectedType.value : 'ร้อน';
        const typePrice = selectedType ? parseFloat(selectedType.dataset.price) : hotPrice;

        const options = {
            type: typeVal,
            sweetness: formData.get('sweetness'),
            toppings: formData.getAll('toppings'),
            notes: formData.get('notes')
        };
        const qty = parseInt(qtyInput.value);
        
        const customizedProduct = {
            ...product,
            name: `${product.name} (${typeVal})`,
            price: typePrice
        };

        for (let i = 0; i < qty; i++) {
            store.addToCart(customizedProduct, options);
        }
        
        onClose();
        overlay.remove();
    });

    return overlay;
}

