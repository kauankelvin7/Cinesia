/**
 * 📊 STAT CARD - Componente de Métrica do Dashboard
 * 
 * Exibe uma estatística numérica com ícone e cor personalizáveis
 * Suporta temas light/dark automaticamente via Tailwind
 * 
 * @param {string} title - Título da métrica (ex: "Matérias Ativas")
 * @param {number} value - Valor numérico (ex: 12)
 * @param {React.Component} icon - Ícone do Lucide React
 * @param {string} colorScheme - Esquema de cores: 'teal', 'blue', 'green', 'orange', 'purple', 'red'
 * @param {number} delay - Delay de animação (opcional, para efeito staggered)
 */

import { motion } from 'framer-motion';

const COLOR_SCHEMES = {
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-600',
    border: 'border-teal-200',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
  },
};

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  colorScheme = 'teal', 
  delay = 0,
  subtitle = null 
}) => {
  const colors = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.teal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: 'easeOut' }}
      className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        {/* Área de Texto */}
        <div className="flex-1">
          <p className="text-slate-600 text-sm font-medium mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Ícone com Background Colorido */}
        <div className={`${colors.bg} p-3 rounded-xl flex-shrink-0`}>
          <Icon className={colors.text} size={24} strokeWidth={2} />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;