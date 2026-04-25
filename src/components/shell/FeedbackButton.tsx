"use client";

import { Icon } from "../ui/Icon";

/**
 * Floating feedback button. Opens the user's default mail client pre-filled
 * with context (page + viewport) so bug reports actually contain signal.
 * Target is Emile's personal inbox while we're pre-launch — swap to a proper
 * /api/feedback endpoint + modal once volume warrants it.
 */
export function FeedbackButton() {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Enrich the mailto on the fly so we capture page + viewport, which is
    // impossible from a static href.
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
    const href = `mailto:emiledelarey@gmail.com?subject=${encodeURIComponent(
      "Axon feedback",
    )}&body=${encodeURIComponent(body)}`;
    e.currentTarget.href = href;
  };

  return (
    <a
      href="mailto:emiledelarey@gmail.com?subject=Axon%20feedback"
      onClick={handleClick}
      className="feedback-btn"
    >
      <Icon.msg size={12} /> Feedback
    </a>
  );
}
