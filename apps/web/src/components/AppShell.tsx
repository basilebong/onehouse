// App shell: top bar (identity + context, NEVER primary actions), main outlet,
// bottom nav (primary navigation in thumb zone). See .claude/rules/mobile.md.

// TODO(basile): wire as React + TanStack Router are installed.
// import { Link, Outlet, useMatchRoute } from "@tanstack/react-router";
// import { cn } from "@/lib/cn.ts";
//
// export function AppShell() {
//   return (
//     <div className="min-h-dvh flex flex-col bg-slate-50">
//       <header className="h-12 px-4 flex items-center pt-[env(safe-area-inset-top)] border-b bg-white">
//         {/* identity, online badge — NO primary actions */}
//       </header>
//       <main className="flex-1 overflow-y-auto pb-24">
//         <Outlet />
//       </main>
//       <nav className="fixed bottom-0 inset-x-0 h-20 pb-[env(safe-area-inset-bottom)] bg-white border-t flex items-stretch">
//         <NavTab to="/grocery" label="Grocery" />
//         <NavTab to="/me" label="Me" />
//       </nav>
//     </div>
//   );
// }
//
// function NavTab({ to, label }: { to: string; label: string }) {
//   const match = useMatchRoute();
//   const active = match({ to, fuzzy: true });
//   return (
//     <Link
//       to={to}
//       className={cn(
//         "flex-1 flex flex-col items-center justify-center text-xs gap-1",
//         active ? "text-slate-900" : "text-slate-500",
//       )}
//     >
//       {label}
//     </Link>
//   );
// }

export {};
