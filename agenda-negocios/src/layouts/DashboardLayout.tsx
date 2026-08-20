import Sidebar from "../components/Sidebar/sidebar";
import { Outlet } from "react-router";

export default function DashboardLayout() {
  return (
    <div>
      <Sidebar />

      <main>
        <Outlet />
      </main>
    </div>
  );
}