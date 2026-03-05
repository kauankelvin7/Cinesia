import React from 'react';

const KakaSkeleton = () => (
  <div className="flex flex-col gap-4 p-4 animate-pulse">
    {/* Mensagem do bot */}
    <div className="flex items-end gap-2">
      <div className="w-8 h-8 rounded-[10px] bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
      <div className="flex flex-col gap-1.5 max-w-[75%]">
        <div className="h-2.5 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-16 w-56 rounded-2xl rounded-bl-md bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
    {/* Mensagem do usuário */}
    <div className="flex items-end gap-2 flex-row-reverse">
      <div className="w-8 h-8 rounded-[10px] bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
      <div className="h-10 w-44 rounded-2xl rounded-br-md bg-slate-200 dark:bg-slate-700" />
    </div>
    {/* Mensagem do bot */}
    <div className="flex items-end gap-2">
      <div className="w-8 h-8 rounded-[10px] bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
      <div className="flex flex-col gap-1.5 max-w-[75%]">
        <div className="h-2.5 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-24 w-64 rounded-2xl rounded-bl-md bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  </div>
);

export default KakaSkeleton;
