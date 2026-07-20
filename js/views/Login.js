import { store } from '../store.js';

export function renderLogin() {
    const container = document.createElement('div');
    container.className = 'w-full min-h-screen bg-surface flex items-center justify-center font-body text-body text-text-primary antialiased pb-[80px] md:pb-0';

    container.innerHTML = `
        <div class="w-full max-w-[400px] px-gutter-desktop mx-auto flex flex-col items-center">
            <!-- Brand Logo Area -->
            <div class="mb-xxl w-full flex justify-center cursor-pointer" id="login-brand">
                <div class="w-[120px] h-[120px] bg-primary rounded-full flex items-center justify-center shadow-lg group hover:scale-105 transition-transform">
                    <span class="font-h1 text-h1 text-on-primary">F</span>
                </div>
            </div>

            <!-- Login Form -->
            <div class="w-full bg-surface-container-lowest p-lg rounded-xl border border-border shadow-[0_1px_3px_rgba(17,17,17,0.06)]">
                <h1 class="font-h1-mobile md:font-h1 text-h1-mobile md:text-h1 text-center text-text-primary mb-xl tracking-tight">เข้าสู่ระบบ</h1>
                
                <form class="flex flex-col gap-lg" id="login-form">
                    <!-- Email Field -->
                    <div class="flex flex-col gap-xs relative">
                        <label class="font-label text-label text-text-primary" for="email">อีเมล</label>
                        <div class="relative w-full">
                            <span class="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline z-10 pointer-events-none">mail</span>
                            <input class="w-full h-[44px] pl-xl pr-sm bg-surface border border-border rounded-DEFAULT focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm text-text-primary placeholder:text-outline transition-colors outline-none" id="email" placeholder="example@email.com" required="" type="email" />
                        </div>
                    </div>
                    
                    <!-- Password Field -->
                    <div class="flex flex-col gap-xs relative">
                        <div class="flex justify-between items-center">
                            <label class="font-label text-label text-text-primary" for="password">รหัสผ่าน</label>
                            <a class="font-caption text-caption text-primary hover:text-primary-hover hover:underline transition-colors" href="#">ลืมรหัสผ่าน?</a>
                        </div>
                        <div class="relative w-full">
                            <span class="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline z-10 pointer-events-none">lock</span>
                            <input class="w-full h-[44px] px-xl bg-surface border border-border rounded-DEFAULT focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm text-text-primary placeholder:text-outline transition-colors outline-none" id="password" placeholder="••••••••" required="" type="password" />
                            <button class="absolute right-sm top-1/2 -translate-y-1/2 text-outline hover:text-text-primary transition-colors focus:outline-none" tabindex="-1" type="button" id="toggle-password">
                                <span class="material-symbols-outlined" style="font-size: 20px;">visibility_off</span>
                            </button>
                        </div>
                    </div>

                    <!-- Remember Me -->
                    <div class="flex items-center gap-sm">
                        <label class="relative flex items-center cursor-pointer p-1 rounded-full hover:bg-surface-container-low transition-colors" for="remember">
                            <input class="peer relative h-5 w-5 cursor-pointer appearance-none rounded-sm border border-outline transition-all checked:border-primary checked:bg-primary" id="remember" type="checkbox" />
                            <span class="absolute text-white transition-opacity opacity-0 pointer-events-none top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 peer-checked:opacity-100">
                                <span class="material-symbols-outlined" style="font-size: 16px;">check</span>
                            </span>
                        </label>
                        <label class="font-body-sm text-body-sm text-text-primary cursor-pointer select-none" for="remember">จำฉันไว้ในระบบ</label>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex flex-col gap-md mt-sm">
                        <button class="w-full h-[44px] bg-primary text-on-primary font-label text-label rounded-DEFAULT hover:bg-primary-hover transition-colors shadow-sm active:scale-[0.98] flex items-center justify-center gap-sm" type="submit">
                            เข้าสู่ระบบ
                            <span class="material-symbols-outlined" style="font-size: 18px;">arrow_forward</span>
                        </button>
                        
                        <div class="relative flex items-center py-sm">
                            <div class="flex-grow border-t border-border"></div>
                            <span class="flex-shrink-0 mx-md font-caption text-caption text-text-secondary uppercase tracking-wider">หรือ</span>
                            <div class="flex-grow border-t border-border"></div>
                        </div>

                        <button class="w-full h-[44px] bg-surface text-text-primary border border-border font-label text-label rounded-DEFAULT hover:bg-surface-container-low transition-colors shadow-sm active:scale-[0.98] flex items-center justify-center gap-sm" type="button">
                            เข้าสู่ระบบด้วย Google
                        </button>
                    </div>
                </form>

                <p class="mt-lg text-center font-body-sm text-body-sm text-text-secondary">
                    ยังไม่มีบัญชี? 
                    <a class="font-label text-label text-primary hover:text-primary-hover hover:underline transition-colors" href="#">สมัครสมาชิก</a>
                </p>
            </div>
            
            <div class="mt-xl font-caption text-caption text-outline text-center flex flex-col gap-xs">
                <p>2023 © FikaSmart.</p>
                <div class="flex gap-md justify-center">
                    <a class="hover:text-text-primary transition-colors" href="#">Terms</a>
                    <a class="hover:text-text-primary transition-colors" href="#">Privacy</a>
                </div>
            </div>
        </div>
    `;

    // Functionality
    const loginForm = container.querySelector('#login-form');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        store.navigate('admin'); // Simulate successful login navigating to admin
    });

    const togglePasswordBtn = container.querySelector('#toggle-password');
    const passwordInput = container.querySelector('#password');
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePasswordBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 20px;">${type === 'password' ? 'visibility_off' : 'visibility'}</span>`;
    });

    container.querySelector('#login-brand').addEventListener('click', () => {
        store.navigate('menu');
    });

    return container;
}
