"use client";

import { TravelSearch } from "@/components/travel-search";
import { TravelProvider } from "@/components/context/travel-context";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BookingData } from "@/types/booking";

interface StepSearchProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepSearch({
  bookingData,
  updateBookingData,
  onNext,
  onBack,
}: StepSearchProps) {
  return (
    <TravelProvider>
      <div className="max-w-6xl mx-auto">
        <TravelSearch onNext={onNext} onBack={onBack} />
      </div>
    </TravelProvider>
  );
}
