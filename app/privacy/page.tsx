import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Privacy Policy · ShieldPay',
  description: 'How ShieldPay handles your data.',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="June 27, 2026">
      <p>
        ShieldPay is built around a simple idea: keep sensitive numbers private by default. This
        policy explains what we collect, what we deliberately do not collect, and who we share data
        with. It applies to the ShieldPay web application.
      </p>

      <LegalSection title="What we collect">
        <p>
          To run payroll we store account and workspace details (your name and role, the company
          name, and contributor records), each collaborator&apos;s Stellar address and identity
          anchor, and payment metadata: the reference, the agreed range, the on-chain transaction
          hashes, and the proof record. We also keep the operational logs needed to run the service.
        </p>
      </LegalSection>

      <LegalSection title="What we do not collect">
        <p>
          We do not store the exact amount of a payment in clear text. Each amount is kept only as a
          cryptographic commitment plus the agreed range, so there is no plaintext figure to leak,
          scrape, or subpoena. The exact amount is revealed only when you choose to disclose it to an
          auditor, under a viewing key you control. We do not hold your wallet&apos;s private key.
        </p>
      </LegalSection>

      <LegalSection title="How we use it">
        <p>
          We use this data to authenticate you, run confidential payroll, generate receipts, enforce
          the identity anchor, and let you grant scoped, time-boxed audit access. We do not sell your
          data or use it for advertising.
        </p>
      </LegalSection>

      <LegalSection title="On-chain data is public">
        <p>
          Settlement and proof records live on the Stellar network and are public and permanent by
          design. Anyone can see that a payment occurred between two addresses and that it was
          verified; the amount stays private. On-chain data cannot be deleted or altered by us.
        </p>
      </LegalSection>

      <LegalSection title="Service providers">
        <p>
          We rely on a small set of providers to operate: an authentication and wallet provider for
          passwordless sign-in, the Stellar network and its RPC infrastructure for settlement and
          verification, and a cloud host for the application and its database. Each processes only the
          data needed for its function.
        </p>
      </LegalSection>

      <LegalSection title="Retention and your choices">
        <p>
          We keep off-chain records for as long as your workspace is active and as needed to provide
          the service. You can request access to or deletion of your off-chain data through the team.
          On-chain records cannot be removed, as the network is immutable.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          ShieldPay is a hackathon-stage product. Questions about privacy can be sent to the team
          through the project repository, and this policy will be updated as the product matures.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
