import { store } from '../store.js';

export function renderLogin() {
    const container = document.createElement('div');
    container.className = 'w-full min-h-screen bg-surface flex items-center justify-center font-body text-body text-text-primary antialiased p-4';

    const targetName = store.state.pendingRoute ? store.state.pendingRoute.toUpperCase() : 'หลังร้าน';

    container.innerHTML = `
        <div class="w-full max-w-[420px] mx-auto flex flex-col items-center">
            <!-- Brand Logo Area -->
            <div class="mb-lg w-full flex flex-col items-center cursor-pointer" id="login-brand">
                <div class="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg mb-sm hover:scale-105 transition-transform">
                    <span class="material-symbols-outlined text-[40px] text-on-primary">admin_panel_settings</span>
                </div>
                <h2 class="font-h2 text-h2 text-text-primary">ร้านแม่วะคาเฟ่</h2>
                <p class="font-caption text-caption text-text-secondary">ระบบจัดการหลังร้าน (Staff & Admin Only)</p>
            </div>

            <!-- Login Form Card -->
            <div class="w-full bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-border shadow-xl">
                <div class="text-center mb-6">
                    <h1 class="font-h2 text-h2 text-text-primary mb-1">ยืนยันรหัสเข้าใช้งาน</h1>
                    <p class="font-body-sm text-body-sm text-text-secondary">กรุณากรอกรหัสผ่านพนักงานเพื่อเข้าสู่หน้า ${targetName}</p>
                </div>
                
                <form class="flex flex-col gap-5" id="passcode-form">
                    <!-- Error Alert -->
                    <div id="error-alert" class="hidden bg-error-container text-on-error-container p-3 rounded-lg text-caption flex items-center gap-2 border border-error/20">
                        <span class="material-symbols-outlined text-[18px]">error</span>
                        <span id="error-msg">รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง</span>
                    </div>

                    <!-- Passcode Field -->
                    <div class="flex flex-col gap-1.5 relative">
                        <label class="font-label text-label text-text-primary" for="passcode">รหัสผ่านพนักงาน / เจ้าของร้าน</label>
                        <div class="relative w-full">
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline z-10 pointer-events-none">lock</span>
                            <input class="w-full h-12 pl-10 pr-10 bg-surface border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 font-dimensions text-body tracking-wider text-text-primary placeholder:text-outline transition-all outline-none" id="passcode" placeholder="กรอกรหัสผ่าน 11 หลัก..." required type="password" autocomplete="off" autofocus />
                            <button class="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-text-primary transition-colors focus:outline-none" tabindex="-1" type="button" id="toggle-passcode">
                                <span class="material-symbols-outlined text-[20px]">visibility_off</span>
                            </button>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <div class="flex flex-col gap-3 mt-2">
                        <button class="w-full h-12 bg-primary text-on-primary font-label text-label rounded-xl hover:bg-primary-hover active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 font-bold" type="submit">
                            <span>เข้าสู่ระบบหลังร้าน</span>
                            <span class="material-symbols-outlined text-[20px]">key</span>
                        </button>
                        
                        <button id="back-to-menu-btn" class="w-full h-11 bg-surface text-text-secondary border border-border font-label text-label rounded-xl hover:bg-surface-container transition-all flex items-center justify-center gap-2" type="button">
                            <span class="material-symbols-outlined text-[18px]">arrow_back</span>
                            กลับไปหน้าร้าน (สำหรับลูกค้า)
                        </button>
                    </div>
                </form>
            </div>
            
            <div class="mt-8 font-caption text-caption text-outline text-center flex flex-col gap-1">
                <p>🔒 ระบบการเชื่อมต่อปลอดภัย ร้านแม่วะคาเฟ่</p>
            </div>
        </div>
    `;

    // Form logic
    const form = container.querySelector('#passcode-form');
    const passcodeInput = container.querySelector('#passcode');
    const errorAlert = container.querySelector('#error-alert');
    const errorMsg = container.querySelector('#error-msg');
    const toggleBtn = container.querySelector('#toggle-passcode');

    toggleBtn.addEventListener('click', () => {
        const type = passcodeInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passcodeInput.setAttribute('type', type);
        toggleBtn.innerHTML = `<span class="material-symbols-outlined text-[20px]">${type === 'password' ? 'visibility_off' : 'visibility'}</span>`;
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = passcodeInput.value.trim();
        
        const success = store.verifyPasscode(code);
        if (!success) {
            errorMsg.textContent = 'รหัสผ่านพนักงานไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
            errorAlert.classList.remove('hidden');
            passcodeInput.value = '';
            passcodeInput.focus();
        }
    });

    container.querySelector('#back-to-menu-btn').addEventListener('click', () => {
        store.navigate('menu');
    });

    container.querySelector('#login-brand').addEventListener('click', () => {
        store.navigate('menu');
    });

    return container;
}

