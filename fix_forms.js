const fs = require('fs');

function updateDashboardView() {
  const file = 'components/DashboardView.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // Change the login card from white to dark (#1a1a1a)
  content = content.replace(
    /className="bg-white rounded-\[2rem\] p-6 sm:p-10 shadow-xl border border-slate-100 space-y-8 relative overflow-hidden"/g,
    'className="bg-[#1a1a1a] rounded-3xl p-6 sm:p-10 shadow-2xl border border-neutral-800 space-y-8 relative overflow-hidden"'
  );
  
  content = content.replace(
    /className="absolute top-0 left-0 w-full h-2 bg-\[#023caf\]" \/>/g,
    'className="absolute top-0 left-0 w-full h-2 bg-[#ff6700]" />'
  );

  content = content.replace(
    /className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left border-b border-slate-100 pb-6"/g,
    'className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left border-b border-neutral-800 pb-6"'
  );

  content = content.replace(
    /className="w-16 h-16 rounded-lg bg-blue-50 text-\[#023caf\] flex items-center justify-center shrink-0 shadow-sm border border-blue-100"/g,
    'className="w-16 h-16 rounded-2xl bg-neutral-800 text-[#ff6700] flex items-center justify-center shrink-0 shadow-sm border border-neutral-700"'
  );
  
  content = content.replace(
    /className="w-8 h-8 text-\[#023caf\]"/g,
    'className="w-8 h-8 text-[#ff6700]"'
  );

  content = content.replace(
    /className="text-2xl font-black text-\[#023caf\]"/g,
    'className="text-2xl font-black text-white"'
  );

  content = content.replace(
    /className="text-sm text-slate-500 font-medium"/g,
    'className="text-sm text-neutral-400 font-medium"'
  );

  content = content.replace(
    /className="block text-xs font-extrabold text-\[#0F172A\] uppercase tracking-wider"/g,
    'className="block text-xs font-extrabold text-neutral-300 uppercase tracking-wider"'
  );

  content = content.replace(
    /className=`w-full text-sm font-semibold bg-white border rounded-md pl-10 pr-4 py-3\.5 focus:outline-none focus:ring-2 text-\[#0F172A\] \$\{[\s\S]*?rutError \? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-\[#ff6700\]'[\s\S]*?\}`/g,
    'className={`w-full text-sm font-semibold bg-neutral-900 border rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:ring-2 text-white placeholder-neutral-500 transition-colors ${rutError ? "border-red-500 focus:ring-red-500" : "border-neutral-700 focus:border-[#ff6700] focus:ring-[#ff6700]/20"}`}'
  );

  content = content.replace(
    /className="w-5 h-5 text-slate-400 absolute left-3\.5 top-4" \/>/g,
    'className="w-5 h-5 text-neutral-500 absolute left-3.5 top-4" />'
  );

  // Buttons
  content = content.replace(
    /className="w-full bg-\[#ff6700\] hover:bg-\[#e65c00\] text-white font-extrabold py-4 px-6 rounded-md shadow-lg hover:shadow-xl hover:-translate-y-0\.5 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 disabled:hover:translate-y-0"/g,
    'className="w-full bg-[#ff6700] hover:bg-[#e65c00] text-white font-black py-4 px-6 rounded-xl shadow-lg hover:shadow-orange-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50 disabled:hover:scale-100"'
  );

  fs.writeFileSync(file, content);
}

function updateCancellationView() {
  const file = 'components/TicketCancellationView.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // Same dark adaptations
  content = content.replace(
    /className="bg-white rounded-\[2rem\] p-6 sm:p-10 shadow-xl border border-slate-100 space-y-8 relative overflow-hidden"/g,
    'className="bg-[#1a1a1a] rounded-3xl p-6 sm:p-10 shadow-2xl border border-neutral-800 space-y-8 relative overflow-hidden"'
  );

  content = content.replace(
    /className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left border-b border-slate-100 pb-6"/g,
    'className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left border-b border-neutral-800 pb-6"'
  );

  content = content.replace(
    /className="w-16 h-16 rounded-lg bg-orange-50 text-\[#ff6700\] flex items-center justify-center shrink-0 shadow-sm border border-orange-100"/g,
    'className="w-16 h-16 rounded-2xl bg-neutral-800 text-[#ff6700] flex items-center justify-center shrink-0 shadow-sm border border-neutral-700"'
  );

  content = content.replace(
    /className="text-2xl font-black text-\[#ff6700\]"/g,
    'className="text-2xl font-black text-white"'
  );

  content = content.replace(
    /className="text-sm text-slate-500 font-medium"/g,
    'className="text-sm text-neutral-400 font-medium"'
  );
  
  content = content.replace(
    /className="text-slate-800"/g,
    'className="text-white"'
  );

  // Form wrappers
  content = content.replace(
    /className="bg-slate-50\/50 rounded-lg p-5 sm:p-6 border border-slate-100 space-y-5"/g,
    'className="bg-neutral-900/50 rounded-2xl p-5 sm:p-6 border border-neutral-800 space-y-5"'
  );

  content = content.replace(
    /className="block text-xs font-bold text-slate-600 ml-1"/g,
    'className="block text-xs font-bold text-neutral-300 ml-1"'
  );

  // Inputs
  content = content.replace(
    /className=`w-full text-sm font-semibold bg-white border-2 rounded-md pl-11 pr-4 py-3\.5 transition-all duration-300 focus:outline-none focus:ring-4 text-slate-800 placeholder:text-slate-400 group-hover:border-slate-300 shadow-sm \$\{[\s\S]*?\}`/g,
    'className={`w-full text-sm font-semibold bg-neutral-900 border rounded-xl pl-11 pr-4 py-3.5 transition-all duration-300 focus:outline-none text-white placeholder-neutral-500 group-hover:border-neutral-600 shadow-sm ${rutError ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-neutral-700 focus:border-[#ff6700] focus:ring-[#ff6700]/20"}`}'
  );

  content = content.replace(
    /className="w-5 h-5 text-slate-400 absolute left-4 top-3\.5 transition-colors group-focus-within:text-\[#023caf\]"/g,
    'className="w-5 h-5 text-neutral-500 absolute left-4 top-3.5 transition-colors group-focus-within:text-[#ff6700]"'
  );

  // Input 2 (PasajeCodigo)
  content = content.replace(
    /className="w-full text-sm font-mono font-bold bg-white border-2 border-slate-200\/80 rounded-md pl-4 pr-11 py-3\.5 transition-all duration-300 focus:outline-none focus:border-\[#ff6700\] focus:ring-4 focus:ring-\[#ff6700\]\/10 text-slate-800 placeholder:text-slate-400 group-hover:border-slate-300 shadow-sm uppercase tracking-wider"/g,
    'className="w-full text-sm font-mono font-bold bg-neutral-900 border border-neutral-700 rounded-xl pl-4 pr-11 py-3.5 transition-all duration-300 focus:outline-none focus:border-[#ff6700] focus:ring-4 focus:ring-[#ff6700]/20 text-white placeholder-neutral-500 group-hover:border-neutral-600 shadow-sm uppercase tracking-wider"'
  );

  content = content.replace(
    /className="absolute right-4 top-3\.5 p-1 bg-slate-100 rounded-md"/g,
    'className="absolute right-4 top-3.5 p-1 bg-neutral-800 rounded-md border border-neutral-700"'
  );

  // Buttons
  content = content.replace(
    /className="group relative w-full overflow-hidden bg-gradient-to-r from-\[#ff6700\] to-orange-500 hover:from-orange-600 hover:to-orange-500 text-white font-black py-4 px-6 rounded-md shadow-\[0_4px_14px_0_rgba\(255,103,0,0\.39\)\] hover:shadow-\[0_6px_20px_rgba\(255,103,0,0\.23\)\] transition-all duration-300 flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50 disabled:hover:shadow-none active:scale-\[0\.98\]"/g,
    'className="group relative w-full overflow-hidden bg-[#ff6700] hover:bg-[#e65c00] text-white font-black py-4 px-6 rounded-xl shadow-lg hover:shadow-orange-500/20 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50 disabled:hover:scale-100"'
  );

  fs.writeFileSync(file, content);
}

try {
  updateDashboardView();
  updateCancellationView();
  console.log('Update complete');
} catch (e) {
  console.error(e);
}
