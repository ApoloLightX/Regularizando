# Fase 2 — Identidade e onboarding

## Entrega

Esta fase cria a primeira fatia vertical autenticada do Regularizando:

1. cadastro com confirmação de e-mail;
2. login e recuperação de senha;
3. criação de organização;
4. dashboard protegido;
5. criação de projetos e processos de licenciamento;
6. convite de membros;
7. leitura da trilha de auditoria.

O fluxo usa o cliente Supabase SSR com cookies. Páginas protegidas validam as claims no servidor, enquanto todas as consultas de domínio continuam sujeitas às políticas RLS.

## Modelo de autorização

| Papel      | Organização/equipe | Projetos             | Processos             |
| ---------- | ------------------ | -------------------- | --------------------- |
| `owner`    | administra         | cria, edita e remove | cria, revisa e remove |
| `admin`    | administra         | cria, edita e remove | cria, revisa e remove |
| `analyst`  | leitura            | cria e edita         | cria e revisa         |
| `reviewer` | leitura            | leitura              | revisa                |
| `viewer`   | leitura            | leitura              | leitura               |

O proprietário não pode ser removido nem rebaixado. A transferência de propriedade continua reservada para um fluxo dedicado.

## Convites

- O servidor gera 256 bits aleatórios.
- Apenas o SHA-256 do token é persistido.
- O link é exibido somente na resposta de criação.
- O convite expira em sete dias.
- O e-mail autenticado deve coincidir com o e-mail normalizado do convite.
- O papel `owner` não pode ser concedido por convite.
- O aceite é atômico e executado por uma função `security definer` com `search_path` vazio.

O MVP entrega o link para cópia manual. O envio transacional por e-mail fica para a integração de notificações.

## Isolamento de dados

`licensing_processes` carrega `organization_id` e possui chave estrangeira composta para `(project_id, organization_id)`. Assim, mesmo uma falha na aplicação não permite associar um processo a um projeto de outro tenant.

As políticas de projeto da Fase 1 foram endurecidas: membros somente leitura não podem mais criar ou editar projetos. `audit_logs` não concede `INSERT`, `UPDATE` nem `DELETE` ao papel `authenticated`; os registros são produzidos por triggers do banco.

## Auditoria

Triggers registram inserções, alterações e remoções em:

- organizações;
- membros;
- convites;
- projetos;
- processos de licenciamento.

O log guarda ator, ação, entidade, identificador, tenant e horário. Conteúdo sensível e documentos não são copiados para `metadata`.

## Validação

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
pnpm build
pnpm audit --prod
```

Com Docker disponível:

```bash
pnpm db:start
pnpm db:reset
pnpm db:lint
pnpm db:test
```

## Configuração remota pendente

Antes do teste ponta a ponta, é necessário:

1. vincular o Supabase CLI ao projeto de desenvolvimento;
2. aplicar as duas migrations em desenvolvimento;
3. cadastrar `NEXT_PUBLIC_APP_URL` nas Redirect URLs do Supabase Auth;
4. configurar SMTP para uso além do limite de testes;
5. executar os testes de cadastro, recuperação, convite e isolamento com contas de teste.
