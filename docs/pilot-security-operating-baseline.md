# Baseline operacional de segurança — piloto Regularizando

O piloto usa **OAuth Manus** como fonte de identidade. A aplicação não deve declarar MFA, verificação de e-mail, retenção de sessão, revogação ou recuperação de acesso como capacidades próprias sem confirmação formal do provedor. Antes de cada organização entrar com dados reais, o responsável pelo piloto registra essa confirmação e designa o administrador organizacional.

Na configuração de projeto disponível para esta revisão não há conector ou parâmetro de OAuth que comprove MFA ou verificação de e-mail. Portanto, esses itens continuam como pré-requisitos externos, e não como controles declarados pelo produto.

| Controle | Regra de entrada do piloto | Evidência exigida |
|---|---|---|
| Identidade | Usuários acessam somente pela identidade OAuth aprovada e têm uma associação ativa à organização. | Lista de administradores e papéis revisada. |
| MFA e verificação | Dependem da configuração e das capacidades do provedor de identidade. | Confirmação do provedor e decisão do controlador sobre contas privilegiadas. |
| Recuperação de acesso | Processada pelo provedor; a organização mantém contato administrativo e procedimento de remoção de membros. | Contato de segurança e responsável de organização. |
| Retenção e exclusão | Nenhum prazo é presumido pelo produto. O controlador define classes de dados, prazos, base legal e descarte. | Mapa de tratamento e tabela de retenção aprovados. |
| Backups e restore | Banco e arquivos são avaliados separadamente; o piloto só inicia após definir RPO, RTO, responsável e teste de restauração. | Registro do teste de restore e aceite do responsável. |
| Incidentes | Detectar, conter, preservar evidências, avaliar impacto, corrigir e comunicar quando aplicável. | Canal de incidente e responsáveis do controlador e operador. |
| Dados de evidência | Downloads passam por autorização de organização e URL temporária; decisões e downloads relevantes entram em trilha de auditoria. | Revisão dos logs e teste de acesso entre organizações. |

> Este documento é um baseline técnico-operacional, não substitui o aviso de privacidade, o contrato de tratamento de dados, a análise jurídica de base legal ou instruções formais do controlador.
