import { Icon } from "../ui/Icon";

export function FeedbackButton() {
  return (
    <a
      href="mailto:emile@axon.study?subject=Axon%20feedback&body=What%20happened%3F%20What%20did%20you%20expect%3F%0A%0A"
      className="feedback-btn"
    >
      <Icon.msg size={12} /> Feedback
    </a>
  );
}
