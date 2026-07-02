# ShieldPay explainer video (Remotion)

Motion-graphics explainer for ShieldPay: confidential payroll on Stellar, private
by default, auditable on demand, verifiable by anyone. 1920x1080, 30fps, ~43s.

## Commands

Install (pnpm, node 22+):

```bash
pnpm install
```

Preview in the Remotion studio:

```bash
pnpm dev
# or: npx remotion studio
```

Render to MP4 (output: out/demo.mp4):

```bash
pnpm render
# or: npx remotion render ShieldPay out/demo.mp4
```

## Structure

- `src/Root.tsx`: registers the `ShieldPay` composition (1920x1080, 30fps).
- `src/ShieldPayVideo.tsx`: sequences the eight scenes with fade transitions.
- `src/theme.ts`: brand tokens (slate base, indigo->emerald accent gradient).
- `src/components/BrandMark.tsx`: shield-check mark with the gradient stroke.
- `src/components/primitives.tsx`: backdrop, entrance springs, cards, eyebrow.
- `src/scenes/`: one file per scene (see below).

## Scenes

1. `Scene1Hook` - public ledger row with a visible amount, then masked.
2. `Scene2Problem` - on a transparent chain, the payroll amount is public.
3. `Scene3Reveal` - ShieldPay: recipient visible, amount hidden, brand mark.
4. `Scene4ZK` - amount -> Poseidon commitment -> Groth16 proof -> Soroban (BN254).
5. `Scene5Real` - on-chain record: verified true, proof_id 0, testnet contract.
6. `Scene6Disclosure` - auditor viewing key resolves the amount, matches commitment.
7. `Scene7Portals` - Company, Worker, Auditor cards with one-line roles.
8. `Scene8Close` - brand mark, wordmark, tagline, Stellar + Zero-Knowledge.

## Note on the headless browser

Remotion renders frames with a Chrome headless shell it downloads on first run.
If the render reports "No browser found for rendering frames" after the download,
the extraction can be incomplete in this environment. The fix is to extract the
downloaded zip manually:

```bash
cd node_modules/.remotion/chrome-headless-shell
rm -rf /tmp/chs && unzip -q chrome-headless-shell-linux64.zip -d /tmp/chs
rm -rf linux64/chrome-headless-shell-linux64
cp -r /tmp/chs/chrome-headless-shell-linux64 linux64/
chmod +x linux64/chrome-headless-shell-linux64/chrome-headless-shell
```

Then re-run the render command.
