import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Terms of Service · ShieldPay',
  description: 'The terms that govern use of ShieldPay.',
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="June 27, 2026">
      <p>
        These terms govern your use of ShieldPay, a confidential payroll platform that settles
        stablecoin payments on the Stellar network and records a zero-knowledge proof of each
        payment. By creating an account or using the service, you agree to these terms.
      </p>

      <LegalSection title="1. The service">
        <p>
          ShieldPay lets a company pay contributors in stablecoins while keeping each amount private,
          proves on-chain that every payment falls within an agreed range, and lets the company
          disclose exact figures to an auditor it authorizes. ShieldPay currently operates on the
          Stellar test network as a hackathon-stage product. Features may change, and the service is
          provided on an as-is and as-available basis.
        </p>
      </LegalSection>

      <LegalSection title="2. Accounts and wallets">
        <p>
          You sign in through our authentication provider, which creates and secures a wallet on your
          behalf. You are responsible for keeping access to your account secure and for the activity
          that happens under it. You must provide accurate information and have the authority to act
          for any company you represent.
        </p>
      </LegalSection>

      <LegalSection title="3. Acceptable use">
        <p>
          You agree not to misuse the service: no unlawful payments, no attempts to break, probe, or
          overload the platform or the network, and no use that infringes the rights of others. You
          are responsible for complying with the tax, employment, and financial regulations that
          apply to you and to the people you pay.
        </p>
      </LegalSection>

      <LegalSection title="4. No financial or legal advice">
        <p>
          ShieldPay is software, not a bank, a payment institution, or a law or accounting firm.
          Nothing in the product is financial, tax, or legal advice. The on-chain proof and the
          generated receipts are records of a payment, not a substitute for the agreements and
          filings your jurisdiction requires.
        </p>
      </LegalSection>

      <LegalSection title="5. On-chain and confidentiality">
        <p>
          Settlement happens on a public blockchain. The fact that a payment occurred between two
          addresses is public; the exact amount is not. ShieldPay records only a commitment and the
          agreed range, never the plaintext amount. We do not control the Stellar network and cannot
          reverse, censor, or guarantee the timing of on-chain transactions.
        </p>
      </LegalSection>

      <LegalSection title="6. Limitation of liability">
        <p>
          To the maximum extent permitted by law, ShieldPay and its contributors are not liable for
          indirect, incidental, or consequential damages, or for loss of funds, data, or profits
          arising from your use of the service. The service is experimental and used at your own risk.
        </p>
      </LegalSection>

      <LegalSection title="7. Changes and contact">
        <p>
          We may update these terms as the product evolves; material changes will be reflected by the
          date above. Questions about these terms can be sent to the team through the project
          repository.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
