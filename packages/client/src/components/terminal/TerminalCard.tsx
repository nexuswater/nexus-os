import React, { type ReactNode } from "react";

interface TerminalCardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  glow?: boolean;
  statusDot?: "active" | "warning" | "error";
  padding?: "sm" | "md" | "lg";
}

const STATUS_DOT_COLORS: Record<string, { bg: string; shadow: string }> = {
  active: { bg: "#25D695", shadow: "rgba(37, 214, 149, 0.5)" },
  warning: { bg: "#F59E0B", shadow: "rgba(245, 158, 11, 0.5)" },
  error: { bg: "#EF4444", shadow: "rgba(239, 68, 68, 0.5)" },
};

const PADDING_MAP: Record<string, string> = {
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
};

export const TerminalCard: React.FC<TerminalCardProps> = ({
  children,
  title,
  className = "",
  glow = false,
  statusDot,
  padding = "md",
}) => {
  const paddingClass = PADDING_MAP[padding] ?? PADDING_MAP.md;

  return (
    <div
      className={[
        "rounded-xl transition-all duration-200",
        paddingClass,
        glow ? "terminal-card-glow" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        backgroundColor: "#111820",
        border: "1px solid #1C2432",
      }}
      onMouseEnter={(e) => {
        if (glow) {
          e.currentTarget.style.borderColor = "#25D69550";
          e.currentTarget.style.boxShadow =
            "0 0 24px rgba(37, 214, 149, 0.06)";
        }
      }}
      onMouseLeave={(e) => {
        if (glow) {
          e.currentTarget.style.borderColor = "#1C2432";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      {title && (
        <div className="flex items-center gap-2 mb-3">
          {statusDot && (
            <span
              className="inline-block w-[6px] h-[6px] rounded-full flex-shrink-0"
              style={{
                backgroundColor: STATUS_DOT_COLORS[statusDot].bg,
                boxShadow: `0 0 6px ${STATUS_DOT_COLORS[statusDot].shadow}`,
              }}
            />
          )}
          <span
            className="uppercase select-none"
            style={{
              fontSize: "10px",
              letterSpacing: "0.15em",
              color: "#64748B",
            }}
          >
            {title}
          </span>
        </div>
      )}
      {children}
    </div>
  );
};

export default TerminalCard;
