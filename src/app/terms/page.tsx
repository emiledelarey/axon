import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, LegalSection, LegalEyebrow } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Terms of Service — Axon",
  description: "The rules for using Axon — short, plain-English, ACL-respecting.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "25 April 2026";

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated={LAST_UPDATED}>
      <LegalEyebrow>
        Axon helps you learn — it won&apos;t write your assignments, and you agree not to try to
        make it. Pay A$20/mo if you want Pro. Cancel anytime, no surprise charges. Don&apos;t do
        anything illegal. That&apos;s the gist; the details are below.
      </LegalEyebrow>

      <LegalSection title="1. Who you're agreeing with">
        <p>
          Axon is operated by <strong>Napkin Group</strong>, a sole-trader business registered in
          Australia (ABN <em>[YOUR ABN]</em>). When this document says &ldquo;we&rdquo; or
          &ldquo;us&rdquo;, that&apos;s who. When it says &ldquo;you&rdquo;, that&apos;s the person
          using Axon under their account.
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility">
        <p>
          You must be at least 16 years old. If you&apos;re between 16 and 18, you confirm a parent
          or guardian is OK with you using Axon and paying for Pro (if applicable).
        </p>
      </LegalSection>

      <LegalSection title="3. Your account">
        <p>
          You&apos;re responsible for what happens under your account. Don&apos;t share it.
          Don&apos;t lie about who you are. If someone else uses your login, that&apos;s on you.
          Tell us if your credentials are compromised.
        </p>
      </LegalSection>

      <LegalSection title="4. What you can use Axon for">
        <p>Axon&apos;s entire point is to teach you, not to do your work. So:</p>
        <ul>
          <li>
            <strong>You can</strong> paste your own course material, work through cards, get coached
            on essays you&apos;re writing yourself, talk to the tutor, run mock exams.
          </li>
          <li>
            <strong>You agree not to</strong> use Axon — or any output from Axon — to cheat,
            plagiarise, ghost-write, or break your university&apos;s academic integrity rules. We
            built Axon specifically to refuse that. If you find a way around it, we&apos;ll close
            your account.
          </li>
          <li>
            <strong>You also agree not to</strong> reverse-engineer or scrape the service, abuse the
            API, upload someone else&apos;s copyrighted material without permission, or use Axon to
            harm anyone.
          </li>
        </ul>
        <p>
          You keep ownership of the study material you paste in. You give us a non-exclusive licence
          to process it through the app and our subprocessors (see the Privacy Policy) purely to
          deliver the service to you. We don&apos;t use it to train anything.
        </p>
      </LegalSection>

      <LegalSection title="5. Free and paid plans">
        <p>
          Axon has a free tier with caps (one active deck, 30 tutor messages a month) and a Pro tier
          at A$20/month that lifts those caps and unlocks Mock Exam, Live Write, and Voice Mode.
        </p>
        <ul>
          <li>
            <strong>Billing</strong> — Pro is billed monthly via Stripe in Australian dollars. The
            charge recurs on the same date each month until you cancel.
          </li>
          <li>
            <strong>Cancelling</strong> — you can cancel any time from the in-app billing portal.
            You keep Pro access until the end of the current billing period.
          </li>
          <li>
            <strong>Refunds</strong> — we don&apos;t offer pro-rata refunds for unused portions of a
            month. If you have a real problem with the product (a bug, an outage, a feature that
            doesn&apos;t do what we said), email us — we&apos;ll sort it out fairly. Nothing in this
            clause limits the consumer guarantees you have under the Australian Consumer Law.
          </li>
          <li>
            <strong>Price changes</strong> — if we change Pro&apos;s price, we&apos;ll email you and
            give you at least 30 days&apos; notice before the new price applies to your
            subscription.
          </li>
          <li>
            <strong>Failed payments</strong> — if your card stops working, we&apos;ll let Stripe
            retry. After that we&apos;ll downgrade you to free until you fix the payment method.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Changes to the service">
        <p>
          We&apos;ll keep adding features and occasionally remove ones that don&apos;t work. If we
          remove a feature you&apos;re actively using on Pro, we&apos;ll give you reasonable notice
          and (where it&apos;s a major reduction in what you paid for) a fair refund. We can&apos;t
          guarantee 100% uptime — Axon depends on Vercel, Clerk, Supabase, Stripe, and Anthropic,
          any of which can have outages.
        </p>
      </LegalSection>

      <LegalSection title="7. Suspension and termination">
        <p>
          We can suspend or close your account if you breach these terms — academic-dishonesty
          attempts, abuse of the API, illegal use, non-payment, or putting other users at risk. You
          can close your account anytime from the billing portal or by emailing us.
        </p>
      </LegalSection>

      <LegalSection title="8. Disclaimer (and your consumer rights)">
        <p>
          Axon is provided &ldquo;as is&rdquo; — we don&apos;t guarantee the AI tutor or coach will
          be right every time. Always cross-check what it tells you against your course material and
          your lecturer. Axon is not a substitute for a human teacher, and it&apos;s not legal,
          medical, or financial advice.
        </p>
        <p>
          <strong>Australian Consumer Law:</strong> the consumer guarantees in the ACL apply to Axon
          and we can&apos;t exclude them. If we breach a non-excludable guarantee, our liability is
          limited (where the law allows) to re-supplying the service or refunding what you paid for
          it. Nothing in these terms takes away ACL rights.
        </p>
      </LegalSection>

      <LegalSection title="9. Liability cap">
        <p>
          To the maximum extent the law allows, our total liability to you for anything related to
          Axon is capped at the greater of A$100 or what you paid us in the 12 months before the
          claim. We&apos;re not liable for indirect, consequential, or special damages — lost marks,
          lost grades, missed deadlines, etc. — even if we should&apos;ve seen them coming. Use Axon
          as a tool, not a crutch.
        </p>
      </LegalSection>

      <LegalSection title="10. Privacy">
        <p>
          See the <Link href="/privacy">Privacy Policy</Link> for what we collect and how we handle
          it.
        </p>
      </LegalSection>

      <LegalSection title="11. Governing law and disputes">
        <p>
          These terms are governed by the law of New South Wales, Australia. Any dispute we
          can&apos;t resolve by chatting goes to the courts of New South Wales (or, where
          applicable, the relevant consumer tribunal). If you&apos;re a consumer in another country,
          your local mandatory rights still apply.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes to these terms">
        <p>
          When we change anything material we&apos;ll update the &ldquo;last updated&rdquo; date at
          the top and email Pro subscribers at least 14 days before the change takes effect. If you
          don&apos;t agree, cancel your subscription before then; otherwise the new terms apply.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact">
        <p>
          <a href="mailto:emiledelarey@gmail.com">emiledelarey@gmail.com</a>.
        </p>
      </LegalSection>

      <p style={{ marginTop: 32 }}>
        <Link href="/" className="eyebrow">
          ← Back to Axon
        </Link>
      </p>
    </LegalShell>
  );
}
