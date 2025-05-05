import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, User, Settings, Home, Mail, Calendar, Bell, FileText, Search, Heart, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type IconSelectProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function IconSelect({ value, onChange, placeholder = "Select an icon..." }: IconSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  
  // Curated list of commonly used icons
  const icons = [
    { name: 'User', component: User },
    { name: 'Settings', component: Settings },
    { name: 'Home', component: Home },
    { name: 'Mail', component: Mail },
    { name: 'Calendar', component: Calendar },
    { name: 'Bell', component: Bell },
    { name: 'FileText', component: FileText },
    { name: 'Search', component: Search },
    { name: 'Heart', component: Heart },
    { name: 'Star', component: Star },
  ];

  const filteredIcons = icons.filter((icon) =>
    icon.name.toLowerCase().includes(search.toLowerCase())
  );

  const SelectedIcon = icons.find(icon => icon.name === value)?.component;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value && SelectedIcon ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4">
                <SelectedIcon aria-hidden="true" />
              </div>
              <span>{value}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2" align="start">
        <div className="space-y-2">
          <Input 
            placeholder="Search icons..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
          <div className="grid grid-cols-4 gap-2">
            {filteredIcons.map(({ name, component: Icon }) => (
              <button
                key={name}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center justify-center p-2 rounded-md relative",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  value === name && "bg-accent text-accent-foreground"
                )}
              >
                <div className="h-5 w-5">
                  <Icon aria-hidden="true" />
                </div>
                {value === name && (
                  <Check className="h-3 w-3 text-primary absolute top-1 right-1" />
                )}
              </button>
            ))}
          </div>
          {filteredIcons.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No icons found
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
} 