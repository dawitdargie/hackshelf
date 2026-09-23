import { LoadingState } from "@/components/ui/LoadingState";

// Route-level loading UI for the library.
export default function LibraryLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
      <LoadingState rows={3} />
    </div>
  );
}
