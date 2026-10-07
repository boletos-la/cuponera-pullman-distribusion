const fs = require('fs');

function revertDashboardView() {
  const file = 'components/DashboardView.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // Revert dark background to slate-50
  content = content.replace(
    /className="bg-\[#1a1a1a\] rounded-3xl p-6 sm:p-10 shadow-2xl border border-neutral-800 space-y-8 relative overflow-hidden"/g,
    'className="bg-slate-50 rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200 space-y-8 relative overflow-hidden"'
  );
  
  // Remove top colored line
  content = content.replace(
    /<div className="absolute top-0 left-0 w-full h-2 bg-\[#ff6700\]" \/>\r?\n?/g,
    ''
  );

  content = content.replace(
    /className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left border-b border-neutral-800 pb-6"/g,
    'className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left border-b border-slate-200 pb-6"'
  );

  content = content.replace(
    /className="w-16 h-16 rounded-2xl bg-neutral-800 text-\[#ff6700\] flex items-center justify-center shrink-0 shadow-sm border border-neutral-700"/g,
    'className="w-16 h-16 rounded-2xl bg-white text-[#ff6700] flex items-center justify-center shrink-0 shadow-sm border border-slate-200"'
  );

  content = content.replace(
    /className="text-2xl font-black text-white"/g,
    'className="text-2xl font-black text-[#ff6700]"'
  );

  content = content.replace(
    /className="text-sm text-neutral-400 font-medium"/g,
    'className="text-sm text-slate-500 font-medium"'
  );

  content = content.replace(
    /className="block text-xs font-extrabold text-neutral-300 uppercase tracking-wider"/g,
    'className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider"'
  );

  content = content.replace(
    /className=\{`w-full text-sm font-semibold bg-neutral-900 border rounded-xl pl-10 pr-4 py-3\.5 focus:outline-none focus:ring-2 text-white placeholder-neutral-500 transition-colors \$\{rutError \? "border-red-500 focus:ring-red-500" : "border-neutral-700 focus:border-\[#ff6700\] focus:ring-\[#ff6700\]\/20"\}`\}/g,
    'className={`w-full text-sm font-semibold bg-white border rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:ring-2 text-slate-800 placeholder-slate-400 transition-colors ${rutError ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:border-[#ff6700] focus:ring-[#ff6700]/20"}`}'
  );

  content = content.replace(
    /className="w-5 h-5 text-neutral-500 absolute left-3\.5 top-4" \/>/g,
    'className="w-5 h-5 text-slate-400 absolute left-3.5 top-4" />'
  );

  fs.writeFileSync(file, content);
}

function revertCancellationView() {
  const file = 'components/TicketCancellationView.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // Revert dark background to slate-50
  content = content.replace(
    /className="bg-\[#1a1a1a\] rounded-3xl p-6 sm:p-10 shadow-2xl border border-neutral-800 space-y-8 relative overflow-hidden"/g,
    'className="bg-slate-50 rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200 space-y-8 relative overflow-hidden"'
  );

  // Remove top colored line
  content = content.replace(
    /<div className="absolute top-0 left-0 w-full h-2 bg-\[#ff6700\]" \/>\r?\n?/g,
    ''
  );

  content = content.replace(
    /className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left border-b border-neutral-800 pb-6"/g,
    'className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left border-b border-slate-200 pb-6"'
  );

  content = content.replace(
    /className="w-16 h-16 rounded-2xl bg-neutral-800 text-\[#ff6700\] flex items-center justify-center shrink-0 shadow-sm border border-neutral-700"/g,
    'className="w-16 h-16 rounded-2xl bg-white text-[#ff6700] flex items-center justify-center shrink-0 shadow-sm border border-slate-200"'
  );

  content = content.replace(
    /className="text-2xl font-black text-white"/g,
    'className="text-2xl font-black text-[#ff6700]"'
  );

  content = content.replace(
    /className="text-sm text-neutral-400 font-medium"/g,
    'className="text-sm text-slate-500 font-medium"'
  );
  
  content = content.replace(
    /className="text-white"/g,
    'className="text-slate-800"'
  );

  // Form wrappers
  content = content.replace(
    /className="bg-neutral-900\/50 rounded-2xl p-5 sm:p-6 border border-neutral-800 space-y-5"/g,
    'className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-5 shadow-sm"'
  );

  content = content.replace(
    /className="block text-xs font-bold text-neutral-300 ml-1"/g,
    'className="block text-xs font-bold text-slate-600 ml-1"'
  );

  // Inputs
  content = content.replace(
    /className=\{`w-full text-sm font-semibold bg-neutral-900 border rounded-xl pl-11 pr-4 py-3\.5 transition-all duration-300 focus:outline-none text-white placeholder-neutral-500 group-hover:border-neutral-600 shadow-sm \$\{rutError \? "border-red-500 focus:border-red-500 focus:ring-red-500\/20" : "border-neutral-700 focus:border-\[#ff6700\] focus:ring-\[#ff6700\]\/20"\}`\}/g,
    'className={`w-full text-sm font-semibold bg-slate-50 border rounded-xl pl-11 pr-4 py-3.5 transition-all duration-300 focus:outline-none text-slate-800 placeholder-slate-400 group-hover:border-slate-300 shadow-inner ${rutError ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:border-[#ff6700] focus:ring-[#ff6700]/20"}`}'
  );

  content = content.replace(
    /className="w-5 h-5 text-neutral-500 absolute left-4 top-3\.5 transition-colors group-focus-within:text-\[#ff6700\]"/g,
    'className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 transition-colors group-focus-within:text-[#ff6700]"'
  );

  // Input 2 (PasajeCodigo)
  content = content.replace(
    /className="w-full text-sm font-mono font-bold bg-neutral-900 border border-neutral-700 rounded-xl pl-4 pr-11 py-3\.5 transition-all duration-300 focus:outline-none focus:border-\[#ff6700\] focus:ring-4 focus:ring-\[#ff6700\]\/20 text-white placeholder-neutral-500 group-hover:border-neutral-600 shadow-sm uppercase tracking-wider"/g,
    'className="w-full text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-11 py-3.5 transition-all duration-300 focus:outline-none focus:border-[#ff6700] focus:ring-4 focus:ring-[#ff6700]/20 text-slate-800 placeholder-slate-400 group-hover:border-slate-300 shadow-inner uppercase tracking-wider"'
  );

  content = content.replace(
    /className="absolute right-4 top-3\.5 p-1 bg-neutral-800 rounded-md border border-neutral-700"/g,
    'className="absolute right-4 top-3.5 p-1 bg-white rounded-md border border-slate-200 shadow-sm"'
  );

  fs.writeFileSync(file, content);
}

try {
  revertDashboardView();
  revertCancellationView();
  console.log('Update complete');
} catch (e) {
  console.error(e);
}
