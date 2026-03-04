# Deploy — Cinesia

## Opção 1 — Firebase Hosting (Recomendado)

### Pré-requisitos
```bash
npm install -g firebase-tools
firebase login
```

### Deploy manual
```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

### Deploy via GitHub Actions (automático)
Push na branch `main` dispara o workflow `.github/workflows/deploy.yml` automaticamente.

**Configuração necessária (uma vez só):**

1. Gerar service account no Firebase:
   - Console Firebase → Project Settings → Service Accounts
   - "Generate new private key" → baixe o JSON

2. Adicionar secrets no GitHub (Settings → Secrets and Variables → Actions):

| Secret | Descrição |
|--------|-----------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Measurement ID |
| `VITE_GEMINI_API_KEY` | Google Gemini API Key |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary Upload Preset |
| `FIREBASE_SERVICE_ACCOUNT` | Conteúdo JSON do service account |

3. Publicar regras do Firestore:
```bash
firebase deploy --only firestore:rules
```

---

## Opção 2 — Vercel

1. Conectar repositório GitHub na Vercel
2. Configurar:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Adicionar as variáveis de ambiente no painel (Settings → Environment Variables)

---

## Variáveis de Ambiente

Não esqueça de configurar todas as variáveis listadas em `frontend/.env.example`.

> ⚠️ **NUNCA commitar o arquivo `.env`** com valores reais. Ele está no `.gitignore`.
