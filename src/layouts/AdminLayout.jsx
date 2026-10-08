import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/dashboard/Sidebar";
import Navbar from "../components/dashboard/Navbar";

function AdminLayout() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="lg:ml-64">
        <Navbar setIsOpen={setIsOpen} />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
