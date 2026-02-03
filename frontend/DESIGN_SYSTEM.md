# 🎨 Cinesia Design System

## Sistema de Temas (Dark/Light Mode)

### Configuração
O Cinesia usa o sistema **class-based** do Tailwind CSS para gerenciar temas. A classe `dark` é aplicada dinamicamente no elemento `<html>` pelo `ThemeContext.jsx`.

### Prioridade de Inicialização
1. **localStorage** (escolha explícita do usuário)
2. **System Preference** (`prefers-color-scheme`)
3. **Fallback**: `light`

---

## 🎨 Paleta de Cores

### Primary (Teal)
- **Light Mode**: `teal-600` (#0D9488)
- **Dark Mode**: `teal-400` (#2DD4BF)

```jsx
<button className="bg-teal-600 dark:bg-teal-500 text-white">
  Botão Primário
</button>
```

### Background
- **Light Mode**: `slate-50` (#F8FAFC)
- **Dark Mode**: `slate-950` (#020617)

```jsx
<div className="bg-slate-50 dark:bg-slate-950">
  Conteúdo
</div>
```

### Surface (Cards/Containers)
- **Light Mode**: `white` (#FFFFFF)
- **Dark Mode**: `slate-900` (#0F172A)

```jsx
<div className="bg-white dark:bg-slate-900">
  Card ou Container
</div>
```

### Text (Hierarquia Visual)
| Tipo | Light Mode | Dark Mode |
|------|-----------|-----------|
| **Primary** | `slate-900` | `slate-100` |
| **Secondary** | `slate-600` | `slate-400` |
| **Muted** | `slate-500` | `slate-500` |

```jsx
<h1 className="text-slate-900 dark:text-slate-100">Título</h1>
<p className="text-slate-600 dark:text-slate-400">Subtítulo</p>
<span className="text-slate-500 dark:text-slate-500">Texto mudo</span>
```

### Borders
- **Light Mode**: `slate-200` (#E2E8F0)
- **Dark Mode**: `slate-800` (#1E293B)

```jsx
<div className="border border-slate-200 dark:border-slate-800">
  Container com borda
</div>
```

---

## 🧩 Componentes Padrão

### Botão Primário
```jsx
<button className="bg-teal-600 dark:bg-teal-500 text-white px-6 py-3 rounded-xl hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors shadow-md font-medium">
  Ação Principal
</button>
```

### Botão Secundário
```jsx
<button className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-6 py-3 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors font-medium">
  Ação Secundária
</button>
```

### Card
```jsx
<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm dark:shadow-soft-dark hover:shadow-md transition-all">
  Conteúdo do Card
</div>
```

### Input de Formulário
```jsx
<input
  type="text"
  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
  placeholder="Digite aqui..."
/>
```

### TextArea
```jsx
<textarea
  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all resize-none"
  rows="3"
  placeholder="Descrição..."
/>
```

---

## 📐 Espaçamento e Tipografia

### Padding Generoso (Medical Clean)
- Cards: `p-6`
- Containers: `p-8`
- Inputs: `px-4 py-2.5`

### Bordas Arredondadas
- Cards/Botões: `rounded-xl` (12px)
- Inputs: `rounded-lg` (8px)

### Sombras
- **Light Mode**: `shadow-sm`, `hover:shadow-md`
- **Dark Mode**: `dark:shadow-soft-dark`, `dark:hover:shadow-card-dark`

```jsx
<div className="shadow-sm dark:shadow-soft-dark hover:shadow-md dark:hover:shadow-card-dark">
  Card com sombra adaptativa
</div>
```

### Transições
Sempre adicione `transition-colors duration-200` ou `transition-all duration-200` para mudanças suaves:

```jsx
<div className="bg-white dark:bg-slate-900 transition-colors duration-200">
  Transição suave ao trocar tema
</div>
```

---

## 🚨 Regras de Ouro

### ❌ NUNCA FAÇA ISSO:
```jsx
// Classes INEXISTENTES no Tailwind
<div className="bg-surface border-border text-text-primary">

// Cores hardcoded
<div style={{ backgroundColor: '#1E293B' }}>

// Apenas uma variante (sem dark mode)
<div className="bg-white text-gray-900">
```

### ✅ SEMPRE FAÇA ISSO:
```jsx
// Classes válidas do Tailwind com dark mode
<div className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">

// Cores do Design System
<button className="bg-teal-600 dark:bg-teal-500">

// Transições suaves
<div className="bg-white dark:bg-slate-900 transition-colors duration-200">
```

---

## 📊 Exemplos de Páginas Corretas

### Header de Página
```jsx
<div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-8 shadow-sm dark:shadow-soft-dark">
  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
    Título da Página
  </h1>
  <p className="text-slate-600 dark:text-slate-400">
    Descrição breve
  </p>
</div>
```

### Grid de Cards
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Métrica</p>
    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">42</p>
  </div>
</div>
```

---

## 🔧 Usando o ThemeContext

```jsx
import { useTheme } from '../contexts/ThemeContext';

function MeuComponente() {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {isDarkMode ? '🌞 Modo Claro' : '🌙 Modo Escuro'}
    </button>
  );
}
```

---

## 📦 Componentes Reutilizáveis

### StatCard
Localização: `src/components/Dashboard/StatCard.jsx`

```jsx
import StatCard from '../components/Dashboard/StatCard';
import { BookOpen } from 'lucide-react';

<StatCard
  title="Matérias Ativas"
  value={12}
  icon={BookOpen}
  colorScheme="teal"
  subtitle="24 no total"
/>
```

**Esquemas de cores disponíveis:**
- `teal`, `blue`, `green`, `orange`, `purple`, `red`

---

## 🎯 Checklist para Novos Componentes

Antes de commitar um novo componente, verifique:

- [ ] Todas as cores usam classes do Tailwind (não hardcoded)
- [ ] Backgrounds têm variante `dark:` (ex: `bg-white dark:bg-slate-900`)
- [ ] Textos têm variante `dark:` (ex: `text-slate-900 dark:text-slate-100`)
- [ ] Borders têm variante `dark:` (ex: `border-slate-200 dark:border-slate-800`)
- [ ] Transições suaves estão presentes (`transition-colors duration-200`)
- [ ] Sombras adaptam ao tema (`shadow-sm dark:shadow-soft-dark`)
- [ ] Bordas arredondadas seguem padrão (`rounded-xl` ou `rounded-lg`)
- [ ] Espaçamento segue o design (padding generoso)

---

## 🧪 Teste de Tema

Para testar se seu componente funciona corretamente:

1. Abra a aplicação no modo claro
2. Clique no botão "Modo Escuro" no Sidebar
3. Verifique se:
   - Nenhum elemento fica invisível
   - Cores de texto mantêm contraste legível
   - Borders são visíveis
   - Hover states funcionam em ambos os modos

---

## 📚 Referências

- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Tailwind Colors](https://tailwindcss.com/docs/customizing-colors)
- [Lucide Icons](https://lucide.dev/)
- [Framer Motion](https://www.framer.com/motion/)

---

**Mantido por**: Equipe Cinesia  
**Última atualização**: Fevereiro 2026
