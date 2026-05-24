"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Search, X, Loader2 } from "lucide-react";

interface UserSuggestion {
  id: string;
  username: string;
}

interface AutocompleteSearchProps {
  onSelectUser: (userId: string | null) => void;
}

export function AutocompleteSearch({ onSelectUser }: AutocompleteSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced autocomplete API query
  useEffect(() => {
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users/autocomplete?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setIsOpen(data.length > 0);
          setHighlightedIndex(-1);
        }
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (user: UserSuggestion) => {
    setSelectedUser(user.username);
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    onSelectUser(user.id);
  };

  const handleClear = () => {
    setSelectedUser(null);
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    onSelectUser(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < suggestions.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative flex items-center">
        {selectedUser ? (
          <div className="flex items-center justify-between w-full bg-primary/10 border border-primary/30 rounded-lg px-3.5 py-2 text-sm font-medium text-primary">
            <span className="flex items-center gap-2">
              <Search size={14} suppressHydrationWarning />
              Filtering by user: <strong className="font-semibold">@{selectedUser}</strong>
            </span>
            <button
              onClick={handleClear}
              className="text-primary hover:bg-primary/20 rounded-full p-1 transition-colors"
              aria-label="Clear user filter"
            >
              <X size={14} suppressHydrationWarning />
            </button>
          </div>
        ) : (
          <>
            <Search className="absolute left-3.5 text-muted-foreground" size={16} suppressHydrationWarning />
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-muted/10 border border-border/50 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 text-foreground transition-all placeholder:text-muted-foreground/40"
              placeholder="Search user actions by username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setIsOpen(true);
              }}
            />
            {loading && (
              <Loader2 className="absolute right-3.5 animate-spin text-muted-foreground" size={16} suppressHydrationWarning />
            )}
          </>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-card/90 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-border/20">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${
                highlightedIndex === index
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-muted/10"
              }`}
            >
              <span>@{suggestion.username}</span>
              {highlightedIndex === index && <span className="text-[10px] uppercase font-bold tracking-wider text-primary/70">Select</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
