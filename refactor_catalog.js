const fs = require('fs');

const file = 'components/CatalogView.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Rename CuponeraCardGroup to CuponeraCard and simplify it
const groupCardRegex = /const CuponeraCardGroup = \(\{ group, onOpenCheckout \}: \{ group: any, onOpenCheckout: \(c: Cuponera\) => void \}\) => \{([\s\S]*?)\};(\r?\n)?(\r?\n)?export default function CatalogView/m;

const newCardCode = `const CuponeraCard = ({ item, onOpenCheckout }: { item: Cuponera, onOpenCheckout: (c: Cuponera) => void }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      setShowTooltip(false);
    };
    if (showTooltip) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showTooltip]);

  return (
    <div className="relative bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-slate-100 flex flex-col mt-4">
      {/* Badge */}
      {item.badge && (
        <div className="absolute -top-3 right-4 bg-[#FFE8E0] text-[#ff6700] font-semibold text-xs px-2.5 py-1 rounded-md shadow-sm border border-white z-10">
          {item.badge}
        </div>
      )}

      {/* Card Content */}
      <div className="p-4 pb-3 flex-1 flex flex-col">
        {/* Info Tooltip */}
        <div className="absolute top-4 right-4 z-20">
          <div 
            className="relative group flex items-center"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(!showTooltip);
            }}
          >
            <button
              type="button"
              className="flex items-center justify-center w-6 h-6 rounded-md border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer sm:cursor-help focus:outline-none"
              aria-label="Más información sobre los tramos"
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            <div className={\`absolute right-0 top-full mt-2 w-56 bg-slate-100/90 backdrop-blur-md text-slate-800 text-[10px] p-3 rounded-md shadow-xl z-50 border border-slate-200 transition-all duration-200 \${showTooltip ? 'opacity-100 visible translate-y-0 pointer-events-auto' : 'opacity-0 invisible -translate-y-1 pointer-events-none sm:group-hover:opacity-100 sm:group-hover:visible sm:group-hover:translate-y-0 sm:group-hover:pointer-events-auto'}\`}>
              <div className="bg-emerald-50 text-emerald-600 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-2 mb-3 w-fit">
                <CheckCircle className="w-3.5 h-3.5" />
                Válido por 90 días
              </div>
              <div className="font-semibold mb-1 text-slate-700 uppercase tracking-wider">Tramos Habilitados:</div>
              <ul className="list-disc pl-3 space-y-0.5 font-medium text-slate-600">
                {item.tramos.map((t: string, i: number) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-2">
          <img src="/logo-boletos.png" alt="boletos.la" className="h-5 object-contain" />
        </div>

        <h3 className="text-base font-semibold text-slate-900 leading-snug mb-1.5 capitalize min-h-[44px] line-clamp-2">
          {item.nombre.toLowerCase()}
        </h3>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-3 text-slate-600">
            <Target className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-medium">{item.tramos && item.tramos.length > 0 ? item.tramos[0].split('-')[0].trim() : 'Origen'}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs font-medium">{item.tramos && item.tramos.length > 0 ? item.tramos[0].split('-')[1]?.trim() || 'Destino' : 'Destino'}</span>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-slate-100">
          <div className="flex justify-between items-end text-slate-800">
            <span className="font-semibold text-sm">{item.cantidadCupones} x pasajes</span>
            <span className="font-semibold text-base">\${(item.valorUnitario || 0).toLocaleString('es-CL')}</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onOpenCheckout(item)}
        className="bg-[#ff6700] text-white w-full rounded-b-2xl px-5 py-3 flex justify-between items-center font-semibold text-xs hover:bg-[#e65c00] transition-all group cursor-pointer shadow-inner"
      >
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-semibold text-white/80 capitalize tracking-wider">Total</span>
          <span className="text-base font-semibold leading-tight">CLP \${(item.precioTotal || 0).toLocaleString('es-CL')}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-white text-[#ff6700] group-hover:bg-orange-50 px-4 py-2 rounded-md text-xs font-semibold shadow-sm group-hover:scale-105 transition-all">
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Comprar</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </button>
    </div>
  );
};

export default function CatalogView`;

content = content.replace(groupCardRegex, newCardCode);

// 2. Add state for quantity toggle
content = content.replace(
  `const [infoOpen, setInfoOpen] = useState<number | null>(null);`,
  `const [infoOpen, setInfoOpen] = useState<number | null>(null);\n  const [selectedQuantity, setSelectedQuantity] = useState<number>(10);`
);

// 3. Remove groupedCuponeras and replace with simple filter
const groupCodeRegex = /\/\/ Agrupar cuponeras por nombre base[\s\S]*?\}\)\(\);/;
content = content.replace(groupCodeRegex, `// Filtrar por cantidad seleccionada
  const filteredByQuantity = displayCuponeras.filter(c => c.cantidadCupones === selectedQuantity);`);

// 4. Update the UI to render the buttons
const uiStartRegex = /\{"\/\* Barra de Búsqueda y Filtros \*\/"\}/;
const searchBarRegex = /<div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200 space-y-4">/;
const newSearchBar = `<div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
        <button
          onClick={() => setSelectedQuantity(10)}
          className={\`w-full sm:w-auto px-8 py-3 rounded-xl font-black text-lg transition-all \${selectedQuantity === 10 ? 'bg-[#ff6700] text-white shadow-lg shadow-orange-500/20 scale-105' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}\`}
        >
          Cuponeras 10 Pasajes
        </button>
        <button
          onClick={() => setSelectedQuantity(20)}
          className={\`w-full sm:w-auto px-8 py-3 rounded-xl font-black text-lg transition-all \${selectedQuantity === 20 ? 'bg-[#ff6700] text-white shadow-lg shadow-orange-500/20 scale-105' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}\`}
        >
          Cuponeras 20 Pasajes
        </button>
      </div>
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200 space-y-4">`;

content = content.replace(searchBarRegex, newSearchBar);

// 5. Replace groupedCuponeras.map with filteredByQuantity.map in grid view
const gridMapRegex = /\{groupedCuponeras\.map\(\(group, idx\) => \([\s\S]*?group=\{group\}[\s\S]*?\}\)\}/;
const newGridMap = `{filteredByQuantity.map((item, idx) => (
            <CuponeraCard
              key={\`\${item.id}-\${idx}\`}
              item={item}
              onOpenCheckout={handleOpenCheckout}
            />
          ))}`;
content = content.replace(gridMapRegex, newGridMap);

// 6. Fix table view to also use filteredByQuantity
content = content.replace(/displayCuponeras\.map\(\(item\)/, 'filteredByQuantity.map((item)');
content = content.replace(/displayCuponeras\.map\(\(item\)/g, 'filteredByQuantity.map((item)');

fs.writeFileSync(file, content);
console.log('Done refactoring CatalogView');
