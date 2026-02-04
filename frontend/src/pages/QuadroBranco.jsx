/**
 * 🎨 QUADRO BRANCO - Canvas de Anatomia
 * 
 * Ferramenta de desenho para estudantes de Fisioterapia
 * Otimizado para iPad e Apple Pencil
 * 
 * Features:
 * - Canvas HTML5 com touch e mouse
 * - Cores temáticas (artérias, veias, nervos, linfático)
 * - Ferramentas: Lápis, Borracha, Limpar
 * - Diferentes espessuras de traço
 * - Undo/Redo
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Pencil,
  Eraser,
  Trash2,
  Undo2,
  Redo2,
  Download,
  Palette,
  Sparkles
} from 'lucide-react';

// Cores temáticas para anatomia
const CORES = [
  { id: 'preto', cor: '#1e293b', nome: 'Preto', desc: 'Contornos' },
  { id: 'vermelho', cor: '#dc2626', nome: 'Vermelho', desc: 'Artérias' },
  { id: 'azul', cor: '#2563eb', nome: 'Azul', desc: 'Veias' },
  { id: 'amarelo', cor: '#eab308', nome: 'Amarelo', desc: 'Nervos' },
  { id: 'verde', cor: '#16a34a', nome: 'Verde', desc: 'Linfático' },
  { id: 'laranja', cor: '#ea580c', nome: 'Laranja', desc: 'Músculos' },
  { id: 'roxo', cor: '#9333ea', nome: 'Roxo', desc: 'Ossos' },
  { id: 'branco', cor: '#ffffff', nome: 'Branco', desc: 'Apagar' },
];

function QuadroBranco() {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const containerRef = useRef(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [ferramenta, setFerramenta] = useState('pencil'); // 'pencil' | 'eraser'
  const [corAtual, setCorAtual] = useState(CORES[0].cor);
  const [espessura, setEspessura] = useState(5);
  const [opacidade, setOpacidade] = useState(100); // 0-100%
  const [historico, setHistorico] = useState([]);
  const [histIndex, setHistIndex] = useState(-1);
  const [showPalette, setShowPalette] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 🔍 Pinch-to-Zoom state
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const lastTouchDistance = useRef(null);
  const lastPanPoint = useRef(null);

  // Salvar estado para undo/redo (definido antes do useEffect que o usa)
  const salvarEstado = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const imageData = canvas.toDataURL();
    
    setHistorico(prev => {
      const newHist = prev.slice(0, histIndex + 1);
      newHist.push(imageData);
      // Limitar histórico a 20 estados
      if (newHist.length > 20) newHist.shift();
      return newHist;
    });
    setHistIndex(prev => Math.min(prev + 1, 19));
  }, [histIndex]);

  // Inicializar canvas (apenas uma vez)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    if (!canvas || !container) return;

    // Definir tamanho do canvas
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 5;
      contextRef.current = ctx;
      
      // Preencher com branco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      
      // Marcar como inicializado
      if (!isInitialized) {
        setIsInitialized(true);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isInitialized]);

  // Salvar estado inicial após inicialização
  useEffect(() => {
    if (isInitialized && historico.length === 0) {
      salvarEstado();
    }
  }, [isInitialized, historico.length, salvarEstado]);

  // Atualizar estilo do contexto quando mudar cor/espessura/ferramenta/opacidade
  useEffect(() => {
    if (contextRef.current) {
      if (ferramenta === 'eraser') {
        contextRef.current.strokeStyle = '#ffffff';
        contextRef.current.lineWidth = espessura * 3;
        contextRef.current.globalAlpha = 1; // Borracha sempre 100%
      } else {
        contextRef.current.strokeStyle = corAtual;
        contextRef.current.lineWidth = espessura;
        contextRef.current.globalAlpha = opacidade / 100;
      }
    }
  }, [corAtual, espessura, ferramenta, opacidade]);

  // Obter coordenadas do evento (mouse ou touch), corrigindo para zoom e pan
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    // Ajustar para pan e zoom
    const x = (clientX - rect.left - panOffset.x) / scale;
    const y = (clientY - rect.top - panOffset.y) / scale;
    return { x, y };
  };

  // Iniciar desenho
  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  // Desenhar
  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const { x, y } = getCoordinates(e);
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  // Parar de desenhar
  const stopDrawing = () => {
    if (isDrawing) {
      contextRef.current.closePath();
      setIsDrawing(false);
      salvarEstado();
    }
  };

  // 🔍 PINCH-TO-ZOOM - Calcular distância entre dois toques
  const getTouchDistance = (touches) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 🔍 PINCH-TO-ZOOM - Calcular ponto médio entre dois toques
  const getTouchMidpoint = (touches) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  // 🔍 PINCH-TO-ZOOM - Handler para gestos multi-touch
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Dois dedos = pinch zoom (não desenhar)
      e.preventDefault();
      lastTouchDistance.current = getTouchDistance(e.touches);
      lastPanPoint.current = getTouchMidpoint(e.touches);
    } else if (e.touches.length === 1) {
      // Um dedo = desenhar
      startDrawing(e);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      
      const currentDistance = getTouchDistance(e.touches);
      const currentMidpoint = getTouchMidpoint(e.touches);
      
      if (lastTouchDistance.current && lastPanPoint.current) {
        // Calcular mudança de escala
        const scaleChange = currentDistance / lastTouchDistance.current;
        const newScale = Math.min(Math.max(0.5, scale * scaleChange), 3); // Limite: 0.5x a 3x
        
        // Calcular mudança de pan
        const panDelta = {
          x: currentMidpoint.x - lastPanPoint.current.x,
          y: currentMidpoint.y - lastPanPoint.current.y,
        };
        
        setScale(newScale);
        setPanOffset(prev => ({
          x: prev.x + panDelta.x,
          y: prev.y + panDelta.y,
        }));
        
        lastTouchDistance.current = currentDistance;
        lastPanPoint.current = currentMidpoint;
      }
    } else if (e.touches.length === 1 && isDrawing) {
      // Continuar desenhando
      draw(e);
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      lastTouchDistance.current = null;
      lastPanPoint.current = null;
    }
    
    if (e.touches.length === 0) {
      stopDrawing();
    }
  };

  // Reset zoom
  const resetZoom = () => {
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Undo
  const undo = () => {
    if (histIndex <= 0) return;
    
    const newIndex = histIndex - 1;
    const img = new Image();
    img.src = historico[newIndex];
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
    };
    setHistIndex(newIndex);
  };

  // Redo
  const redo = () => {
    if (histIndex >= historico.length - 1) return;
    
    const newIndex = histIndex + 1;
    const img = new Image();
    img.src = historico[newIndex];
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
    };
    setHistIndex(newIndex);
  };

  // Limpar tudo
  const limparTudo = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    const rect = canvas.getBoundingClientRect();
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    salvarEstado();
  };

  // Baixar imagem
  const baixarImagem = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `cinesia-anatomia-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header Toolbar */}
      <motion.div
        className="bg-white border-b border-slate-200 shadow-sm px-4 py-3 flex items-center justify-between gap-4 flex-wrap"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Título */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Pencil size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Quadro de Anatomia</h1>
            <p className="text-xs text-slate-500 hidden sm:block">Desenhe e anote seus estudos</p>
          </div>
        </div>

        {/* Ferramentas Principais */}
        <div className="flex items-center gap-2">
          {/* Lápis */}
          <button
            onClick={() => setFerramenta('pencil')}
            className={`p-3 rounded-xl transition-all ${
              ferramenta === 'pencil'
                ? 'bg-violet-100 text-violet-600 shadow-inner'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Lápis"
          >
            <Pencil size={22} />
          </button>

          {/* Borracha */}
          <button
            onClick={() => setFerramenta('eraser')}
            className={`p-3 rounded-xl transition-all ${
              ferramenta === 'eraser'
                ? 'bg-amber-100 text-amber-600 shadow-inner'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Borracha"
          >
            <Eraser size={22} />
          </button>

          <div className="w-px h-8 bg-slate-200 mx-1" />

          {/* Paleta de Cores */}
          <div className="relative">
            <button
              onClick={() => setShowPalette(!showPalette)}
              className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-2"
              title="Cores"
            >
              <div 
                className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: corAtual }}
              />
              <Palette size={18} className="text-slate-600" />
            </button>

            {/* Dropdown de Cores */}
            {showPalette && (
              <motion.div
                className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 min-w-[280px]"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-xs font-semibold text-slate-500 mb-3">CORES ANATÔMICAS</p>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {CORES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCorAtual(c.cor);
                        setFerramenta('pencil');
                      }}
                      className={`w-10 h-10 rounded-xl transition-all hover:scale-110 ${
                        corAtual === c.cor ? 'ring-2 ring-offset-2 ring-violet-500' : ''
                      }`}
                      style={{ backgroundColor: c.cor }}
                      title={`${c.nome} - ${c.desc}`}
                    />
                  ))}
                </div>
                
                {/* Slider de Tamanho */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-500">TAMANHO</p>
                    <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                      {espessura}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={espessura}
                    onChange={(e) => setEspessura(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-violet-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1px</span>
                    <span>50px</span>
                  </div>
                </div>

                {/* Slider de Opacidade */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-500">OPACIDADE</p>
                    <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                      {opacidade}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={opacidade}
                    onChange={(e) => setOpacidade(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-violet-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>10%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Preview do traço */}
                <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-center">
                  <div
                    className="rounded-full"
                    style={{
                      width: Math.min(espessura, 40),
                      height: Math.min(espessura, 40),
                      backgroundColor: corAtual,
                      opacity: opacidade / 100,
                      minWidth: 8,
                      minHeight: 8,
                    }}
                  />
                  <span className="ml-3 text-xs text-slate-500">Preview</span>
                </div>

                {/* Botão fechar */}
                <button
                  onClick={() => setShowPalette(false)}
                  className="w-full mt-3 py-2 bg-violet-100 text-violet-700 rounded-xl text-sm font-medium hover:bg-violet-200 transition-all"
                >
                  Aplicar
                </button>
              </motion.div>
            )}
          </div>

          <div className="w-px h-8 bg-slate-200 mx-1" />

          {/* Undo/Redo */}
          <button
            onClick={undo}
            disabled={histIndex <= 0}
            className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Desfazer"
          >
            <Undo2 size={20} />
          </button>
          <button
            onClick={redo}
            disabled={histIndex >= historico.length - 1}
            className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Refazer"
          >
            <Redo2 size={20} />
          </button>

          <div className="w-px h-8 bg-slate-200 mx-1" />

          {/* Limpar */}
          <button
            onClick={limparTudo}
            className="p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all"
            title="Limpar Tudo"
          >
            <Trash2 size={20} />
          </button>

          {/* Download */}
          <button
            onClick={baixarImagem}
            className="p-3 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
            title="Baixar Imagem"
          >
            <Download size={20} />
          </button>
        </div>
      </motion.div>

      {/* Legenda de Cores (apenas tablet/desktop) */}
      <div className="hidden md:flex items-center justify-center gap-4 py-2 bg-slate-50 border-b border-slate-200 text-xs">
        {CORES.map((c) => (
          <div key={c.id} className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: c.cor }}
            />
            <span className="text-slate-600">{c.desc}</span>
          </div>
        ))}
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden touch-none"
        style={{ minHeight: 'calc(100vh - 180px)' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair bg-white"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: 'transform 0.05s ease-out',
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={stopDrawing}
        />

        {/* Indicador de Zoom */}
        {scale !== 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-4 right-4 flex items-center gap-2 bg-violet-500 text-white px-4 py-2 rounded-full shadow-lg"
          >
            <span className="text-sm font-bold">{Math.round(scale * 100)}%</span>
            <button
              onClick={resetZoom}
              className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
            >
              Resetar
            </button>
          </motion.div>
        )}

        {/* Indicador de ferramenta atual */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-slate-200">
          <div 
            className="w-4 h-4 rounded-full border-2 border-white shadow"
            style={{ 
              backgroundColor: ferramenta === 'eraser' ? '#f1f5f9' : corAtual,
              opacity: ferramenta === 'eraser' ? 1 : opacidade / 100
            }}
          />
          <span className="text-sm font-medium text-slate-700">
            {ferramenta === 'eraser' ? 'Borracha' : 'Lápis'}
          </span>
          <span className="text-xs text-slate-400">
            {espessura}px • {opacidade}%
          </span>
        </div>

        {/* Dica inicial - atualizada com dica de pinça */}
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: isDrawing || historico.length > 1 ? 0 : 0.5 }}
        >
          <Sparkles size={48} className="text-violet-300 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Comece a desenhar!</p>
          <p className="text-slate-300 text-sm">Use o dedo, mouse ou Apple Pencil</p>
          <p className="text-slate-300 text-xs mt-2">🤏 Use dois dedos para zoom</p>
        </motion.div>
      </div>
    </div>
  );
}

export default QuadroBranco;
