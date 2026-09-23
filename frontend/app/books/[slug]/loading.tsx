import { LoadingState } from "@/components/ui/LoadingState";

// Route-level loading UI for the book details page.
export default function BookLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
      <LoadingState rows={5} />
    </div>
  );
}
