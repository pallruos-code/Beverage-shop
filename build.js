const fs = require('fs');
const path = require('path');

const files = [
    'js/supabase.js',
    'js/store.js',
    'js/components/BottomNav.js',
    'js/components/Navbar.js',
    'js/views/Admin.js',
    'js/views/Cart.js',
    'js/views/KDS.js',
    'js/views/Login.js',
    'js/views/Menu.js',
    'js/views/POS.js',
    'js/views/ProductModal.js',
    'js/app.js'
];

let output = '';

for (const file of files) {
    let content = fs.readFileSync(path.resolve(__dirname, file), 'utf8');
    
    // Remove import statements (single-line or multi-line imports)
    content = content.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?\r?\n/g, '');
    
    // Remove export keywords from declarations
    content = content.replace(/export\s+(const|let|var|function|async\s+function|class)\s+/g, '$1 ');
    content = content.replace(/export\s+default\s+/g, '');
    content = content.replace(/export\s*\{[^}]*\};?\r?\n?/g, '');
    
    output += `\n/* --- ${file.replace(/\\/g, '/')} --- */\n\n` + content.trim() + '\n\n';
}

fs.writeFileSync(path.resolve(__dirname, 'js/bundle.js'), output.trimStart(), 'utf8');
console.log('Successfully compiled js/bundle.js');
