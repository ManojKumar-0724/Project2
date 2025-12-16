import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface SearchFilters {
  query: string;
  era: string;
  location: string;
}

interface MonumentSearchProps {
  onSearch: (filters: SearchFilters) => void;
  eras: string[];
  locations: string[];
}

export function MonumentSearch({ onSearch, eras, locations }: MonumentSearchProps) {
  const [query, setQuery] = useState("");
  const [era, setEra] = useState("all");
  const [location, setLocation] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onSearch({
      query,
      era: era === "all" ? "" : era,
      location: location === "all" ? "" : location,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setQuery("");
    setEra("all");
    setLocation("all");
    onSearch({ query: "", era: "", location: "" });
  };

  const hasActiveFilters = query || era !== "all" || location !== "all";

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search monuments, stories, locations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? "bg-primary text-primary-foreground" : ""}
        >
          <Filter className="h-4 w-4" />
        </Button>
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Era</label>
            <Select value={era} onValueChange={setEra}>
              <SelectTrigger>
                <SelectValue placeholder="All Eras" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Eras</SelectItem>
                {eras.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Location</label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {query && (
            <Badge variant="secondary">
              Search: "{query}"
            </Badge>
          )}
          {era !== "all" && (
            <Badge variant="secondary">
              Era: {era}
            </Badge>
          )}
          {location !== "all" && (
            <Badge variant="secondary">
              Location: {location}
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
