# 📱 Cinesia PWA - Guia de Ícones e Assets

## Estrutura de Arquivos Necessária

Para que o PWA funcione corretamente, você precisa criar os seguintes arquivos na pasta `public/`:

### 📦 Ícones Principais (OBRIGATÓRIOS)

```
public/
├── favicon.ico              # 32x32px - Ícone do navegador
├── favicon-16x16.png        # 16x16px
├── favicon-32x32.png        # 32x32px
├── apple-touch-icon.png     # 180x180px - Ícone iOS na tela inicial
├── pwa-64x64.png            # 64x64px
├── pwa-192x192.png          # 192x192px - Ícone Android/Chrome
├── pwa-512x512.png          # 512x512px - Ícone grande para splash
├── android-chrome-192x192.png  # 192x192px (maskable)
└── android-chrome-512x512.png  # 512x512px (maskable)
```

### 🎨 Ícones para Atalhos (Opcionais)

```
public/icons/
├── simulado-96x96.png       # Atalho: Simulados
├── flashcard-96x96.png      # Atalho: Flashcards
└── resumo-96x96.png         # Atalho: Resumos
```

### 📸 Screenshots (Opcionais - para Play Store)

```
public/screenshots/
├── screenshot-mobile.png    # 390x844px - Screenshot mobile
└── screenshot-desktop.png   # 1280x720px - Screenshot desktop
```

### 🚀 Splash Screens iOS (Recomendados)

Para melhor experiência no iOS, crie splash screens em `public/splash/`:

```
public/splash/
├── apple-splash-640x1136.png    # iPhone SE, 5s
├── apple-splash-750x1334.png    # iPhone 6, 7, 8
├── apple-splash-1242x2208.png   # iPhone 6+, 7+, 8+
├── apple-splash-1125x2436.png   # iPhone X, Xs, 11 Pro
├── apple-splash-828x1792.png    # iPhone Xr, 11
├── apple-splash-1242x2688.png   # iPhone Xs Max, 11 Pro Max
├── apple-splash-1080x2340.png   # iPhone 12/13 mini
├── apple-splash-1170x2532.png   # iPhone 12/13, 14
├── apple-splash-1284x2778.png   # iPhone 12/13 Pro Max, 14 Plus
├── apple-splash-1179x2556.png   # iPhone 14 Pro
├── apple-splash-1290x2796.png   # iPhone 14 Pro Max
├── apple-splash-1536x2048.png   # iPad Mini, Air
├── apple-splash-1668x2224.png   # iPad Pro 10.5"
├── apple-splash-1668x2388.png   # iPad Pro 11"
└── apple-splash-2048x2732.png   # iPad Pro 12.9"
```

---

## 🛠️ Como Gerar os Ícones

### Opção 1: Ferramenta Online (Recomendada)

1. Acesse [Real Favicon Generator](https://realfavicongenerator.net/)
2. Faça upload do logo do Cinesia (512x512px mínimo)
3. Configure as cores (Theme: #0d9488)
4. Baixe e extraia na pasta `public/`

### Opção 2: PWA Asset Generator

```bash
# Instalar globalmente
npm install -g pwa-asset-generator

# Gerar todos os assets
pwa-asset-generator ./logo.png ./public \
  --background "#0d9488" \
  --splash-only false \
  --icon-only false \
  --portrait-only true \
  --padding "10%"
```

### Opção 3: Figma/Canva

Crie manualmente nos tamanhos especificados usando:
- **Cores:** Teal (#0d9488) com branco
- **Formato:** PNG com transparência (exceto splash)
- **Logo:** Centralizado com padding de 10-20%

---

## ✅ Verificação

Após criar os ícones, verifique se o PWA está funcionando:

1. **Build do projeto:**
   ```bash
   npm run build
   ```

2. **Testar localmente:**
   ```bash
   npm run preview
   ```

3. **Verificar no Chrome DevTools:**
   - Abra DevTools (F12)
   - Vá em "Application" > "Manifest"
   - Verifique se não há erros

4. **Lighthouse Audit:**
   - DevTools > Lighthouse > PWA
   - Score deve ser 100 para PWA

---

## 📝 Especificações de Design

### Cores
- **Primary:** #0d9488 (Teal-600)
- **Background:** #ffffff
- **Splash Background:** #0d9488 (gradiente opcional para #059669)

### Logo
- Manter proporção quadrada
- Padding mínimo de 10% nas bordas
- Versão branca para splash (fundo colorido)
- Versão colorida para ícones (fundo transparente ou branco)

### Maskable Icons
- Ícones "maskable" precisam de safe zone central
- O conteúdo principal deve estar em 80% do centro
- 10% de margem em cada lado

---

## 🔗 Links Úteis

- [PWA Icon Generator](https://tools.crawlink.com/tools/pwa-icon-generator/)
- [Maskable Icon Editor](https://maskable.app/editor)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Web App Manifest](https://web.dev/add-manifest/)
