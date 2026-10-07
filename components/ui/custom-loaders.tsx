"use client";

import { motion } from "framer-motion";
import { Ticket, Bus, MapPin, Grid, TicketCheck, Loader2 } from "lucide-react";

interface LoaderProps {
  message: string;
}

export function TicketLoader({ message }: LoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <motion.div
        animate={{ 
          y: [0, -10, 0],
          rotate: [0, -5, 5, 0]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="w-16 h-16 bg-cyan-100 rounded-lg flex items-center justify-center text-[#00c7cc] shadow-lg shadow-cyan-500/10"
      >
        <Ticket className="w-8 h-8" />
      </motion.div>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-5 h-5 text-[#00c7cc] animate-spin" />
        <p className="text-slate-600 font-medium text-sm animate-pulse">{message}</p>
      </div>
    </div>
  );
}

export function BusRouteLoader({ message }: LoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="relative w-48 h-12 flex items-center justify-between">
        {/* Route Line */}
        <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 border-t border-dashed border-slate-300" />
        
        {/* Origin Pin */}
        <div className="relative z-10 w-4 h-4 rounded-md bg-slate-100 border-2 border-slate-300 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-md bg-slate-400" />
        </div>

        {/* Bus moving */}
        <motion.div
          animate={{ x: [0, 160, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute z-20 left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-100 border border-blue-200 rounded-lg flex items-center justify-center text-blue-600 shadow-md"
        >
          <Bus className="w-4 h-4" />
        </motion.div>

        {/* Destination Pin */}
        <div className="relative z-10 w-5 h-5 rounded-md bg-cyan-50 border-2 border-cyan-200 flex items-center justify-center">
          <MapPin className="w-3 h-3 text-[#00c7cc]" />
        </div>
      </div>
      <p className="text-slate-600 font-medium text-sm animate-pulse">{message}</p>
    </div>
  );
}

export function SeatMapLoader({ message }: LoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5">
      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-md border border-slate-100">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
            className="w-10 h-10 bg-blue-100 rounded-md border border-blue-200 flex items-center justify-center text-blue-500"
          >
            <Grid className="w-5 h-5" />
          </motion.div>
        ))}
      </div>
      <p className="text-slate-600 font-medium text-sm animate-pulse">{message}</p>
    </div>
  );
}

export function EmissionLoader({ message }: LoaderProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center gap-6 max-w-sm w-[90%] text-center relative overflow-hidden">
        {/* Background glow effect */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/10 blur-3xl rounded-md" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 blur-3xl rounded-md" />

        <div className="relative z-10">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 bg-green-50 rounded-md flex items-center justify-center text-green-600 shadow-inner"
          >
            <TicketCheck className="w-10 h-10" />
          </motion.div>
          
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-md border-4 border-transparent border-t-green-500 border-r-green-200 opacity-70"
          />
        </div>
        
        <div className="space-y-2 relative z-10">
          <h3 className="text-lg font-bold text-slate-800">Procesando</h3>
          <p className="text-slate-500 text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}
