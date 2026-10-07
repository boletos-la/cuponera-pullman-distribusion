const fs = require('fs');
const path = require('path');

const dirsToProcess = ['app', 'components'];

function processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            processDirectory(fullPath);
        } else if (entry.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
            if (entry.name === 'Navbar.tsx') continue; // No tocar Navbar.tsx
            
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Colors
            const replacements = [
                { from: /#00c7cc/g, to: '#ff6700' },
                { from: /#00b3b7/g, to: '#e65c00' }, // Hover orange
                // Cyan shadows back to orange shadows
                { from: /rgba\(0,199,204,/g, to: 'rgba(255,103,0,' },
                { from: /rgba\(0,179,183,/g, to: 'rgba(230,92,0,' },
                // Tailwind classes (cyan -> orange)
                { from: /bg-cyan-/g, to: 'bg-orange-' },
                { from: /text-cyan-/g, to: 'text-orange-' },
                { from: /border-cyan-/g, to: 'border-orange-' },
                { from: /shadow-cyan-/g, to: 'shadow-orange-' },
                { from: /from-cyan-/g, to: 'from-orange-' },
                { from: /to-cyan-/g, to: 'to-orange-' },
                { from: /ring-cyan-/g, to: 'ring-orange-' },
            ];

            for (const rep of replacements) {
                if (rep.from.test(content)) {
                    content = content.replace(rep.from, rep.to);
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

dirsToProcess.forEach(dir => {
    if (fs.existsSync(dir)) {
        processDirectory(dir);
    }
});
