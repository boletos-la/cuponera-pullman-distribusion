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

// Función para normalizar texto (remover tildes)
const normalizeText = (text: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

export function ComboBox({
  items,
  value,
  onChange,
  placeholder,
  disabled = false,
}: ComboBoxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const selectedLabel =
    items.find((i) => i.value === value)?.label || placeholder;

  const commandRef = React.useRef<HTMLDivElement>(null);

  const filteredItems = React.useMemo(() => {
    if (!searchQuery) return items;

    const normalizedSearch = normalizeText(searchQuery);

    return items.filter((item) => {
      const normalizedLabel = normalizeText(item.label);
      return normalizedLabel.includes(normalizedSearch);
    });
  }, [items, searchQuery]);

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
            "w-full justify-between",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          disabled={disabled}
        >
          {selectedLabel}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0">
        <Command ref={commandRef} filter={() => 1}>
          {" "}
          <CommandInput
            placeholder="Buscar ciudad..."
            onKeyDown={handleEnter}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>No encontrada.</CommandEmpty>
          <div className="max-h-64 overflow-y-auto">
            <CommandGroup>
              {filteredItems.map((item) => (
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
                      "mr-2 h-4 w-4",
                      value === item.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
