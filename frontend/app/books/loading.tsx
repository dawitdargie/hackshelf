import { LoadingState } from "@/components/ui/LoadingState";

// Route-level loading UI: shown while the catalog page's server payload
// streams in, so navigation gives immediate feedback.
export default function BooksLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
      <LoadingState rows={4} />
    </div>
  );
}
