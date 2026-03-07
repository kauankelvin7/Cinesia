import React from 'react';

const KakaSkeleton = () => (
  <div className="flex flex-col gap-4 animate-pulse">
    {/* Esqueleto: Mensagem do bot */}
    <div className="flex items-end gap-2">
      {/* Avatar Kaka */}
      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700/50 flex-shrink-0" />
      <div className="flex flex-col gap-1.5 max-w-[78%]">
        {/* Nome KAKA */}
        <div className="h-2.5 w-10 rounded-full bg-slate-200 dark:bg-slate-700/50 ml-0.5" />
        {/* Balão do Bot (ponta esquerda afiada) */}
        <div className="h-16 w-56 rounded-2xl rounded-tl-[4px] bg-slate-200 dark:bg-slate-700/50" />
      </div>
    </div>

    {/* Esqueleto: Mensagem do usuário */}
    <div className="flex items-end gap-2 flex-row-reverse">
      {/* Avatar Usuário */}
      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700/50 flex-shrink-0" />
      {/* Balão do Usuário (ponta direita afiada) */}
      <div className="h-10 w-44 rounded-2xl rounded-tr-[4px] bg-slate-200 dark:bg-slate-700/50" />
    </div>

    {/* Esqueleto: Mensagem longa do bot */}
    <div className="flex items-end gap-2">
      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700/50 flex-shrink-0" />
      <div className="flex flex-col gap-1.5 max-w-[78%]">
        <div className="h-2.5 w-10 rounded-full bg-slate-200 dark:bg-slate-700/50 ml-0.5" />
        <div className="h-24 w-64 rounded-2xl rounded-tl-[4px] bg-slate-200 dark:bg-slate-700/50" />
      </div>
    </div>
  </div>
);

export default KakaSkeleton;