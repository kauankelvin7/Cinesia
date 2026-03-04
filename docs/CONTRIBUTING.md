# Contribuindo com o Cinesia

## Pré-requisitos
- Node.js 18+
- Conta Firebase configurada (ver [DEPLOY.md](./DEPLOY.md))
- `.env` preenchido a partir do `.env.example`

## Fluxo de trabalho

```bash
# 1. Criar branch a partir de main
git checkout -b feat/nome-da-feature

# 2. Desenvolver localmente
cd frontend && npm run dev

# 3. Verificar qualidade antes do commit
npm run lint

# 4. Commit seguindo Conventional Commits
git commit -m "feat: descrição clara da mudança"

# 5. Push e abrir Pull Request para main
git push origin feat/nome-da-feature
```

## Convenção de commits

```
feat:     nova funcionalidade
fix:      correção de bug
refactor: refatoração sem mudança de comportamento
style:    ajustes de CSS/visual sem lógica
docs:     documentação
chore:    build, CI, dependências
perf:     melhorias de performance
```

**Exemplos:**
```
feat(flashcards): adicionar filtro por matéria
fix(resumos): corrigir exportação PDF em dispositivos iOS
docs: atualizar instruções de deploy no DEPLOY.md
chore: atualizar dependências Firebase para v12
```

## Padrões de código

- **JavaScript ES2020+** — sem TypeScript (projeto em JSX)
- Componentes funcionais com hooks — sem class components
- CSS via Tailwind — evitar CSS inline exceto valores dinâmicos
- Comentários JSDoc em funções com lógica complexa
- `console.log` proibido em produção — usar `console.warn` / `console.error`
- Sem warnings ESLint ao fazer commit

## Estrutura de branches

- `main` — produção (deploy automático)
- `develop` — integração (CI automático)
- `feat/*` — novas funcionalidades
- `fix/*` — correções de bugs
- `docs/\*` — documentação
