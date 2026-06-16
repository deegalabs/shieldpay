# CLAUDE.md — ShieldPay: Payroll & Payment Proof on Stellar + ZK

> Documento de contexto completo para desenvolvimento com Claude Code / Cursor.
> Gerado em: 15 de junho de 2026.
> Hackathon: Stellar Hacks ZK — Deadline: 29 de junho de 2026, 12h (horário do Pacífico).

---

## 1. IDENTIDADE DO PROJETO

### Nome
**ShieldPay** — Payroll & Payment Proof on Stellar

### Tagline
> "Pague qualquer pessoa no mundo. Prove matematicamente que pagou. Proteja sua empresa para sempre."

### O que é
ShieldPay é uma plataforma web de pagamento e quitação verificável construída sobre Stellar + Soroban + ZK Proofs. Permite que empresas, DAOs e contratantes paguem prestadores de serviço e funcionários em USDC nativo da Stellar, gerando automaticamente uma prova matemática on-chain (ZK proof verificável no Soroban) que funciona como comprovante jurídico irrefutável de pagamento.

### O que NÃO é
- Não é um sistema de folha de pagamento CLT completo (a CLT exige pagamento em Real; isso está em processo de mudança via PL 2.324/2026, mas ainda não aprovado).
- Não é uma blockchain privada. Stellar é transparente por padrão — a privacidade aqui é seletiva, via ZK range proofs.
- Não é equivalente ao pool blindado da Zcash. Não prometemos invisibilidade total de transações.

### Casos de uso reais (onde funciona hoje, sem nova legislação)
1. **Prestadores de serviço / Freelancers / Contratos PJ** — sem CLT, pagamento em USDC é válido por acordo contratual.
2. **Empresas Web3 nativas** que já remuneram colaboradores em cripto por acordo mútuo documentado.
3. **Pagamentos internacionais** — empresa no exterior pagando pessoa no Brasil ou vice-versa, onde CLT não se aplica.
4. **DAOs pagando contribuidores** — sem vínculo CLT, com necessidade de prova de quitação.

---

## 2. CONTEXTO JURÍDICO (CRÍTICO — LER ANTES DE CODAR)

### Por que isso importa mais do que a tecnologia

O Gemini e o Gemini-documento original entenderam o problema de negócio, mas ignoraram a camada jurídica que torna o produto real. Esta seção é o resultado de pesquisa em jurisprudência do TST, CLT e doutrina trabalhista brasileira.

### O que a lei brasileira exige como prova de pagamento (Art. 464 da CLT)

O Tribunal Superior do Trabalho consolidou dois e apenas dois meios de prova válidos para quitação de salário:

**Caminho A:** Recibo (holerite) **assinado pelo empregado** — física ou digitalmente.

**Caminho B:** **Comprovante de depósito bancário** na conta cujo CPF seja o do trabalhador contratado — sem necessidade de assinatura adicional.

**Consequência direta:** Um recibo sem assinatura do empregado, desacompanhado de comprovante de depósito bancário identificado, tem **valor probatório zero** no TST. O ônus da prova é sempre do empregador.

### O problema da Web3 com o Caminho B

Blockchain não tem CPF. Um pagamento em USDC de `GABCDE...` para `GXYZ123...` não prova para nenhum juiz que o João da Silva recebeu R$ 5.000. Falta o vínculo entre identidade legal e endereço on-chain.

### Como o ShieldPay resolve isso (os 5 documentos da defesa jurídica)

Para que a empresa esteja blindada em qualquer processo, o sistema gera e armazena automaticamente:

**Documento 1 — Contrato de Prestação de Serviço (off-chain)**
- Assinado digitalmente (validade jurídica pelo Marco Civil Digital / ICP-Brasil ou DocuSign)
- Contém: nome completo, CPF, CNPJ da empresa, valor, periodicidade, objeto do serviço
- **Campo obrigatório:** "O prestador declara que o endereço Stellar `GABCDE...` é de sua exclusiva propriedade e autoriza recebimento de pagamentos neste endereço."
- Referência legal: Art. 104 do Código Civil (validade dos contratos digitais)

**Documento 2 — Transação de Ancoragem de Identidade (on-chain Stellar)**
- O próprio prestador assina uma transação de 0 XLM da sua carteira para si mesmo
- Memo obrigatório: `SHIELDPAY|ANCHOR|CPF:12345678900|CONTRACT:42|DATE:2026-06-01`
- **Efeito jurídico:** Prova criptográfica de que o dono daquele endereço Stellar declarou ser o portador daquele CPF. Imutável, com timestamp blockchain.
- Isso cria o vínculo endereço↔identidade que o juiz precisa.

**Documento 3 — Transação de Pagamento (on-chain Stellar)**
- USDC nativo enviado para o endereço do prestador
- Memo estruturado: `SHIELDPAY|PAY|CONTRACT:42|REF:MAI2026|USDC:500.00`
- **Efeito jurídico:** Equivalente ao comprovante de depósito bancário (Caminho B do Art. 464 CLT), desde que combinado com o Documento 2 que vincula o endereço ao CPF.

**Documento 4 — ZK Proof de Quitação (on-chain Soroban)**
- Prova matemática verificável que atesta: "O endereço X recebeu um valor dentro do range contratual no bloco Y"
- Não revela o valor exato — apenas que está dentro do acordado (ex: entre $400 e $600 USDC)
- Verificável por qualquer terceiro (juiz, auditor, contador) sem precisar confiar na empresa
- Registrada no contrato Soroban como `verified: true` com hash do pagamento

**Documento 5 — PDF de Comprovante Judicial (off-chain gerado pelo sistema)**
- Gerado automaticamente após cada pagamento
- Contém: dados do contrato, hash da ancoragem, hash do pagamento, resultado da ZK proof, QR code para verificação instantânea, link do explorador Stellar
- Linguagem acessível para juízes não-técnicos: "Este documento é uma prova matemática gerada pela rede blockchain Stellar de que o valor foi depositado no endereço do destinatário no bloco X. O código de verificação pode ser validado em [URL]."

### O que o holerite eletrônico moderno precisa ter (jurisprudência 2025-2026)

Pesquisa em decisões recentes do TST e doutrina de compliance RH confirmou que um holerite digital tem força probatória quando contém:
- Hash e carimbo de tempo (timestamp) do documento
- Trilha de auditoria: quem enviou, quando foi disponibilizado, quando foi acessado
- Prova de ciência: aceite rastreável ou confirmação de recebimento
- Comprovante de depósito ou transferência vinculado

O ShieldPay automatiza todos esses elementos via blockchain.

### Status legislativo do pagamento em cripto no Brasil

- **PL 957/2025:** Propõe permitir pagamento de até 50% do salário em criptomoedas, com acordo escrito entre as partes. Em tramitação na Câmara.
- **PL 2.324/2026 (Partido NOVO):** Propõe alterar CLT para permitir salários em cripto por acordo contratual. Apresentado em maio de 2026, em tramitação.
- **Marco Legal das Criptomoedas (Lei 14.478/2022):** Reconhece ativos virtuais como meio de pagamento. Em vigor desde 2023.
- **Situação atual:** Pagamento de salário CLT em cripto ainda tem risco jurídico. Para PJ/prestador de serviço, é válido hoje por acordo contratual.

---

## 3. CONTEXTO TÉCNICO STELLAR (ESTADO REAL EM JUNHO 2026)

### Protocolos relevantes

**Protocol 25 "X-Ray" (mainnet: 22 janeiro 2026)**
- Introduziu host functions nativas para BN254 (curva elíptica padrão de ZK apps) e Poseidon/Poseidon2 (hash otimizado para ZK circuits)
- Permite verificação eficiente de zk-SNARKs no Soroban
- Feature parity com Ethereum EIP-196 e EIP-197

**Protocol 26 "Yardstick" (mainnet: 6 maio 2026)**
- Adicionou 9 novas host functions: MSM BN254, aritmética de campo escalar (add, subtract, multiply, power, inverse), verificações de pertinência à curva para BLS12-381 e BN254
- Move aritmética ZK pesada para a camada host — verificação de provas Noir significativamente mais barata
- Permite que SAC (Stellar Asset Contract) crie trustlines ilimitadas para G-accounts

### ZK na Stellar: o que está disponível e funciona

**Noir + UltraHonk no Soroban:**
- Repositório: `indextree/ultrahonk_soroban_contract`
- Status: Funciona em localnet com `--limits unlimited`. Otimização para testnet/mainnet em andamento (integração com precompiles BN254 do Protocol 26 reduzirá custo significativamente).
- **Risco real:** O verifier UltraHonk ainda pode exceder budget em testnet sem as otimizações de precompile. Monitorar.

**Groth16 via Circom no Soroban (alternativa mais segura):**
- Repositório: `stellar/soroban-examples/groth16_verifier`
- Status: Funciona comprovadamente em testnet e mainnet
- Custo: Menor que UltraHonk (provas menores)
- Tutorial: `jamesbachini.com/circom-on-stellar/`
- **Recomendação:** Para o hackathon, Groth16 é o caminho mais seguro se UltraHonk apresentar problemas de budget

**Noir + Groth16 backend (melhor dos dois mundos):**
- Repositório: `jamesbachini.com/noir-groth16/`
- Escreve circuits em Noir (mais legível), gera artefatos Groth16, verifica no Soroban
- Tutorial E2E disponível

### Stablecoins disponíveis na Stellar (mainnet, junho 2026)
- **USDC** (Circle) — nativo desde 2021, maior volume
- **EURC** (Circle) — euro digital
- **YLDS** (Figure) — yield-bearing dollar
- **MGUSD** (Bridge/MoneyGram) — lançado 2 junho 2026

**Recomendação para o projeto:** USDC. Maior liquidez, maior reconhecimento, SAC-level support no Soroban.

### Recursos de desenvolvimento confirmados

```
Stellar SDK JS:     @stellar/stellar-sdk
Soroban Rust SDK:   soroban-sdk
Noir:               nargo (linguagem ZK)
Barretenberg:       bb (backend de provas Noir)
Verifier Soroban:   indextree/ultrahonk_soroban_contract
Groth16 Verifier:   stellar/soroban-examples/groth16_verifier
Explorer testnet:   stellar.expert/explorer/testnet
Friendbot:          friendbot.stellar.org (faucet testnet)
RPC testnet:        https://soroban-testnet.stellar.org
```

---

## 4. ARQUITETURA DO SISTEMA

### Visão geral das camadas

```
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 5 — DOCUMENTO JURÍDICO                              │
│  PDF gerado off-chain com trilha completa de prova          │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  CAMADA 4 — ZK PROOF (Soroban)                             │
│  Contrato verifier registra: "pagamento válido ✅"          │
│  Não revela valor exato — range proof apenas               │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  CAMADA 3 — PAGAMENTO (Stellar on-chain)                   │
│  USDC → endereço do prestador                              │
│  Memo: SHIELDPAY|PAY|CONTRACT:X|REF:Y|USDC:Z              │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  CAMADA 2 — ANCORAGEM DE IDENTIDADE (Stellar on-chain)     │
│  Prestador assina tx 0 XLM com memo CPF + contrato         │
│  Vincula endereço ↔ identidade legal                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  CAMADA 1 — CONTRATO (off-chain)                           │
│  Assinatura digital do contrato de prestação               │
│  Endereço Stellar declarado pelo prestador                 │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo completo de um pagamento

```
1. ONBOARDING DO PRESTADOR
   Empresa convida prestador → prestador preenche dados (nome, CPF, endereço Stellar)
   → Sistema gera contrato PDF → ambos assinam digitalmente
   → Prestador executa "transação de ancoragem" da própria carteira (auto-assinada)
   → Sistema confirma ancoragem on-chain

2. DISPARO DE PAGAMENTO
   CFO faz upload de CSV [nome, endereço, valor, referência]
   → Sistema valida endereços ancorados
   → Sistema gera ZK proof off-chain para cada pagamento
   → Sistema envia USDC + memo para cada endereço
   → Sistema submete ZK proof ao Soroban para verificação on-chain
   → Soroban registra: verified=true, payment_hash, block_number

3. GERAÇÃO DE COMPROVANTE
   Após confirmação on-chain (3-5 segundos na Stellar):
   → Sistema gera PDF automaticamente por pagamento
   → PDF inclui: dados do contrato, tx hash ancoragem, tx hash pagamento,
     resultado ZK proof, QR code verificador, URL explorador
   → PDF fica disponível no painel da empresa e no portal do prestador

4. PORTAL DO PRESTADOR
   Prestador acessa via Stellar Wallet Auth (assina mensagem com carteira)
   → Vê histórico de recebimentos
   → Acessa PDF de cada pagamento
   → Pode baixar todos os comprovantes para declaração de IR

5. PORTAL DO AUDITOR
   Empresa gera link temporário (expira em 30 dias) para auditor/contador
   → Auditor vê tabela de pagamentos do período selecionado
   → Vê hashes e resultados ZK verificados
   → Exporta relatório fiscal em PDF/CSV
   → NÃO vê saldo atual da empresa, NÃO tem acesso para movimentar fundos
```

### ZK Circuit: o que precisa provar

**Inputs públicos (visíveis on-chain):**
- Hash do endereço do destinatário (não o endereço em si)
- Hash do memo de referência do pagamento
- Número do bloco Stellar
- Commitment do valor (não o valor)

**Inputs privados (witness, nunca on-chain):**
- Valor real do pagamento em USDC
- Endereço completo do destinatário
- Chave do range contratual [valor_min, valor_max]

**O que o circuit prova:**
1. `valor_pago >= valor_minimo_contratual` (range proof lower bound)
2. `valor_pago <= valor_maximo_contratual` (range proof upper bound)
3. `hash(endereco_destinatario) == endereco_hash_publico` (binding)
4. `hash(valor_pago) == commitment_valor` (commitment opening)

**Output:** `proof_valid: bool` registrado no Soroban

**Nota técnica:** Para o hackathon, o circuit pode ser simplificado para apenas o range proof básico. A binding do endereço pode ser feita off-chain no MVP e evoluir para on-chain em produção.

---

## 5. STACK TECNOLÓGICA

### Frontend (Portais Web)
```
Framework:     Next.js 14+ (App Router)
Linguagem:     TypeScript
Styling:       Tailwind CSS
Componentes:   shadcn/ui
Stellar SDK:   @stellar/stellar-sdk (para transações e wallet auth)
PDF geração:   jsPDF ou react-pdf
Estado:        Zustand
Formulários:   react-hook-form + zod
```

### ZK Layer
```
Linguagem circuit:   Noir (preferencial) ou Circom (fallback mais seguro)
Backend provas:      Barretenberg (bb) para Noir
Verifier on-chain:   Contrato Soroban (Rust)
Referência:          indextree/ultrahonk_soroban_contract (Noir/UltraHonk)
                     stellar/soroban-examples/groth16_verifier (Circom/Groth16)
Geração de provas:   Off-chain (Node.js script ou WASM no browser)
```

### Contratos Soroban (Rust)
```
SDK:           soroban-sdk
Contratos:
  - PaymentVerifier: registra e armazena ZK proofs verificadas
  - AnchorRegistry: registra ancoragens de identidade (endereço ↔ contrato)
Target:        wasm32v1-none
Deploy:        stellar contract deploy --network testnet
```

### Backend / Scripts
```
Runtime:       Node.js (TypeScript) ou scripts Rust
Database:      PostgreSQL (metadados off-chain) ou Supabase para MVP rápido
Autenticação:  Stellar Wallet Auth (sign message com chave privada da carteira)
CSV parsing:   papaparse
```

### Infraestrutura
```
Deploy frontend:  Vercel
RPC Stellar:      Soroban RPC testnet → mainnet
Storage PDFs:     IPFS (hash no contrato) ou S3 para MVP
```

---

## 6. ESTRUTURA DE PASTAS DO PROJETO

```
shieldpay/
├── CLAUDE.md                    ← este arquivo
├── README.md                    ← documentação pública do hackathon
│
├── circuits/                    ← ZK circuits
│   ├── payment_proof/
│   │   ├── src/
│   │   │   └── main.nr          ← circuit Noir principal
│   │   ├── Nargo.toml
│   │   └── target/              ← artefatos compilados (gitignore)
│   └── scripts/
│       ├── build_circuits.sh    ← compila e gera VK
│       └── generate_proof.ts    ← gera proof para um pagamento
│
├── contracts/                   ← Contratos Soroban (Rust)
│   ├── payment_verifier/
│   │   ├── src/
│   │   │   └── lib.rs           ← contrato verificador de ZK proofs
│   │   └── Cargo.toml
│   ├── anchor_registry/
│   │   ├── src/
│   │   │   └── lib.rs           ← contrato de ancoragem identidade
│   │   └── Cargo.toml
│   └── deploy/
│       ├── deploy.sh            ← script de deploy testnet
│       └── addresses.json       ← endereços dos contratos deployados
│
├── app/                         ← Next.js frontend
│   ├── (company)/               ← Portal da Empresa (CFO/RH)
│   │   ├── dashboard/
│   │   ├── employees/           ← gestão de prestadores
│   │   ├── payroll/             ← disparo de pagamentos
│   │   └── receipts/            ← histórico e comprovantes
│   ├── (worker)/                ← Portal do Prestador
│   │   ├── login/
│   │   ├── payments/
│   │   └── documents/
│   ├── (auditor)/               ← Portal do Auditor
│   │   ├── [token]/             ← acesso via link temporário
│   │   └── export/
│   └── api/
│       ├── anchor/              ← endpoint de ancoragem
│       ├── pay/                 ← endpoint de pagamento
│       ├── proof/               ← endpoint de geração de proof
│       └── verify/              ← endpoint de verificação
│
├── lib/
│   ├── stellar/
│   │   ├── client.ts            ← cliente Stellar SDK
│   │   ├── transactions.ts      ← builders de transações
│   │   ├── auth.ts              ← wallet authentication
│   │   └── usdc.ts              ← helpers USDC
│   ├── zk/
│   │   ├── prover.ts            ← geração de provas off-chain
│   │   └── types.ts             ← tipos TypeScript para provas
│   ├── pdf/
│   │   └── receipt.ts           ← gerador de PDF de comprovante
│   └── db/
│       └── schema.ts            ← schema do banco de dados
│
├── scripts/
│   ├── setup.sh                 ← setup completo do ambiente
│   ├── test_flow.ts             ← teste do fluxo completo E2E
│   └── seed.ts                  ← dados de teste
│
└── docs/
    ├── ARCHITECTURE.md          ← diagrama de arquitetura detalhado
    ├── LEGAL.md                 ← contexto jurídico completo
    └── DEMO_SCRIPT.md           ← roteiro do vídeo de demonstração
```

---

## 7. OS TRÊS PORTAIS: ESPECIFICAÇÃO DE UX

### Princípio de design geral
**Regra de ouro:** A criptografia deve ser invisível. Nenhum termo técnico (ZK proof, Soroban, BN254) aparece na interface do usuário final. Esses termos existem apenas nos documentos de comprovante jurídico onde são necessários.

**Estilo visual:** Fintech Premium Tradicional — referências: Stripe Dashboard, Deel, QuickBooks.

**Paleta:**
- Fundo / painéis: `#0F172A` (slate-900) e `#1E293B` (slate-800)
- Texto principal: `#F8FAFC` (slate-50)
- Ação primária / sucesso: `#10B981` (emerald-500)
- Aviso: `#F59E0B` (amber-500)
- Erro: `#EF4444` (red-500)
- Accent: `#6366F1` (indigo-500)

**NÃO usar:** Neon verde, estética hacker/cyberpunk, fundos pretos com texto verde. Isso afasta CFOs.

---

### Portal 1 — Empresa (CFO / RH)

**Autenticação:** Stellar Wallet Auth — empresa conecta carteira corporativa (Freighter, xBull) e assina mensagem de login. Sem email/senha.

**Tela: Dashboard**
```
┌─────────────────────────────────────────────────┐
│ ShieldPay              [Empresa XPTO] [Carteira] │
├─────────────────────────────────────────────────┤
│                                                  │
│  Balanço Operacional          Pago este mês     │
│  ┌──────────────────┐         ┌───────────────┐ │
│  │  $ 12,450 USDC   │         │  $ 8,200 USDC │ │
│  └──────────────────┘         └───────────────┘ │
│                                                  │
│  Prestadores ativos: 12    Pagamentos pendentes: 0 │
│                                                  │
│  [▶ Pagar Folha]  [+ Novo Prestador]            │
│                                                  │
│  Últimos pagamentos                              │
│  ┌──────────────────────────────────────────┐   │
│  │ João Silva    Mai/2026   $ 500 USDC  ✅  │   │
│  │ Maria Souza   Mai/2026   $ 750 USDC  ✅  │   │
│  │ ...                                       │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Tela: Pagar Folha**
```
1. Upload CSV ou preenchimento manual
   Formato CSV: nome, endereço_stellar, valor_usdc, referência
   
2. Validação automática:
   ✅ Endereço ancorado (identidade vinculada)
   ✅ USDC suficiente na carteira
   ✅ Valor dentro do range contratual

3. Preview da folha com total
   "12 pagamentos — Total: $ 8,200 USDC"
   
4. Botão [Confirmar e Pagar]
   → Abre carteira para assinatura
   → Barra de progresso: "Enviando... Verificando... Registrando prova..."
   → Tela de sucesso: "12 pagamentos confirmados ✅"
   → "Comprovantes gerados e disponíveis"
```

**Tela: Prestador individual**
```
João Silva — CPF: 123.456.789-00
Endereço Stellar: GABCDE... [verificado ✅]
Valor contratual: $450 – $550 USDC/mês

Histórico:
┌────────────────────────────────────────────────┐
│ Maio/2026    $ 500 USDC    ✅ Verificado       │
│              [📄 Ver Comprovante] [⚖️ Defesa Jurídica] │
│ Abril/2026   $ 500 USDC    ✅ Verificado       │
│              [📄 Ver Comprovante] [⚖️ Defesa Jurídica] │
└────────────────────────────────────────────────┘
```

**Botão "⚖️ Defesa Jurídica"** — gera em 1 clique o PDF completo de comprovante judicial com linguagem acessível para tribunal, contendo todos os 5 documentos de prova encadeados.

---

### Portal 2 — Prestador / Trabalhador

**Autenticação:** Stellar Wallet Auth — prestador conecta a mesma carteira cujo endereço foi ancorado. Sistema verifica automaticamente que é o dono do endereço.

**Tela: Meus Recebimentos**
```
Olá, João Silva

Último recebimento: $ 500 USDC — Maio/2026 ✅

Seus pagamentos:
┌─────────────────────────────────────────┐
│ Mai/2026   $ 500 USDC   ✅ Recebido    │
│            [📄 Comprovante] [📥 Baixar] │
│ Abr/2026   $ 500 USDC   ✅ Recebido    │
│            [📄 Comprovante] [📥 Baixar] │
└─────────────────────────────────────────┘

[📦 Baixar todos para IR]
```

**Tela: Comprovante individual**

Exibe o "holerite digital" formatado com:
- Empresa pagadora + CNPJ
- Prestador + CPF
- Referência do pagamento (mês/ano, objeto do contrato)
- Status: "Pagamento verificado matematicamente ✅"
- QR code para validação pública
- [Baixar PDF]

---

### Portal 3 — Auditor / Contador

**Acesso:** Link temporário gerado pela empresa com expiração configurável (30/60/90 dias). Sem necessidade de carteira cripto.

**Tela: Visão do Auditor**
```
Auditoria — Empresa XPTO Ltda
Período: Janeiro/2026 – Março/2026
Gerado em: 15/06/2026 | Expira em: 15/07/2026

Resumo do período:
Total pago: $ 24,600 USDC
Prestadores: 12
Pagamentos: 36

Tabela de transações:
┌──────────────────────────────────────────────────────────┐
│ Data       Prestador    Referência   Hash TX    Status   │
│ 31/01      João S.      Jan/2026     abc123...  ✅ Verif │
│ 28/02      João S.      Fev/2026     def456...  ✅ Verif │
│ ...                                                       │
└──────────────────────────────────────────────────────────┘

[📊 Exportar Relatório Fiscal CSV] [📄 Exportar PDF Completo]

⚠️ Este acesso é somente leitura. Nenhuma operação financeira
pode ser realizada por este portal.
```

**O auditor NÃO vê:** saldo atual da empresa, pagamentos fora do período, informações de outras empresas.

---

## 8. CONTRATOS SOROBAN: ESPECIFICAÇÃO

### Contrato 1: `AnchorRegistry`

```rust
// Registra o vínculo entre endereço Stellar e metadados de contrato
// O prestador chama este contrato ao aceitar o onboarding

pub struct AnchorRegistry;

#[contractimpl]
impl AnchorRegistry {
    // Prestador registra seu próprio endereço + hash dos metadados do contrato
    // Só pode ser chamado pela própria conta (self-anchor)
    pub fn anchor(
        env: Env,
        worker_address: Address,    // endereço do prestador
        contract_hash: BytesN<32>,  // hash SHA256 do contrato PDF
        company_address: Address,   // endereço da empresa contratante
        metadata: String,           // "CPF:123|CONTRACT:42|DATE:2026-06-01"
    ) -> Result<(), Error>

    // Verifica se endereço está ancorado para uma empresa específica
    pub fn is_anchored(
        env: Env,
        worker_address: Address,
        company_address: Address,
    ) -> bool

    // Retorna metadados da ancoragem
    pub fn get_anchor(
        env: Env,
        worker_address: Address,
        company_address: Address,
    ) -> Option<AnchorData>
}

pub struct AnchorData {
    contract_hash: BytesN<32>,
    metadata: String,
    anchored_at_ledger: u32,  // ledger Stellar da ancoragem
    anchored_at_timestamp: u64,
}
```

### Contrato 2: `PaymentVerifier`

```rust
// Registra ZK proofs verificadas de pagamentos
// A empresa chama este contrato após cada pagamento

pub struct PaymentVerifier;

#[contractimpl]
impl PaymentVerifier {
    // Inicializa contrato com a verification key do circuit ZK
    pub fn initialize(env: Env, vk_bytes: Bytes) -> Result<(), Error>

    // Verifica e registra uma ZK proof de pagamento
    // Retorna: ID único do registro de prova
    pub fn verify_and_record(
        env: Env,
        company_address: Address,        // empresa pagadora (deve ser caller)
        worker_address_hash: BytesN<32>, // hash do endereço do prestador
        payment_tx_hash: BytesN<32>,     // hash da transação Stellar de pagamento
        value_commitment: BytesN<32>,    // Pedersen commitment do valor
        proof: Bytes,                    // ZK proof serializada
        public_inputs: Vec<Val>,         // inputs públicos do circuit
    ) -> Result<u64, Error>             // retorna proof_id

    // Verifica se um pagamento específico tem proof registrada
    pub fn is_verified(
        env: Env,
        payment_tx_hash: BytesN<32>,
    ) -> bool

    // Retorna dados completos de uma proof
    pub fn get_proof_record(
        env: Env,
        proof_id: u64,
    ) -> Option<ProofRecord>

    // Lista proofs de uma empresa em um período
    pub fn list_by_company(
        env: Env,
        company_address: Address,
        from_ledger: u32,
        to_ledger: u32,
    ) -> Vec<ProofRecord>
}

pub struct ProofRecord {
    proof_id: u64,
    company_address: Address,
    worker_address_hash: BytesN<32>,
    payment_tx_hash: BytesN<32>,
    value_commitment: BytesN<32>,
    verified: bool,               // sempre true se está gravado
    verified_at_ledger: u32,
    verified_at_timestamp: u64,
}
```

---

## 9. ZK CIRCUIT: ESPECIFICAÇÃO (NOIR)

```noir
// circuits/payment_proof/src/main.nr
// Circuit: prova que um pagamento está dentro do range contratual

// Inputs privados (witness — nunca revelados on-chain)
fn main(
    value: u64,                    // valor real do pagamento em USDC centavos
    value_randomness: Field,       // randomness para o Pedersen commitment
    worker_address_bytes: [u8; 32], // endereço Stellar do prestador
    address_randomness: Field,     // randomness para hash do endereço
    
    // Inputs públicos (visíveis on-chain)
    value_commitment: pub Field,   // Pedersen commitment do valor
    worker_address_hash: pub Field, // hash do endereço do prestador  
    min_value: pub u64,            // valor mínimo contratual
    max_value: pub u64,            // valor máximo contratual
    payment_tx_hash: pub Field,    // hash da tx Stellar (binding)
) {
    // Constraint 1: range proof — valor dentro do range contratual
    assert(value >= min_value);
    assert(value <= max_value);
    
    // Constraint 2: commitment binding — valor corresponde ao commitment
    let computed_commitment = pedersen_commitment(value as Field, value_randomness);
    assert(computed_commitment == value_commitment);
    
    // Constraint 3: address binding — endereço corresponde ao hash público
    let computed_address_hash = poseidon2_hash(
        worker_address_bytes.map(|b| b as Field)
    );
    assert(computed_address_hash == worker_address_hash);
}
```

**Nota de implementação:** Para MVP do hackathon, simplificar para apenas range proof (Constraints 1) e verificar address binding off-chain no backend. Isso reduz complexidade do circuit e risco de problemas com budget Soroban.

---

## 10. MEMO PROTOCOL: FORMATO PADRONIZADO

### Transação de Ancoragem (assinada pelo prestador)
```
SHIELDPAY|ANCHOR|v1|{company_stellar_address}|{contract_id}|{cpf_hash}
```
Exemplo:
```
SHIELDPAY|ANCHOR|v1|GCOMPANY...|42|a3f2b1...
```
- `cpf_hash`: SHA256 do CPF sem pontuação (privacidade parcial — não expõe CPF mas permite verificação)
- Máximo 28 bytes no campo memo Stellar — usar memo_hash para strings longas

### Transação de Pagamento (enviada pela empresa)
```
SHIELDPAY|PAY|v1|{contract_id}|{reference}|{proof_id}
```
Exemplo:
```
SHIELDPAY|PAY|v1|42|MAI2026|789
```
- `proof_id`: ID retornado pelo contrato PaymentVerifier após verificação da ZK proof

---

## 11. DADOS MOCK PARA DESENVOLVIMENTO E DEMO

### Empresa de exemplo
```
Nome:           TechStartup Ltda
CNPJ:           12.345.678/0001-90
Endereço Stellar: GCOMPANY... (gerar no setup)
Saldo mock:     15,000 USDC
```

### Prestadores de exemplo
```
Prestador 1:
  Nome:      João Silva
  CPF:       123.456.789-00
  Endereço:  GWORKER1... 
  Contrato:  $450–$550 USDC/mês
  Status:    Ancorado ✅

Prestador 2:
  Nome:      Maria Souza
  CPF:       987.654.321-00
  Endereço:  GWORKER2...
  Contrato:  $700–$800 USDC/mês
  Status:    Ancorado ✅

Prestador 3:
  Nome:      Pedro Santos
  CPF:       111.222.333-44
  Endereço:  GWORKER3...
  Contrato:  $300–$400 USDC/mês
  Status:    Ancorado ✅
```

### CSV de exemplo para demo
```csv
nome,endereco_stellar,valor_usdc,referencia
João Silva,GWORKER1...,500.00,MAI2026
Maria Souza,GWORKER2...,750.00,MAI2026
Pedro Santos,GWORKER3...,350.00,MAI2026
```

---

## 12. ROTEIRO DE DESENVOLVIMENTO (13 DIAS)

### Fase 1 — Fundação ZK (Dias 1–3)
**Objetivo:** Circuit funcionando e verificador deployado na testnet

- [ ] Setup ambiente: Nargo, bb, Rust, stellar-cli, Node.js
- [ ] Escrever circuit Noir de range proof (versão simplificada para MVP)
- [ ] Compilar circuit e gerar verification key (VK)
- [ ] Adaptar `indextree/ultrahonk_soroban_contract` para o VK do projeto
- [ ] Deploy do verifier na testnet Stellar
- [ ] Teste E2E: gerar proof off-chain → submeter → verificar on-chain ✅
- [ ] **Fallback:** Se UltraHonk exceder budget, migrar para Groth16 via Circom

### Fase 2 — Contratos de Negócio (Dias 4–5)
**Objetivo:** AnchorRegistry e PaymentVerifier deployados e testados

- [ ] Implementar `AnchorRegistry` em Rust/Soroban
- [ ] Implementar `PaymentVerifier` em Rust/Soroban (wrapper do verifier ZK)
- [ ] Testes unitários dos contratos
- [ ] Deploy testnet dos dois contratos
- [ ] Script de teste: ancoragem → pagamento USDC → proof → registro

### Fase 3 — Backend e Integrações (Dias 6–7)
**Objetivo:** API funcional conectando frontend aos contratos

- [ ] Endpoint `/api/anchor` — processa ancoragem de prestador
- [ ] Endpoint `/api/pay` — orquestra pagamento + proof + registro
- [ ] Endpoint `/api/verify` — consulta status de pagamento
- [ ] Gerador de proof off-chain (Node.js chamando bb)
- [ ] Integração Stellar SDK: construção de transações USDC com memo
- [ ] Database schema + migrations (PostgreSQL ou Supabase)

### Fase 4 — Frontend Portal Empresa (Dias 8–9)
**Objetivo:** Portal CFO funcional para demo

- [ ] Layout base + sistema de design (Tailwind + shadcn)
- [ ] Stellar Wallet Auth (Freighter)
- [ ] Dashboard com saldo e histórico
- [ ] Upload CSV + validação + preview
- [ ] Fluxo de pagamento com feedback de progresso
- [ ] Histórico de pagamentos com status

### Fase 5 — Portais Prestador e Auditor + PDF (Dias 10–11)
**Objetivo:** Portais secundários + comprovante jurídico

- [ ] Portal do prestador: login, histórico, download
- [ ] Portal do auditor: acesso por link, tabela, exportação
- [ ] Gerador de PDF: comprovante judicial completo
- [ ] PDF inclui: todos os hashes, resultado ZK, QR code, linguagem para juízes

### Fase 6 — Demo e Entrega (Dias 12–13)
**Objetivo:** Projeto pronto para submissão

- [ ] Teste E2E completo do fluxo: onboarding → pagamento → comprovante → auditoria
- [ ] README.md completo com setup instructions
- [ ] Gravação do vídeo de demonstração (2–3 minutos)
- [ ] Deploy frontend (Vercel)
- [ ] Submissão no DoraHacks

---

## 13. ROTEIRO DO VÍDEO DE DEMONSTRAÇÃO (2–3 MIN)

### Estrutura narrativa

**[0:00–0:20] O problema (gancho emocional)**
"Sua empresa pagou o prestador. Ele diz que não recebeu. Como você prova em tribunal?"

**[0:20–0:45] O contexto (por que blockchain)**
Mostrar brevemente: blockchain é imutável, timestamps são irrefutáveis, ZK proofs são verificáveis por qualquer pessoa.

**[0:45–1:30] Demo do fluxo (hero feature)**
1. CFO faz upload do CSV com 3 prestadores
2. Sistema mostra preview com validações
3. CFO clica "Confirmar e Pagar"
4. Barra de progresso: enviando → provando → verificando
5. Tela de sucesso: "3 pagamentos verificados ✅"

**[1:30–2:00] A prova jurídica**
1. Clicar em "⚖️ Defesa Jurídica" para João Silva
2. PDF abre com trilha completa
3. Mostrar QR code → link do explorador Stellar → "Verificado on-chain"
4. "Isso é o que você mostra para o juiz."

**[2:00–2:20] Portal do prestador**
1. João Silva acessa seu portal
2. Vê recebimento de Mai/2026 ✅
3. Baixa comprovante para declaração de IR

**[2:20–2:40] Portal do auditor**
1. Empresa gera link temporário para contador
2. Contador vê tabela do trimestre
3. Exporta CSV/PDF para Receita Federal

**[2:40–3:00] Fechamento**
"ShieldPay: pagamento em cripto com proteção jurídica real. Construído na Stellar + ZK Proofs."

---

## 14. DECISÕES TÉCNICAS E TRADE-OFFS DOCUMENTADOS

### Decisão 1: Noir vs Circom para os circuits

**Escolha: Noir (primária) com Circom como fallback**

Prós Noir:
- Sintaxe próxima a Rust — Daniel já tem experiência
- Circuit mais legível e maintainable
- Backend UltraHonk disponível para Soroban (indextree)

Contras Noir:
- Provas UltraHonk maiores e potencialmente mais caras
- Verifier Soroban ainda em estágio de otimização (pode exceder budget)

Fallback Circom:
- Groth16 é comprovadamente funcional na Stellar mainnet
- Provas menores e mais baratas
- Curva de aprendizado maior para escrever o circuit

**Decisão:** Começar com Noir. No Dia 2, fazer teste de budget no testnet. Se `ExceededLimit`, migrar para Circom + Groth16 imediatamente.

### Decisão 2: Privacidade — range proof vs valor exato

**Escolha: Range proof (valor dentro do range contratual)**

Justificativa: O valor exato de cada contrato fica visível na blockchain mesmo com Stellar. A ZK proof não oculta o valor exato da transação — ela prova que o valor está dentro do range acordado sem revelar exatamente quanto.

**Limitação honesta:** Qualquer pessoa que observe a blockchain vê que `GCOMPANY...` enviou USDC para `GWORKER...`. Não vemos o valor exato via ZK, mas a transação em si é pública.

**O que isso significa para o produto:** A privacidade aqui é de range, não absoluta. O valor comercialmente sensível (ex: "João ganha exatamente $500/mês") fica protegido. O fato de que a empresa pagou o João não.

### Decisão 3: Ancoragem de identidade — on-chain vs off-chain

**Escolha: On-chain via `AnchorRegistry`**

Justificativa: A ancoragem precisa ser imutável e verificável independentemente do sistema ShieldPay. Se o sistema sair do ar, a prova na blockchain continua válida.

**Trade-off:** O CPF não deve ir em texto puro na blockchain. Usar `cpf_hash = SHA256(cpf_sem_pontuacao)`. Isso permite verificação (empresa pode provar que o hash corresponde ao CPF via apresentação em tribunal) sem expor o CPF publicamente.

### Decisão 4: Database off-chain vs tudo on-chain

**Escolha: Híbrido — dados críticos on-chain, metadados off-chain**

On-chain (Soroban): proofs ZK verificadas, registros de ancoragem
Off-chain (PostgreSQL): dados de prestadores, histórico de pagamentos, PDFs gerados, links de auditores

Justificativa: Custo de storage on-chain na Stellar é real. Metadados que não precisam de imutabilidade ficam off-chain. O que precisa ser verificável e irrefutável fica on-chain.

### Decisão 5: Autenticação sem senha

**Escolha: Stellar Wallet Auth (sign message)**

Fluxo:
1. Backend gera challenge: `shieldpay_auth_{timestamp}_{nonce}`
2. Usuário assina com carteira (Freighter para browser)
3. Backend verifica assinatura com `stellar-sdk.Keypair.verify()`
4. JWT emitido com 24h de validade

Vantagem: Zero armazenamento de senha. A prova de identidade é a mesma chave que controla os fundos.

---

## 15. ERROS COMUNS E COMO EVITAR

### Stellar-específicos

**Memo field limit:** Campo memo Stellar tem limite de 28 bytes (memo_text) ou 32 bytes (memo_hash). O protocolo de memo definido usa hash quando exceder.

**Trustlines USDC:** Contas Stellar precisam estabelecer trustline para USDC antes de receber. O onboarding do prestador deve verificar e instruir sobre isso.

**Budget Soroban:** `--limits unlimited` só funciona em localnet. Testar SEMPRE no testnet antes de assumir que funciona.

**Sequence numbers:** Transações Stellar têm sequence number. Em pagamentos batch, construir e assinar todas as transações antes de submeter, ou usar fee bump transactions.

### ZK-específicos

**Proof format mismatch:** Versões diferentes do Nargo/bb geram proofs em formatos incompatíveis. Fixar versões no início: `nargo v1.0.0-beta.9` e `bb v0.87.0`.

**Witness vs public inputs:** Confundir o que é privado e o que é público invalida o modelo de privacidade. Revisar sempre o circuit antes de deploy.

**VK size:** Verification keys podem ser grandes. Armazenar no contrato no `initialize()` e não passá-la em cada `verify_proof()`.

### Jurídico-específicos

**Não confundir prestador PJ com CLT:** O produto funciona hoje para PJ. Para CLT, precisa do PL 2.324/2026 ou similar ser aprovado. O README deve deixar isso claro.

**PDF não substitui o contrato:** O PDF de comprovante prova o pagamento, mas o contrato de prestação de serviços assinado é que estabelece o acordo. Os dois são necessários para blindagem completa.

---

## 16. CONTEXTO ADICIONAL: POR QUE A STELLAR É A BLOCKCHAIN CERTA AQUI

### Vantagens reais da Stellar para este caso de uso

**USDC nativo:** Não é USDC bridgeado de outra chain. É USDC emitido diretamente pela Circle na Stellar. Sem risco de bridge. Aceito globalmente.

**Finalidade em 3–5 segundos:** Pagamentos trabalhistas têm caráter urgente. Stellar confirma em segundos, não em minutos ou horas.

**Custo por transação:** Frações de centavo por operação. Pagamentos batch de 100 prestadores custam menos de $0.01 total em fees.

**Infraestrutura de pagamento real:** Stellar tem MoneyGram (170+ países, 470k locais), Bitso (América Latina), Airtm — o USDC pode ser sacado em BRL via rede de anchors existente.

**ZK ready:** Protocol 25 e 26 entregaram as primitivas criptográficas necessárias na camada host. Não estamos workaroundando limitações — estamos usando features desenhadas para isso.

### Fit com o hackathon

O briefing do hackathon diz explicitamente: "projetos que aplicam ZK a casos de uso práticos são uma combinação perfeita e especialmente bem-vindos."

ShieldPay usa ZK para resolver um problema que afeta qualquer empresa que pague alguém — não é um experimento acadêmico. É um produto com mercado real, em produção potencial no dia seguinte ao hackathon.

---

## 17. REFERÊNCIAS E LINKS ÚTEIS

### Stellar
- Docs ZK: https://developers.stellar.org/docs/build/apps/zk
- Protocol 25: https://stellar.org/blog/developers/announcing-stellar-x-ray-protocol-25
- Protocol 26: https://stellar.org/blog/foundation-news/stellar-yardstick-protocol-26-upgrade-guide
- Soroban docs: https://developers.stellar.org/docs/build/smart-contracts/overview
- Stellar SDK JS: https://stellar.github.io/js-stellar-sdk/

### ZK na Stellar
- UltraHonk Soroban: https://github.com/indextree/ultrahonk_soroban_contract
- Groth16 Verifier: https://github.com/stellar/soroban-examples/tree/main/groth16_verifier
- Tutorial Noir+Stellar: https://jamesbachini.com/noir-on-stellar/
- Tutorial Circom+Stellar: https://jamesbachini.com/circom-on-stellar/
- Tutorial Noir+Groth16: https://jamesbachini.com/noir-groth16/
- RISC Zero Stellar: https://github.com/NethermindEth/stellar-risc0-verifier/

### Noir
- Docs: https://noir-lang.org/docs/
- Nargo install: `curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash`

### Barretenberg
- Install: `curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/master/barretenberg/bbup/install | bash`

### Hackathon
- DoraHacks: https://dorahacks.io/hackathon/stellar-hacks-zk/detail
- Discord Stellar Dev: https://discord.gg/stellardev (canal #zk-chat)
- Telegram: https://t.me/+e898qibDUVExODkx

### Jurídico (referências)
- Art. 464 CLT (prova de pagamento): guiatrabalhista.com.br
- Holerite eletrônico validade: factorialhr.com.br/blog/recibo-de-pagamento-de-salario/
- PL 2.324/2026 (cripto em salários): livecoins.com.br

---

## 18. GLOSSÁRIO PARA O CLAUDE CODE

Quando eu pedir para implementar algo, use estas definições:

| Termo | Significado no projeto |
|---|---|
| Anchor / Ancoragem | Transação on-chain que vincula endereço Stellar a dados de contrato |
| Company | Empresa contratante (paga os prestadores) |
| Worker / Prestador | Pessoa física ou PJ que recebe pelo serviço |
| Auditor | Contador ou fiscal com acesso somente-leitura temporário |
| PaymentRecord | Registro de um pagamento: tx hash + proof id + metadata |
| ZK Proof | Prova matemática de que o pagamento está dentro do range contratual |
| ProofRecord | Registro on-chain no PaymentVerifier de uma ZK proof verificada |
| Comprovante Judicial | PDF gerado com trilha completa de prova para uso em tribunal |
| Range Contratual | [min_value, max_value] definido no contrato de prestação |
| Memo Protocol | Formato padronizado de memo Stellar para transações ShieldPay |

---

*Fim do CLAUDE.md — ShieldPay v1.0*
*Última atualização: 15 de junho de 2026*
*Próxima ação: Setup do ambiente e implementação do circuit ZK (Fase 1)*
