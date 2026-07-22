import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { chatGPTSignOutPath, requireChatGPTUser } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Talaan ng Kawani | Reyes Medical Clinic",
  description: "Pribadong talaan para sa mga kawani ng Reyes Medical Clinic.",
};

async function ProtectedDashboard() {
  const user = await requireChatGPTUser("/admin");
  return <AdminDashboard staffName={user.displayName} signOutPath={chatGPTSignOutPath("/")} />;
}

export default function AdminPage() {
  return <ProtectedDashboard />;
}
