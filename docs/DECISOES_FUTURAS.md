# Decisões Futuras — ShieldPay

> Backlog **vivo** de decisões e automações que ainda vamos implementar.
> Não fazer agora — registrar aqui para colocar em prática depois.
> A cada nova decisão desse tipo, **anexar um item neste arquivo**.

Última atualização: 17/jun/2026.

---

## 1. Automação de emails (notificações do ciclo de convite) — *a implementar*

Hoje o convite é **manual** (a empresa copia o link e envia). Automatizar:

- **Ao criar o vínculo (convite):** enviar email automático ao colaborador —
  algo como *"A Empresa X está te convidando a cadastrar seus dados para
  recebimento de pagamentos"* — com o link do convite e as informações
  (empresa, função, range acordado).
- **Após o colaborador aceitar o vínculo:** enviar email de confirmação contendo:
  - nome da empresa que o vinculou;
  - a **carteira Stellar `G…`** criada para ele;
  - o range acordado e o status (ativo/ancorado);
  - (definir destinatário: colaborador e/ou a empresa).
- **Provedor:** a decidir — **Resend** (mais simples, free tier) ou **SMTP Gmail**.
  Requer criar conta + API key. O campo de email do colaborador já é obrigatório
  no convite (fica registrado, pronto para o envio).

## 2. Carteira Stellar do colaborador — visibilidade e **acesso ao dinheiro** (CRÍTICO) — *a definir + implementar*

Precisa ficar **explícito** como o colaborador vê e acessa a carteira:

- **Mostrar a carteira:** após aceitar, exibir claramente ao colaborador o
  endereço Stellar `G…` que foi criado para ele (hoje a carteira é criada pelo
  Privy, mas não é mostrada de forma destacada no portal dele).
- **Como ele acessa a carteira para RECEBER / SACAR o dinheiro?** (o ponto central)
  - A carteira é **embedded do Privy (sem seed phrase)**; o acesso é via login
    Privy (email/Google/passkey) — o mesmo email do convite.
  - Definir o que oferecemos:
    - **Ver saldo** em USDC no portal do colaborador;
    - **Exportar a chave privada** (o Privy permite export) — sim/não, com avisos;
    - **Sacar / transferir** para outra carteira Stellar do colaborador;
    - **Off-ramp para fiat (BRL)** via anchors da Stellar (MoneyGram/Bitso) —
      como e se entra no escopo;
  - Documentar isso para o colaborador (passo a passo "como receber e usar").

## 3. Acesso do colaborador à plataforma — *a definir + implementar*

- Como o colaborador **entra novamente** no app depois (login Privy com o mesmo
  email) e o que ele vê: recebimentos, comprovantes, a carteira, e as ações de
  saque/uso do item 2.
- Onboarding de retorno (primeira vez que loga no portal após aceitar).

---

## Como usar este arquivo
- É um **backlog de decisões**, não um plano de execução imediato.
- Sempre que aparecer uma decisão/automação "para depois", **adicione um item aqui**
  com: o que é, por que ficou para depois, e o que precisa para implementar.
- Quando formos implementar, movemos o item para uma fase do roadmap (N-x).
