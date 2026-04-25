import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, LegalSection, LegalEyebrow } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy — Axon",
  description: "What Axon collects, how it's stored, and your rights.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "25 April 2026";

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated={LAST_UPDATED}>
      <LegalEyebrow>
        Axon collects what we need to make the product work — your account, your study material,
        your progress — and nothing else. We don&apos;t sell your data, we don&apos;t use it to
        train AI models, and we don&apos;t share it beyond the subprocessors that actually run the
        app.
      </LegalEyebrow>

      <LegalSection title="1. Who runs Axon">
        <p>
          Axon is operated by <strong>Napkin Group</strong>, a sole-trader business registered in
          Australia (ABN <em>[YOUR ABN]</em>). Contact:{" "}
          <a href="mailto:emiledelarey@gmail.com">emiledelarey@gmail.com</a>.
        </p>
      </LegalSection>

      <LegalSection title="2. What we collect">
        <ul>
          <li>
            <strong>Account info</strong> — your email address, your first name, and the password
            hash held by our auth provider (Clerk). We never see your raw password.
          </li>
          <li>
            <strong>Study material you paste in</strong> — the text and notes you give Axon to
            generate flashcards from, plus the answers you type during practice. This stays attached
            to your account.
          </li>
          <li>
            <strong>Usage signals</strong> — which cards you got right or wrong, how long sessions
            ran, which features you used. We use this to drive your spaced-repetition schedule and
            roadmap.
          </li>
          <li>
            <strong>Billing info</strong> — if you upgrade to Pro, Stripe collects and stores your
            payment method. We see only your Stripe customer ID and subscription status — never your
            card number.
          </li>
          <li>
            <strong>Technical data</strong> — IP address, browser, device type, and timestamps for
            requests. Used for debugging, abuse prevention, and rate limiting.
          </li>
        </ul>
        <p>
          We don&apos;t collect location beyond what an IP address implies, we don&apos;t use
          tracking cookies for advertising, and we don&apos;t run third-party analytics that
          fingerprint you.
        </p>
      </LegalSection>

      <LegalSection title="3. How we use it">
        <ul>
          <li>To run the product — generate cards, run the tutor, track your progress.</li>
          <li>To bill you (Pro users only) and email you about your account.</li>
          <li>
            To improve the product — looking at aggregate signals (which features get used, where
            errors happen). Never your raw study material.
          </li>
          <li>To meet legal obligations — tax records, fraud prevention, lawful requests.</li>
        </ul>
        <p>
          <strong>We do not use your data to train AI models.</strong> The AI provider we use
          (Anthropic) does not train on API traffic. We don&apos;t train any models ourselves.
        </p>
      </LegalSection>

      <LegalSection title="4. Who we share it with (subprocessors)">
        <p>The services Axon depends on. Each one only sees the data they need to do their job:</p>
        <ul>
          <li>
            <strong>Clerk</strong> (US) — authentication. Sees your email and session.
          </li>
          <li>
            <strong>Supabase</strong> (US) — database. Stores your study material and progress.
          </li>
          <li>
            <strong>Stripe</strong> (US/IE) — payments. Sees your card and billing details.
          </li>
          <li>
            <strong>Anthropic</strong> (US) — AI processing. Receives your study material and
            questions to generate responses. Does not retain or train on this data.
          </li>
          <li>
            <strong>Vercel</strong> (US) — hosting. Sees request logs (IP, route, status code).
          </li>
        </ul>
        <p>
          That&apos;s the whole list. We don&apos;t share your data with anyone else, and we
          don&apos;t sell it. If we ever add a new subprocessor, we&apos;ll update this page and
          email anyone with an active Pro subscription.
        </p>
      </LegalSection>

      <LegalSection title="5. International transfers">
        <p>
          You may be in Australia, the EU, or elsewhere — most of our subprocessors are in the
          United States. By using Axon you consent to your data being transferred to and processed
          there. We rely on the standard contractual clauses these vendors offer, plus their own
          security commitments.
        </p>
      </LegalSection>

      <LegalSection title="6. How long we keep it">
        <ul>
          <li>
            <strong>Account data</strong> — for as long as your account exists, plus 30 days after
            deletion to handle disputes.
          </li>
          <li>
            <strong>Study material and progress</strong> — same as account data. Deleted with the
            account.
          </li>
          <li>
            <strong>Billing records</strong> — kept for 7 years after the last transaction (ATO
            requirement).
          </li>
          <li>
            <strong>Server logs</strong> — typically 30 days at Vercel.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Your rights">
        <p>You can, at any time:</p>
        <ul>
          <li>
            <strong>See what we hold</strong> — email us and we&apos;ll send you a copy of your
            account data.
          </li>
          <li>
            <strong>Correct or update it</strong> — most of it you can edit yourself in the app.
          </li>
          <li>
            <strong>Delete your account</strong> — email us and we&apos;ll wipe everything we can
            (Stripe billing records have to be retained for tax law).
          </li>
          <li>
            <strong>Export your study material</strong> — we&apos;ll send you a JSON dump on
            request.
          </li>
          <li>
            <strong>Opt out of marketing emails</strong> — there&apos;s a link in every email; we
            also send transactional emails (billing, password resets) that we have to send.
          </li>
        </ul>
        <p>
          If you&apos;re in the EU/UK, you also have the right to object, restrict processing, lodge
          a complaint with your data protection authority, and (in limited cases) request data
          portability. Email us and we&apos;ll handle it within 30 days.
        </p>
        <p>
          Australian users: you can complain to the Office of the Australian Information
          Commissioner (oaic.gov.au) if you think we&apos;ve handled your data badly.
        </p>
      </LegalSection>

      <LegalSection title="8. Children">
        <p>
          Axon is for university students. We don&apos;t knowingly accept users under 16. If you
          think a child has signed up, email us and we&apos;ll close the account.
        </p>
      </LegalSection>

      <LegalSection title="9. Security">
        <p>
          All traffic is over HTTPS. Passwords are hashed by Clerk. Database access is restricted to
          our backend, scoped per user. Stripe holds your card; we don&apos;t. We&apos;re a small
          operation — we follow the platform basics, but we can&apos;t promise unbreachable
          security. If we ever have a breach affecting you, we&apos;ll tell you within 72 hours.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes to this policy">
        <p>
          When we change anything material, we&apos;ll update the &ldquo;last updated&rdquo; date at
          the top and email Pro subscribers. Continuing to use Axon after a change means you accept
          it.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact">
        <p>
          Questions, requests, or complaints:{" "}
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
