import { AuthProvider } from "@/lib/auth";
import BookEditorClient from "./BookEditorClient";

export default async function AdminBookEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AuthProvider>
      <BookEditorClient bookId={id} />
    </AuthProvider>
  );
}
