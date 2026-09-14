import { store } from './store.js';
import { renderNavbar } from './components/Navbar.js';
import { renderBottomNav } from './components/BottomNav.js';
import { renderMenu } from './views/Menu.js';
import { renderCart } from './views/Cart.js';
import { renderAdmin } from './views/Admin.js';
import { renderPOS } from './views/POS.js';
import { renderKDS } from './views/KDS.js';
import { renderLogin } from './views/Login.js';

class App {
    constructor() {
        this.root = document.getElementById('app-root');
        
        // Subscribe to state changes to re-render when route changes
        store.subscribe((state) => {
            this.render(state.currentRoute);
        });
        
        // Initial render
        this.render(store.state.currentRoute);
    }

    render(route) {
        this.root.innerHTML = ''; // Clear current view
        
        const container = document.createElement('div');
        container.className = 'app-container flex flex-col min-h-screen';

        // Render appropriate views based on route
        if (route === 'admin') {
            container.appendChild(renderAdmin());
        } else if (route === 'kds') {
            container.appendChild(renderKDS());
        } else if (route === 'pos') {
            container.appendChild(renderPOS());
        } else if (route === 'login') {
            container.appendChild(renderLogin());
        } else {
            // Standard user views
            container.appendChild(renderNavbar());
            
            const mainContent = document.createElement('main');
            mainContent.className = 'flex-grow w-full pb-[80px] md:pb-0 pt-[64px]';
            
            if (route === 'menu') {
                mainContent.appendChild(renderMenu());
            } else if (route === 'cart') {
                mainContent.appendChild(renderCart());
            }
            
            container.appendChild(mainContent);
            container.appendChild(renderBottomNav());
        }
        
        try {
            this.root.appendChild(container);
        } catch (err) {
            console.error('App render error:', err);
            this.root.innerHTML = `<div class="p-8 text-center"><h1 class="text-xl font-bold">ร้านแม่วะคาเฟ่</h1><p class="mt-2 text-gray-600">กรุณารีเฟรชหน้าใหม่อีกครั้ง</p></div>`;
        }
    }
}

// Safe Initialize App (handles DOMContentLoaded race condition on mobile)
function startApp() {
    try {
        new App();
    } catch (e) {
        console.error('Failed to start App:', e);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

