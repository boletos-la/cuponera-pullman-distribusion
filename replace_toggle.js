const fs = require('fs');

const file = 'components/CatalogView.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">[\s\S]*?Cuponeras 20 Pasajes\r?\n\s*<\/button>\r?\n\s*<\/div>/;

const newToggle = `<div className="flex justify-center mb-6 px-4">
          <div className="flex bg-white border border-slate-200 rounded-lg p-1.5 w-full max-w-sm shadow-sm relative">
            <button
              onClick={() => setSelectedQuantity(10)}
              className={\`flex-1 text-sm font-bold py-2.5 rounded-md transition-all flex items-center justify-center gap-2 relative z-10
                \${selectedQuantity === 10
                  ? 'bg-[#FFE8E0] text-[#ff6700] shadow-sm ring-1 ring-[#ff6700]/20'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}\`}
            >
              <div className={\`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-colors
                \${selectedQuantity === 10 ? 'border-[#ff6700]' : 'border-slate-300'}\`}>
                {selectedQuantity === 10 && <div className="w-1.5 h-1.5 rounded-md bg-[#ff6700]" />}
              </div>
              10 Pasajes
            </button>
            <button
              onClick={() => setSelectedQuantity(20)}
              className={\`flex-1 text-sm font-bold py-2.5 rounded-md transition-all flex items-center justify-center gap-2 relative z-10
                \${selectedQuantity === 20
                  ? 'bg-[#FFE8E0] text-[#ff6700] shadow-sm ring-1 ring-[#ff6700]/20'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}\`}
            >
              <div className={\`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-colors
                \${selectedQuantity === 20 ? 'border-[#ff6700]' : 'border-slate-300'}\`}>
                {selectedQuantity === 20 && <div className="w-1.5 h-1.5 rounded-md bg-[#ff6700]" />}
              </div>
              20 Pasajes
            </button>
          </div>
        </div>`;

if (regex.test(content)) {
  content = content.replace(regex, newToggle);
  fs.writeFileSync(file, content);
  console.log("Successfully replaced toggle switch");
} else {
  console.log("Regex didn't match anything");
}
