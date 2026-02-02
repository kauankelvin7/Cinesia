# Guia de Refatoração - Semantic Tokens

## ✅ Design System Implementado

### Classes Semânticas Disponíveis:

#### Backgrounds
- `bg-background` - Fundo principal do app
- `bg-surface` - Fundo de cards e containers
- `bg-surface-elevated` - Fundo de modais e elementos elevados

#### Textos
- `text-text-primary` - Texto principal (títulos, headings)
- `text-text-secondary` - Texto secundário (descrições, labels)
- `text-text-tertiary` - Texto terciário (hints, placeholders)

#### Brand Colors
- `text-brand-primary` ou `bg-brand-primary` - Cor principal do app (teal)
- `hover:bg-brand-hover` - Hover state dos botões
- `bg-brand-light` - Background leve para highlights

#### Borders
- `border-border` - Bordas padrão
- `border-border-light` - Bordas mais claras

---

## 📝 Exemplos de Refatoração

### ANTES (Com classes dark: espalhadas):
```jsx
<div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
  <h1 className="text-slate-900 dark:text-white">Título</h1>
  <p className="text-slate-600 dark:text-slate-300">Descrição</p>
</div>
```

### DEPOIS (Com Semantic Tokens):
```jsx
<div className="bg-surface text-text-primary">
  <h1 className="text-text-primary">Título</h1>
  <p className="text-text-secondary">Descrição</p>
</div>
```

---

## 🎨 Componente Layout.jsx - EXEMPLO REFATORADO

```jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';

const Layout = ({ children }) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      {isDesktop && <Sidebar />}
      
      {!isDesktop && (
        <header className="fixed top-0 left-0 right-0 bg-surface border-b border-border z-40 px-4 py-3">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <Logo />
            <button
              onClick={toggleTheme}
              className="p-3 rounded-xl bg-brand-light text-brand-primary hover:bg-brand-hover/20"
            >
              {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
          </div>
        </header>
      )}

      <main className={isDesktop ? 'ml-64' : 'mt-16'}>
        {children}
      </main>

      {!isDesktop && <BottomNavigation />}
    </div>
  );
};
```

---

## 🃏 Componente Card.jsx - EXEMPLO REFATORADO

```jsx
import { motion } from 'framer-motion';

export const Card = ({ children, className = '', interactive = false, ...props }) => {
  const baseClasses = 'bg-surface rounded-2xl shadow-sm border border-border p-6 transition-all duration-300';
  const interactiveClasses = interactive 
    ? 'cursor-pointer hover:shadow-md hover:border-brand-primary hover:scale-[1.01]' 
    : '';

  return (
    <motion.div 
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
```

---

## 🔘 Componente Button.jsx - EXEMPLO REFATORADO

```jsx
export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = 'px-6 py-3.5 rounded-xl font-semibold transition-all duration-200';
  
  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-brand-hover shadow-md',
    secondary: 'bg-surface-elevated text-text-primary hover:bg-brand-light border border-border',
  };

  return (
    <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
```

---

## 📄 Página Home.jsx - EXEMPLO REFATORADO

```jsx
function Home() {
  return (
    <div className="min-h-screen bg-background pb-32 pt-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-6xl font-bold text-text-primary mb-4">
          Bem-vindo ao <span className="text-brand-primary">Cinesia</span>
        </h1>
        <p className="text-xl text-text-secondary">
          Seu sistema de estudos para Fisioterapia
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
          {features.map((feature) => (
            <div key={feature.title} className="bg-surface border border-border rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-text-primary mb-3">
                {feature.title}
              </h3>
              <p className="text-text-secondary">
                {feature.description}
              </p>
              <div className="mt-6 flex items-center text-brand-primary font-semibold">
                Acessar →
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 🔄 Checklist de Migração

### Por Componente:
- [ ] Substituir `bg-white dark:bg-slate-X` por `bg-surface`
- [ ] Substituir `text-slate-900 dark:text-white` por `text-text-primary`
- [ ] Substituir `text-slate-600 dark:text-slate-300` por `text-text-secondary`
- [ ] Substituir `border-slate-200 dark:border-slate-700` por `border-border`
- [ ] Substituir `bg-teal-X` por `bg-brand-primary`

### Prioridade de Arquivos:
1. ✅ index.css (FEITO)
2. ✅ tailwind.config.js (FEITO)
3. ✅ ThemeContext.jsx (FEITO)
4. ⏳ components/ui.jsx
5. ⏳ components/Layout.jsx
6. ⏳ components/Sidebar.jsx
7. ⏳ pages/Home.jsx
8. ⏳ pages/Materias.jsx
9. ⏳ pages/Resumos.jsx
10. ⏳ pages/Flashcards.jsx

---

## 🎯 Benefícios da Abordagem

✅ **Consistência**: Uma única fonte de verdade para cores  
✅ **Manutenibilidade**: Mudanças de tema em um só lugar  
✅ **Legibilidade**: Classes semânticas são autodocumentadas  
✅ **Performance**: Menos classes CSS geradas  
✅ **Escalabilidade**: Fácil adicionar novos temas
