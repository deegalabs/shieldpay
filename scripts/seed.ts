/**
 * Seed demo data for development and the demo video.
 *
 * Generates a mock company and three workers with funded testnet keypairs and
 * contractual ranges, matching CLAUDE.md §11. Prints the data so it can be
 * copied into the demo or a CSV. (DB persistence is wired once DATABASE_URL is
 * set — this script focuses on producing usable testnet identities.)
 */
import { generateKeypair, fundTestnetAccount } from '../lib/stellar/client';
import { hashCpf } from '../lib/stellar/auth';

interface DemoWorker {
  name: string;
  cpf: string;
  contract: { min: number; max: number }; // USDC cents
}

const COMPANY = { name: 'Acme DAO', cnpj: '12.345.678/0001-90' };

const WORKERS: DemoWorker[] = [
  { name: 'Jane Doe', cpf: '123.456.789-00', contract: { min: 45000, max: 55000 } },
  { name: 'Alice Smith', cpf: '987.654.321-00', contract: { min: 70000, max: 80000 } },
  { name: 'Bob Johnson', cpf: '111.222.333-44', contract: { min: 30000, max: 40000 } },
];

async function main() {
  const fund = process.argv.includes('--fund');

  const company = generateKeypair();
  console.log('\n=== COMPANY ===');
  console.log(COMPANY.name, COMPANY.cnpj);
  console.log('address:', company.publicKey);
  if (fund) {
    await fundTestnetAccount(company.publicKey);
    console.log('funded via friendbot ✅');
  }

  console.log('\n=== WORKERS ===');
  for (const w of WORKERS) {
    const kp = generateKeypair();
    if (fund) await fundTestnetAccount(kp.publicKey);
    console.log(`\n${w.name}  CPF ${w.cpf}`);
    console.log('  address: ', kp.publicKey);
    console.log('  secret:  ', kp.secret);
    console.log('  cpf_hash:', hashCpf(w.cpf));
    console.log(`  range:   $${w.contract.min / 100} to $${w.contract.max / 100} USDC`);
  }

  console.log('\nTip: re-run with --fund to fund all accounts on testnet via friendbot.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
