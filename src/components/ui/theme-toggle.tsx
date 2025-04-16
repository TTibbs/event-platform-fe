import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({
  className,
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  if (showLabel) {
    return (
      <Button
        variant="ghost"
        onClick={toggleTheme}
        className={`flex items-center justify-between gap-2 w-full ${className}`}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        <span className="flex items-center gap-2">
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span className="text-sm">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={className}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}
