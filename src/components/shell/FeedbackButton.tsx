"use client";

import { Icon } from "../ui/Icon";

// Gmail's web compose URL works without a registered OS mailto handler, which
// is the default state on Windows 11. Swap to /api/feedback + modal once
// volume warrants it.
const FEEDBACK_TO = "emiledelarey@gmail.com";

export function FeedbackButton() {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window === "undefined") return;
    const page = window.location.pathname + window.location.search;
    const viewport = `${window.innerWidth}×${window.innerHeight}`;
    const ua = navigator.userAgent.slice(0, 140);
    const body = [
      "What happened? What did you expect?",
      "",
      "",
      "— — — — — — — —",
      `Page: ${page}`,
      `Viewport: ${viewport}`,
      `UA: ${ua}`,
    ].join("\n");
    const params = new URLSearchParams({
      view: "cm",
      fs: "1",
      to: FEEDBACK_TO,
      su: "Axon feedback",
      body,
    });
    e.currentTarget.href = `https://mail.google.com/mail/?${params.toString()}`;
  };

  return (
    <a
      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${FEEDBACK_TO}&su=Axon%20feedback`}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      className="feedback-btn"
    >
      <Icon.msg size={12} /> Feedback
    </a>
  );
}
