import type { Metadata } from "next";
import { AdminClient } from "./AdminClient";

export const metadata: Metadata = {
  title: "Admin",
  description: "Manage books and taxonomy",
};

export default function AdminPage() {
  return (
    <AdminClient />
  );
}
