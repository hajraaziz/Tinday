"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useSearchProfiles } from "@/hooks/useSearchProfiles";
import { withNavNonce } from "@/hooks/useNotifications";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Search icon that expands into a name-search bar with a results dropdown.
// Self-contained local state (unlike the shared notification panel). Selecting a
// result deep-links to /explore?connect=<id>, which front-loads that person's
// card in the carousel (same mechanism connect-notifications use).
export function SearchBar() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the query so we don't fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);

  const { data, isFetching } = useSearchProfiles(
    { q: debounced, limit: 6 },
    debounced.length > 0
  );
  const results = data?.profiles ?? [];

  const close = () => {
    setExpanded(false);
    setQuery("");
    setDebounced("");
  };

  // Focus the input when the bar expands.
  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  // Dismiss on outside click or Escape — mirrors the notification panel pattern.
  useEffect(() => {
    if (!expanded) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [expanded]);

  const handleSelect = (id: string) => {
    close();
    router.push(withNavNonce(`/explore?connect=${id}`));
  };

  const showDropdown = expanded && debounced.length > 0;

  return (
    <div ref={containerRef} className="relative flex items-center">
      <AnimatePresence initial={false} mode="wait">
        {expanded ? (
          <motion.div
            key="input"
            initial={{ width: 40, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 bg-[#221E30] rounded-xl px-3 h-10 w-[200px] sm:w-[280px]"
          >
            <Search className="w-4 h-4 shrink-0 text-[#9CA3AF]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people..."
              className="bg-transparent border-none outline-none text-sm text-white placeholder:text-[#4B5563] w-full"
            />
            <button
              onClick={close}
              className="shrink-0 text-[#9CA3AF] hover:text-white transition-colors"
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="icon"
            onClick={() => setExpanded(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-[rgba(132,120,212,0.06)] transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-[#9CA3AF]" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute top-[calc(100%+8px)] right-0 z-50 w-[320px] max-w-[calc(100vw-2rem)] bg-[#1C1829] border border-[rgba(132,120,212,0.12)] rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="max-h-[360px] overflow-y-auto py-1">
              {results.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-[#9CA3AF]">
                    {isFetching ? "Searching…" : "No people found"}
                  </p>
                </div>
              ) : (
                results.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[rgba(132,120,212,0.06)] transition-colors"
                  >
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarImage src={p.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-[#221E30] text-[#9CA3AF] text-xs">
                        {getInitials(p.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{p.name}</p>
                      {p.roles?.[0] && (
                        <p className="text-xs text-[#9CA3AF] truncate">
                          {p.roles[0]}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
