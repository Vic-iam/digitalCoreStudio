import { Outlet } from "react-router";
import Sidebar from "../components/Sidebar/Sidebar";

export default function DashboardLayout() {
  return (
    <div className="dashboardLayout">
      <Sidebar />


      <main>
        <Outlet />
      </main>
    </div>
  );