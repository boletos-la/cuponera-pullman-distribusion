import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ComboBoxProps {
  items: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}

// Cache para normalizar texto rápidamente sin recalcular repetidamente
const normCache = new Map<string, string>();
const normalizeText = (text: string): string => {
  if (!text) return "";
  let cached = normCache.get(text);
  if (cached !== undefined) return cached;
  cached = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  if (normCache.size > 5000) normCache.clear();
  normCache.set(text, cached);
  return cached;
};

const PAGE_SIZE = 40;

export function ComboBox({
  items,
  value,
  onChange,
  placeholder,
  disabled = false,
}: ComboBoxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);

  // Reiniciar cantidad visible al cambiar de búsqueda o abrir/cerrar
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, open]);

  const selectedLabel = React.useMemo(() => {
    const found = items.find((i) => i.value === value);
    if (found) return found.label;
    if (value) return value;
    return placeholder;
  }, [items, value, placeholder]);

  const commandRef = React.useRef<HTMLDivElement>(null);

  // Filtrado de todas las coincidencias
  const allFilteredItems = React.useMemo(() => {
    if (!open) return [];

    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      if (value && !items.slice(0, PAGE_SIZE).some((i) => i.value === value)) {
        const currentItem = items.find((i) => i.value === value);
        if (currentItem) {
          return [currentItem, ...items.filter((i) => i.value !== value)];
        }
      }
      return items;
    }

    const normalizedSearch = normalizeText(trimmedQuery);
    return items.filter((item) =>
      normalizeText(item.label).includes(normalizedSearch)
    );
  }, [items, searchQuery, open, value]);

  // Ítems actualmente cargados en pantalla (de 40 en 40 dinámicamente)
  const displayItems = React.useMemo(() => {
    return allFilteredItems.slice(0, visibleCount);
  }, [allFilteredItems, visibleCount]);

  const totalMatches = allFilteredItems.length;
  const hasMore = visibleCount < totalMatches;

  // Carga dinámica al scrollear hacia el final de la lista
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 60 && hasMore) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, totalMatches));
    }
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const firstItem = commandRef.current?.querySelector(
        "[cmdk-item]",
      ) as HTMLElement | null;

      if (firstItem) {
        firstItem.click();
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between truncate text-left font-normal",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          disabled={disabled}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[240px] p-0 z-[99999]" align="start">
        <Command ref={commandRef} filter={() => 1}>
          <CommandInput
            placeholder="Buscar ciudad..."
            onKeyDown={handleEnter}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          {totalMatches === 0 && <CommandEmpty>No encontrada.</CommandEmpty>}
          <CommandList 
            className="max-h-64 overflow-y-auto"
            onScroll={handleScroll}
          >
            <CommandGroup>
              {displayItems.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => {
                    if (!disabled) {
                      onChange(item.value);
                      setOpen(false);
                      setSearchQuery(""); // Limpiar búsqueda al seleccionar
                    }
                  }}
                  className={cn(disabled && "opacity-50 cursor-not-allowed")}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === item.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {hasMore && (
              <div className="py-2 text-center text-[10px] text-slate-400 font-medium">
                Cargando más ciudades al scrollear... ({displayItems.length} de {totalMatches})
              </div>
            )}
          </CommandList>
          {totalMatches > PAGE_SIZE && (
            <div className="py-1 px-3 text-[10px] text-slate-400 bg-slate-50 border-t border-slate-100 text-center font-medium">
              Mostrando {displayItems.length} de {totalMatches} ciudades
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
