# 🚀 DEPLOY GUIDE - Cinesia na Vercel

## ✅ Checklist Pré-Deploy

- [x] Build de produção testado (`npm run build`)
- [x] Favicons configurados
- [x] PWA configurado
- [x] Logo implementada
- [x] Code splitting ativo
- [x] Console.logs removidos
- [x] .env.example documentado
- [x] .gitignore atualizado

---

## 📦 Método 1: Deploy via CLI (Recomendado)

### Passo 1: Instalar Vercel CLI
```bash
npm install -g vercel
```

### Passo 2: Login na Vercel
```bash
vercel login
```

### Passo 3: Deploy (do diretório raiz)
```bash
cd c:\Users\Kauan\Desktop\Cinesia
vercel --prod
```

Siga as perguntas:
- **Set up and deploy?** → Yes
- **Which scope?** → Sua conta pessoal
- **Link to existing project?** → No (primeira vez)
- **Project name?** → cinesia
- **Directory?** → ./frontend
- **Override settings?** → Yes
  - **Build Command:** `npm run build`
  - **Output Directory:** `dist`
  - **Install Command:** `npm install`

---

## 🌐 Método 2: Deploy via GitHub (Mais Fácil)

### Passo 1: Criar Repositório no GitHub
1. Acesse [github.com/new](https://github.com/new)
2. Nome: `cinesia`
3. Privado ou Público (sua escolha)
4. **NÃO** marque "Initialize with README"

### Passo 2: Conectar o Projeto ao Git
```bash
cd c:\Users\Kauan\Desktop\Cinesia
git init
git add .
git commit -m "🎉 Initial commit - Cinesia v1.0"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/cinesia.git
git push -u origin main
```

### Passo 3: Importar na Vercel
1. Acesse [vercel.com/new](https://vercel.com/new)
2. Clique em **"Import Git Repository"**
3. Selecione o repositório `cinesia`
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Clique em **Deploy**

---

## 🔑 Configurar Variáveis de Ambiente na Vercel

### Via Dashboard (Recomendado)
1. Vá para o projeto → **Settings** → **Environment Variables**
2. Adicione cada variável do `.env.example`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GEMINI_API_KEY=...
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
```

3. Clique em **Save**
4. Faça **Redeploy** para aplicar as variáveis

---

## 🎯 Pós-Deploy

### Testar o Site
Sua URL será algo como: `https://cinesia.vercel.app`

### Configurar Domínio Customizado (Opcional)
1. Vá para **Settings** → **Domains**
2. Adicione seu domínio (ex: `cinesia.com.br`)
3. Configure os DNS conforme instruções

### Configurar Firebase (Importante!)
Adicione o domínio da Vercel nas **Authorized Domains** do Firebase:
1. [Firebase Console](https://console.firebase.google.com/)
2. **Authentication** → **Settings** → **Authorized domains**
3. Adicione: `cinesia.vercel.app` (ou seu domínio customizado)

---

## 🐛 Troubleshooting

### Build Falha?
- Verifique se todas as variáveis de ambiente estão configuradas
- Teste local: `npm run build` no frontend
- Veja os logs no painel da Vercel

### Página em branco?
- Verifique o Console do navegador (F12)
- Provavelmente faltam variáveis de ambiente
- Certifique-se que o Firebase está configurado

### PWA não funciona?
- HTTPS é obrigatório (Vercel já fornece)
- Limpe o cache do navegador
- Verifique o manifest.json

---

## 📞 Suporte

Se algo der errado:
1. Verifique os logs no painel da Vercel
2. Teste local primeiro: `npm run dev`
3. Confirme que `.env` está configurado localmente

---

**Desenvolvido com ❤️ por Kauan Kelvin**
