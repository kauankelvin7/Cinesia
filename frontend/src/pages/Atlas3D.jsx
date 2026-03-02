/**
 * ATLAS 3D — Anatomia Interativa
 * 
 * 50+ estruturas anatômicas procedurais com:
 * - Esqueleto completo bilateral (axial + apendicular)
 * - Músculos estratificados bilaterais (deltóide, peitoral, quad, isquio, gastroc, glúteos, bíceps, tríceps, trapézio, abdominais, oblíquos, adutores, tibial anterior)
 * - Tendões, ligamentos e cartilagem translúcida
 * - MeshPhysicalMaterial com sheen, clearcoat
 * - Iluminação médica calibrada (4 fontes)
 * - Base de dados clínica expandida: origem, inserção, inervação, irrigação, testes especiais
 * - Raycasting interativo + painel de informações
 * - Responsivo: sidebar desktop / drawer mobile
 * - Dark mode completo
 */

import React, { useState, useRef, useCallback, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import {
  X, RotateCcw, Info, ChevronRight, Bone, Search,
  Eye, Layers, ChevronDown, Filter,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/* ═══════════════ MATERIAL PRESETS ═══════════════ */

const MAT = {
  bone:       { color: '#F5E6D3', roughness: 0.55, metalness: 0.05, clearcoat: 0.15, clearcoatRoughness: 0.4, sheen: 0.3, sheenColor: '#FFF8F0' },
  boneDark:   { color: '#E8D5C5', roughness: 0.60, metalness: 0.05, clearcoat: 0.10, clearcoatRoughness: 0.5, sheen: 0.2, sheenColor: '#F5E8D8' },
  cartilage:  { color: '#A8D8EA', roughness: 0.30, metalness: 0.00, clearcoat: 0.60, clearcoatRoughness: 0.2, sheen: 0.5, sheenColor: '#C5E8F5', transparent: true, opacity: 0.7 },
  muscle:     { color: '#C94040', roughness: 0.70, metalness: 0.02, clearcoat: 0.08, clearcoatRoughness: 0.6, sheen: 0.4, sheenColor: '#E88080' },
  muscleDark: { color: '#A03030', roughness: 0.75, metalness: 0.02, sheen: 0.3, sheenColor: '#D06060' },
  tendon:     { color: '#F5F0E0', roughness: 0.50, metalness: 0.00, clearcoat: 0.20, clearcoatRoughness: 0.3, sheen: 0.6, sheenColor: '#FFFFF0' },
  ligament:   { color: '#E8E0C8', roughness: 0.55, metalness: 0.00, sheen: 0.4, sheenColor: '#F5F0E0' },
};

/* ═══════════════ CATEGORY CONFIG ═══════════════ */

const CATEGORY_CONFIG = {
  'Esqueleto Axial':       { color: '#D4A574' },
  'Esqueleto Apendicular': { color: '#C4956E' },
  'Músculos':              { color: '#E06060' },
  'Articulações':          { color: '#60B8DA' },
  'Tendões/Ligamentos':    { color: '#D4CCA0' },
};

/* ═══════════════ GEOMETRY HELPERS ═══════════════ */

function tG(geo, x, y, z) { geo.translate(x, y, z); return geo; }
function sG(geo, x, y, z) { geo.scale(x, y, z); return geo; }

function mergeGeos(geos) {
  let totalV = 0;
  for (const g of geos) totalV += g.getAttribute('position').count;
  const pos = new Float32Array(totalV * 3);
  const nor = new Float32Array(totalV * 3);
  const idx = [];
  let vOff = 0;
  for (const g of geos) {
    const p = g.getAttribute('position');
    const n = g.getAttribute('normal');
    for (let i = 0; i < p.count; i++) {
      const o = (vOff + i) * 3;
      pos[o] = p.getX(i); pos[o+1] = p.getY(i); pos[o+2] = p.getZ(i);
      if (n) { nor[o] = n.getX(i); nor[o+1] = n.getY(i); nor[o+2] = n.getZ(i); }
    }
    if (g.index) { for (let i = 0; i < g.index.count; i++) idx.push(g.index.getX(i) + vOff); }
    else { for (let i = 0; i < p.count; i++) idx.push(i + vOff); }
    vOff += p.count;
    g.dispose();
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  m.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  m.setIndex(idx);
  m.computeVertexNormals();
  return m;
}

/* ═══════════════ GEOMETRY FACTORY ═══════════════ */

function buildGeo(type) {
  switch (type) {
    // ── CRÂNIO ──
    case 'cranium': { const g = new THREE.SphereGeometry(0.75, 32, 32); g.scale(1, 1.05, 1.1); return g; }

    // ── COLUNA ──
    case 'vert-cervical': return new THREE.CylinderGeometry(0.18, 0.22, 1.2, 12);
    case 'vert-thoracic': return new THREE.CylinderGeometry(0.22, 0.28, 2.8, 12);
    case 'vert-lumbar':   return new THREE.CylinderGeometry(0.28, 0.32, 1.4, 12);
    case 'sacrum': {
      const s = new THREE.Shape();
      s.moveTo(-0.35, 0.5); s.lineTo(0.35, 0.5); s.lineTo(0.15, -0.5); s.lineTo(-0.15, -0.5); s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 });
    }

    // ── COSTELAS ──
    case 'ribs-R': case 'ribs-L': {
      const side = type === 'ribs-R' ? 1 : -1;
      const gs = [];
      for (let i = 0; i < 9; i++) {
        const w = 0.6 + (i < 4 ? i * 0.1 : (8 - i) * 0.08);
        const c = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(0, 1.3 - i * 0.32, 0),
          new THREE.Vector3(side * w, 1.3 - i * 0.32, 0.3 + i * 0.035),
          new THREE.Vector3(side * 0.12, 1.3 - i * 0.32, 0.45 + (i < 8 ? 0 : -0.1))
        );
        gs.push(new THREE.TubeGeometry(c, 14, 0.035 + (i < 3 ? 0.008 : 0), 6, false));
      }
      return mergeGeos(gs);
    }

    // ── ESTERNO ──
    case 'sternum': {
      const s = new THREE.Shape();
      s.moveTo(-0.12, 0.6); s.lineTo(0.12, 0.6); s.lineTo(0.1, -0.4);
      s.lineTo(0.04, -0.55); s.lineTo(-0.04, -0.55); s.lineTo(-0.1, -0.4); s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
    }

    // ── PELVE ──
    case 'pelvis': {
      const s = new THREE.Shape();
      s.moveTo(-0.8, 0.35); s.quadraticCurveTo(-0.9, 0, -0.7, -0.35);
      s.lineTo(-0.2, -0.4); s.quadraticCurveTo(0, -0.45, 0.2, -0.4);
      s.lineTo(0.7, -0.35); s.quadraticCurveTo(0.9, 0, 0.8, 0.35);
      s.quadraticCurveTo(0, 0.5, -0.8, 0.35);
      return new THREE.ExtrudeGeometry(s, { depth: 0.55, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 });
    }

    // ── ESCÁPULA ──
    case 'scap-L': {
      const s = new THREE.Shape(); s.moveTo(0, 0.55); s.lineTo(-0.4, -0.45); s.lineTo(0.25, -0.45); s.lineTo(0.35, 0.1); s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
    }
    case 'scap-R': {
      const s = new THREE.Shape(); s.moveTo(0, 0.55); s.lineTo(0.4, -0.45); s.lineTo(-0.25, -0.45); s.lineTo(-0.35, 0.1); s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
    }

    // ── CLAVÍCULA ──
    case 'clav-L': {
      const c = new THREE.CubicBezierCurve3(new THREE.Vector3(0,0,0), new THREE.Vector3(-0.3,0.05,0.1), new THREE.Vector3(-0.6,-0.05,0.05), new THREE.Vector3(-0.85,0,0));
      return new THREE.TubeGeometry(c, 16, 0.06, 8, false);
    }
    case 'clav-R': {
      const c = new THREE.CubicBezierCurve3(new THREE.Vector3(0,0,0), new THREE.Vector3(0.3,0.05,0.1), new THREE.Vector3(0.6,-0.05,0.05), new THREE.Vector3(0.85,0,0));
      return new THREE.TubeGeometry(c, 16, 0.06, 8, false);
    }

    // ── ÚMERO ──
    case 'hum-L': case 'hum-R': {
      const d = type === 'hum-L' ? -1 : 1;
      return mergeGeos([
        new THREE.CylinderGeometry(0.12, 0.16, 2.0, 10),
        tG(new THREE.SphereGeometry(0.15, 10, 10), d * 0.04, 1.05, 0),
      ]);
    }

    // ── ANTEBRAÇO ──
    case 'forearm-L': case 'forearm-R': {
      const d = type === 'forearm-L' ? -1 : 1;
      return mergeGeos([
        tG(new THREE.CylinderGeometry(0.07, 0.1, 1.6, 8), d * -0.06, 0, 0.04),
        tG(new THREE.CylinderGeometry(0.09, 0.06, 1.7, 8), d * 0.06, 0, -0.04),
      ]);
    }

    // ── MÃO ──
    case 'hand-L': case 'hand-R': {
      const d = type === 'hand-L' ? -1 : 1;
      const gs = [new THREE.BoxGeometry(0.35, 0.45, 0.12)];
      for (let f = 0; f < 5; f++) {
        const x = (f - 2) * 0.07 * d;
        const len = f === 2 ? 0.32 : f === 0 ? 0.2 : 0.27;
        gs.push(tG(new THREE.CylinderGeometry(0.022, 0.018, len, 6), x, -0.22 - len / 2, 0));
      }
      return mergeGeos(gs);
    }

    // ── FÊMUR ──
    case 'fem-L': case 'fem-R': {
      const d = type === 'fem-L' ? -1 : 1;
      return mergeGeos([
        new THREE.CylinderGeometry(0.15, 0.19, 2.4, 12),
        tG(new THREE.SphereGeometry(0.17, 12, 12), d * 0.13, 1.25, 0),
      ]);
    }

    // ── PATELA ──
    case 'patella': { const g = new THREE.SphereGeometry(0.15, 12, 12); g.scale(1.1, 1, 0.55); return g; }

    // ── PERNA ──
    case 'leg-L': case 'leg-R': {
      const d = type === 'leg-L' ? -1 : 1;
      return mergeGeos([
        tG(new THREE.CylinderGeometry(0.13, 0.09, 2.2, 10), d * -0.04, 0, 0.02),
        tG(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 8), d * 0.14, -0.05, -0.02),
      ]);
    }

    // ── PÉ ──
    case 'foot-L': case 'foot-R': {
      const gs = [
        tG(new THREE.BoxGeometry(0.22, 0.18, 0.32), 0, 0, -0.08),
        tG(new THREE.BoxGeometry(0.32, 0.1, 0.38), 0, -0.04, 0.22),
      ];
      for (let t = 0; t < 5; t++) gs.push(tG(new THREE.CylinderGeometry(0.018, 0.014, 0.13, 6), (t - 2) * 0.06, -0.05, 0.46));
      return mergeGeos(gs);
    }

    // ── MÚSCULOS ──
    case 'deltoid-L': case 'deltoid-R': { const g = new THREE.SphereGeometry(0.32, 16, 16); g.scale(0.7, 0.9, 0.55); return g; }
    case 'pectoral-L': case 'pectoral-R': { const g = new THREE.SphereGeometry(0.38, 16, 12); g.scale(1.05, 0.6, 0.35); return g; }

    case 'biceps-L': case 'biceps-R':
      return sG(new THREE.CylinderGeometry(0.11, 0.08, 1.6, 10), 1, 1, 0.6);

    case 'triceps-L': case 'triceps-R':
      return mergeGeos([
        tG(sG(new THREE.CylinderGeometry(0.09, 0.07, 1.5, 8), 1, 1, 0.55), -0.04, 0, 0),
        tG(sG(new THREE.CylinderGeometry(0.08, 0.06, 1.4, 8), 1, 1, 0.5), 0.05, 0.03, 0),
      ]);

    case 'trapezius':
      return mergeGeos([
        sG(new THREE.CylinderGeometry(0.6, 0.3, 0.18, 12), 1, 1, 1),
        tG(sG(new THREE.CylinderGeometry(0.3, 0.5, 0.15, 12), 1, 1, 1), 0, -0.8, 0),
      ]);

    case 'rectus-abdominis': {
      const gs = [];
      for (let r = 0; r < 4; r++) {
        gs.push(tG(sG(new THREE.BoxGeometry(0.2, 0.32, 0.12), 1, 1, 1), -0.12, 0.55 - r * 0.38, 0));
        gs.push(tG(sG(new THREE.BoxGeometry(0.2, 0.32, 0.12), 1, 1, 1), 0.12, 0.55 - r * 0.38, 0));
      }
      return mergeGeos(gs);
    }

    case 'obliques-L': case 'obliques-R':
      return sG(new THREE.CylinderGeometry(0.22, 0.18, 1.3, 10), 0.5, 1, 0.35);

    case 'quadriceps-L': case 'quadriceps-R':
      return mergeGeos([
        tG(sG(new THREE.CylinderGeometry(0.13, 0.09, 1.8, 10), 1, 1, 0.65), 0, 0, 0.07),
        tG(sG(new THREE.CylinderGeometry(0.11, 0.08, 1.7, 10), 1, 1, 0.55), -0.14, -0.04, 0),
        tG(sG(new THREE.CylinderGeometry(0.09, 0.1, 1.5, 10), 1, 1, 0.55), 0.11, -0.08, 0.04),
      ]);

    case 'hamstrings-L': case 'hamstrings-R':
      return mergeGeos([
        tG(sG(new THREE.CylinderGeometry(0.09, 0.07, 1.8, 8), 1, 1, 0.55), -0.08, 0, 0),
        tG(sG(new THREE.CylinderGeometry(0.06, 0.04, 1.9, 8), 1, 1, 0.5), 0.02, 0, 0),
        tG(sG(new THREE.CylinderGeometry(0.08, 0.06, 1.7, 8), 1, 1, 0.6), 0.1, 0.04, 0),
      ]);

    case 'calf-L': case 'calf-R':
      return mergeGeos([
        tG(sG(new THREE.CylinderGeometry(0.11, 0.05, 1.2, 10), 1, 1, 0.65), 0.04, 0.3, 0),
        tG(sG(new THREE.CylinderGeometry(0.1, 0.045, 1.1, 10), 1, 1, 0.6), -0.07, 0.25, 0),
        tG(sG(new THREE.CylinderGeometry(0.09, 0.05, 1.5, 10), 1, 1, 0.55), 0, -0.1, 0.04),
      ]);

    case 'glutes-L': case 'glutes-R':
      return mergeGeos([
        sG(new THREE.SphereGeometry(0.33, 12, 12), 1, 0.65, 0.55),
        tG(sG(new THREE.SphereGeometry(0.23, 10, 10), 1.2, 0.45, 0.45), -0.08, 0.22, 0.08),
      ]);

    case 'rotator-L': case 'rotator-R': { const g = new THREE.TorusGeometry(0.26, 0.07, 8, 16, Math.PI * 1.2); g.rotateX(Math.PI / 2); return g; }

    case 'adductors-L': case 'adductors-R':
      return mergeGeos([
        tG(sG(new THREE.CylinderGeometry(0.08, 0.06, 1.6, 8), 1, 1, 0.5), 0, 0, 0),
        tG(sG(new THREE.CylinderGeometry(0.07, 0.05, 1.4, 8), 1, 1, 0.45), 0.08, -0.06, 0.02),
        tG(sG(new THREE.CylinderGeometry(0.06, 0.04, 1.3, 8), 1, 1, 0.4), -0.06, -0.1, 0.01),
      ]);

    case 'tibialis-L': case 'tibialis-R':
      return sG(new THREE.CylinderGeometry(0.07, 0.04, 1.8, 8), 1, 1, 0.5);

    // ── TENDÕES / LIGAMENTOS ──
    case 'cruciate-L': case 'cruciate-R': {
      const a = new THREE.CylinderGeometry(0.022, 0.022, 0.38, 6); a.rotateZ(0.28);
      const p = new THREE.CylinderGeometry(0.028, 0.028, 0.38, 6); p.rotateZ(-0.28);
      return mergeGeos([a, tG(p, 0, 0, -0.03)]);
    }
    case 'achilles-L': case 'achilles-R': {
      const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(0, 0, -0.07), new THREE.Vector3(0, -0.4, 0.04));
      return new THREE.TubeGeometry(c, 12, 0.038, 8, false);
    }
    case 'mcl-L': case 'mcl-R':
      return new THREE.CylinderGeometry(0.018, 0.025, 0.55, 6);
    case 'lcl-L': case 'lcl-R':
      return new THREE.CylinderGeometry(0.016, 0.022, 0.5, 6);
    case 'patellar-L': case 'patellar-R':
      return sG(new THREE.CylinderGeometry(0.035, 0.025, 0.5, 8), 1, 1, 0.5);
    case 'plantar-L': case 'plantar-R': {
      const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, -0.15), new THREE.Vector3(0, -0.05, 0.1), new THREE.Vector3(0, 0.02, 0.35));
      return new THREE.TubeGeometry(c, 12, 0.02, 6, false);
    }
    case 'discs': {
      const gs = [];
      for (let i = 0; i < 5; i++) gs.push(tG(new THREE.CylinderGeometry(0.2, 0.2, 0.07, 12), 0, i * 0.5, 0));
      return mergeGeos(gs);
    }
    case 'meniscus-L': case 'meniscus-R': {
      const g = new THREE.TorusGeometry(0.12, 0.03, 6, 16, Math.PI * 1.6);
      g.rotateX(Math.PI / 2);
      return g;
    }

    default: return new THREE.SphereGeometry(0.25, 16, 16);
  }
}

/* ═══════════════ ANATOMICAL DATABASE (50+ structures) ═══════════════ */

const STRUCTURES = [
  // ── ESQUELETO AXIAL ──
  { id: 'cranio', name: 'Crânio', category: 'Esqueleto Axial', position: [0, 7.2, 0], geometry: 'cranium', material: 'bone',
    description: 'Estrutura óssea composta por 22 ossos (8 cranianos + 14 faciais) unidos por suturas. Protege o encéfalo e abriga órgãos dos sentidos.',
    details: { 'Ossos cranianos': 'Frontal, Parietais (2), Temporais (2), Occipital, Esfenoide, Etmoide', 'Suturas': 'Sagital, Coronal, Lambdoide, Escamosa', 'Forames': 'Magno, Óptico, Jugular, Oval, Redondo, Espinhoso', 'Fossas cranianas': 'Anterior, Média, Posterior', 'Referência clínica': 'Pterion — ponto frágil (art. meníngea média)', 'Testes especiais': 'Percussão craniana, Palpação de suturas' }
  },
  { id: 'cervical', name: 'Coluna Cervical (C1-C7)', category: 'Esqueleto Axial', position: [0, 6.0, -0.15], geometry: 'vert-cervical', material: 'bone',
    description: 'Sete vértebras cervicais — região mais móvel da coluna. C1 (Atlas) sem corpo, C2 (Áxis) com dente, C7 proeminente.',
    details: { 'Vértebras': 'C1 (Atlas), C2 (Áxis), C3-C6 típicas, C7 (Proeminente)', 'Curvatura': 'Lordose cervical', 'ADM': 'Flexão 80°, Extensão 50°, Rotação 90°, Inclinação 45°', 'Plexo cervical': 'C1-C4 (sensitivo + motor)', 'Patologias': 'Hérnia cervical, Cervicobraquialgia, Whiplash', 'Testes especiais': 'Spurling, Distração cervical, Lhermitte, Adson' }
  },
  { id: 'toracica', name: 'Coluna Torácica (T1-T12)', category: 'Esqueleto Axial', position: [0, 4.0, -0.3], geometry: 'vert-thoracic', material: 'boneDark',
    description: 'Doze vértebras torácicas articuladas com costelas. Cifose torácica, mobilidade principalmente rotatória.',
    details: { 'Vértebras': 'T1-T12 com facetas costais', 'Curvatura': 'Cifose (côncava anterior)', 'Articulações': 'Costovertebrais + Costotransversárias', 'Inervação': 'Nervos intercostais T1-T12', 'Patologias': 'Cifose de Scheuermann, Fraturas compressão', 'Testes especiais': 'Teste de Adams (escoliose)' }
  },
  { id: 'lombar', name: 'Coluna Lombar (L1-L5)', category: 'Esqueleto Axial', position: [0, 2.0, -0.2], geometry: 'vert-lumbar', material: 'bone',
    description: 'Cinco vértebras lombares — as mais robustas. Suportam 60-80% do peso corporal.',
    details: { 'Vértebras': 'L1-L5 (corpo largo e robusto)', 'ADM': 'Flexão 60°, Extensão 25°, Rotação 5°', 'Disco L4-L5': 'Maior espessura, maior índice de herniação', 'Cauda equina': 'Abaixo de L1-L2', 'Patologias': 'Hérnia discal (L4-L5, L5-S1), Estenose, Espondilolistese', 'Testes especiais': 'Lasègue (SLR), Slump, Schober, Valsalva' }
  },
  { id: 'sacro', name: 'Sacro e Cóccix', category: 'Esqueleto Axial', position: [0, 0.6, -0.15], geometry: 'sacrum', material: 'boneDark',
    description: 'Osso triangular — fusão de 5 vértebras sacrais. Plexo sacral (nervo ciático).',
    details: { 'Composição': '5 sacrais fundidas + 3-5 coccígeas', 'Articulações': 'Lombossacral, Sacroilíacas, Sacrococcígea', 'Plexo sacral': 'L4-S3 → nervo ciático', 'Patologias': 'Sacroileíte, Coccigodinia, Disfunção SI', 'Testes especiais': 'Gaenslen, FABER (Patrick), Compressão SI' }
  },
  { id: 'costR', name: 'Costelas Direitas', category: 'Esqueleto Axial', position: [0.8, 4.0, 0.1], geometry: 'ribs-R', material: 'boneDark',
    description: '12 pares: verdadeiras (1-7), falsas (8-10), flutuantes (11-12). Caixa torácica com mecânica respiratória.',
    details: { 'Verdadeiras': '1ª-7ª → esterno', 'Falsas': '8ª-10ª → 7º arco costal', 'Flutuantes': '11ª-12ª livres', 'Mecânica': 'Alça de balde + Braço de bomba', 'Patologias': 'Fratura, Costocondrite, Tietze' }
  },
  { id: 'costL', name: 'Costelas Esquerdas', category: 'Esqueleto Axial', position: [-0.8, 4.0, 0.1], geometry: 'ribs-L', material: 'boneDark',
    description: 'Espelho das costelas direitas. Protegem coração e pulmões.',
    details: { 'Estrutura': 'Cabeça, Colo, Tubérculo, Corpo, Ângulo costal', 'Nervo intercostal': 'Sulco costal (face inferior)' }
  },
  { id: 'esterno', name: 'Esterno', category: 'Esqueleto Axial', position: [0, 4.2, 0.6], geometry: 'sternum', material: 'bone',
    description: 'Osso plano: manúbrio, corpo e xifoide. Ângulo de Louis = referência para 2ª costela.',
    details: { 'Manúbrio': 'Articula com clavícula + 1ª costela', 'Ângulo de Louis': 'Junção manúbrio-corpo → 2ª costela / T4-T5', 'Medula óssea': 'Rico em tecido hematopoiético' }
  },

  // ── ESQUELETO APENDICULAR ──
  { id: 'pelve', name: 'Pelve (Ilíaco)', category: 'Esqueleto Apendicular', position: [0, 0.2, 0], geometry: 'pelvis', material: 'bone',
    description: 'Cintura pélvica: ílio + ísquio + púbis + sacro. Centro de gravidade corporal.',
    details: { 'Acetábulo': 'Recebe cabeça femoral', 'EIAS': 'Espinha ilíaca ântero-superior (referência)', 'Articulações': 'Sacroilíacas, Sínfise púbica, Coxofemoral', 'Testes especiais': 'Trendelenburg, Thomas, Ober, FABER/FADIR' }
  },
  { id: 'scapL', name: 'Escápula Esquerda', category: 'Esqueleto Apendicular', position: [-1.3, 4.8, -0.6], geometry: 'scap-L', material: 'bone',
    description: 'Osso triangular plano — inserção de 17 músculos. Crucial para cinemática do ombro.',
    details: { 'Acidentes': 'Espinha, Acrômio, Coracoide, Glenoide', 'Ritmo escapuloumeral': '2:1 (120° GU + 60° ET)', 'Patologias': 'Escápula alada, Discinesia, Impacto subacromial' }
  },
  { id: 'scapR', name: 'Escápula Direita', category: 'Esqueleto Apendicular', position: [1.3, 4.8, -0.6], geometry: 'scap-R', material: 'bone',
    description: 'Espelho da escápula esquerda. Labrum aumenta profundidade da glenoide em 50%.',
    details: { 'Lábio glenoidal': 'Fibrocartilagem — ↑50% profundidade', 'Ângulo inferior': 'Nível T7 — referência postural' }
  },
  { id: 'clavL', name: 'Clavícula Esquerda', category: 'Esqueleto Apendicular', position: [-0.7, 5.5, 0.3], geometry: 'clav-L', material: 'bone',
    description: 'Osso "S" — primeiro a ossificar, mais fraturado. Conecta MS ao tronco.',
    details: { 'Articulações': 'Esternoclavicular, Acromioclavicular', 'Fratura': 'Junção terços médio/lateral', 'Ligamentos': 'Coracoclavicular (conoide + trapezoide)' }
  },
  { id: 'clavR', name: 'Clavícula Direita', category: 'Esqueleto Apendicular', position: [0.7, 5.5, 0.3], geometry: 'clav-R', material: 'bone',
    description: 'Espelho. Totalmente subcutânea — palpável em toda extensão.',
    details: { 'Palpação': 'Subcutânea toda extensão', 'Ossificação': 'Intramembranosa (exceção)' }
  },
  { id: 'humL', name: 'Úmero Esquerdo', category: 'Esqueleto Apendicular', position: [-2.0, 3.6, 0], geometry: 'hum-L', material: 'bone',
    description: 'Osso longo do braço. Glenoumeral (3 GL) + cotovelo.',
    details: { 'Proximal': 'Cabeça, Colo anatômico/cirúrgico, Tubérculos', 'Nervos': 'Axilar (colo), Radial (sulco), Ulnar (epicôndilo med)', 'Patologias': 'Fratura colo, Epicondilite, Tendinite bicipital', 'Irrigação': 'Circunflexas umerais ant + post' }
  },
  { id: 'humR', name: 'Úmero Direito', category: 'Esqueleto Apendicular', position: [2.0, 3.6, 0], geometry: 'hum-R', material: 'bone',
    description: 'Espelho do úmero esquerdo.',
    details: { 'SITS': 'Supraespinal, Infraespinal, Redondo menor, Subescapular', 'Testes': 'Neer (impacto), Jobe (supra), Patte (infra)' }
  },
  { id: 'frmL', name: 'Rádio e Ulna Esq.', category: 'Esqueleto Apendicular', position: [-2.3, 1.8, 0.3], geometry: 'forearm-L', material: 'boneDark',
    description: 'Rádio (lat) + Ulna (med). Pronação/supinação: rádio cruza sobre ulna.',
    details: { 'Rádio': 'Cabeça, Estiloide', 'Ulna': 'Olécrano, Incisura troclear, Coronoide', 'Membrana interóssea': 'Transmissão de forças', 'Patologias': 'Colles, Smith, Túnel cubital' }
  },
  { id: 'frmR', name: 'Rádio e Ulna Dir.', category: 'Esqueleto Apendicular', position: [2.3, 1.8, 0.3], geometry: 'forearm-R', material: 'boneDark',
    description: 'Espelho do antebraço esquerdo.',
    details: { 'Tabaqueira anatômica': 'Tendões extensores polegar', 'Escafoide': 'Risco necrose avascular' }
  },
  { id: 'handL', name: 'Mão Esquerda', category: 'Esqueleto Apendicular', position: [-2.5, 0.3, 0.5], geometry: 'hand-L', material: 'bone',
    description: '27 ossos: 8 carpais, 5 metacarpais, 14 falanges.',
    details: { 'Carpo proximal': 'Escafoide, Semilunar, Piramidal, Pisiforme', 'Carpo distal': 'Trapézio, Trapezoide, Capitato, Hamato', 'Túnel do carpo': 'Retináculo + carpais → n. mediano', 'Testes': 'Phalen, Tinel, Finkelstein, Allen' }
  },
  { id: 'handR', name: 'Mão Direita', category: 'Esqueleto Apendicular', position: [2.5, 0.3, 0.5], geometry: 'hand-R', material: 'bone',
    description: 'Espelho da mão esquerda.',
    details: { 'Preensão de força': 'Flex. extrínsecos + intrínsecos', 'Preensão de precisão': 'Oponência do polegar' }
  },
  { id: 'femL', name: 'Fêmur Esquerdo', category: 'Esqueleto Apendicular', position: [-0.6, -1.8, 0], geometry: 'fem-L', material: 'bone',
    description: 'Maior osso (~45cm). Ângulo de inclinação ~125°.',
    details: { 'Proximal': 'Cabeça (fóvea), Colo, Trocanteres', 'Ângulo inclinação': '~125° (vara <120°, valga >135°)', 'Linha áspera': 'Inserção adutores/vastos', 'Patologias': 'Fratura colo, Necrose avascular, FAI', 'Testes': 'Trendelenburg, Thomas, Ober, FABER, FADIR, Log roll' }
  },
  { id: 'femR', name: 'Fêmur Direito', category: 'Esqueleto Apendicular', position: [0.6, -1.8, 0], geometry: 'fem-R', material: 'bone',
    description: 'Espelho do fêmur esquerdo.',
    details: { 'Triângulo Ward': 'Região frágil do colo', 'Ângulo Q': '~15° (EIAS → patela → tub. tibial)' }
  },
  { id: 'patL', name: 'Patela Esquerda', category: 'Articulações', position: [-0.6, -3.3, 0.5], geometry: 'patella', material: 'bone',
    description: 'Maior sesamoide. ↑ vantagem mecânica do quadríceps 30-50%.',
    details: { 'Facetas': 'Medial + Lateral → face patelar fêmur', 'Patologias': 'Condromalácia, Luxação recorrente, Osgood-Schlatter', 'Testes': 'Clarke, Apprehension, Gaveta patelar' }
  },
  { id: 'patR', name: 'Patela Direita', category: 'Articulações', position: [0.6, -3.3, 0.5], geometry: 'patella', material: 'bone',
    description: 'Espelho da patela esquerda.',
    details: { 'Biomecânica': '↑ braço de momento quadríceps 30-50%' }
  },
  { id: 'legL', name: 'Tíbia e Fíbula Esq.', category: 'Esqueleto Apendicular', position: [-0.6, -5.0, 0], geometry: 'leg-L', material: 'bone',
    description: 'Tíbia suporta peso; fíbula fixa músculos. N. fibular na cabeça (footdrop!).',
    details: { 'Tíbia': 'Platô, Tuberosidade, Maléolo medial', 'Fíbula': 'Cabeça → n. fibular!', 'Testes': 'Lachman, Gaveta, McMurray, Apley, Varo/Valgo' }
  },
  { id: 'legR', name: 'Tíbia e Fíbula Dir.', category: 'Esqueleto Apendicular', position: [0.6, -5.0, 0], geometry: 'leg-R', material: 'bone',
    description: 'Espelho da perna esquerda.',
    details: { 'Crista tibial': 'Subcutânea (palpável)', 'Sindesmose': 'Tibiofibular distal' }
  },
  { id: 'footL', name: 'Pé Esquerdo', category: 'Esqueleto Apendicular', position: [-0.6, -7.0, 0.5], geometry: 'foot-L', material: 'bone',
    description: '26 ossos, 33 articulações. Sustenta peso, absorve impacto, propulsão.',
    details: { 'Tarso': 'Tálus, Calcâneo, Navicular, Cuboide, Cuneiformes', 'Arcos': 'Longitudinal medial, Lateral, Transverso', 'Patologias': 'Fascite plantar, Entorse, Hálux valgo', 'Testes': 'Gaveta ant, Thompson, Windlass' }
  },
  { id: 'footR', name: 'Pé Direito', category: 'Esqueleto Apendicular', position: [0.6, -7.0, 0.5], geometry: 'foot-R', material: 'bone',
    description: 'Espelho do pé esquerdo.',
    details: { 'Tendão Aquiles': 'O mais forte do corpo', 'Thompson': 'Compressão sem flexão plantar = ruptura' }
  },

  // ── MÚSCULOS (BILATERAIS) ──
  { id: 'deltL', name: 'Deltóide Esquerdo', category: 'Músculos', position: [-1.8, 5.0, 0.2], geometry: 'deltoid-L', material: 'muscle',
    description: '3 feixes envolvendo o ombro. Anterior: flexão. Médio: abdução. Posterior: extensão.',
    details: { 'Anterior': '1/3 lat clavícula → Flexão + RM', 'Médio': 'Acrômio → Abdução pura', 'Posterior': 'Espinha escapular → Extensão + RL', 'Inserção': 'Tuberosidade deltóidea (V deltóideo)', 'Inervação': 'N. axilar (C5-C6)', 'Irrigação': 'Art. circunflexa post úmero' }
  },
  { id: 'deltR', name: 'Deltóide Direito', category: 'Músculos', position: [1.8, 5.0, 0.2], geometry: 'deltoid-R', material: 'muscle',
    description: 'Espelho do deltóide esquerdo.',
    details: { 'Teste': 'Abdução resistida 90°', 'Inervação': 'N. axilar (C5-C6)' }
  },
  { id: 'peitL', name: 'Peitoral Maior Esq.', category: 'Músculos', position: [-0.55, 4.6, 0.7], geometry: 'pectoral-L', material: 'muscle',
    description: 'Feixe clavicular (flexão) + esternal (adução). Principal rotador medial do ombro.',
    details: { 'Clavicular': '2/3 med clavícula → Flexão', 'Esternal': 'Esterno + cart 1-6 → Adução', 'Inserção': 'Crista tubérculo maior (fibras torcidas)', 'Inervação': 'Nn. peitorais med + lat (C5-T1)', 'Irrigação': 'Art. toracoacromial' }
  },
  { id: 'peitR', name: 'Peitoral Maior Dir.', category: 'Músculos', position: [0.55, 4.6, 0.7], geometry: 'pectoral-R', material: 'muscle',
    description: 'Espelho do peitoral esquerdo.',
    details: { 'Função': 'Adução + RM + Flexão MS', 'Inervação': 'Nn. peitorais (C5-T1)' }
  },
  { id: 'bicL', name: 'Bíceps Braquial Esq.', category: 'Músculos', position: [-2.0, 3.5, 0.35], geometry: 'biceps-L', material: 'muscle',
    description: 'Biarticular: CL (tub. supraglenoide) + CC (coracoide). Flexão cotovelo + supinação.',
    details: { 'Cabeça longa': 'Tub. supraglenoide → Sulco intertubercular', 'Cabeça curta': 'Processo coracoide', 'Inserção': 'Tuberosidade bicipital do rádio + Aponeurose bicipital', 'Inervação': 'N. musculocutâneo (C5-C6)', 'Patologias': 'Tendinite CL, Ruptura distal, SLAP lesion', 'Testes': 'Speed, Yergason, O\'Brien (SLAP)' }
  },
  { id: 'bicR', name: 'Bíceps Braquial Dir.', category: 'Músculos', position: [2.0, 3.5, 0.35], geometry: 'biceps-R', material: 'muscle',
    description: 'Espelho do bíceps esquerdo.',
    details: { 'Função': 'Flexão cotovelo + Supinação', 'Inervação': 'N. musculocutâneo (C5-C6)' }
  },
  { id: 'triL', name: 'Tríceps Braquial Esq.', category: 'Músculos', position: [-2.0, 3.5, -0.35], geometry: 'triceps-L', material: 'muscleDark',
    description: '3 cabeças: longa (tub. infraglenoide), lateral e medial (úmero). Extensor do cotovelo.',
    details: { 'Cabeça longa': 'Tub. infraglenoide (biarticular)', 'Lateral': 'Face posterior úmero (acima sulco)', 'Medial': 'Face posterior úmero (abaixo sulco)', 'Inserção': 'Olécrano da ulna', 'Inervação': 'N. radial (C6-C8)', 'Teste': 'Extensão resistida cotovelo' }
  },
  { id: 'triR', name: 'Tríceps Braquial Dir.', category: 'Músculos', position: [2.0, 3.5, -0.35], geometry: 'triceps-R', material: 'muscleDark',
    description: 'Espelho do tríceps esquerdo.',
    details: { 'Função': 'Extensão cotovelo', 'Inervação': 'N. radial (C6-C8)' }
  },
  { id: 'trap', name: 'Trapézio', category: 'Músculos', position: [0, 5.2, -0.55], geometry: 'trapezius', material: 'muscleDark',
    description: 'Grande músculo posterior: fibras superiores (elevação), médias (retração), inferiores (depressão escapular).',
    details: { 'Superiores': 'Occipital + lig. nucal → 1/3 lat clavícula | Elevação escapular', 'Médias': 'T1-T5 → Acrômio + espinha escapular | Retração', 'Inferiores': 'T6-T12 → Espinha escapular (med) | Depressão', 'Inervação': 'N. acessório (XI) + C3-C4', 'Patologias': 'Pontos-gatilho, Cefaleia tensional, Dor cervical crônica' }
  },
  { id: 'abdm', name: 'Reto Abdominal', category: 'Músculos', position: [0, 2.2, 0.65], geometry: 'rectus-abdominis', material: 'muscle',
    description: '6-pack: 4 pares de ventres separados por inscrições tendíneas. Flexão do tronco + pressão intra-abdominal.',
    details: { 'Origem': '5ª-7ª cartilagens costais + Proc. xifoide', 'Inserção': 'Crista e sínfise púbica', 'Inscrições tendíneas': '3-4 faixas transversais (criam os "gomos")', 'Inervação': 'Nn. intercostais T7-T12', 'Bainha do reto': 'Aponeuroses dos oblíquos + transverso', 'Teste': 'Curl-up resistido' }
  },
  { id: 'oblL', name: 'Oblíquos Esquerdos', category: 'Músculos', position: [-0.55, 2.2, 0.4], geometry: 'obliques-L', material: 'muscleDark',
    description: 'Oblíquo externo (sup) + interno (prof). Rotação e inclinação lateral do tronco + estabilização core.',
    details: { 'Externo': 'Costelas 5-12 → Crista ilíaca + linha alba | Rotação contralateral', 'Interno': 'Crista ilíaca + fáscia toracolombar → Costelas 10-12 | Rotação ipsilateral', 'Função conjunta': 'Flexão tronco + ↑ pressão intra-abdominal', 'Inervação': 'Nn. intercostais T7-L1', 'Teste': 'Rotação resistida do tronco' }
  },
  { id: 'oblR', name: 'Oblíquos Direitos', category: 'Músculos', position: [0.55, 2.2, 0.4], geometry: 'obliques-R', material: 'muscleDark',
    description: 'Espelho dos oblíquos esquerdos.',
    details: { 'Sinergia': 'Oblíquo externo D + interno E = rotação para esquerda', 'Inervação': 'Nn. intercostais T7-L1' }
  },
  { id: 'quadL', name: 'Quadríceps Esquerdo', category: 'Músculos', position: [-0.7, -2.2, 0.4], geometry: 'quadriceps-L', material: 'muscle',
    description: 'RF (biarticular) + VL + VM (VMO) + VI. O mais potente extensor do joelho.',
    details: { 'Reto femoral': 'EIAI → biarticular', 'Vasto lateral': 'Linha áspera (lat) → maior volume', 'VMO': 'Linha áspera (med) → estabilização patelar', 'Inserção final': 'Tend. quadricipital → Patela → Lig. patelar → Tub. tibial', 'Inervação': 'N. femoral (L2-L4)', 'Teste': 'Extensão resistida joelho, Ely test' }
  },
  { id: 'quadR', name: 'Quadríceps Direito', category: 'Músculos', position: [0.7, -2.2, 0.4], geometry: 'quadriceps-R', material: 'muscle',
    description: 'Espelho do quadríceps esquerdo.',
    details: { 'Função': 'Extensão joelho + Flexão quadril (RF)', 'Inervação': 'N. femoral (L2-L4)' }
  },
  { id: 'hamL', name: 'Isquiotibiais Esq.', category: 'Músculos', position: [-0.7, -2.2, -0.4], geometry: 'hamstrings-L', material: 'muscleDark',
    description: 'Bíceps femoral + Semitendíneo + Semimembranoso. Flexão joelho + extensão quadril.',
    details: { 'Bíceps femoral': 'CL (tub. isquiática) + CC (linha áspera) → Cabeça fíbula', 'Semitendíneo': 'Tub. isquiática → Pata de ganso', 'Semimembranoso': 'Tub. isquiática → Côndilo med tíbia', 'Pata de ganso': 'Semitendíneo + Grácil + Sartório', 'Inervação': 'N. ciático (div. tibial + fibular)', 'Testes': 'Lasègue, 90/90, Slump' }
  },
  { id: 'hamR', name: 'Isquiotibiais Dir.', category: 'Músculos', position: [0.7, -2.2, -0.4], geometry: 'hamstrings-R', material: 'muscleDark',
    description: 'Espelho dos isquiotibiais esquerdos.',
    details: { 'Patologias': 'Lesão muscular I-III, Tendinopatia proximal', 'Inervação': 'N. ciático' }
  },
  { id: 'gastL', name: 'Tríceps Sural Esq.', category: 'Músculos', position: [-0.6, -4.8, -0.3], geometry: 'calf-L', material: 'muscle',
    description: 'Gastrocnêmio (biarticular) + Sóleo (mono) → Tendão de Aquiles.',
    details: { 'Gastroc med': 'Côndilo medial fêmur', 'Gastroc lat': 'Côndilo lateral fêmur', 'Sóleo': 'Linha do sóleo + cabeça fíbula', 'Inserção': 'Tendão calcâneo → tub. calcâneo', 'Inervação': 'N. tibial (S1-S2)', 'Testes': 'Thompson, Silfverskiöld' }
  },
  { id: 'gastR', name: 'Tríceps Sural Dir.', category: 'Músculos', position: [0.6, -4.8, -0.3], geometry: 'calf-R', material: 'muscle',
    description: 'Espelho do tríceps sural esquerdo.',
    details: { 'Bomba sural': 'Retorno venoso MMII', 'Inervação': 'N. tibial (S1-S2)' }
  },
  { id: 'glutL', name: 'Glúteos Esquerdos', category: 'Músculos', position: [-0.8, 0.1, -0.5], geometry: 'glutes-L', material: 'muscleDark',
    description: 'Máximo: o maior músculo (extensão). Médio: estabilizador pélvico (Trendelenburg).',
    details: { 'Máximo': 'Sacro + ílio post → TIT + Tub. glútea | Extensão + RL', 'Médio': 'Face lat ílio → Trocanter maior | Abdução', 'Mínimo': 'Profundo ao médio | Estabilização', 'N. glúteo inferior': 'L5-S2 → Máximo', 'N. glúteo superior': 'L4-S1 → Médio + Mínimo', 'Testes': 'Trendelenburg, Ponte, Step-down' }
  },
  { id: 'glutR', name: 'Glúteos Direitos', category: 'Músculos', position: [0.8, 0.1, -0.5], geometry: 'glutes-R', material: 'muscleDark',
    description: 'Espelho dos glúteos esquerdos.',
    details: { 'Função': 'Extensão + RL + Abdução quadril', 'Testes': 'Trendelenburg, Ponte glútea' }
  },
  { id: 'rotL', name: 'Manguito Rotador Esq.', category: 'Músculos', position: [-1.5, 5.0, -0.5], geometry: 'rotator-L', material: 'muscleDark',
    description: 'SITS: Supraespinal + Infraespinal + Redondo menor + Subescapular. Estabilizam glenoumeral.',
    details: { 'Supraespinal': 'Fossa supra → Tub. maior (sup) | Abd 0-15° | N. supraescapular', 'Infraespinal': 'Fossa infra → Tub. maior (méd) | RL | N. supraescapular', 'Redondo menor': 'Borda lat → Tub. maior (inf) | RL | N. axilar', 'Subescapular': 'Fossa sub → Tub. menor | RM | Nn. subescapulares', 'Zona crítica': 'Área avascular supraespinal (1cm med)', 'Testes': 'Jobe, Patte, Lift-off, Bear hug, Neer, Hawkins' }
  },
  { id: 'rotR', name: 'Manguito Rotador Dir.', category: 'Músculos', position: [1.5, 5.0, -0.5], geometry: 'rotator-R', material: 'muscleDark',
    description: 'Espelho do manguito rotador esquerdo.',
    details: { 'SITS': 'Supraespinal, Infraespinal, Redondo menor, Subescapular', 'Testes': 'Jobe (supra), Patte (infra), Lift-off (sub)' }
  },
  { id: 'adL', name: 'Adutores Esquerdos', category: 'Músculos', position: [-0.45, -1.8, 0.2], geometry: 'adductors-L', material: 'muscleDark',
    description: 'Longo, Curto, Magno, Grácil, Pectíneo. Adução do quadril + estabilização pélvica.',
    details: { 'Adutor longo': 'Corpo púbis → 1/3 méd linha áspera', 'Adutor curto': 'Ramo inf púbis → Linha pectínea', 'Adutor magno': 'Ramo isquiopúbico → Linha áspera + Tubérculo adutor', 'Grácil': 'Sínfise → Pata de ganso (único biarticular)', 'Inervação': 'N. obturatório (L2-L4)', 'Patologias': 'Pubalgia, Lesão muscular de adutores' }
  },
  { id: 'adR', name: 'Adutores Direitos', category: 'Músculos', position: [0.45, -1.8, 0.2], geometry: 'adductors-R', material: 'muscleDark',
    description: 'Espelho dos adutores esquerdos.',
    details: { 'Função': 'Adução quadril + estabilização', 'Inervação': 'N. obturatório (L2-L4)' }
  },
  { id: 'tibL', name: 'Tibial Anterior Esq.', category: 'Músculos', position: [-0.48, -5.0, 0.28], geometry: 'tibialis-L', material: 'muscle',
    description: 'Principal dorsiflexor do tornozelo e inversor do pé. Marcha — evita o "pé caído".',
    details: { 'Origem': '2/3 proximais face lat da tíbia + membrana interóssea', 'Inserção': 'Cuneiforme medial + base do 1º metatarso', 'Inervação': 'N. fibular profundo (L4-L5)', 'Função': 'Dorsiflexão + Inversão', 'Patologias': 'Canelite, Síndrome compartimental anterior, Foot drop', 'Teste': 'Dorsiflexão resistida' }
  },
  { id: 'tibR', name: 'Tibial Anterior Dir.', category: 'Músculos', position: [0.48, -5.0, 0.28], geometry: 'tibialis-R', material: 'muscle',
    description: 'Espelho do tibial anterior esquerdo.',
    details: { 'Função': 'Dorsiflexão + Inversão', 'Foot drop': 'Lesão n. fibular profundo → perda dorsiflexão' }
  },

  // ── ARTICULAÇÕES / TENDÕES / LIGAMENTOS (BILATERAIS) ──
  { id: 'lcaL', name: 'Lig. Cruzados Joelho Esq.', category: 'Articulações', position: [-0.6, -3.5, 0], geometry: 'cruciate-L', material: 'ligament',
    description: 'LCA resiste translação anterior da tíbia; LCP resiste translação posterior.',
    details: { 'LCA': 'Côndilo lat fem → Área intercondilar ant tíbia', 'LCP': 'Côndilo med fem → Área intercondilar post tíbia', 'Mecanismo LCA': 'Rotação + valgo + hiperextensão (82%)', 'Testes LCA': 'Lachman (mais sensível), Gaveta ant, Pivot shift', 'Testes LCP': 'Gaveta post, Sag sign' }
  },
  { id: 'lcaR', name: 'Lig. Cruzados Joelho Dir.', category: 'Articulações', position: [0.6, -3.5, 0], geometry: 'cruciate-R', material: 'ligament',
    description: 'Espelho dos cruzados esquerdos.',
    details: { 'LCA': 'Lesão mais comum do joelho em esporte', 'Meniscos': 'Medial (C) + Lateral (O) — amortecedores', 'Testes menisco': 'McMurray, Apley, Thessaly' }
  },
  { id: 'mclL', name: 'LCM Joelho Esq.', category: 'Tendões/Ligamentos', position: [-0.45, -3.5, 0.15], geometry: 'mcl-L', material: 'ligament',
    description: 'Ligamento colateral medial — resiste estresse em valgo. Associado à "tríade infeliz".',
    details: { 'Superficial': 'Epicôndilo med fem → Face med tíbia (6-8cm abaixo)', 'Profundo': 'Fixo ao menisco medial', 'Mecanismo': 'Estresse em valgo forçado', 'Tríade infeliz': 'LCM + LCA + Menisco medial', 'Teste': 'Estresse em valgo a 0° e 30°' }
  },
  { id: 'mclR', name: 'LCM Joelho Dir.', category: 'Tendões/Ligamentos', position: [0.45, -3.5, 0.15], geometry: 'mcl-R', material: 'ligament',
    description: 'Espelho do LCM esquerdo.',
    details: { 'Graus': 'I (estiramento), II (parcial), III (ruptura completa)', 'Teste': 'Valgo stress test' }
  },
  { id: 'lclL', name: 'LCL Joelho Esq.', category: 'Tendões/Ligamentos', position: [-0.75, -3.5, -0.1], geometry: 'lcl-L', material: 'ligament',
    description: 'Ligamento colateral lateral — resiste estresse em varo. Cordiforme (não fixo ao menisco).',
    details: { 'Trajeto': 'Epicôndilo lat fem → Cabeça fíbula', 'Nervo fibular': 'Passa próximo (risco lesão associada)', 'Teste': 'Estresse em varo a 0° e 30°' }
  },
  { id: 'lclR', name: 'LCL Joelho Dir.', category: 'Tendões/Ligamentos', position: [0.75, -3.5, -0.1], geometry: 'lcl-R', material: 'ligament',
    description: 'Espelho do LCL esquerdo.',
    details: { 'Diferença do LCM': 'Cordiforme, não fixo ao menisco lateral', 'Teste': 'Varo stress test' }
  },
  { id: 'patTenL', name: 'Tendão Patelar Esq.', category: 'Tendões/Ligamentos', position: [-0.6, -3.65, 0.45], geometry: 'patellar-L', material: 'tendon',
    description: 'Liga polo inferior da patela à tuberosidade tibial. Via final do mecanismo extensor.',
    details: { 'Trajeto': 'Polo inferior patela → Tub. tibial', 'Função': 'Via final extensão joelho', 'Patologias': 'Tendinopatia patelar (jumper\'s knee), Osgood-Schlatter (tração apófise)', 'Teste': 'Dor à palpação pólo inferior da patela' }
  },
  { id: 'patTenR', name: 'Tendão Patelar Dir.', category: 'Tendões/Ligamentos', position: [0.6, -3.65, 0.45], geometry: 'patellar-R', material: 'tendon',
    description: 'Espelho do tendão patelar esquerdo.',
    details: { 'Jumper\'s knee': 'Comum em esportes de salto', 'Tratamento': 'Excêntricos de declínio (squat declínio)' }
  },
  { id: 'achL', name: 'Tendão de Aquiles Esq.', category: 'Tendões/Ligamentos', position: [-0.6, -6.2, -0.3], geometry: 'achilles-L', material: 'tendon',
    description: 'O mais forte tendão (~15cm, até 12x peso corporal). Zona avascular a 2-6cm da inserção.',
    details: { 'Comprimento': '~12-15 cm', 'Resistência': 'Até 3.9 kN (~400 kgf)', 'Zona avascular': '2-6 cm do calcâneo (local ruptura)', 'Patologias': 'Tendinopatia, Ruptura, Bursitis', 'Testes': 'Thompson (squeeze), Matles, Simmonds', 'Reabilitação': 'Protocolo excêntrico de Alfredson' }
  },
  { id: 'achR', name: 'Tendão de Aquiles Dir.', category: 'Tendões/Ligamentos', position: [0.6, -6.2, -0.3], geometry: 'achilles-R', material: 'tendon',
    description: 'Espelho do tendão de Aquiles esquerdo.',
    details: { 'Teste Thompson': 'Compressão panturrilha sem flexão plantar = ruptura', 'Alfredson': 'Gold standard para tendinopatia' }
  },
  { id: 'plantL', name: 'Fáscia Plantar Esq.', category: 'Tendões/Ligamentos', position: [-0.6, -7.1, 0.3], geometry: 'plantar-L', material: 'tendon',
    description: 'Aponeurose plantar: tub. calcâneo → cabeças metatarsais. Mecanismo de molinete (windlass).',
    details: { 'Trajeto': 'Tub. calcâneo → Falanges proximais (5 bandas)', 'Mecanismo windlass': 'Dorsiflexão dedos → tensão fáscia → ↑ arco longitudinal', 'Patologias': 'Fascite plantar (dor matinal cedente), Esporão calcâneo', 'Testes': 'Windlass test, Palpação tub. medial calcâneo' }
  },
  { id: 'plantR', name: 'Fáscia Plantar Dir.', category: 'Tendões/Ligamentos', position: [0.6, -7.1, 0.3], geometry: 'plantar-R', material: 'tendon',
    description: 'Espelho da fáscia plantar esquerda.',
    details: { 'Tratamento': 'Alongamento fáscia + gastroc/sóleo, Ondas de choque', 'Windlass': 'Dorsiflexão hálux tensiona fáscia' }
  },
  { id: 'menL', name: 'Meniscos Joelho Esq.', category: 'Articulações', position: [-0.6, -3.35, 0.08], geometry: 'meniscus-L', material: 'cartilage',
    description: 'Medial (C) + Lateral (O): fibrocartilagem que absorve impacto, distribui peso e estabiliza o joelho.',
    details: { 'Medial': 'Forma de C, fixo ao LCM (menos móvel → mais lesionado)', 'Lateral': 'Forma de O, mais móvel (menos lesionado)', 'Vascularização': 'Zona vermelha (periférica), Branca (central avascular)', 'Mecanismos': 'Torção + carga axial → cisalhamento', 'Testes': 'McMurray, Apley compression, Thessaly' }
  },
  { id: 'menR', name: 'Meniscos Joelho Dir.', category: 'Articulações', position: [0.6, -3.35, 0.08], geometry: 'meniscus-R', material: 'cartilage',
    description: 'Espelho dos meniscos esquerdos.',
    details: { 'Reparo': 'Zona vermelha → sutura | Zona branca → meniscectomia parcial', 'Relevância': 'Preservar menisco = proteger cartilagem articular' }
  },
  { id: 'discos', name: 'Discos Intervertebrais', category: 'Articulações', position: [0.4, 3.0, -0.2], geometry: 'discs', material: 'cartilage',
    description: 'Fibrocartilagem: núcleo pulposo (gel) + anel fibroso (lamelas). Avascular — nutrição por difusão.',
    details: { 'Núcleo pulposo': '80% água, colágeno tipo II', 'Anel fibroso': 'Lamelas concêntricas, colágeno tipo I', 'Herniação': 'Posterolateral (anel + LLP mais finos)', 'Classificação': 'Pfirrmann (RM), Modic (placa terminal)', 'Patologias': 'Protrusão, Extrusão, Sequestro, Degeneração' }
  },
];

const CATEGORIES = [...new Set(STRUCTURES.map(s => s.category))];

/* ═══════════════ 3D COMPONENTS ═══════════════ */

function AnatomyMesh({ structure, isSelected, isHovered, onSelect, onHover }) {
  const meshRef = useRef();
  const [hover, setHover] = useState(false);
  const mat = MAT[structure.material] || MAT.bone;

  const baseCol = useMemo(() => new THREE.Color(mat.color), [mat.color]);
  const selCol  = useMemo(() => new THREE.Color('#0EA5E9'), []);
  const hovCol  = useMemo(() => { const c = new THREE.Color(mat.color); c.lerp(new THREE.Color('#38BDF8'), 0.35); return c; }, [mat.color]);
  const geo     = useMemo(() => buildGeo(structure.geometry), [structure.geometry]);

  useFrame(() => {
    if (!meshRef.current) return;
    const m = meshRef.current.material;
    const t = isSelected ? selCol : (hover || isHovered) ? hovCol : baseCol;
    m.color.lerp(t, 0.12);
    if (isSelected) {
      m.emissive.lerp(new THREE.Color('#0EA5E9'), 0.06);
      m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, 0.2, 0.1);
    } else {
      m.emissive.lerp(new THREE.Color('#000000'), 0.1);
      m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, 0, 0.1);
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geo}
      position={structure.position}
      onClick={e => { e.stopPropagation(); onSelect(structure.id); }}
      onPointerOver={e => { e.stopPropagation(); setHover(true); onHover(structure.id); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHover(false); onHover(null); document.body.style.cursor = 'auto'; }}
      castShadow receiveShadow
    >
      <meshPhysicalMaterial
        color={mat.color}
        roughness={mat.roughness}
        metalness={mat.metalness}
        clearcoat={mat.clearcoat || 0}
        clearcoatRoughness={mat.clearcoatRoughness || 0}
        sheen={mat.sheen || 0}
        sheenColor={mat.sheenColor || '#fff'}
        sheenRoughness={0.4}
        transparent={mat.transparent || false}
        opacity={mat.opacity || 1}
        emissive="#000000"
        emissiveIntensity={0}
      />
    </mesh>
  );
}

function Label({ structure, isSelected, isHovered }) {
  if (!isSelected && !isHovered) return null;
  const p = [structure.position[0], structure.position[1] + 0.6, structure.position[2]];
  return (
    <Html position={p} center>
      <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap pointer-events-none transition-all ${
        isSelected
          ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 scale-105'
          : 'bg-white/95 dark:bg-slate-800/95 text-slate-900 dark:text-white shadow-md backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50'
      }`}>
        {structure.name}
        {isSelected && <span className="block text-[10px] font-normal text-primary-200 mt-0.5">{structure.category}</span>}
      </div>
    </Html>
  );
}

function HoloRing() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.3;
    ref.current.material.opacity = 0.12 + Math.sin(clock.elapsedTime * 2) * 0.06;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -7.3, 0]}>
      <ringGeometry args={[2.5, 3.0, 64]} />
      <meshBasicMaterial color="#0EA5E9" transparent opacity={0.12} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Scene({ selectedId, hoveredId, onSelect, onHover, visCats }) {
  const { isDarkMode } = useTheme();
  const filtered = useMemo(() => STRUCTURES.filter(s => visCats.includes(s.category)), [visCats]);

  return (
    <>
      <ambientLight intensity={isDarkMode ? 0.22 : 0.38} />
      <directionalLight position={[5, 12, 5]} intensity={isDarkMode ? 0.8 : 1.1} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.001} />
      <directionalLight position={[-4, 8, -4]} intensity={0.3} color="#E8D5F5" />
      <pointLight position={[0, 4, 6]} intensity={0.45} color="#0EA5E9" distance={15} />
      <pointLight position={[3, -2, -3]} intensity={0.18} color="#F97316" distance={12} />

      {filtered.map(s => (
        <React.Fragment key={s.id}>
          <AnatomyMesh structure={s} isSelected={selectedId === s.id} isHovered={hoveredId === s.id} onSelect={onSelect} onHover={onHover} />
          <Label structure={s} isSelected={selectedId === s.id} isHovered={hoveredId === s.id} />
        </React.Fragment>
      ))}

      <HoloRing />
      <OrbitControls enablePan enableZoom enableRotate minDistance={3} maxDistance={25} target={[0, 1.5, 0]} makeDefault enableDamping dampingFactor={0.08} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -7.4, 0]} receiveShadow>
        <circleGeometry args={[4, 48]} />
        <meshStandardMaterial color={isDarkMode ? '#0f172a' : '#e2e8f0'} roughness={1} metalness={0} transparent opacity={0.4} />
      </mesh>
    </>
  );
}

/* ═══════════════ MAIN COMPONENT ═══════════════ */

export default function Atlas3D() {
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visCats, setVisCats] = useState([...CATEGORIES]);
  const [showPanel, setShowPanel] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { isDarkMode } = useTheme();

  const selected = STRUCTURES.find(s => s.id === selectedId);

  const handleSelect = useCallback(id => { setSelectedId(p => p === id ? null : id); setShowPanel(true); }, []);
  const handleHover  = useCallback(id => setHoveredId(id), []);
  const toggleCat    = useCallback(c => setVisCats(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]), []);

  const filtered = useMemo(() =>
    STRUCTURES.filter(s => {
      const q = searchTerm.toLowerCase();
      const matchQ = !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
      return matchQ && visCats.includes(s.category);
    }), [searchTerm, visCats]);

  return (
    <div className="h-[calc(100dvh-80px)] flex flex-col lg:flex-row overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <div className="w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col overflow-hidden max-h-[35vh] lg:max-h-full">
        <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-sky-600 flex items-center justify-center shadow-sm">
              <Bone size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Atlas 3D</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{filtered.length} estrutura{filtered.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="relative mb-1.5">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar estrutura, músculo, teste..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>

          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            <Filter size={11} /> Camadas <ChevronDown size={11} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="flex gap-1 flex-wrap pt-1.5">
                  {CATEGORIES.map(cat => {
                    const active = visCats.includes(cat);
                    return (
                      <button key={cat} onClick={() => toggleCat(cat)} className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${
                        active ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 ring-1 ring-primary-300 dark:ring-primary-700'
                               : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 line-through opacity-60'
                      }`}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: active ? CATEGORY_CONFIG[cat]?.color : '#94a3b8' }} />
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 overflow-y-auto py-0.5">
          {filtered.map(s => (
            <button key={s.id} onClick={() => handleSelect(s.id)} className={`w-full px-3 py-2 flex items-center gap-2 text-left transition-colors ${
              selectedId === s.id ? 'bg-primary-50 dark:bg-primary-950/60 border-l-2 border-primary-500' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border-l-2 border-transparent'
            }`}>
              <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{
                backgroundColor: selectedId === s.id ? '#0EA5E918' : `${CATEGORY_CONFIG[s.category]?.color || '#94a3b8'}18`,
                border: `1.5px solid ${selectedId === s.id ? '#0EA5E9' : CATEGORY_CONFIG[s.category]?.color || '#94a3b8'}`,
              }}>
                <Bone size={10} style={{ color: selectedId === s.id ? '#0EA5E9' : CATEGORY_CONFIG[s.category]?.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-medium truncate ${selectedId === s.id ? 'text-primary-700 dark:text-primary-300' : 'text-slate-800 dark:text-slate-200'}`}>{s.name}</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{s.category}</p>
              </div>
              <ChevronRight size={10} className={selectedId === s.id ? 'text-primary-500' : 'text-slate-300 dark:text-slate-600'} />
            </button>
          ))}
          {!filtered.length && (
            <div className="text-center py-6 px-4">
              <Search size={20} className="text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Nenhuma estrutura encontrada</p>
            </div>
          )}
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <Canvas shadows camera={{ position: [6, 4, 12], fov: 42 }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} style={{ background: isDarkMode ? '#0f172a' : '#f1f5f9' }} dpr={[1, 2]}>
          <Suspense fallback={null}>
            <Scene selectedId={selectedId} hoveredId={hoveredId} onSelect={handleSelect} onHover={handleHover} visCats={visCats} />
          </Suspense>
        </Canvas>

        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <button onClick={() => { setSelectedId(null); setShowPanel(false); }} className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" title="Limpar seleção"><RotateCcw size={15} /></button>
          <button onClick={() => setVisCats([...CATEGORIES])} className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" title="Mostrar tudo"><Layers size={15} /></button>
        </div>

        <div className="absolute top-3 left-3 hidden sm:flex flex-col gap-0.5">
          {CATEGORIES.filter(c => visCats.includes(c)).map(cat => (
            <div key={cat} className="flex items-center gap-1 px-1.5 py-0.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded text-[9px] text-slate-600 dark:text-slate-300 font-medium">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_CONFIG[cat]?.color }} />
              {cat}
            </div>
          ))}
        </div>

        {!selectedId && !hoveredId && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full shadow-md text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pointer-events-none">
            <Eye size={13} className="text-primary-500" />
            Clique em uma estrutura para detalhes
          </div>
        )}

        {/* Detail Panel */}
        <AnimatePresence>
          {selected && showPanel && (
            <>
              <motion.div className="lg:hidden fixed inset-0 bg-black/30 dark:bg-black/50 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPanel(false)} />
              <motion.div
                className="fixed lg:absolute bottom-0 lg:bottom-3 lg:right-3 left-0 lg:left-auto w-full lg:w-[400px] z-50 lg:z-10"
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                <div className="bg-white dark:bg-slate-800 rounded-t-2xl lg:rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60 max-h-[70vh] lg:max-h-[75vh] overflow-hidden flex flex-col">
                  <div className="lg:hidden flex justify-center pt-2 pb-0.5"><div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" /></div>

                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{
                        background: `linear-gradient(135deg, ${CATEGORY_CONFIG[selected.category]?.color || '#0EA5E9'}22, ${CATEGORY_CONFIG[selected.category]?.color || '#0EA5E9'}08)`,
                        border: `2px solid ${CATEGORY_CONFIG[selected.category]?.color || '#0EA5E9'}`,
                      }}>
                        <Bone size={16} style={{ color: CATEGORY_CONFIG[selected.category]?.color || '#0EA5E9' }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{selected.name}</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{selected.category}</p>
                      </div>
                    </div>
                    <button onClick={() => setShowPanel(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition-colors"><X size={16} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{selected.description}</p>
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1"><Info size={10} />Informações Clínicas</h4>
                      {Object.entries(selected.details).map(([k, v]) => (
                        <div key={k} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                          <p className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 mb-0.5">{k}</p>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
