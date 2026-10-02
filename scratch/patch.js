const fs = require('fs');

// --- CatalogView ---
let catalog = fs.readFileSync('components/CatalogView.tsx', 'utf8');

// 1. Reemplazar la definición de grilla
const startMatch = `      ) : (\n        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 pt-4">`;
const endMatch = `          ))}\n        </div>\n      )}\n\n      {/* ---------------- MODAL DE CHECKOUT Y PASARELA WEBPAY ---------------- */}`;

const startIndex = catalog.indexOf(startMatch);
const endIndex = catalog.indexOf(endMatch);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 pt-4">
          {groupedCuponeras.map((group, idx) => (
            <CuponeraCardGroup 
              key={\`\${group.baseName}-\${idx}\`} 
              group={group} 
              onOpenCheckout={handleOpenCheckout} 
            />
          ))}
        </div>
      ) : (
        <div className="hidden"></div>
      )}

      {/* ---------------- MODAL DE CHECKOUT Y PASARELA WEBPAY ---------------- */}`;
  catalog = catalog.substring(0, startIndex) + replacement + catalog.substring(endIndex + endMatch.length);
  console.log('Grid CatalogView reemplazado');
} else {
  console.log('No se pudo reemplazar grid CatalogView', startIndex, endIndex);
}

fs.writeFileSync('components/CatalogView.tsx', catalog, 'utf8');


// --- DashboardView ---
let dash = fs.readFileSync('components/DashboardView.tsx', 'utf8');

dash = dash.replace(
  /<div className="mb-2">\s*<img src="https:\/\/kuposclientlogos.s3.us-east-1.amazonaws.com\/IMG_3089.png" alt="Pullmanbus" className="h-8 object-contain" \/>\s*<\/div>/,
  `<div className="mb-2 flex justify-between items-start">
                              <img src="https://kuposclientlogos.s3.us-east-1.amazonaws.com/IMG_3089.png" alt="Pullmanbus" className="h-8 object-contain" />
                              <div className="relative group flex items-center">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-help focus:outline-none">
                                  <Info className="w-3.5 h-3.5" />
                                </div>
                                <div className="absolute right-0 top-full mt-2 w-56 bg-slate-100/90 backdrop-blur-md text-slate-800 text-[10px] p-3 rounded-xl shadow-xl z-50 border border-slate-200 transition-all duration-200 opacity-0 invisible -translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto">
                                  <div className="font-semibold mb-1 text-slate-700 uppercase tracking-wider">Tramos Habilitados:</div>
                                  <ul className="list-disc pl-3 space-y-0.5 font-medium text-slate-600">
                                    {c.tramosPermitidos?.map((t: string, i: number) => (
                                      <li key={i}>{t}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>`
);

dash = dash.replace(
  /\{\/\* Días Restantes \*\/\}\s*<div className=\{`text-\[10px\] font-semibold px-2 py-1 rounded border flex items-center gap-1 \$\{daysLeft <= 7 \? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`\}>\s*<CheckCircle className="w-3 h-3" \/>\s*Quedan \{daysLeft\} días\s*<\/div>/,
  ``
);

dash = dash.replace(
  /<div className="flex items-baseline gap-1">\s*<span className="text-lg font-black text-slate-900">\{saldoC\}<\/span>\s*<span className="text-xs font-semibold text-slate-400">\/ \{totalC\}<\/span>\s*<\/div>/,
  `<div className="flex items-baseline gap-1">
                                  <span className="text-base font-semibold text-slate-900">{saldoC}</span>
                                  <span className="text-xs font-semibold text-slate-400">/ {totalC}</span>
                                </div>`
);

dash = dash.replace(
  /className="bg-\[#fa5e00\] text-white w-full rounded-b-2xl px-5 py-3 flex justify-between items-center font-semibold text-xs hover:bg-\[#e55400\] transition-all group cursor-pointer shadow-inner mt-2"/g,
  `className="bg-[#fa5e00] text-white w-full rounded-b-2xl px-5 py-3 flex justify-between items-center font-semibold text-xs hover:bg-[#e55400] transition-all group cursor-pointer shadow-inner"`
);

fs.writeFileSync('components/DashboardView.tsx', dash, 'utf8');

console.log('Hecho.');
