# Rate limiting distribuído

O Regularizando usa buckets persistidos em banco para que a contagem seja compartilhada entre instâncias. Cada consumo usa incremento atômico com expiração da janela, sem depender de mapa local de memória.

| Grupo | Chaves aplicadas | Janela e limite | Indisponibilidade do banco |
|---|---|---:|---|
| tRPC geral | IP, usuário e organização quando autenticada | 120/IP, 180/usuário, 600/organização por minuto | Permite a continuação com alerta técnico. |
| Upload | IP, usuário e organização | 12/IP, 20/usuário, 80/organização por minuto | Falha fechada com resposta 503. |
| IA/análise | IP, usuário e organização | 20/IP, 20/usuário, 80/organização por minuto | Falha fechada com resposta 503. |
| Governança e administração | IP, usuário e organização | 60/IP, 20/usuário, 80/organização por minuto | Falha fechada com resposta 503. |

Quando um bucket excede o limite, a API devolve `429` e o cabeçalho `Retry-After`. O bloqueio HTTP gera evento de governança minimizado com escopo, prazo de espera e critério de bloqueio, sem persistir endereço IP.

## Limpeza

Os buckets expirados são removidos apenas pelo callback cron autenticado `/api/scheduled/rate-limit-cleanup`. O callback exige identidade de tarefa e vínculo persistido pelo `taskUid`; tarefas órfãs não executam limpeza. O agendamento será criado somente após o checkpoint e a publicação que incluírem este endpoint.
