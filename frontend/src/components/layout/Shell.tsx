import { Outlet } from "react-router-dom";
import MobileNav from "./MobileNav";

export default function Shell() {
  return (
    <div className="flex flex-col min-h-dvh bg-slate-950 text-slate-100">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
