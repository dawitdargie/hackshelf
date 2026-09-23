import { AuthProvider } from "@/lib/auth";
import BookEditorClient from "../[id]/BookEditorClient";

export default function AdminBookNewPage() {
  return (
    <AuthProvider>
      <BookEditorClient />
    </AuthProvider>
  );
}
