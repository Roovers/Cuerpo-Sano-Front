import {
  Children,
  isValidElement,
  useId,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import "./PageTabs.css";

export type PageTabItem<T extends string = string> = {
  value: T;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
};

interface PageTabsProps<T extends string = string> {
  value: T;
  tabs: PageTabItem<T>[];
  onChange: (value: T) => void;
  className?: string;
}

function AnimatedIcon({ active, icon }: { active: boolean; icon?: ReactNode }) {
  if (!icon) return null;

  const iconNode = Children.only(icon);

  return (
    <motion.span
      className="cs-page-tabs__icon"
      animate={{
        scale: active ? 1.08 : 1,
        rotate: active ? 0 : -2,
      }}
      transition={{
        type: "spring",
        stiffness: 420,
        damping: 24,
      }}
    >
      {isValidElement(iconNode) ? iconNode : icon}
    </motion.span>
  );
}

export default function PageTabs<T extends string = string>({
  value,
  tabs,
  onChange,
  className = "",
}: PageTabsProps<T>) {
  const instanceId = useId().replace(/:/g, "");
  const activePillLayoutId = `cs-page-tabs-active-pill-${instanceId}`;
  const activeGlowLayoutId = `cs-page-tabs-active-glow-${instanceId}`;

  const enabledTabs = tabs.filter((tab) => !tab.disabled);

  const focusTab = (nextValue: T) => {
    const button = document.querySelector<HTMLButtonElement>(
      `[data-page-tab-value="${String(nextValue)}"]`,
    );

    button?.focus();
    onChange(nextValue);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();

    const currentIndex = enabledTabs.findIndex((tab) => tab.value === value);

    if (currentIndex === -1) return;

    if (event.key === "Home") {
      focusTab(enabledTabs[0].value);
      return;
    }

    if (event.key === "End") {
      focusTab(enabledTabs[enabledTabs.length - 1].value);
      return;
    }

    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex =
      (currentIndex + direction + enabledTabs.length) % enabledTabs.length;

    focusTab(enabledTabs[nextIndex].value);
  };

  return (
    <div
      className={`cs-page-tabs ${className}`.trim()}
      role="tablist"
      aria-label="Secciones"
      onKeyDown={handleKeyDown}
    >
      <motion.div
        className="cs-page-tabs__track"
        initial={false}
        layout
        transition={{
          type: "spring",
          stiffness: 460,
          damping: 36,
        }}
      >
        {tabs.map((tab) => {
          const active = tab.value === value;

          return (
            <motion.button
              key={tab.value}
              type="button"
              role="tab"
              data-page-tab-value={String(tab.value)}
              aria-selected={active}
              disabled={tab.disabled}
              className={active ? "cs-page-tabs__tab active" : "cs-page-tabs__tab"}
              onClick={() => !tab.disabled && onChange(tab.value)}
              whileTap={tab.disabled ? undefined : { scale: 0.965 }}
              transition={{
                type: "spring",
                stiffness: 420,
                damping: 26,
              }}
            >
              {active && (
                <>
                  <motion.span
                    layoutId={activePillLayoutId}
                    className="cs-page-tabs__active-pill"
                    transition={{
                      type: "spring",
                      stiffness: 430,
                      damping: 34,
                      mass: 0.9,
                    }}
                  />

                  <motion.span
                    layoutId={activeGlowLayoutId}
                    className="cs-page-tabs__active-glow"
                    transition={{
                      type: "spring",
                      stiffness: 430,
                      damping: 38,
                      mass: 0.9,
                    }}
                  />
                </>
              )}

              <span className="cs-page-tabs__content">
                <AnimatedIcon active={active} icon={tab.icon} />

                <motion.span
                  className="cs-page-tabs__label"
                  animate={{
                    y: active ? -0.5 : 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 26,
                  }}
                >
                  {tab.label}
                </motion.span>

                {tab.badge && (
                  <motion.span
                    className="cs-page-tabs__badge"
                    animate={{
                      scale: active ? 1 : 0.96,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 28,
                    }}
                  >
                    {tab.badge}
                  </motion.span>
                )}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
