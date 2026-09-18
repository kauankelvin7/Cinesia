# Cinesia — modelo de dados

Este documento descreve o modelo observado na aplicação atual e será atualizado junto com qualquer migração.

## Ownership

O identificador de conta é sempre o `uid` fornecido pelo Firebase Auth.

Coleções privadas top-level possuem campo `uid`. Subcoleções privadas usam o `uid` no path.

## Conteúdo de estudo

### `materias/{materiaId}`

Campos observados/esperados:

- `uid`
- `nome`
- `cor`
- `icone`
- `descricao`
- `createdAt`
- `updatedAt`

### `resumos/{resumoId}`

- `uid`
- `titulo`
- `conteudo`
- `materiaId`
- mídia associada
- timestamps

### `flashcards/{flashcardId}`

- `uid`
- frente/pergunta
- verso/resposta
- `materiaId`
- tags/mídia
- campos SM-2
- timestamps

Campos de revisão precisam continuar retrocompatíveis durante a normalização.

### `simulados/{simuladoId}`

- `uid`
- título/contexto
- questões
- resultado/pontuação
- `createdAt`

### `eventos/{eventoId}`

- `uid`
- título
- data
- tipo
- matéria opcional

### `pomodoro/{uid_data}`

Documento diário de estudo/pomodoro.

## Usuário

### `users/{uid}`

Atualmente mistura perfil, preferências e alguns agregados.

Subcoleções:

```text
users/{uid}/perfil/{doc}
users/{uid}/stats/{doc}
users/{uid}/notifications/{id}
users/{uid}/kakabot_memoria/{doc}
users/{uid}/kakabot_sessoes/{id}
users/{uid}/kakabot_salvos/{id}
```

### Direção futura

```text
users/{uid}             privado
publicProfiles/{uid}    público para usuários autenticados
```

Não executar essa migração sem dual-read/dual-write ou script equivalente.

## Social

### `friendships/{id}`

Relaciona usuários, solicitante, destinatário e status.

### `conversations/{id}`

- participantes
- tipo
- metadados
- última atividade

Subcoleções:

```text
messages/{id}
typing/{uid}
```

### `challenges/{id}`

Desafios entre usuários.

Há registros antigos e novos com schemas diferentes; helpers atuais mantêm leitura retrocompatível.

### `notifications/{id}`

Notificações sociais top-level.

Não confundir com `users/{uid}/notifications`, usada por notificações pedagógicas.

## Presence

Realtime Database:

```text
/status/{uid}
```

Presence é efêmero e não deve ser tratado como histórico durável.

## Índices

Os índices oficiais ficam em:

`infra/firebase/firestore.indexes.json`

Toda query composta nova deve atualizar esse arquivo.

## Regras

As Rules oficiais ficam em:

`infra/firebase/firestore.rules`

A segurança não pode depender somente de filtros no cliente.

## Convenções futuras

A partir da fase de contratos:

- string obrigatória é normalizada com `trim()`;
- `uid` é lido da sessão, não de input editável;
- IDs referenciados precisam pertencer ao mesmo usuário quando o domínio exigir;
- timestamps de criação/alteração são gerados de forma consistente;
- ausência é `null` ou campo omitido conforme contrato do domínio, nunca mistura arbitrária;
- payload desconhecido vindo de IA não é persistido antes de validação.
