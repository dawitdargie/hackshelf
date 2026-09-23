"use client";

// HackShelf — last-resort error boundary (errors in the root layout itself).
// Must render its own <html>/<body>.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "3rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>HackShelf hit an error</h1>
        <p style={{ color: "#4a4a4a", marginTop: "0.75rem" }}>
          {error.digest ? `Reference: ${error.digest}` : "Please try again."}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            padding: "0.75rem 1.25rem",
            borderRadius: "0.5rem",
            background: "#00a651",
            color: "white",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}