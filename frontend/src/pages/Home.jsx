import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBookOpen, FiFileText, FiCreditCard, FiTrendingUp } from 'react-icons/fi';

function Home() {
  const features = [
    {
      icon: FiBookOpen,
      title: 'Organize por Matérias',
      description: 'Crie e gerencie suas matérias com cores personalizadas',
      link: '/materias',
      gradient: 'from-primary-400 to-primary-600',
      delay: 0.1
    },
    {
      icon: FiFileText,
      title: 'Resumos Ricos',
      description: 'Crie resumos com formatação rica e imagens',
      link: '/resumos',
      gradient: 'from-wellness-sky to-primary-500',
      delay: 0.2
    },
    {
      icon: FiCreditCard,
      title: 'Flashcards Visuais',
      description: 'Estude com flashcards e imagens de anatomia',
      link: '/flashcards',
      gradient: 'from-wellness-mint to-primary-600',
      delay: 0.3
    },
    {
      icon: FiTrendingUp,
      title: 'Estudo Eficiente',
      description: 'Aprenda de forma visual e interativa',
      link: null,
      gradient: 'from-wellness-lavender to-primary-500',
      delay: 0.4
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-32 pt-8 px-4 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1 
            className="text-6xl font-bold text-text-primary mb-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Bem-vindo ao <span className="text-brand-primary">Cinesia</span> 📚
          </motion.h1>
          <motion.p 
            className="text-xl text-text-secondary max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Seu sistema de estudos para Fisioterapia com resumos e flashcards
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: feature.delay }}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              {feature.link ? (
                <Link to={feature.link} className="block">
                  <div className="bg-surface border border-border rounded-2xl shadow-sm p-8 h-full hover:shadow-md hover:border-brand-primary transition-all duration-300">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-md`}>
                      <feature.icon size={32} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-text-primary mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-text-secondary leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="mt-6 flex items-center text-brand-primary font-semibold">
                      Acessar
                      <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="bg-surface border border-border rounded-2xl shadow-sm p-8 h-full">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-md`}>
                    <feature.icon size={32} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
