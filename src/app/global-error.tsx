"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (
      error?.message &&
      /hydrat|mismatch/i.test(error.message)
    ) {
      if (typeof reset === "function") {
        reset();
      } else {
        window.location.reload();
      }
      return;
    }
  }, [error, reset]);

  if (error?.message && /hydrat|mismatch/i.test(error.message)) {
    return null;
  }

  const handleReset = () => {
    if (typeof reset === "function") {
      reset();
    } else {
      window.location.reload();
    }
  };

  return (
    <html>
      <body>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Something went wrong</h2>
          <button onClick={handleReset} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
