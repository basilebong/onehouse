import { BasketIcon, CheckSquareIcon, UserIcon } from "@phosphor-icons/react";
import type { ComponentType, ReactElement } from "react";
import { cn } from "./cn.ts";

export type NavTab = "grocery" | "todo" | "me";

type IconProps = { size?: number; weight?: "regular" | "fill" };
type PhosphorIcon = ComponentType<IconProps>;

type BottomNavProps = {
  active: NavTab;
  onChange?: (tab: NavTab) => void;
};

const ENTRIES: readonly { id: NavTab; icon: PhosphorIcon; label: string }[] = [
  { id: "grocery", icon: BasketIcon, label: "Grocery" },
  { id: "todo", icon: CheckSquareIcon, label: "Todo" },
  { id: "me", icon: UserIcon, label: "Me" },
];

const Tab = ({
  active,
  Icon,
  label,
  onClick,
}: {
  active: boolean;
  Icon: PhosphorIcon;
  label: string;
  onClick?: () => void;
}): ReactElement => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5",
      active ? "text-slate-900" : "text-slate-500",
    )}
    aria-current={active ? "page" : undefined}
  >
    <Icon size={22} weight={active ? "fill" : "regular"} />
    <span className={cn("text-[11px]", active && "font-medium")}>{label}</span>
  </button>
);

export const BottomNav = ({ active, onChange }: BottomNavProps): ReactElement => (
  <nav
    className="flex h-20 shrink-0 items-stretch border-slate-100 border-t bg-white pb-[env(safe-area-inset-bottom)]"
    aria-label="Primary"
  >
    {ENTRIES.map(({ id, icon, label }) => {
      const tabProps = onChange ? { onClick: () => onChange(id) } : {};
      return <Tab key={id} active={id === active} Icon={icon} label={label} {...tabProps} />;
    })}
  </nav>
);
