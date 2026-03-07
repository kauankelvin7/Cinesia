/**
 * ATLAS 3D MELHORADO — Anatomia com proporções humanas reais
 * Geometrias orgânicas, proporções corretas, aparência realista
 * UI Premium com Glassmorphism e tipografia refinada.
 */

import React, { useState, useRef, useCallback, Suspense, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Environment, ContactShadows } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import {
  X, RotateCcw, Info, ChevronRight, Search,
  Eye, Layers, ChevronDown, Filter, ZoomIn, ZoomOut,
  Activity, Bone, Brain, Heart, Sparkles, ChevronLeft
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/* ═══════════════════════════════════════════════════════
   PALETA DE MATERIAIS ANATOMICAMENTE CORRETOS
═══════════════════════════════════════════════════════ */

const MAT = {
  // Pele / superfície
  skin:        { color: '#E8C5A0', roughness: 0.75, metalness: 0.0,  clearcoat: 0.2,  clearcoatRoughness: 0.5, sheen: 0.4,  sheenColor: '#F5DCC8' },
  skinDark:    { color: '#C4956A', roughness: 0.8,  metalness: 0.0,  clearcoat: 0.15, clearcoatRoughness: 0.6, sheen: 0.3,  sheenColor: '#D4A882' },
  // Ossos
  bone:        { color: '#F0E2D0', roughness: 0.55, metalness: 0.05, clearcoat: 0.2,  clearcoatRoughness: 0.4, sheen: 0.3,  sheenColor: '#FFF8F0' },
  boneDark:    { color: '#D8C4AE', roughness: 0.6,  metalness: 0.05, clearcoat: 0.1,  clearcoatRoughness: 0.5, sheen: 0.2,  sheenColor: '#EDD8C5' },
  cartilage:   { color: '#A8D8EA', roughness: 0.3,  metalness: 0.0,  clearcoat: 0.7,  clearcoatRoughness: 0.2, sheen: 0.5,  sheenColor: '#C5E8F5', transparent: true, opacity: 0.65 },
  // Músculos
  muscle:      { color: '#C03535', roughness: 0.65, metalness: 0.02, clearcoat: 0.12, clearcoatRoughness: 0.55, sheen: 0.5, sheenColor: '#E07070' },
  muscleMid:   { color: '#A82828', roughness: 0.7,  metalness: 0.02, clearcoat: 0.08, clearcoatRoughness: 0.6,  sheen: 0.4, sheenColor: '#C86060' },
  muscleDeep:  { color: '#8B1A1A', roughness: 0.75, metalness: 0.02, clearcoat: 0.05, clearcoatRoughness: 0.65, sheen: 0.3, sheenColor: '#B04040' },
  // Tendões
  tendon:      { color: '#F0EAD0', roughness: 0.45, metalness: 0.0,  clearcoat: 0.3,  clearcoatRoughness: 0.3,  sheen: 0.6, sheenColor: '#FFFFF0' },
  ligament:    { color: '#E0D8B8', roughness: 0.5,  metalness: 0.0,  sheen: 0.4,  sheenColor: '#F5F0DC' },
  // Nervos
  nerve:       { color: '#F5D020', roughness: 0.4,  metalness: 0.0,  clearcoat: 0.4,  clearcoatRoughness: 0.25, sheen: 0.6, sheenColor: '#FFF08A' },
  // Órgãos
  heart:       { color: '#C01818', roughness: 0.5,  metalness: 0.03, clearcoat: 0.3,  clearcoatRoughness: 0.4,  sheen: 0.5, sheenColor: '#E84040' },
  lung:        { color: '#E09090', roughness: 0.45, metalness: 0.0,  clearcoat: 0.15, clearcoatRoughness: 0.5,  sheen: 0.4, sheenColor: '#F5B8B8', transparent: true, opacity: 0.82 },
  brain:       { color: '#DDA0A8', roughness: 0.4,  metalness: 0.0,  clearcoat: 0.3,  clearcoatRoughness: 0.3,  sheen: 0.5, sheenColor: '#F0C0C8' },
  liver:       { color: '#7A3010', roughness: 0.55, metalness: 0.02, clearcoat: 0.2,  clearcoatRoughness: 0.45, sheen: 0.35, sheenColor: '#A05020' },
  kidney:      { color: '#904020', roughness: 0.5,  metalness: 0.02, clearcoat: 0.25, clearcoatRoughness: 0.4,  sheen: 0.35, sheenColor: '#B06030' },
  organ:       { color: '#A02020', roughness: 0.6,  metalness: 0.02, clearcoat: 0.15, clearcoatRoughness: 0.5,  sheen: 0.3, sheenColor: '#C85050' },
  fascia:      { color: '#C8C0A8', roughness: 0.38, metalness: 0.0,  clearcoat: 0.35, clearcoatRoughness: 0.25, sheen: 0.5, sheenColor: '#E8E2D0', transparent: true, opacity: 0.55 },
  bursa:       { color: '#88C8E0', roughness: 0.22, metalness: 0.0,  clearcoat: 0.6,  clearcoatRoughness: 0.18, sheen: 0.6, sheenColor: '#A8E0F5', transparent: true, opacity: 0.50 },
};

/* ═══════════════════════════════════════════════════════
   HELPERS DE GEOMETRIA
═══════════════════════════════════════════════════════ */

function tG(geo, x, y, z) { geo.translate(x, y, z); return geo; }
function rG(geo, x, y, z) { geo.rotateX(x); geo.rotateY(y); geo.rotateZ(z); return geo; }
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
      pos[o]=p.getX(i); pos[o+1]=p.getY(i); pos[o+2]=p.getZ(i);
      if(n){ nor[o]=n.getX(i); nor[o+1]=n.getY(i); nor[o+2]=n.getZ(i); }
    }
    if(g.index){ for(let i=0;i<g.index.count;i++) idx.push(g.index.getX(i)+vOff); }
    else { for(let i=0;i<p.count;i++) idx.push(i+vOff); }
    vOff += p.count;
    g.dispose();
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(pos,3));
  m.setAttribute('normal', new THREE.BufferAttribute(nor,3));
  m.setIndex(idx);
  m.computeVertexNormals();
  return m;
}

// Cria curva suave entre pontos (para membros orgânicos)
const LIMB_RADIAL = 8; // segmentos radiais reduzidos para performance
function createLimbGeo(points, radii, segs = 6) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const frames = curve.computeFrenetFrames(segs * points.length, false);
  const positions = [];
  const normals = [];
  const indices = [];
  const totalSegs = segs * (points.length - 1);

  for (let i = 0; i <= totalSegs; i++) {
    const t = i / totalSegs;
    const pt = curve.getPoint(t);
    const idx = Math.min(Math.floor(t * (radii.length - 1)), radii.length - 2);
    const lt = t * (radii.length - 1) - idx;
    const r = radii[idx] * (1 - lt) + radii[idx + 1] * lt;
    const tangent = frames.tangents[i] || frames.tangents[frames.tangents.length - 1];
    const normal = frames.normals[i] || frames.normals[frames.normals.length - 1];
    const binormal = frames.binormals[i] || frames.binormals[frames.binormals.length - 1];

    for (let j = 0; j <= LIMB_RADIAL; j++) {
      const angle = (j / LIMB_RADIAL) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      positions.push(
        pt.x + r * (cos * normal.x + sin * binormal.x),
        pt.y + r * (cos * normal.y + sin * binormal.y),
        pt.z + r * (cos * normal.z + sin * binormal.z),
      );
      normals.push(cos * normal.x + sin * binormal.x, cos * normal.y + sin * binormal.y, cos * normal.z + sin * binormal.z);
    }
  }

  const ring = LIMB_RADIAL + 1;
  for (let i = 0; i < totalSegs; i++) {
    for (let j = 0; j < LIMB_RADIAL; j++) {
      const a = i * ring + j;
      const b = a + ring;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/* ═══════════════════════════════════════════════════════
   FACTORY DE GEOMETRIAS ORGÂNICAS
═══════════════════════════════════════════════════════ */

const geoCache = new Map();

function buildGeo(type) {
  if (geoCache.has(type)) return geoCache.get(type);
  const geo = _buildGeo(type);
  geoCache.set(type, geo);
  return geo;
}

function _buildGeo(type) {
  switch (type) {

    /* ──────────── CABEÇA / CRÂNIO ──────────── */
    case 'cranium': {
      const g = new THREE.SphereGeometry(0.72, 48, 36);
      // Forma mais oval como crânio real
      const pos = g.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const x = pos.getX(i);
        const z = pos.getZ(i);
        // Achata levemente os lados, alonga para trás
        pos.setX(i, x * 0.92);
        pos.setY(i, y * 1.08 + (y > 0 ? 0.05 : -0.08)); // topo mais alto
        pos.setZ(i, z * 1.12 + (z < 0 ? -0.08 : 0.02)); // occiput mais proeminente
      }
      g.computeVertexNormals();
      return g;
    }

    case 'face': {
      // Área facial com orbitas e nariz
      return mergeGeos([
        tG(sG(new THREE.SphereGeometry(0.62, 32, 24), 0.95, 0.85, 0.9), 0, -0.15, 0.35),
        // Nariz
        tG(sG(new THREE.SphereGeometry(0.08, 12, 10), 0.8, 1.2, 0.7), 0, 0.0, 0.68),
        // Mandíbula
        tG(sG(new THREE.SphereGeometry(0.42, 24, 18), 1, 0.55, 0.85), 0, -0.52, 0.18),
      ]);
    }

    /* ──────────── PESCOÇO ──────────── */
    case 'neck': {
      return createLimbGeo(
        [[0,0,0],[0,0.3,-0.04],[0,0.65,-0.06],[0,1.0,0]],
        [0.24, 0.22, 0.20, 0.22]
      );
    }

    /* ──────────── TRONCO SUPERIOR (TÓRAX) ──────────── */
    case 'thorax': {
      // Tórax com formato de barril levemente achatado + ombros
      const g = new THREE.SphereGeometry(1.0, 48, 32);
      const pos = g.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const r = Math.sqrt(x*x + z*z);
        // Formato de barril: mais largo no meio, estreita em cima e embaixo
        const barrel = 1.0 + 0.15 * Math.cos(y * Math.PI * 0.8);
        pos.setX(i, x * barrel * 1.05);
        pos.setY(i, y * 1.35); // alonga verticalmente
        pos.setZ(i, z * barrel * 0.78); // achatado frente-trás
      }
      g.computeVertexNormals();
      return g;
    }

    case 'thorax-back': {
      // Costas com omoplatas
      const g = new THREE.SphereGeometry(0.92, 48, 32);
      const pos = g.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        if (z < 0) {
          pos.setZ(i, z * 0.65);
        }
      }
      g.computeVertexNormals();
      return g;
    }

    /* ──────────── ABDÔMEN ──────────── */
    case 'abdomen': {
      const g = new THREE.SphereGeometry(0.88, 48, 32);
      const pos = g.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const belly = 1.0 + 0.08 * Math.exp(-y*y * 2) + (z > 0 ? 0.06 : 0);
        pos.setX(i, x * 0.95 * belly);
        pos.setY(i, y * 1.1);
        pos.setZ(i, z * 0.82 * belly);
      }
      g.computeVertexNormals();
      return g;
    }

    /* ──────────── PELVE ──────────── */
    case 'pelvis-body': {
      const g = new THREE.SphereGeometry(0.82, 40, 28);
      const pos = g.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        // Pelve: mais larga nos lados, achatada v-p, afunila embaixo
        const flare = y < 0 ? 1.0 + Math.abs(y) * 0.3 : 1.0;
        pos.setX(i, x * 1.15 * flare);
        pos.setY(i, y * 0.75);
        pos.setZ(i, z * 0.7);
      }
      g.computeVertexNormals();
      return g;
    }

    /* ──────────── ESCÁPULA ──────────── */
    case 'scap-L': {
      const s = new THREE.Shape();
      s.moveTo(0, 0.6); s.quadraticCurveTo(-0.15, 0.4, -0.38, -0.1);
      s.quadraticCurveTo(-0.45, -0.35, -0.28, -0.55);
      s.quadraticCurveTo(-0.05, -0.6, 0.18, -0.45);
      s.quadraticCurveTo(0.38, -0.2, 0.3, 0.2);
      s.quadraticCurveTo(0.2, 0.5, 0, 0.6);
      const e = new THREE.ExtrudeGeometry(s, { depth: 0.055, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.018, bevelSegments: 4 });
      return e;
    }
    case 'scap-R': {
      const s = new THREE.Shape();
      s.moveTo(0, 0.6); s.quadraticCurveTo(0.15, 0.4, 0.38, -0.1);
      s.quadraticCurveTo(0.45, -0.35, 0.28, -0.55);
      s.quadraticCurveTo(0.05, -0.6, -0.18, -0.45);
      s.quadraticCurveTo(-0.38, -0.2, -0.3, 0.2);
      s.quadraticCurveTo(-0.2, 0.5, 0, 0.6);
      const e = new THREE.ExtrudeGeometry(s, { depth: 0.055, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.018, bevelSegments: 4 });
      return e;
    }

    /* ──────────── CLAVÍCULA ──────────── */
    case 'clav-L': {
      const c = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0,0,0), new THREE.Vector3(-0.28,0.08,0.12),
        new THREE.Vector3(-0.58,-0.04,0.06), new THREE.Vector3(-0.88,0.02,0));
      return new THREE.TubeGeometry(c, 24, 0.065, 10, false);
    }
    case 'clav-R': {
      const c = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0,0,0), new THREE.Vector3(0.28,0.08,0.12),
        new THREE.Vector3(0.58,-0.04,0.06), new THREE.Vector3(0.88,0.02,0));
      return new THREE.TubeGeometry(c, 24, 0.065, 10, false);
    }

    /* ──────────── ÚMERO (braço orgânico) ──────────── */
    case 'hum-L': return createLimbGeo(
      [[0,1.1,0],[0,0.8,0.05],[-0.04,0.4,0.03],[-0.06,-0.1,0],[-0.06,-0.85,0]],
      [0.165, 0.155, 0.145, 0.135, 0.15]
    );
    case 'hum-R': return createLimbGeo(
      [[0,1.1,0],[0,0.8,0.05],[0.04,0.4,0.03],[0.06,-0.1,0],[0.06,-0.85,0]],
      [0.165, 0.155, 0.145, 0.135, 0.15]
    );

    /* ──────────── ANTEBRAÇO ──────────── */
    case 'forearm-L': {
      const radius = createLimbGeo(
        [[-0.04,0.8,0.06],[-0.05,0.4,0.04],[-0.04,0,0.02],[-0.02,-0.55,0]],
        [0.088, 0.082, 0.072, 0.065]
      );
      const ulna = createLimbGeo(
        [[0.06,0.8,-0.04],[0.06,0.4,-0.03],[0.05,0,-0.01],[0.03,-0.55,0]],
        [0.075, 0.068, 0.058, 0.052]
      );
      return mergeGeos([radius, ulna]);
    }
    case 'forearm-R': {
      const radius = createLimbGeo(
        [[0.04,0.8,0.06],[0.05,0.4,0.04],[0.04,0,0.02],[0.02,-0.55,0]],
        [0.088, 0.082, 0.072, 0.065]
      );
      const ulna = createLimbGeo(
        [[-0.06,0.8,-0.04],[-0.06,0.4,-0.03],[-0.05,0,-0.01],[-0.03,-0.55,0]],
        [0.075, 0.068, 0.058, 0.052]
      );
      return mergeGeos([radius, ulna]);
    }

    /* ──────────── MÃO ──────────── */
    case 'hand-L': case 'hand-R': {
      const d = type === 'hand-L' ? -1 : 1;
      const palm = new THREE.BoxGeometry(0.3, 0.42, 0.1);
      const pos = palm.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        pos.setX(i, pos.getX(i) * (1 + y * 0.15));
      }
      palm.computeVertexNormals();
      const fingers = [];
      const fconf = [
        { x: -0.11, len: 0.28, r: 0.025 }, // indicador
        { x: -0.037, len: 0.32, r: 0.026 }, // médio
        { x: 0.037, len: 0.29, r: 0.024 }, // anelar
        { x: 0.11, len: 0.24, r: 0.022 }, // mínimo
      ];
      for (const f of fconf) {
        fingers.push(tG(new THREE.CylinderGeometry(f.r, f.r * 1.1, f.len, 8), d * f.x, -0.21 - f.len/2, 0.01));
        fingers.push(tG(new THREE.SphereGeometry(f.r * 1.05, 8, 8), d * f.x, -0.21 - f.len, 0.01));
      }
      // Polegar
      const thumb = createLimbGeo(
        [[d*0.18, 0.05, 0.04], [d*0.22, -0.06, 0.06], [d*0.24, -0.17, 0.04]],
        [0.032, 0.028, 0.022]
      );
      return mergeGeos([palm, ...fingers, thumb]);
    }

    /* ──────────── FÊMUR (orgânico) ──────────── */
    case 'fem-L': return createLimbGeo(
      [[-0.14,1.28,0.02],[-0.1,0.85,0],[-0.05,0.3,0],[0,-0.2,0.01],[0.02,-0.85,-0.02],[0,-1.18,0]],
      [0.18, 0.175, 0.17, 0.165, 0.16, 0.18]
    );
    case 'fem-R': return createLimbGeo(
      [[0.14,1.28,0.02],[0.1,0.85,0],[0.05,0.3,0],[0,-0.2,0.01],[-0.02,-0.85,-0.02],[0,-1.18,0]],
      [0.18, 0.175, 0.17, 0.165, 0.16, 0.18]
    );

    /* ──────────── PATELA ──────────── */
    case 'patella': {
      const g = new THREE.SphereGeometry(0.14, 16, 12);
      g.scale(1.12, 1.0, 0.52);
      return g;
    }

    /* ──────────── PERNA (tíbia + fíbula) ──────────── */
    case 'leg-L': {
      const tibia = createLimbGeo(
        [[-0.03,0.95,0.02],[-0.025,0.5,0.015],[-0.02,0,-0.01],[-0.02,-0.5,-0.02],[-0.018,-0.95,0]],
        [0.125, 0.105, 0.09, 0.082, 0.092]
      );
      const fibula = createLimbGeo(
        [[0.1,0.82,-0.02],[0.095,0.3,-0.02],[0.085,-0.3,-0.02],[0.07,-0.88,0.015]],
        [0.042, 0.038, 0.035, 0.042]
      );
      return mergeGeos([tibia, fibula]);
    }
    case 'leg-R': {
      const tibia = createLimbGeo(
        [[0.03,0.95,0.02],[0.025,0.5,0.015],[0.02,0,-0.01],[0.02,-0.5,-0.02],[0.018,-0.95,0]],
        [0.125, 0.105, 0.09, 0.082, 0.092]
      );
      const fibula = createLimbGeo(
        [[-0.1,0.82,-0.02],[-0.095,0.3,-0.02],[-0.085,-0.3,-0.02],[-0.07,-0.88,0.015]],
        [0.042, 0.038, 0.035, 0.042]
      );
      return mergeGeos([tibia, fibula]);
    }

    /* ──────────── PÉ ──────────── */
    case 'foot-L': case 'foot-R': {
      const d = type === 'foot-L' ? -1 : 1;
      const gs = [];
      // Calcâneo
      const calcaneus = new THREE.BoxGeometry(0.18, 0.14, 0.28);
      const cpos = calcaneus.getAttribute('position');
      for (let i = 0; i < cpos.count; i++) {
        cpos.setX(i, cpos.getX(i) * (1 - Math.abs(cpos.getY(i)) * 0.2));
      }
      calcaneus.computeVertexNormals();
      gs.push(tG(calcaneus, 0, -0.02, -0.22));
      // Metatarso + dorso
      gs.push(tG(sG(new THREE.BoxGeometry(0.26, 0.1, 0.35), 1, 1, 1), 0, -0.04, 0.1));
      // Arco
      for (let t = 0; t < 5; t++) {
        const angle = (t - 2) * 0.14;
        const len = t === 2 ? 0.18 : 0.15;
        gs.push(tG(new THREE.CylinderGeometry(0.02, 0.016, len, 8), d * (t-2)*0.052, -0.04, 0.35 + len/2 + Math.cos(angle)*0.01));
      }
      return mergeGeos(gs);
    }

    /* ──────────── COSTELAS ──────────── */
    case 'ribs-R': case 'ribs-L': {
      const side = type === 'ribs-R' ? 1 : -1;
      const gs = [];
      for (let i = 0; i < 10; i++) {
        const w = 0.55 + (i < 5 ? i * 0.085 : (9 - i) * 0.06);
        const yOff = 1.55 - i * 0.3;
        const thick = 0.032 + (i < 3 ? 0.008 : 0);
        const c = new THREE.CubicBezierCurve3(
          new THREE.Vector3(side * 0.15, yOff, 0.12),
          new THREE.Vector3(side * (w + 0.15), yOff + 0.05, 0.25 + i * 0.02),
          new THREE.Vector3(side * (w + 0.1), yOff - 0.08, 0.4 + i * 0.015),
          new THREE.Vector3(side * 0.12, yOff - 0.12, 0.48 + (i < 8 ? 0 : -0.08))
        );
        gs.push(new THREE.TubeGeometry(c, 20, thick, 7, false));
      }
      return mergeGeos(gs);
    }

    /* ──────────── ESTERNO ──────────── */
    case 'sternum': {
      const s = new THREE.Shape();
      s.moveTo(-0.11, 0.7); s.quadraticCurveTo(-0.14, 0.5, -0.12, 0.2);
      s.lineTo(-0.1, -0.3); s.quadraticCurveTo(-0.06, -0.52, 0, -0.58);
      s.quadraticCurveTo(0.06, -0.52, 0.1, -0.3);
      s.lineTo(0.12, 0.2); s.quadraticCurveTo(0.14, 0.5, 0.11, 0.7);
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: 0.09, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 4 });
    }

    /* ──────────── COLUNA ──────────── */
    case 'vert-cervical': {
      const gs = [];
      for (let i = 0; i < 7; i++) {
        const body = new THREE.CylinderGeometry(0.16 + i*0.01, 0.17 + i*0.01, 0.155, 14);
        const bpos = body.getAttribute('position');
        for (let j = 0; j < bpos.count; j++) {
          bpos.setX(j, bpos.getX(j) * 1.1);
          bpos.setZ(j, bpos.getZ(j) * 0.85);
        }
        body.computeVertexNormals();
        gs.push(tG(body, 0, i * 0.175, 0));
        // Processo espinhoso
        gs.push(tG(rG(new THREE.ConeGeometry(0.04, 0.12, 6), 0, 0, Math.PI/2), -0.18, i*0.175, 0));
      }
      return mergeGeos(gs);
    }
    case 'vert-thoracic': {
      const gs = [];
      for (let i = 0; i < 12; i++) {
        const body = new THREE.CylinderGeometry(0.19 + i*0.006, 0.20 + i*0.006, 0.22, 14);
        gs.push(tG(body, 0, i * 0.26, 0));
        gs.push(tG(rG(new THREE.ConeGeometry(0.045, 0.18, 6), 0, 0, Math.PI/2), -0.24, i*0.26, 0));
      }
      return mergeGeos(gs);
    }
    case 'vert-lumbar': {
      const gs = [];
      for (let i = 0; i < 5; i++) {
        const body = new THREE.CylinderGeometry(0.26, 0.28, 0.26, 14);
        const bpos = body.getAttribute('position');
        for (let j = 0; j < bpos.count; j++) {
          bpos.setX(j, bpos.getX(j) * 1.18);
          bpos.setZ(j, bpos.getZ(j) * 0.9);
        }
        body.computeVertexNormals();
        gs.push(tG(body, 0, i * 0.3, 0));
        gs.push(tG(rG(new THREE.ConeGeometry(0.05, 0.22, 6), 0, 0, Math.PI/2), -0.3, i*0.3, 0));
      }
      return mergeGeos(gs);
    }
    case 'sacrum': {
      const gs = [];
      for (let i = 0; i < 5; i++) {
        const w = 0.28 - i * 0.04;
        gs.push(tG(new THREE.CylinderGeometry(w, w - 0.03, 0.14, 10), 0, i * 0.14, 0));
      }
      return mergeGeos(gs);
    }

    /* ──────────── MÚSCULO DELTÓIDE ──────────── */
    case 'deltoid-L': case 'deltoid-R': {
      const d = type === 'deltoid-L' ? -1 : 1;
      const g = new THREE.SphereGeometry(1, 32, 24);
      const pos = g.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        // Formato de meias-luas envolvendo o ombro
        pos.setX(i, x * 0.32 * d);
        pos.setY(i, y * 0.4 - 0.05);
        pos.setZ(i, z * 0.26 + (y < 0 ? y * 0.15 : 0));
      }
      g.computeVertexNormals();
      return g;
    }

    /* ──────────── PEITORAL ──────────── */
    case 'pectoral-L': case 'pectoral-R': {
      const d = type === 'pectoral-L' ? -1 : 1;
      const g = new THREE.SphereGeometry(1, 32, 24);
      const pos = g.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        // Formato do peitoral - mais largo na inserção, mais fino na origem
        const taper = 0.5 + Math.max(0, x * d) * 0.4;
        pos.setX(i, x * 0.42 * d * taper);
        pos.setY(i, y * 0.30 + 0.1);
        pos.setZ(i, z * 0.22 + 0.08);
      }
      g.computeVertexNormals();
      return g;
    }

    /* ──────────── BÍCEPS ──────────── */
    case 'biceps-L': case 'biceps-R': return createLimbGeo(
      [[0, 0.85, 0.06], [0, 0.5, 0.12], [0, 0, 0.10], [0, -0.55, 0.05]],
      [0.085, 0.115, 0.108, 0.072]
    );

    /* ──────────── TRÍCEPS ──────────── */
    case 'triceps-L': case 'triceps-R': return mergeGeos([
      createLimbGeo([[0,0.85,-0.08],[0,0.4,-0.14],[0,0,-0.12],[0,-0.55,-0.06]], [0.08,0.11,0.105,0.07]),
      createLimbGeo([[0.07,0.7,-0.08],[0.06,0.3,-0.12],[0.04,-0.1,-0.1],[0.02,-0.55,-0.05]], [0.07,0.09,0.085,0.06]),
    ]);

    /* ──────────── TRAPÉZIO ──────────── */
    case 'trapezius': {
      const g = new THREE.SphereGeometry(1, 32, 24);
      const pos = g.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        pos.setX(i, x * 0.85);
        pos.setY(i, y * 0.65 + 0.3);
        pos.setZ(i, z * 0.2 - 0.12);
      }
      g.computeVertexNormals();
      return g;
    }

    /* ──────────── RETO ABDOMINAL ──────────── */
    case 'rectus-abdominis': {
      const gs = [];
      for (let r = 0; r < 4; r++) {
        // Cada par de segmentos com forma convexa
        const seg = new THREE.SphereGeometry(0.1, 14, 10);
        const pos = seg.getAttribute('position');
        for (let i = 0; i < pos.count; i++) {
          pos.setX(i, pos.getX(i) * 1.15);
          pos.setY(i, pos.getY(i) * 0.72);
          pos.setZ(i, pos.getZ(i) * 0.65 + 0.02);
        }
        seg.computeVertexNormals();
        gs.push(tG(seg.clone(), -0.115, 0.6 - r * 0.35, 0.08));
        gs.push(tG(seg, 0.115, 0.6 - r * 0.35, 0.08));
      }
      return mergeGeos(gs);
    }

    /* ──────────── OBLÍQUOS ──────────── */
    case 'obliques-L': return createLimbGeo(
      [[-0.5, 0.5, 0.1], [-0.65, 0.2, 0.2], [-0.7, -0.1, 0.18], [-0.55, -0.4, 0.08]],
      [0.1, 0.12, 0.115, 0.09]
    );
    case 'obliques-R': return createLimbGeo(
      [[0.5, 0.5, 0.1], [0.65, 0.2, 0.2], [0.7, -0.1, 0.18], [0.55, -0.4, 0.08]],
      [0.1, 0.12, 0.115, 0.09]
    );

    /* ──────────── QUADRÍCEPS ──────────── */
    case 'quadriceps-L': return mergeGeos([
      createLimbGeo([[0,0.95,0.12],[0,0.5,0.18],[0,0,0.16],[0,-0.65,0.08]], [0.14,0.18,0.175,0.12]), // reto femoral
      createLimbGeo([[-0.15,0.8,0.05],[-0.14,0.3,0.1],[-0.12,-0.2,0.1],[-0.08,-0.65,0.06]], [0.1,0.13,0.125,0.09]), // VL
      createLimbGeo([[0.1,0.8,0.06],[0.1,0.3,0.11],[0.08,-0.2,0.1],[0.05,-0.65,0.06]], [0.09,0.12,0.115,0.09]), // VM
    ]);
    case 'quadriceps-R': return mergeGeos([
      createLimbGeo([[0,0.95,0.12],[0,0.5,0.18],[0,0,0.16],[0,-0.65,0.08]], [0.14,0.18,0.175,0.12]),
      createLimbGeo([[0.15,0.8,0.05],[0.14,0.3,0.1],[0.12,-0.2,0.1],[0.08,-0.65,0.06]], [0.1,0.13,0.125,0.09]),
      createLimbGeo([[-0.1,0.8,0.06],[-0.1,0.3,0.11],[-0.08,-0.2,0.1],[-0.05,-0.65,0.06]], [0.09,0.12,0.115,0.09]),
    ]);

    /* ──────────── ISQUIOTIBIAIS ──────────── */
    case 'hamstrings-L': return mergeGeos([
      createLimbGeo([[-0.08,0.8,-0.12],[-0.07,0.3,-0.18],[-0.06,-0.2,-0.16],[-0.04,-0.65,-0.08]], [0.1,0.125,0.12,0.085]),
      createLimbGeo([[0.05,0.8,-0.11],[0.05,0.3,-0.17],[0.04,-0.2,-0.15],[0.03,-0.65,-0.08]], [0.095,0.12,0.115,0.08]),
      createLimbGeo([[0.1,0.75,-0.08],[0.1,0.25,-0.14],[0.08,-0.25,-0.12],[0.06,-0.65,-0.07]], [0.075,0.09,0.085,0.065]),
    ]);
    case 'hamstrings-R': return mergeGeos([
      createLimbGeo([[0.08,0.8,-0.12],[0.07,0.3,-0.18],[0.06,-0.2,-0.16],[0.04,-0.65,-0.08]], [0.1,0.125,0.12,0.085]),
      createLimbGeo([[-0.05,0.8,-0.11],[-0.05,0.3,-0.17],[-0.04,-0.2,-0.15],[-0.03,-0.65,-0.08]], [0.095,0.12,0.115,0.08]),
      createLimbGeo([[-0.1,0.75,-0.08],[-0.1,0.25,-0.14],[-0.08,-0.25,-0.12],[-0.06,-0.65,-0.07]], [0.075,0.09,0.085,0.065]),
    ]);

    /* ──────────── GLÚTEOS ──────────── */
    case 'glutes-L': case 'glutes-R': {
      const d = type === 'glutes-L' ? -1 : 1;
      const g = new THREE.SphereGeometry(0.36, 24, 20);
      const pos = g.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        pos.setX(i, x * 0.85 * d);
        pos.setY(i, y * 0.72);
        pos.setZ(i, z * 0.82 - 0.1);
      }
      g.computeVertexNormals();
      return g;
    }

    /* ──────────── PANTURRILHA ──────────── */
    case 'calf-L': return mergeGeos([
      createLimbGeo([[0.04,0.85,-0.05],[0.04,0.55,-0.14],[0.03,0.15,-0.12],[0.02,-0.2,-0.08],[0,-0.6,-0.02]], [0.095,0.12,0.115,0.09,0.065]),
      createLimbGeo([[-0.05,0.82,-0.04],[-0.05,0.52,-0.13],[-0.04,0.12,-0.11],[-0.02,-0.2,-0.07],[0,-0.6,-0.02]], [0.085,0.11,0.105,0.085,0.06]),
      createLimbGeo([[0,0.75,0.01],[0,0.4,-0.06],[0,0,-0.1],[0,-0.6,-0.02]], [0.08,0.095,0.09,0.06]),
    ]);
    case 'calf-R': return mergeGeos([
      createLimbGeo([[-0.04,0.85,-0.05],[-0.04,0.55,-0.14],[-0.03,0.15,-0.12],[-0.02,-0.2,-0.08],[0,-0.6,-0.02]], [0.095,0.12,0.115,0.09,0.065]),
      createLimbGeo([[0.05,0.82,-0.04],[0.05,0.52,-0.13],[0.04,0.12,-0.11],[0.02,-0.2,-0.07],[0,-0.6,-0.02]], [0.085,0.11,0.105,0.085,0.06]),
      createLimbGeo([[0,0.75,0.01],[0,0.4,-0.06],[0,0,-0.1],[0,-0.6,-0.02]], [0.08,0.095,0.09,0.06]),
    ]);

    /* ──────────── TIBIAL ANTERIOR ──────────── */
    case 'tibialis-L': return createLimbGeo(
      [[-0.1,0.85,0.12],[-0.1,0.4,0.16],[-0.09,0,0.14],[-0.08,-0.5,0.09]],
      [0.065, 0.078, 0.072, 0.055]
    );
    case 'tibialis-R': return createLimbGeo(
      [[0.1,0.85,0.12],[0.1,0.4,0.16],[0.09,0,0.14],[0.08,-0.5,0.09]],
      [0.065, 0.078, 0.072, 0.055]
    );

    /* ──────────── GRANDE DORSAL ──────────── */
    case 'latissimus-L': return mergeGeos([
      createLimbGeo([[-0.18,2.2,-0.22],[-0.42,1.2,-0.16],[-0.55,0.2,-0.08],[-0.38,-0.55,0.04]], [0.1,0.13,0.14,0.09]),
      createLimbGeo([[-0.08,1.2,-0.25],[-0.38,0.5,-0.16],[-0.5,-0.1,-0.08],[-0.35,-0.55,0.04]], [0.08,0.11,0.12,0.08]),
    ]);
    case 'latissimus-R': return mergeGeos([
      createLimbGeo([[0.18,2.2,-0.22],[0.42,1.2,-0.16],[0.55,0.2,-0.08],[0.38,-0.55,0.04]], [0.1,0.13,0.14,0.09]),
      createLimbGeo([[0.08,1.2,-0.25],[0.38,0.5,-0.16],[0.5,-0.1,-0.08],[0.35,-0.55,0.04]], [0.08,0.11,0.12,0.08]),
    ]);

    /* ──────────── SERRÁTIL ANTERIOR ──────────── */
    case 'serratus-ant-L': {
      const gs = [];
      for (let i = 0; i < 6; i++) {
        gs.push(createLimbGeo(
          [[-0.72+i*0.01,1.1-i*0.22,0.22],[-0.6+i*0.01,1.02-i*0.22,0.34],[-0.45,0.95-i*0.22,0.46]],
          [0.045, 0.038, 0.028]
        ));
      }
      return mergeGeos(gs);
    }
    case 'serratus-ant-R': {
      const gs = [];
      for (let i = 0; i < 6; i++) {
        gs.push(createLimbGeo(
          [[0.72-i*0.01,1.1-i*0.22,0.22],[0.6-i*0.01,1.02-i*0.22,0.34],[0.45,0.95-i*0.22,0.46]],
          [0.045, 0.038, 0.028]
        ));
      }
      return mergeGeos(gs);
    }

    /* ──────────── ROMBOIDES ──────────── */
    case 'rhomboids': {
      const g = new THREE.SphereGeometry(0.5, 24, 18);
      const pos = g.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        pos.setX(i, pos.getX(i) * 0.88);
        pos.setY(i, pos.getY(i) * 0.58 + 0.4);
        pos.setZ(i, pos.getZ(i) * 0.11 - 0.18);
      }
      g.computeVertexNormals();
      return g;
    }

    /* ──────────── ILIOPSOAS ──────────── */
    case 'iliopsoas-L': return createLimbGeo(
      [[-0.24, 1.1, -0.12], [-0.2, 0.5, 0.04], [-0.18, 0, 0.12], [-0.14, -0.52, 0.16]],
      [0.1, 0.12, 0.11, 0.082]
    );
    case 'iliopsoas-R': return createLimbGeo(
      [[0.24, 1.1, -0.12], [0.2, 0.5, 0.04], [0.18, 0, 0.12], [0.14, -0.52, 0.16]],
      [0.1, 0.12, 0.11, 0.082]
    );

    /* ──────────── SARTÓRIO ──────────── */
    case 'sartorius-L': return createLimbGeo(
      [[-0.35, 0.95, 0.18], [-0.25, 0.42, 0.22], [-0.14,-0.08, 0.2], [-0.02,-0.58, 0.1], [0.07,-0.92,-0.04]],
      [0.042, 0.04, 0.036, 0.034, 0.03]
    );
    case 'sartorius-R': return createLimbGeo(
      [[0.35, 0.95, 0.18], [0.25, 0.42, 0.22], [0.14,-0.08, 0.2], [0.02,-0.58, 0.1], [-0.07,-0.92,-0.04]],
      [0.042, 0.04, 0.036, 0.034, 0.03]
    );

    /* ──────────── ADUTORES DO QUADRIL ──────────── */
    case 'adductors-L': return mergeGeos([
      createLimbGeo([[-0.1,0.65,0.06],[-0.12,0.2,0.1],[-0.12,-0.28,0.08],[-0.06,-0.7,0.02]], [0.09,0.11,0.105,0.08]),
      createLimbGeo([[-0.18,0.45,0.02],[-0.2,0.02,0.05],[-0.17,-0.38,0.02]], [0.068,0.082,0.076]),
      createLimbGeo([[-0.24,0.28,-0.04],[-0.22,-0.1,0.02],[-0.18,-0.42,0.0]], [0.055,0.065,0.06]),
    ]);
    case 'adductors-R': return mergeGeos([
      createLimbGeo([[0.1,0.65,0.06],[0.12,0.2,0.1],[0.12,-0.28,0.08],[0.06,-0.7,0.02]], [0.09,0.11,0.105,0.08]),
      createLimbGeo([[0.18,0.45,0.02],[0.2,0.02,0.05],[0.17,-0.38,0.02]], [0.068,0.082,0.076]),
      createLimbGeo([[0.24,0.28,-0.04],[0.22,-0.1,0.02],[0.18,-0.42,0.0]], [0.055,0.065,0.06]),
    ]);

    /* ──────────── GRÁCIL ──────────── */
    case 'gracilis-L': return createLimbGeo(
      [[-0.04, 0.62, 0.03], [-0.05, 0.12, 0.03], [-0.06,-0.28, 0.01], [-0.04,-0.7,-0.02]],
      [0.036, 0.034, 0.031, 0.027]
    );
    case 'gracilis-R': return createLimbGeo(
      [[0.04, 0.62, 0.03], [0.05, 0.12, 0.03], [0.06,-0.28, 0.01], [0.04,-0.7,-0.02]],
      [0.036, 0.034, 0.031, 0.027]
    );

    /* ──────────── BRAQUIAL ANTERIOR ──────────── */
    case 'brachialis-L': return createLimbGeo(
      [[0, 0.72, 0.1], [0, 0.38, 0.15], [0,-0.02, 0.12], [0,-0.42, 0.08]],
      [0.072, 0.092, 0.088, 0.062]
    );
    case 'brachialis-R': return createLimbGeo(
      [[0, 0.72, 0.1], [0, 0.38, 0.15], [0,-0.02, 0.12], [0,-0.42, 0.08]],
      [0.072, 0.092, 0.088, 0.062]
    );

    /* ──────────── FIBULAR LONGO ──────────── */
    case 'fibularis-L': return createLimbGeo(
      [[-0.14, 0.88,-0.01],[-0.14, 0.40, 0.06],[-0.12,-0.12, 0.09],[-0.08,-0.62, 0.05]],
      [0.052, 0.063, 0.058, 0.044]
    );
    case 'fibularis-R': return createLimbGeo(
      [[0.14, 0.88,-0.01],[0.14, 0.40, 0.06],[0.12,-0.12, 0.09],[0.08,-0.62, 0.05]],
      [0.052, 0.063, 0.058, 0.044]
    );

    /* ──────────── POPLÍTEO ──────────── */
    case 'popliteus-L': return createLimbGeo(
      [[-0.1, 0.3,-0.16],[-0.04, 0.14,-0.18],[0.04,-0.02,-0.15]],
      [0.055, 0.062, 0.05]
    );
    case 'popliteus-R': return createLimbGeo(
      [[0.1, 0.3,-0.16],[0.04, 0.14,-0.18],[-0.04,-0.02,-0.15]],
      [0.055, 0.062, 0.05]
    );

    /* ──────────── MANGUITO ROTADOR ──────────── */
    case 'rotator-L': case 'rotator-R': {
      const d = type === 'rotator-L' ? -1 : 1;
      const g = new THREE.TorusGeometry(0.25, 0.07, 10, 22, Math.PI * 1.4);
      g.rotateX(Math.PI / 2 + 0.3);
      g.rotateY(d * 0.3);
      return g;
    }

    /* ──────────── TENDÕES ──────────── */
    case 'achilles-L': case 'achilles-R': {
      const c = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0, 0.55, -0.06),
        new THREE.Vector3(0, 0.25, -0.1),
        new THREE.Vector3(0, -0.05, -0.08),
        new THREE.Vector3(0, -0.42, 0.03)
      );
      return new THREE.TubeGeometry(c, 16, 0.04, 8, false);
    }
    case 'patellar-L': case 'patellar-R': {
      const c = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0.18, 0.5),
        new THREE.Vector3(0, 0, 0.52),
        new THREE.Vector3(0, -0.22, 0.48)
      );
      return new THREE.TubeGeometry(c, 12, 0.038, 8, false);
    }
    case 'plantar-L': case 'plantar-R': {
      const c = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, -0.2),
        new THREE.Vector3(0, -0.04, 0.05),
        new THREE.Vector3(0, -0.02, 0.28),
        new THREE.Vector3(0, 0.0, 0.42),
      ]);
      return new THREE.TubeGeometry(c, 16, 0.022, 7, false);
    }
    case 'cruciate-L': case 'cruciate-R': {
      const a = new THREE.CylinderGeometry(0.024, 0.024, 0.4, 7);
      a.rotateZ(0.3);
      const p = new THREE.CylinderGeometry(0.028, 0.028, 0.4, 7);
      p.rotateZ(-0.3);
      return mergeGeos([a, tG(p, 0, 0, -0.03)]);
    }
    case 'mcl-L': case 'mcl-R': return new THREE.CylinderGeometry(0.02, 0.026, 0.58, 7);
    case 'lcl-L': case 'lcl-R': return new THREE.CylinderGeometry(0.018, 0.024, 0.52, 7);
    case 'meniscus-L': case 'meniscus-R': {
      const g = new THREE.TorusGeometry(0.13, 0.035, 7, 18, Math.PI * 1.65);
      g.rotateX(Math.PI / 2);
      return g;
    }

    /* ──────────── ARTICULAÇÃO GLENOUMERAL ──────────── */
    case 'gleno-joint-L': case 'gleno-joint-R': {
      const ball = new THREE.SphereGeometry(0.22, 20, 16);
      ball.scale(0.95, 1.0, 0.88);
      const rim = new THREE.TorusGeometry(0.20, 0.04, 8, 22);
      rim.rotateX(Math.PI / 2);
      rim.translate(0, 0, -0.04);
      return mergeGeos([ball, rim]);
    }

    /* ──────────── ARTICULAÇÃO COXOFEMORAL ──────────── */
    case 'coxa-joint-L': case 'coxa-joint-R': {
      const ball = new THREE.SphereGeometry(0.26, 22, 18);
      ball.scale(1, 1, 0.92);
      const cup = new THREE.TorusGeometry(0.24, 0.048, 10, 26, Math.PI * 1.85);
      cup.rotateX(Math.PI / 2);
      return mergeGeos([ball, cup]);
    }

    /* ──────────── ARTICULAÇÃO DO COTOVELO ──────────── */
    case 'elbow-joint-L': case 'elbow-joint-R': {
      const hinge = new THREE.TorusGeometry(0.17, 0.042, 8, 20, Math.PI * 1.62);
      hinge.rotateZ(Math.PI / 2);
      const cap = new THREE.SphereGeometry(0.15, 16, 12);
      cap.scale(0.9, 0.65, 0.8);
      cap.translate(0, -0.1, 0);
      return mergeGeos([hinge, cap]);
    }

    /* ──────────── ARTICULAÇÃO TALOCRURAL (TORNOZELO) ──────────── */
    case 'ankle-joint-L': case 'ankle-joint-R': {
      const g = new THREE.SphereGeometry(0.17, 16, 12);
      g.scale(1.12, 0.72, 0.88);
      const mortise = new THREE.TorusGeometry(0.15, 0.035, 7, 18, Math.PI * 1.5);
      mortise.rotateZ(Math.PI / 2);
      mortise.translate(0, -0.04, 0);
      return mergeGeos([g, mortise]);
    }

    /* ──────────── ARTICULAÇÃO SACROILÍACA ──────────── */
    case 'si-joint-L': case 'si-joint-R': {
      const d = type === 'si-joint-L' ? -1 : 1;
      const s = new THREE.Shape();
      s.moveTo(0,0); s.lineTo(d*0.1, 0.25); s.lineTo(d*0.06, 0.55);
      s.lineTo(d*(-0.04), 0.65); s.lineTo(d*(-0.12), 0.38); s.lineTo(d*(-0.08), 0.06);
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: 0.055, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3 });
    }

    /* ──────────── ARTICULAÇÃO DO PUNHO ──────────── */
    case 'wrist-joint-L': case 'wrist-joint-R': {
      const g = new THREE.SphereGeometry(0.14, 14, 10);
      g.scale(1.2, 0.65, 0.9);
      return g;
    }

    /* ──────────── ARTICULAÇÃO ACROMIOCLAVICULAR ──────────── */
    case 'ac-joint-L': case 'ac-joint-R': {
      const g = new THREE.SphereGeometry(0.088, 12, 10);
      g.scale(0.85, 0.7, 1.0);
      return g;
    }

    /* ──────────── ESTERNOCLEIDOMASTOIDEO (SCM) ──────────── */
    case 'scm-L': return mergeGeos([
      // Cabeça esternal
      createLimbGeo([[-0.06,-0.72,0.18],[-0.1,-0.28,0.12],[-0.12,0.22,0.04],[-0.1,0.7,-0.06]], [0.038,0.042,0.044,0.036]),
      // Cabeça clavicular
      createLimbGeo([[-0.18,-0.68,0.14],[-0.14,-0.25,0.1],[-0.12,0.24,0.04]], [0.028,0.033,0.036]),
    ]);
    case 'scm-R': return mergeGeos([
      createLimbGeo([[0.06,-0.72,0.18],[0.1,-0.28,0.12],[0.12,0.22,0.04],[0.1,0.7,-0.06]], [0.038,0.042,0.044,0.036]),
      createLimbGeo([[0.18,-0.68,0.14],[0.14,-0.25,0.1],[0.12,0.24,0.04]], [0.028,0.033,0.036]),
    ]);

    /* ──────────── ERETOR DA ESPINHA ──────────── */
    case 'erector-L': return mergeGeos([
      createLimbGeo([[-0.12,2.8,-0.18],[-0.12,1.8,-0.22],[-0.11,0.6,-0.2],[-0.1,-0.25,-0.15]], [0.065,0.072,0.078,0.06]),
      createLimbGeo([[-0.2,2.6,-0.15],[-0.2,1.6,-0.19],[-0.18,0.5,-0.17],[-0.16,-0.28,-0.12]], [0.052,0.058,0.062,0.048]),
    ]);
    case 'erector-R': return mergeGeos([
      createLimbGeo([[0.12,2.8,-0.18],[0.12,1.8,-0.22],[0.11,0.6,-0.2],[0.1,-0.25,-0.15]], [0.065,0.072,0.078,0.06]),
      createLimbGeo([[0.2,2.6,-0.15],[0.2,1.6,-0.19],[0.18,0.5,-0.17],[0.16,-0.28,-0.12]], [0.052,0.058,0.062,0.048]),
    ]);

    /* ──────────── ELEVADOR DA ESCÁPULA ──────────── */
    case 'levator-scap-L': return createLimbGeo(
      [[-0.12,1.35,-0.12],[-0.22,0.88,-0.22],[-0.36,0.35,-0.3],[-0.48,-0.02,-0.32]],
      [0.04, 0.044, 0.046, 0.038]
    );
    case 'levator-scap-R': return createLimbGeo(
      [[0.12,1.35,-0.12],[0.22,0.88,-0.22],[0.36,0.35,-0.3],[0.48,-0.02,-0.32]],
      [0.04, 0.044, 0.046, 0.038]
    );

    /* ──────────── PIRIFORME ──────────── */
    case 'piriformis-L': return createLimbGeo(
      [[-0.08,0.15,-0.14],[-0.28,0.08,-0.1],[-0.48,0.0,-0.0],[-0.58,-0.05,0.08]],
      [0.05, 0.058, 0.062, 0.045]
    );
    case 'piriformis-R': return createLimbGeo(
      [[0.08,0.15,-0.14],[0.28,0.08,-0.1],[0.48,0.0,-0.0],[0.58,-0.05,0.08]],
      [0.05, 0.058, 0.062, 0.045]
    );

    /* ──────────── TENSOR DA FÁSCIA LATA (TFL) ──────────── */
    case 'tfl-L': return createLimbGeo(
      [[-0.55,0.72,0.18],[-0.62,0.28,0.22],[-0.65,-0.2,0.2],[-0.62,-0.65,0.16]],
      [0.05, 0.058, 0.056, 0.046]
    );
    case 'tfl-R': return createLimbGeo(
      [[0.55,0.72,0.18],[0.62,0.28,0.22],[0.65,-0.2,0.2],[0.62,-0.65,0.16]],
      [0.05, 0.058, 0.056, 0.046]
    );

    /* ──────────── SÓLEO ──────────── */
    case 'soleus-L': return mergeGeos([
      createLimbGeo([[-0.06,0.72,-0.1],[-0.06,0.35,-0.14],[-0.04,-0.08,-0.12],[-0.02,-0.5,-0.06]], [0.09,0.11,0.105,0.08]),
      createLimbGeo([[0.04,0.7,-0.09],[0.04,0.33,-0.13],[0.03,-0.1,-0.11],[0.01,-0.5,-0.06]], [0.085,0.105,0.1,0.075]),
    ]);
    case 'soleus-R': return mergeGeos([
      createLimbGeo([[0.06,0.72,-0.1],[0.06,0.35,-0.14],[0.04,-0.08,-0.12],[0.02,-0.5,-0.06]], [0.09,0.11,0.105,0.08]),
      createLimbGeo([[-0.04,0.7,-0.09],[-0.04,0.33,-0.13],[-0.03,-0.1,-0.11],[-0.01,-0.5,-0.06]], [0.085,0.105,0.1,0.075]),
    ]);

    case 'discs': {
      const gs = [];
      for (let i = 0; i < 5; i++) {
        const g = new THREE.CylinderGeometry(0.22, 0.22, 0.075, 14);
        const p = g.getAttribute('position');
        for (let j = 0; j < p.count; j++) {
          p.setX(j, p.getX(j) * 1.05);
          p.setZ(j, p.getZ(j) * 0.88);
        }
        g.computeVertexNormals();
        gs.push(tG(g, 0, i * 0.52, 0));
      }
      return mergeGeos(gs);
    }

    /* ──────────── NERVOS ──────────── */
    case 'nerve-brachial-L': case 'nerve-brachial-R': {
      const d = type.endsWith('-L') ? -1 : 1;
      const gs = [];
      const origins = [[0, 0.28, 0.02], [0, 0.18, 0.02], [0, 0.08, 0.02], [0,-0.04, 0.02], [0,-0.14, 0.02]];
      for (let i = 0; i < 5; i++) {
        const c = new THREE.CubicBezierCurve3(
          new THREE.Vector3(origins[i][0], origins[i][1], origins[i][2]),
          new THREE.Vector3(d*(0.2 + i*0.06), origins[i][1] + 0.05, 0.06),
          new THREE.Vector3(d*(0.45 + i*0.08), origins[i][1] - 0.08, 0.02),
          new THREE.Vector3(d*(0.7 + i*0.09), origins[i][1] - 0.18, -0.04)
        );
        gs.push(new THREE.TubeGeometry(c, 12, 0.014 + (i === 2 ? 0.004 : 0), 6, false));
      }
      return mergeGeos(gs);
    }
    case 'nerve-sciatic-L': case 'nerve-sciatic-R': {
      const d = type.endsWith('-L') ? -1 : 1;
      const c = new THREE.CatmullRomCurve3([
        new THREE.Vector3(d*0.14, 0.85, -0.18),
        new THREE.Vector3(d*0.12, 0.3, -0.22),
        new THREE.Vector3(d*0.1, -0.25, -0.2),
        new THREE.Vector3(d*0.08, -0.8, -0.18),
        new THREE.Vector3(d*0.06, -1.3, -0.14),
        new THREE.Vector3(d*0.1, -1.65, -0.1),
      ]);
      return new THREE.TubeGeometry(c, 30, 0.042, 8, false);
    }
    case 'nerve-femoral-L': case 'nerve-femoral-R': {
      const d = type.endsWith('-L') ? -1 : 1;
      const c = new THREE.CatmullRomCurve3([
        new THREE.Vector3(d*0.2, 0.55, 0.18),
        new THREE.Vector3(d*0.18, 0.1, 0.24),
        new THREE.Vector3(d*0.14, -0.4, 0.22),
        new THREE.Vector3(d*0.1, -0.9, 0.18),
        new THREE.Vector3(d*0.08, -1.35, 0.14),
      ]);
      return new THREE.TubeGeometry(c, 24, 0.032, 8, false);
    }
    case 'nerve-median': case 'nerve-ulnar': case 'nerve-radial': {
      const xOff = type === 'nerve-ulnar' ? 0.1 : type === 'nerve-radial' ? -0.1 : 0;
      const zOff = type === 'nerve-radial' ? -0.15 : type === 'nerve-ulnar' ? -0.08 : 0.18;
      const c = new THREE.CatmullRomCurve3([
        new THREE.Vector3(xOff, 0.7, zOff),
        new THREE.Vector3(xOff * 1.1, 0.2, zOff),
        new THREE.Vector3(xOff * 0.8, -0.2, zOff * 0.9),
        new THREE.Vector3(xOff * 0.5, -0.6, zOff * 0.7),
        new THREE.Vector3(xOff * 0.3, -1.05, zOff * 0.5),
      ]);
      return new THREE.TubeGeometry(c, 22, 0.018, 7, false);
    }
    case 'nerve-tibial-L': case 'nerve-tibial-R': {
      const d = type.endsWith('-L') ? -1 : 1;
      const c = new THREE.CatmullRomCurve3([
        new THREE.Vector3(d*0.04, 0.55, -0.18),
        new THREE.Vector3(d*0.03, 0.1, -0.2),
        new THREE.Vector3(d*0.04, -0.3, -0.18),
        new THREE.Vector3(d*0.05, -0.75, -0.14),
        new THREE.Vector3(d*0.04, -1.15, -0.1),
      ]);
      return new THREE.TubeGeometry(c, 22, 0.026, 7, false);
    }
    case 'nerve-fibular-L': case 'nerve-fibular-R': {
      const d = type.endsWith('-L') ? -1 : 1;
      const c = new THREE.CatmullRomCurve3([
        new THREE.Vector3(d*0.1, 0.4, -0.1),
        new THREE.Vector3(d*0.16, 0.1, 0.04),
        new THREE.Vector3(d*0.14, -0.2, 0.1),
        new THREE.Vector3(d*0.1, -0.6, 0.12),
        new THREE.Vector3(d*0.06, -0.9, 0.08),
      ]);
      return new THREE.TubeGeometry(c, 18, 0.02, 6, false);
    }
    case 'spinal-cord': return createLimbGeo(
      [[0,4.2,-0.22],[0,3,-0.28],[0,1.5,-0.25],[0,0,-0.22],[0,-1.0,-0.18]],
      [0.075, 0.08, 0.075, 0.068, 0.06]
    );

    /* ──────────── ÓRGÃOS ──────────── */
    case 'brain': {
      const g = new THREE.SphereGeometry(0.6, 48, 36);
      const pos = g.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i); const y = pos.getY(i); const z = pos.getZ(i);
        // Sulcos cerebrais simulados com ruído
        const noise = Math.sin(x*8)*Math.cos(y*7)*0.025 + Math.sin(z*9)*0.018;
        const r = Math.sqrt(x*x+y*y+z*z);
        const scale = (r + noise) / r;
        pos.setX(i, x * scale * 1.02); pos.setY(i, y * scale * 0.88); pos.setZ(i, z * scale * 1.08);
      }
      g.computeVertexNormals();
      return g;
    }
    case 'cerebellum': {
      const g = new THREE.SphereGeometry(0.28, 32, 20);
      const pos = g.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const noise = Math.sin(pos.getX(i)*12)*0.018;
        pos.setY(i, y + noise);
        pos.setX(i, pos.getX(i) * 1.32);
        pos.setZ(i, pos.getZ(i) * 0.9);
      }
      g.computeVertexNormals();
      return g;
    }
    case 'heart-organ': {
      const g = new THREE.SphereGeometry(0.34, 32, 24);
      const pos = g.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i); const y = pos.getY(i); const z = pos.getZ(i);
        // Forma de coração
        const heartX = x; const heartY = y - Math.abs(x) * 0.5;
        pos.setX(i, heartX * 1.0); pos.setY(i, heartY * 1.15); pos.setZ(i, z * 0.92);
      }
      g.computeVertexNormals();
      return mergeGeos([
        g,
        tG(sG(new THREE.CylinderGeometry(0.07, 0.04, 0.32, 8), 1, 1, 1), -0.1, 0.4, 0),
        tG(sG(new THREE.CylinderGeometry(0.06, 0.035, 0.28, 8), 1, 1, 1), 0.12, 0.38, 0.05),
        tG(sG(new THREE.CylinderGeometry(0.05, 0.03, 0.26, 8), 1, 1, 1), 0.02, 0.36, -0.1),
      ]);
    }
    case 'lung-L': case 'lung-R': {
      const d = type === 'lung-L' ? -1 : 1;
      const g = new THREE.SphereGeometry(0.5, 28, 22);
      const pos = g.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i); const y = pos.getY(i); const z = pos.getZ(i);
        pos.setX(i, x * 0.7 + d * 0.04);
        pos.setY(i, y * 1.25);
        pos.setZ(i, z * 0.82 + (z > 0 ? 0.08 : 0));
        // Corte medial
        if (pos.getX(i) * d > 0.2) pos.setX(i, d * 0.2 + (pos.getX(i) - d * 0.2) * 0.3);
      }
      g.computeVertexNormals();
      return g;
    }
    case 'liver-organ': {
      const s = new THREE.Shape();
      s.moveTo(-0.5, 0.05); s.quadraticCurveTo(-0.62, 0.3, -0.28, 0.42);
      s.quadraticCurveTo(0.08, 0.48, 0.42, 0.28);
      s.quadraticCurveTo(0.62, 0.12, 0.48, -0.15);
      s.quadraticCurveTo(0.3, -0.35, 0, -0.38);
      s.quadraticCurveTo(-0.28, -0.38, -0.38, -0.15);
      s.quadraticCurveTo(-0.5, 0, -0.5, 0.05);
      return new THREE.ExtrudeGeometry(s, { depth: 0.38, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 5 });
    }
    case 'kidney-L': case 'kidney-R': {
      const g = new THREE.SphereGeometry(0.21, 20, 16);
      g.scale(0.68, 1.02, 0.56);
      return g;
    }
    case 'stomach-organ': {
      const g = new THREE.SphereGeometry(0.3, 24, 18);
      const pos = g.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i); const y = pos.getY(i);
        pos.setX(i, x * 1.3 + y * 0.18);
        pos.setY(i, y * 0.85);
        pos.setZ(i, pos.getZ(i) * 0.72);
      }
      g.computeVertexNormals();
      return g;
    }
    case 'diaphragm': {
      const g = new THREE.SphereGeometry(0.82, 32, 16, 0, Math.PI*2, 0, Math.PI*0.42);
      g.scale(1.22, 0.38, 1.0);
      return g;
    }
    case 'intestine-small': {
      const gs = [];
      for (let i = 0; i < 9; i++) {
        const x1 = (i % 2 === 0 ? -1 : 1) * 0.22;
        const x2 = -x1;
        const c = new THREE.CubicBezierCurve3(
          new THREE.Vector3(x1, 0.4 - i*0.09, 0.02),
          new THREE.Vector3(x2 * 0.6, 0.35 - i*0.09, 0.05),
          new THREE.Vector3(x2 * 0.8, 0.3 - i*0.09, 0.03),
          new THREE.Vector3(x2, 0.4 - (i+1)*0.09, 0.02),
        );
        gs.push(new THREE.TubeGeometry(c, 12, 0.028, 7, false));
      }
      return mergeGeos(gs);
    }
    case 'intestine-large': {
      const pts = [
        new THREE.Vector3(0.38, -0.38, 0.02), new THREE.Vector3(0.38, 0.18, 0.02),
        new THREE.Vector3(0.22, 0.38, 0.02), new THREE.Vector3(-0.22, 0.38, 0.02),
        new THREE.Vector3(-0.38, 0.18, 0.02), new THREE.Vector3(-0.38, -0.28, 0.02),
        new THREE.Vector3(-0.2, -0.42, 0.02), new THREE.Vector3(0, -0.45, 0.02),
      ];
      const c = new THREE.CatmullRomCurve3(pts, false);
      return new THREE.TubeGeometry(c, 36, 0.065, 9, false);
    }
    case 'trachea': {
      const gs = [];
      const col = createLimbGeo([[0,0.9,0.05],[0,0.5,0.03],[0,0,0],[0,-0.5,0]], [0.065,0.065,0.065,0.065]);
      gs.push(col);
      for (let i = 0; i < 10; i++) {
        const ring = new THREE.TorusGeometry(0.07, 0.014, 6, 14, Math.PI * 1.62);
        ring.rotateX(Math.PI/2);
        ring.translate(0, 0.42 - i*0.085, 0.02);
        gs.push(ring);
      }
      return mergeGeos(gs);
    }

    /* ──────────── ESTRUTURAS ESPECIAIS ──────────── */
    case 'fascia-toracolombar': {
      const s = new THREE.Shape();
      s.moveTo(-0.55, 0.88); s.quadraticCurveTo(-0.6, 0.4, -0.58, 0);
      s.lineTo(-0.5, -0.65); s.lineTo(0.5, -0.65);
      s.lineTo(0.58, 0); s.quadraticCurveTo(0.6, 0.4, 0.55, 0.88);
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: 0.032, bevelEnabled: false });
    }
    case 'bursa-subacromial-L': case 'bursa-subacromial-R': {
      const g = new THREE.SphereGeometry(0.18, 14, 10);
      g.scale(1.45, 0.28, 1.12);
      return g;
    }
    case 'bursa-trocanteric-L': case 'bursa-trocanteric-R': {
      const g = new THREE.SphereGeometry(0.16, 14, 10);
      g.scale(1.02, 0.32, 0.82);
      return g;
    }
    case 'labrum-glenoidal-L': case 'labrum-glenoidal-R': {
      const g = new THREE.TorusGeometry(0.17, 0.036, 9, 22);
      g.rotateX(Math.PI / 2);
      return g;
    }
    case 'retinaculum-ext-L': case 'retinaculum-ext-R': {
      return sG(new THREE.BoxGeometry(0.36, 0.09, 0.22), 1, 1, 1);
    }
    case 'tit-L': case 'tit-R': {
      const d = type === 'tit-L' ? -1 : 1;
      const c = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.6, 0.06), new THREE.Vector3(d*0.04, 0.2, 0.1),
        new THREE.Vector3(d*0.02, -0.2, 0.06), new THREE.Vector3(0, -0.7, 0),
      ]);
      return new THREE.TubeGeometry(c, 20, 0.044, 9, false);
    }

    default: return new THREE.SphereGeometry(0.22, 16, 14);
  }
}

/* ═══════════════════════════════════════════════════════
   CATEGORIA CONFIG
═══════════════════════════════════════════════════════ */

const CATEGORY_CONFIG = {
  'Esqueleto Axial':       { color: '#D4A574', icon: '🦴' },
  'Esqueleto Apendicular': { color: '#C4956E', icon: '🦴' },
  'Músculos':              { color: '#E06060', icon: '💪' },
  'Articulações':          { color: '#60B8DA', icon: '🔗' },
  'Tendões/Ligamentos':    { color: '#D4CCA0', icon: '🎗️' },
  'Nervos':                { color: '#F5D547', icon: '⚡' },
  'Órgãos':                { color: '#B05050', icon: '❤️' },
  'Estruturas Especiais':  { color: '#50B8A0', icon: '✨' },
};

/* ═══════════════════════════════════════════════════════
   DATABASE (mantida a mesma do original - posições e dados)
═══════════════════════════════════════════════════════ */

const STRUCTURES = [
  /* ESQUELETO AXIAL */
  { id: 'cranio', name: 'Crânio', category: 'Esqueleto Axial', position: [0, 7.2, 0], geometry: 'cranium', material: 'bone',
    description: 'Estrutura óssea composta por 22 ossos (8 cranianos + 14 faciais) unidos por suturas. Protege o encéfalo e abriga órgãos dos sentidos.',
    details: { 'Ossos cranianos': 'Frontal, Parietais (2), Temporais (2), Occipital, Esfenoide, Etmoide', 'Suturas': 'Sagital, Coronal, Lambdoide, Escamosa', 'Testes': 'Percussão craniana, Palpação de suturas' }
  },
  { id: 'face', name: 'Face (Ossos Faciais)', category: 'Esqueleto Axial', position: [0, 7.05, 0.1], geometry: 'face', material: 'bone',
    description: '14 ossos faciais: zigomáticos, maxilas, mandíbula, nasais, lacrimais, palatinos, vômer, cornetos inferiores.',
    details: { 'Mandíbula': 'Único osso móvel da face — ATM', 'Zigomático': 'Proeminência da bochecha', 'ATM': 'Articulação temporomandibular — disfunções craniomandibulares' }
  },
  { id: 'cervical', name: 'Coluna Cervical (C1-C7)', category: 'Esqueleto Axial', position: [0, 6.05, -0.22], geometry: 'vert-cervical', material: 'bone',
    description: 'Sete vértebras — região mais móvel da coluna. C1 (Atlas) sem corpo, C2 (Áxis) com dente.',
    details: { 'ADM': 'Flexão 80°, Extensão 50°, Rotação 90°, Inclinação 45°', 'Testes': 'Spurling, Distração cervical, Lhermitte', 'Patologias': 'Hérnia cervical, Cervicobraquialgia, Whiplash' }
  },
  { id: 'toracica', name: 'Coluna Torácica (T1-T12)', category: 'Esqueleto Axial', position: [0, 3.85, -0.35], geometry: 'vert-thoracic', material: 'boneDark',
    description: 'Doze vértebras torácicas articuladas com costelas. Cifose torácica.',
    details: { 'Curvatura': 'Cifose (côncava anterior)', 'Articulações': 'Costovertebrais + Costotransversárias', 'Testes': 'Adams (escoliose)' }
  },
  { id: 'lombar', name: 'Coluna Lombar (L1-L5)', category: 'Esqueleto Axial', position: [0, 1.55, -0.28], geometry: 'vert-lumbar', material: 'bone',
    description: 'Cinco vértebras — as mais robustas. Suportam 60-80% do peso corporal.',
    details: { 'ADM': 'Flexão 60°, Extensão 25°', 'Testes': 'Lasègue (SLR), Slump, Schober', 'Disco L4-L5': 'Maior índice de herniação' }
  },
  { id: 'sacro', name: 'Sacro e Cóccix', category: 'Esqueleto Axial', position: [0, 0.45, -0.18], geometry: 'sacrum', material: 'boneDark',
    description: 'Osso triangular — fusão de 5 vértebras sacrais + cóccix.',
    details: { 'Articulações': 'Lombossacral, Sacroilíacas, Sacrococcígea', 'Plexo sacral': 'L4-S3 → nervo ciático', 'Testes': 'Gaenslen, FABER (Patrick)' }
  },
  { id: 'costR', name: 'Costelas Direitas', category: 'Esqueleto Axial', position: [0, 4.0, 0], geometry: 'ribs-R', material: 'boneDark',
    description: '12 pares: verdadeiras (1-7), falsas (8-10), flutuantes (11-12).',
    details: { 'Verdadeiras': '1ª-7ª → esterno', 'Falsas': '8ª-10ª → 7º arco costal', 'Flutuantes': '11ª-12ª livres' }
  },
  { id: 'costL', name: 'Costelas Esquerdas', category: 'Esqueleto Axial', position: [0, 4.0, 0], geometry: 'ribs-L', material: 'boneDark',
    description: 'Espelho das costelas direitas. Protegem coração e pulmões.',
    details: { 'Mecânica': 'Alça de balde + Braço de bomba', 'Nervo': 'Intercostal (sulco costal)' }
  },
  { id: 'esterno', name: 'Esterno', category: 'Esqueleto Axial', position: [0, 4.25, 0.62], geometry: 'sternum', material: 'bone',
    description: 'Osso plano: manúbrio, corpo e xifoide. Ângulo de Louis = referência 2ª costela.',
    details: { 'Ângulo de Louis': 'Junção manúbrio-corpo → 2ª costela / T4-T5', 'Medula': 'Rico em tecido hematopoiético' }
  },
  { id: 'neck', name: 'Pescoço', category: 'Esqueleto Axial', position: [0, 6.18, 0], geometry: 'neck', material: 'skin',
    description: 'Região cervical com músculos, nervos e vasos principais.',
    details: { 'Músculos': 'ECM, Escalenos, Trapézio superior', 'Vasos': 'Carótidas, Jugulares' }
  },

  /* ESQUELETO APENDICULAR */
  { id: 'pelve', name: 'Pelve (Ilíaco)', category: 'Esqueleto Apendicular', position: [0, 0.08, 0], geometry: 'pelvis-body', material: 'bone',
    description: 'Cintura pélvica: ílio + ísquio + púbis + sacro. Centro de gravidade corporal.',
    details: { 'Acetábulo': 'Recebe cabeça femoral', 'EIAS': 'Espinha ilíaca ântero-superior', 'Testes': 'Trendelenburg, Thomas, FABER/FADIR' }
  },
  { id: 'scapL', name: 'Escápula Esquerda', category: 'Esqueleto Apendicular', position: [-1.28, 4.7, -0.62], geometry: 'scap-L', material: 'bone',
    description: 'Osso triangular plano — inserção de 17 músculos. Crucial para cinemática do ombro.',
    details: { 'Ritmo': 'Escapuloumeral 2:1 (120° GU + 60° ET)', 'Patologias': 'Escápula alada, Discinesia' }
  },
  { id: 'scapR', name: 'Escápula Direita', category: 'Esqueleto Apendicular', position: [1.28, 4.7, -0.62], geometry: 'scap-R', material: 'bone',
    description: 'Espelho. Labrum aumenta profundidade da glenoide em 50%.',
    details: { 'Ângulo inferior': 'Nível T7 — referência postural', 'Acidentes': 'Espinha, Acrômio, Coracoide' }
  },
  { id: 'clavL', name: 'Clavícula Esquerda', category: 'Esqueleto Apendicular', position: [-0.68, 5.4, 0.32], geometry: 'clav-L', material: 'bone',
    description: 'Osso "S" — primeiro a ossificar, mais fraturado.',
    details: { 'Articulações': 'Esternoclavicular, Acromioclavicular', 'Fratura': 'Junção terços médio/lateral' }
  },
  { id: 'clavR', name: 'Clavícula Direita', category: 'Esqueleto Apendicular', position: [0.68, 5.4, 0.32], geometry: 'clav-R', material: 'bone',
    description: 'Espelho. Totalmente subcutânea — palpável em toda extensão.',
    details: { 'Ligamentos': 'Coracoclavicular (conoide + trapezoide)', 'Palpação': 'Subcutânea toda extensão' }
  },
  { id: 'humL', name: 'Úmero Esquerdo', category: 'Esqueleto Apendicular', position: [-2.05, 3.2, 0], geometry: 'hum-L', material: 'bone',
    description: 'Osso longo do braço. Glenoumeral (3 GL) + cotovelo.',
    details: { 'Nervos': 'Axilar (colo), Radial (sulco), Ulnar (epicôndilo med)', 'Patologias': 'Fratura colo, Epicondilite', 'Testes': 'Neer, Jobe, Patte' }
  },
  { id: 'humR', name: 'Úmero Direito', category: 'Esqueleto Apendicular', position: [2.05, 3.2, 0], geometry: 'hum-R', material: 'bone',
    description: 'Espelho do úmero esquerdo.',
    details: { 'SITS': 'Supraespinal, Infraespinal, Redondo menor, Subescapular', 'Irrigação': 'Circunflexas umerais ant + post' }
  },
  { id: 'frmL', name: 'Rádio e Ulna Esq.', category: 'Esqueleto Apendicular', position: [-2.32, 1.52, 0], geometry: 'forearm-L', material: 'boneDark',
    description: 'Rádio (lat) + Ulna (med). Pronação/supinação: rádio cruza sobre ulna.',
    details: { 'Patologias': 'Colles, Smith, Túnel cubital', 'Membrana': 'Interóssea — transmissão de forças' }
  },
  { id: 'frmR', name: 'Rádio e Ulna Dir.', category: 'Esqueleto Apendicular', position: [2.32, 1.52, 0], geometry: 'forearm-R', material: 'boneDark',
    description: 'Espelho do antebraço esquerdo.',
    details: { 'Tabaqueira anatômica': 'Tendões extensores polegar', 'Escafoide': 'Risco necrose avascular' }
  },
  { id: 'handL', name: 'Mão Esquerda', category: 'Esqueleto Apendicular', position: [-2.5, 0.1, 0.3], geometry: 'hand-L', material: 'bone',
    description: '27 ossos: 8 carpais, 5 metacarpais, 14 falanges.',
    details: { 'Túnel do carpo': 'Retináculo + carpais → n. mediano', 'Testes': 'Phalen, Tinel, Finkelstein, Allen' }
  },
  { id: 'handR', name: 'Mão Direita', category: 'Esqueleto Apendicular', position: [2.5, 0.1, 0.3], geometry: 'hand-R', material: 'bone',
    description: 'Espelho da mão esquerda.',
    details: { 'Preensão': 'Força (flex. extrínsecos) + Precisão (oponência polegar)' }
  },
  { id: 'femL', name: 'Fêmur Esquerdo', category: 'Esqueleto Apendicular', position: [-0.6, -1.6, 0], geometry: 'fem-L', material: 'bone',
    description: 'Maior osso (~45cm). Ângulo de inclinação ~125°.',
    details: { 'Proximal': 'Cabeça (fóvea), Colo, Trocanteres', 'Testes': 'Trendelenburg, Thomas, FABER, FADIR', 'Patologias': 'Fratura colo, Necrose avascular, FAI' }
  },
  { id: 'femR', name: 'Fêmur Direito', category: 'Esqueleto Apendicular', position: [0.6, -1.6, 0], geometry: 'fem-R', material: 'bone',
    description: 'Espelho do fêmur esquerdo.',
    details: { 'Ângulo Q': '~15° (EIAS → patela → tub. tibial)', 'Triângulo Ward': 'Região frágil do colo' }
  },
  { id: 'patL', name: 'Patela Esquerda', category: 'Articulações', position: [-0.6, -3.35, 0.52], geometry: 'patella', material: 'bone',
    description: 'Maior sesamoide. ↑ vantagem mecânica do quadríceps 30-50%.',
    details: { 'Patologias': 'Condromalácia, Luxação recorrente', 'Testes': 'Clarke, Apprehension' }
  },
  { id: 'patR', name: 'Patela Direita', category: 'Articulações', position: [0.6, -3.35, 0.52], geometry: 'patella', material: 'bone',
    description: 'Espelho da patela esquerda.',
    details: { 'Biomecânica': '↑ braço de momento quadríceps 30-50%' }
  },
  { id: 'legL', name: 'Tíbia e Fíbula Esq.', category: 'Esqueleto Apendicular', position: [-0.6, -4.85, 0], geometry: 'leg-L', material: 'bone',
    description: 'Tíbia suporta peso; fíbula fixa músculos. N. fibular na cabeça (footdrop!).',
    details: { 'Testes': 'Lachman, Gaveta, McMurray, Apley', 'N. fibular': 'Cabeça da fíbula — vulnerável!' }
  },
  { id: 'legR', name: 'Tíbia e Fíbula Dir.', category: 'Esqueleto Apendicular', position: [0.6, -4.85, 0], geometry: 'leg-R', material: 'bone',
    description: 'Espelho da perna esquerda.',
    details: { 'Crista tibial': 'Subcutânea (palpável)', 'Sindesmose': 'Tibiofibular distal' }
  },
  { id: 'footL', name: 'Pé Esquerdo', category: 'Esqueleto Apendicular', position: [-0.6, -6.9, 0.3], geometry: 'foot-L', material: 'bone',
    description: '26 ossos, 33 articulações. Sustenta peso, absorve impacto, propulsão.',
    details: { 'Arcos': 'Longitudinal medial, Lateral, Transverso', 'Patologias': 'Fascite plantar, Hálux valgo', 'Testes': 'Thompson, Windlass' }
  },
  { id: 'footR', name: 'Pé Direito', category: 'Esqueleto Apendicular', position: [0.6, -6.9, 0.3], geometry: 'foot-R', material: 'bone',
    description: 'Espelho do pé esquerdo.',
    details: { 'Tendão Aquiles': 'O mais forte do corpo', 'Thompson': 'Compressão sem flexão plantar = ruptura' }
  },

  /* MÚSCULOS */
  { id: 'deltL', name: 'Deltóide Esquerdo', category: 'Músculos', position: [-1.88, 4.82, 0.18], geometry: 'deltoid-L', material: 'muscle',
    description: '3 feixes: Anterior (flexão), Médio (abdução), Posterior (extensão).',
    details: { 'Origem': '1/3 lat clavícula, Acrômio, Espinha escapular', 'Inserção': 'Tuberosidade deltóidea', 'Inervação': 'N. axilar (C5-C6)', 'Testes': 'Abdução resistida 90°' }
  },
  { id: 'deltR', name: 'Deltóide Direito', category: 'Músculos', position: [1.88, 4.82, 0.18], geometry: 'deltoid-R', material: 'muscle',
    description: 'Espelho. N. axilar (C5-C6).',
    details: { 'Inervação': 'N. axilar (C5-C6)', 'Função': 'Abdução pura — feixe médio' }
  },
  { id: 'peitL', name: 'Peitoral Maior Esq.', category: 'Músculos', position: [-0.52, 4.52, 0.72], geometry: 'pectoral-L', material: 'muscle',
    description: 'Feixe clavicular + esternal. Principal rotador medial do ombro.',
    details: { 'Inervação': 'Nn. peitorais med + lat (C5-T1)', 'Função': 'Adução + RM + Flexão MS', 'Irrigação': 'Art. toracoacromial' }
  },
  { id: 'peitR', name: 'Peitoral Maior Dir.', category: 'Músculos', position: [0.52, 4.52, 0.72], geometry: 'pectoral-R', material: 'muscle',
    description: 'Espelho do peitoral esquerdo.',
    details: { 'Inervação': 'Nn. peitorais (C5-T1)' }
  },
  { id: 'bicL', name: 'Bíceps Braquial Esq.', category: 'Músculos', position: [-2.05, 2.8, 0], geometry: 'biceps-L', material: 'muscle',
    description: 'CL (tub. supraglenoide) + CC (coracoide). Flexão cotovelo + supinação.',
    details: { 'Inervação': 'N. musculocutâneo (C5-C6)', 'Patologias': 'Tendinite CL, Ruptura distal, SLAP', 'Testes': 'Speed, Yergason, O\'Brien' }
  },
  { id: 'bicR', name: 'Bíceps Braquial Dir.', category: 'Músculos', position: [2.05, 2.8, 0], geometry: 'biceps-R', material: 'muscle',
    description: 'Espelho. N. musculocutâneo (C5-C6).',
    details: { 'Função': 'Flexão cotovelo + Supinação', 'Inervação': 'N. musculocutâneo (C5-C6)' }
  },
  { id: 'triL', name: 'Tríceps Braquial Esq.', category: 'Músculos', position: [-2.05, 2.8, 0], geometry: 'triceps-L', material: 'muscleDeep',
    description: '3 cabeças → olécrano. Extensor do cotovelo.',
    details: { 'Inervação': 'N. radial (C6-C8)', 'Função': 'Extensão cotovelo', 'Teste': 'Extensão resistida' }
  },
  { id: 'triR', name: 'Tríceps Braquial Dir.', category: 'Músculos', position: [2.05, 2.8, 0], geometry: 'triceps-R', material: 'muscleDeep',
    description: 'Espelho. N. radial (C6-C8).',
    details: { 'Inervação': 'N. radial (C6-C8)' }
  },
  { id: 'trap', name: 'Trapézio', category: 'Músculos', position: [0, 5.1, -0.58], geometry: 'trapezius', material: 'muscleDeep',
    description: 'Superior (elevação), Médias (retração), Inferiores (depressão).',
    details: { 'Inervação': 'N. acessório (XI) + C3-C4', 'Patologias': 'Pontos-gatilho, Cefaleia tensional' }
  },
  { id: 'abdm', name: 'Reto Abdominal', category: 'Músculos', position: [0, 2.1, 0], geometry: 'rectus-abdominis', material: 'muscle',
    description: '4 pares de ventres (6-pack). Flexão tronco + pressão intra-abdominal.',
    details: { 'Origem': '5ª-7ª cart. costais + xifoide', 'Inserção': 'Crista e sínfise púbica', 'Inervação': 'Nn. intercostais T7-T12' }
  },
  { id: 'oblL', name: 'Oblíquos Esquerdos', category: 'Músculos', position: [-0.8, 2.1, 0], geometry: 'obliques-L', material: 'muscleMid',
    description: 'Externo + Interno. Rotação e inclinação lateral do tronco.',
    details: { 'Inervação': 'Nn. intercostais T7-L1', 'Função': 'Flexão + Rotação tronco' }
  },
  { id: 'oblR', name: 'Oblíquos Direitos', category: 'Músculos', position: [0.8, 2.1, 0], geometry: 'obliques-R', material: 'muscleMid',
    description: 'Espelho.',
    details: { 'Sinergia': 'Obl. ext D + int E = rotação para esquerda' }
  },
  { id: 'quadL', name: 'Quadríceps Esquerdo', category: 'Músculos', position: [-0.65, -2.15, 0], geometry: 'quadriceps-L', material: 'muscle',
    description: 'RF + VL + VM (VMO) + VI. O mais potente extensor do joelho.',
    details: { 'Inervação': 'N. femoral (L2-L4)', 'Testes': 'Extensão resistida joelho, Ely test' }
  },
  { id: 'quadR', name: 'Quadríceps Direito', category: 'Músculos', position: [0.65, -2.15, 0], geometry: 'quadriceps-R', material: 'muscle',
    description: 'Espelho.',
    details: { 'Inervação': 'N. femoral (L2-L4)' }
  },
  { id: 'hamL', name: 'Isquiotibiais Esq.', category: 'Músculos', position: [-0.65, -2.15, 0], geometry: 'hamstrings-L', material: 'muscleDeep',
    description: 'Bíceps femoral + Semitendíneo + Semimembranoso. Flexão joelho + extensão quadril.',
    details: { 'Pata de ganso': 'Semitendíneo + Grácil + Sartório', 'Inervação': 'N. ciático', 'Testes': 'Lasègue, 90/90, Slump' }
  },
  { id: 'hamR', name: 'Isquiotibiais Dir.', category: 'Músculos', position: [0.65, -2.15, 0], geometry: 'hamstrings-R', material: 'muscleDeep',
    description: 'Espelho.',
    details: { 'Patologias': 'Lesão I-III, Tendinopatia proximal' }
  },
  { id: 'gastL', name: 'Tríceps Sural Esq.', category: 'Músculos', position: [-0.6, -4.72, 0], geometry: 'calf-L', material: 'muscle',
    description: 'Gastrocnêmio (biarticular) + Sóleo → Tendão de Aquiles.',
    details: { 'Inervação': 'N. tibial (S1-S2)', 'Bomba sural': 'Retorno venoso MMII', 'Testes': 'Thompson, Silfverskiöld' }
  },
  { id: 'gastR', name: 'Tríceps Sural Dir.', category: 'Músculos', position: [0.6, -4.72, 0], geometry: 'calf-R', material: 'muscle',
    description: 'Espelho.',
    details: { 'Inervação': 'N. tibial (S1-S2)' }
  },
  { id: 'glutL', name: 'Glúteos Esquerdos', category: 'Músculos', position: [-0.78, 0.05, -0.45], geometry: 'glutes-L', material: 'muscleMid',
    description: 'Máximo (extensão) + Médio (Trendelenburg) + Mínimo (estabilização).',
    details: { 'N. glúteo sup': 'L4-S1 → Médio + Mínimo', 'N. glúteo inf': 'L5-S2 → Máximo', 'Testes': 'Trendelenburg, Ponte, Step-down' }
  },
  { id: 'glutR', name: 'Glúteos Direitos', category: 'Músculos', position: [0.78, 0.05, -0.45], geometry: 'glutes-R', material: 'muscleMid',
    description: 'Espelho.',
    details: { 'Função': 'Extensão + RL + Abdução quadril' }
  },
  { id: 'rotL', name: 'Manguito Rotador Esq.', category: 'Músculos', position: [-1.55, 4.92, -0.45], geometry: 'rotator-L', material: 'muscleDeep',
    description: 'SITS: Supraespinal + Infraespinal + Redondo menor + Subescapular.',
    details: { 'Testes': 'Jobe (supra), Patte (infra), Lift-off (sub), Neer, Hawkins' }
  },
  { id: 'rotR', name: 'Manguito Rotador Dir.', category: 'Músculos', position: [1.55, 4.92, -0.45], geometry: 'rotator-R', material: 'muscleDeep',
    description: 'Espelho.',
    details: { 'SITS': 'Supraespinal, Infraespinal, Redondo menor, Subescapular' }
  },
  { id: 'tibL', name: 'Tibial Anterior Esq.', category: 'Músculos', position: [-0.6, -4.85, 0], geometry: 'tibialis-L', material: 'muscle',
    description: 'Dorsiflexor + inversor. "Pé caído" na lesão do n. fibular profundo.',
    details: { 'Inervação': 'N. fibular profundo (L4-L5)', 'Função': 'Dorsiflexão + Inversão' }
  },
  { id: 'tibR', name: 'Tibial Anterior Dir.', category: 'Músculos', position: [0.6, -4.85, 0], geometry: 'tibialis-R', material: 'muscle',
    description: 'Espelho.',
    details: { 'Foot drop': 'Lesão n. fibular profundo → perda dorsiflexão' }
  },
  { id: 'latL', name: 'Grande Dorsal Esq.', category: 'Músculos', position: [-0.42, 1.55, -0.22], geometry: 'latissimus-L', material: 'muscleDeep',
    description: 'Maior músculo do dorso. Adução + RM + Extensão do úmero. "Músculo do nadador".',
    details: { 'Origem': 'Processos espinhosos T7-L5 + Crista ilíaca + Costelas inf', 'Inserção': 'Sulco intertubercular do úmero', 'Inervação': 'N. toracodorsal (C6-C8)', 'Função': 'Adução + Rotação medial + Extensão do ombro' }
  },
  { id: 'latR', name: 'Grande Dorsal Dir.', category: 'Músculos', position: [0.42, 1.55, -0.22], geometry: 'latissimus-R', material: 'muscleDeep',
    description: 'Espelho. Essencial para transferências e propulsão de cadeira de rodas.',
    details: { 'Inervação': 'N. toracodorsal (C6-C8)', 'Clínica': 'Fraqueza → comprometimento ADV e transferências' }
  },
  { id: 'serL', name: 'Serrátil Anterior Esq.', category: 'Músculos', position: [-0.92, 2.6, 0.38], geometry: 'serratus-ant-L', material: 'muscle',
    description: '8-9 digitações laterais. Protração e rotação superior da escápula. "Músculo do boxeador".',
    details: { 'Origem': '8ª-9ª costelas (face lateral)', 'Inserção': 'Borda medial escápula (face anterior)', 'Inervação': 'N. torácico longo (C5-C7)', 'Patologia': 'Paralisia → escápula alada + dor' }
  },
  { id: 'serR', name: 'Serrátil Anterior Dir.', category: 'Músculos', position: [0.92, 2.6, 0.38], geometry: 'serratus-ant-R', material: 'muscle',
    description: 'Espelho. N. torácico longo (C5-C7).',
    details: { 'Escápula alada': 'Paralisia serrátil → borda medial prominente', 'Teste': 'Flexão com resistência → escápula alada' }
  },
  { id: 'rhom', name: 'Romboides (Maior e Menor)', category: 'Músculos', position: [0, 4.15, -0.42], geometry: 'rhomboids', material: 'muscleDeep',
    description: 'Retração + Rotação inferior da escápula. Estabiliza borda medial.',
    details: { 'Origem': 'Processos espinhosos C7-T4', 'Inserção': 'Borda medial da escápula', 'Inervação': 'N. escapular dorsal (C4-C5)', 'Função': 'Retração + Rotação inferior escapular' }
  },
  { id: 'iliopL', name: 'Iliopsoas Esquerdo', category: 'Músculos', position: [-0.28, -0.15, 0.12], geometry: 'iliopsoas-L', material: 'muscleMid',
    description: 'Ilíaco + Psoas maior. Principal flexor do quadril. Postural.',
    details: { 'Iliaco': 'Fossa ilíaca → Trocânter menor', 'Psoas': 'Corpos T12-L5 → Trocânter menor', 'Inervação': 'N. femoral + ramos diretos L1-L3', 'Testes': 'Thomas (encurtamento), Iliopsoas resistido' }
  },
  { id: 'iliopR', name: 'Iliopsoas Direito', category: 'Músculos', position: [0.28, -0.15, 0.12], geometry: 'iliopsoas-R', material: 'muscleMid',
    description: 'Espelho. Encurtamento → anteversão pélvica e hiperlordose.',
    details: { 'Inervação': 'N. femoral + L1-L3', 'Thomas test': 'DL → flexão quadril contralateral → encurtamento' }
  },
  { id: 'sarL', name: 'Sartório Esquerdo', category: 'Músculos', position: [-0.28, -1.75, 0.2], geometry: 'sartorius-L', material: 'muscle',
    description: 'Músculo mais longo do corpo. FADIR (flexão, abdução, RE). "Músculo do alfaiate".',
    details: { 'Origem': 'EIAS', 'Inserção': 'Pata de ganso (face medial tíbia)', 'Inervação': 'N. femoral (L2-L3)', 'Pata de ganso': 'Sartório + Grácil + Semitendíneo → bursite' }
  },
  { id: 'sarR', name: 'Sartório Direito', category: 'Músculos', position: [0.28, -1.75, 0.2], geometry: 'sartorius-R', material: 'muscle',
    description: 'Espelho.',
    details: { 'Inervação': 'N. femoral (L2-L3)' }
  },
  { id: 'addL', name: 'Adutores Esquerdo', category: 'Músculos', position: [-0.2, -2.2, 0.08], geometry: 'adductors-L', material: 'muscleMid',
    description: 'Grupo: Longo, Curto, Magno + Pectíneo. Adução + Flexão do quadril.',
    details: { 'Inervação': 'N. obturador (L2-L4); Magno distal: N. ciático', 'Testes': 'Adução resistida (Groin squeeze), FABER', 'Patologias': 'Pubalgia, Lesão groin, Tendinopatia adutor magno' }
  },
  { id: 'addR', name: 'Adutores Direito', category: 'Músculos', position: [0.2, -2.2, 0.08], geometry: 'adductors-R', material: 'muscleMid',
    description: 'Espelho.',
    details: { 'Inervação': 'N. obturador (L2-L4)' }
  },
  { id: 'gracL', name: 'Grácil Esquerdo', category: 'Músculos', position: [-0.08, -2.2, 0.04], geometry: 'gracilis-L', material: 'muscle',
    description: 'Adução quadril + Flexão joelho. Participa da pata de ganso.',
    details: { 'Origem': 'Ramo inferior do púbis', 'Inserção': 'Pata de ganso (face medial tíbia proximal)', 'Inervação': 'N. obturador (L2-L3)' }
  },
  { id: 'gracR', name: 'Grácil Direito', category: 'Músculos', position: [0.08, -2.2, 0.04], geometry: 'gracilis-R', material: 'muscle',
    description: 'Espelho.',
    details: { 'Enxerto': 'Usado como enxerto em reconstrução LCA (ST-G)' }
  },
  { id: 'brachiL', name: 'Braquial Ant. Esquerdo', category: 'Músculos', position: [-2.05, 2.78, 0.1], geometry: 'brachialis-L', material: 'muscle',
    description: '"Cavalo de trabalho" do cotovelo — flexor mais potente (bifenocal).',
    details: { 'Origem': 'Face anterior úmero (2/3 distal)', 'Inserção': 'Processo coronoide da ulna', 'Inervação': 'N. musculocutâneo (C5-C6) + ramo n. radial (C7)', 'Função': 'Flexão cotovelo (independe da pronossupinação)' }
  },
  { id: 'brachiR', name: 'Braquial Ant. Direito', category: 'Músculos', position: [2.05, 2.78, 0.1], geometry: 'brachialis-R', material: 'muscle',
    description: 'Espelho.',
    details: { 'Inervação': 'N. musculocutâneo (C5-C6)' }
  },
  { id: 'fibL', name: 'Fibular Longo Esq.', category: 'Músculos', position: [-0.72, -4.72, 0.06], geometry: 'fibularis-L', material: 'muscle',
    description: 'Eversão do pé + Flexão plantar. Sustenta o arco transverso.',
    details: { 'Origem': 'Cabeça e 2/3 sup fíbula (face lat)', 'Inserção': 'Cuneiforme medial + 1º metatarso (via sulco plantar)', 'Inervação': 'N. fibular superficial (L4-S1)', 'Patologia': 'Lesão → pé varo + diminuição eversão' }
  },
  { id: 'fibR', name: 'Fibular Longo Dir.', category: 'Músculos', position: [0.72, -4.72, 0.06], geometry: 'fibularis-R', material: 'muscle',
    description: 'Espelho.',
    details: { 'N. fibular superficial': 'L4-S1 — sensitivo dorso pé (exceto 1º espaço)' }
  },
  { id: 'poplL', name: 'Poplíteo Esquerdo', category: 'Músculos', position: [-0.6, -3.5, -0.14], geometry: 'popliteus-L', material: 'muscleDeep',
    description: '"Chave" do joelho — destranca extensão terminal. Rotação medial tíbia.',
    details: { 'Origem': 'Côndilo lateral fêmur + Menisco lateral', 'Inserção': 'Face posterior tíbia (triângulo)', 'Inervação': 'N. tibial (L4-S1)', 'Função': 'RI tíbia 5° para destravar joelho em extensão' }
  },
  { id: 'poplR', name: 'Poplíteo Direito', category: 'Músculos', position: [0.6, -3.5, -0.14], geometry: 'popliteus-R', material: 'muscleDeep',
    description: 'Espelho.',
    details: { 'Inervação': 'N. tibial (L4-S1)' }
  },

  /* ─── NOVOS MÚSCULOS ─── */
  { id: 'scmL', name: 'Esternocleidomastoideo Esq.', category: 'Músculos', position: [-0.22, 5.62, 0.1], geometry: 'scm-L', material: 'muscle',
    description: 'Músculo bilateral do pescoço responsável pela flexão, rotação e inclinação lateral da cabeça. Avaliado em disfunções cervicais e síndrome do desfiladeiro torácico.',
    details: { 'Origem': 'Manúbrio esternal + terço medial da clavícula', 'Inserção': 'Processo mastoideo e linha nucal superior', 'Inervação': 'N. Acessório (XI) + C2-C3 sensitivo', 'Função': 'Flexão cervical bilateral; rotação e inclinação contralateral', 'Teste': 'Resistência à rotação da cabeça; palpação em decúbito dorsal', 'Patologia': 'Torcicolo muscular, TOS (síndrome do desfiladeiro torácico)' }
  },
  { id: 'scmR', name: 'Esternocleidomastoideo Dir.', category: 'Músculos', position: [0.22, 5.62, 0.1], geometry: 'scm-R', material: 'muscle',
    description: 'Espelho do lado esquerdo. Assimetria SCM é marcador frequente de escoliose cervical funcional.',
    details: { 'Inervação': 'N. Acessório (XI) + C2-C3', 'Patologia': 'Torcicolo, TOS, cefaleia tensional' }
  },
  { id: 'erctL', name: 'Eretor da Espinha Esq.', category: 'Músculos', position: [-0.15, 1.75, -0.38], geometry: 'erector-L', material: 'muscleDeep',
    description: 'Grupo muscular fundamental para a extensão do tronco: iliocostal, longuíssimo e espinhal. Principal estabilizador da coluna vertebral. Essencial em qualquer avaliação de lombalgia.',
    details: { 'Origem': 'Crista ilíaca, sacro e processos espinhosos lombares', 'Inserção': 'Costelas, processos transversos/espinhosos, occipital', 'Inervação': 'Ramos dorsais dos nn. espinhais C1-L5', 'Função': 'Extensão, inclinação lateral e rotação do tronco; estabilização vertebral', 'Teste': 'Sorensen test (endurance em extensão de tronco) — < 176s = risco de lombalgia', 'Patologia': 'Lombalgia mecânica, espasmo paravertebral, síndrome da faceta' }
  },
  { id: 'erctR', name: 'Eretor da Espinha Dir.', category: 'Músculos', position: [0.15, 1.75, -0.38], geometry: 'erector-R', material: 'muscleDeep',
    description: 'Espelho do lado esquerdo. Assimetria paravertebral visível na inspeção posterior indica desequilíbrio funcional.',
    details: { 'Teste': 'Sorensen bilateral; assimetria de proeminência = desequilíbrio', 'Patologia': 'Lombalgia, espasmo, escoliose funcional' }
  },
  { id: 'levscapL', name: 'Elevador da Escápula Esq.', category: 'Músculos', position: [-0.28, 5.45, -0.2], geometry: 'levator-scap-L', material: 'muscle',
    description: 'Músculo cervical posterior que eleva a escápula e inclina lateralmente a cervical. Frequentemente sobrecarregado em postura anteriorizada de cabeça (forward head posture).',
    details: { 'Origem': 'Processos transversos C1-C4', 'Inserção': 'Ângulo superior da escápula', 'Inervação': 'N. dorsal da escápula (C3-C5) + ramos ventrais C3-C4', 'Função': 'Elevação e rotação inferior da escápula; inclinação lateral cervical', 'Teste': 'Palpação no ângulo superior da escápula com pescoço em rotação contralateral', 'Patologia': 'Cervicalgia, tensão crônica por postura compulsória, trigger points' }
  },
  { id: 'levscapR', name: 'Elevador da Escápula Dir.', category: 'Músculos', position: [0.28, 5.45, -0.2], geometry: 'levator-scap-R', material: 'muscle',
    description: 'Espelho do lado esquerdo. O elevador da escápula é um dos músculos mais frequentemente com trigger points na população que trabalha ao computador.',
    details: { 'Patologia': 'Tensão cervical alta, trigger point frequente, cefaleia cervicogênica' }
  },
  { id: 'pirL', name: 'Piriforme Esquerdo', category: 'Músculos', position: [-0.35, -0.32, -0.16], geometry: 'piriformis-L', material: 'muscleDeep',
    description: 'Rotador lateral profundo do quadril. Relação direta com o nervo ciático — em 15% da população o ciático perfura o músculo, predispondo à síndrome do piriforme.',
    details: { 'Origem': 'Face anterior do sacro (S2-S4) + lig. sacroilíaco', 'Inserção': 'Extremidade superior do grande trocânter', 'Inervação': 'Nervo para o piriforme (L5-S2)', 'Função': 'Rotação lateral do quadril (estendido); abdução (flexão > 60°)', 'Teste': 'FAIR test (Flexão, Adução, RI) — reproduz sciatica-like pain', 'Patologia': 'Síndrome do piriforme (pseudo-ciática), bursite isquioglútea' }
  },
  { id: 'pirR', name: 'Piriforme Direito', category: 'Músculos', position: [0.35, -0.32, -0.16], geometry: 'piriformis-R', material: 'muscleDeep',
    description: 'Espelho do lado esquerdo. Rigidez isolada do piriforme é uma causa subestimada de lombalgia baixa e dor glútea.',
    details: { 'Teste': 'FAIR + palpação profunda glútea superoexterna', 'Patologia': 'Síndrome do piriforme, compressão do n. ciático' }
  },
  { id: 'tflL', name: 'Tensor da Fáscia Lata Esq.', category: 'Músculos', position: [-0.88, -0.5, 0.18], geometry: 'tfl-L', material: 'muscleMid',
    description: 'Tensiona a fáscia lata e o trato iliotibial. Desequilíbrio causa síndrome da banda iliotibial — dor lateral característica em corredores de longa distância.',
    details: { 'Origem': 'EIAS e lábio externo da crista ilíaca', 'Inserção': 'Trato iliotibial → tubérculo de Gerdy (tíbia)', 'Inervação': 'N. glúteo superior (L4-S1)', 'Função': 'Abdução + rotação medial quadril; tensão do TIT; estabilização pélvica lateral', 'Teste': 'Teste de Ober (DL, quadril estendido, verifica encurtamento)', 'Patologia': 'Síndrome do TIT, conflito lateral joelho, disfunção femoropatelar' }
  },
  { id: 'tflR', name: 'Tensor da Fáscia Lata Dir.', category: 'Músculos', position: [0.88, -0.5, 0.18], geometry: 'tfl-R', material: 'muscleMid',
    description: 'Espelho do lado esquerdo. TFL tight + fraqueza glúteo médio = principal causa de síndrome do TIT em corredores.',
    details: { 'Teste': 'Ober (DL) + Noble compression test (joelho 30° de flexão)', 'Patologia': 'Síndrome da banda iliotibial, dor lateral joelho' }
  },
  { id: 'solL', name: 'Sóleo Esquerdo', category: 'Músculos', position: [-0.6, -4.72, -0.08], geometry: 'soleus-L', material: 'muscle',
    description: 'Músculo profundo da panturrilha formador do tendão de Aquiles. Domina a flexão plantar com joelho fletido. Essencial no controle da progressão tibial durante a marcha.',
    details: { 'Origem': 'Linha oblíqua da tíbia + cabeça e corpo superior da fíbula', 'Inserção': 'Tendão de Aquiles → calcâneo', 'Inervação': 'N. tibial (S1-S2)', 'Função': 'Flexão plantar (joelho fletido); controle de equilíbrio; bomba venosa', 'Teste': 'Calf raise em joelho 90°; Thompson test avalia integridade do Aquiles', 'Patologia': 'Tendinopatia de Aquiles, sínd. do compartimento posterior, limitação de dorsiflexão' }
  },
  { id: 'solR', name: 'Sóleo Direito', category: 'Músculos', position: [0.6, -4.72, -0.08], geometry: 'soleus-R', material: 'muscle',
    description: 'Espelho do lado esquerdo. Stiffness do sóleo reduz a dorsiflexão e é fator de risco para fascite plantar e tendinopatia.',
    details: { 'Teste': 'Dorsiflexão com joelho fletido; Silfverskiöld test (diferencia gastro de sóleo)', 'Patologia': 'Tendinopatia de Aquiles, fascite plantar (indireta), stiffness de tornozelo' }
  },

  /* ARTICULAÇÕES / TENDÕES / LIGAMENTOS */
  { id: 'lcaL', name: 'Lig. Cruzados Joelho Esq.', category: 'Articulações', position: [-0.6, -3.45, 0], geometry: 'cruciate-L', material: 'ligament',
    description: 'LCA (translação anterior) e LCP (posterior).',
    details: { 'Testes LCA': 'Lachman (mais sensível), Gaveta ant, Pivot shift', 'Mecanismo': 'Rotação + valgo + hiperextensão (82%)' }
  },
  { id: 'lcaR', name: 'Lig. Cruzados Joelho Dir.', category: 'Articulações', position: [0.6, -3.45, 0], geometry: 'cruciate-R', material: 'ligament',
    description: 'Espelho.',
    details: { 'LCA': 'Lesão mais comum do joelho em esporte' }
  },
  { id: 'mclL', name: 'LCM Joelho Esq.', category: 'Tendões/Ligamentos', position: [-0.44, -3.45, 0.12], geometry: 'mcl-L', material: 'ligament',
    description: 'Resiste estresse em valgo. Tríade infeliz: LCM + LCA + Menisco medial.',
    details: { 'Teste': 'Estresse em valgo a 0° e 30°' }
  },
  { id: 'mclR', name: 'LCM Joelho Dir.', category: 'Tendões/Ligamentos', position: [0.44, -3.45, 0.12], geometry: 'mcl-R', material: 'ligament',
    description: 'Espelho.',
    details: { 'Graus': 'I (estiramento), II (parcial), III (ruptura)' }
  },
  { id: 'lclL', name: 'LCL Joelho Esq.', category: 'Tendões/Ligamentos', position: [-0.74, -3.45, -0.08], geometry: 'lcl-L', material: 'ligament',
    description: 'Resiste estresse em varo. Cordiforme.',
    details: { 'Teste': 'Estresse em varo a 0° e 30°' }
  },
  { id: 'lclR', name: 'LCL Joelho Dir.', category: 'Tendões/Ligamentos', position: [0.74, -3.45, -0.08], geometry: 'lcl-R', material: 'ligament',
    description: 'Espelho.',
    details: { 'N. fibular': 'Passa próximo (risco associado)' }
  },
  { id: 'patTenL', name: 'Tendão Patelar Esq.', category: 'Tendões/Ligamentos', position: [-0.6, -3.6, 0], geometry: 'patellar-L', material: 'tendon',
    description: 'Liga polo inferior patela à tuberosidade tibial.',
    details: { 'Patologias': 'Tendinopatia patelar (jumper\'s knee)', 'Tratamento': 'Excêntricos de declínio' }
  },
  { id: 'patTenR', name: 'Tendão Patelar Dir.', category: 'Tendões/Ligamentos', position: [0.6, -3.6, 0], geometry: 'patellar-R', material: 'tendon',
    description: 'Espelho.',
    details: { 'Osgood-Schlatter': 'Tração apófise tibial em adolescentes' }
  },
  { id: 'achL', name: 'Tendão de Aquiles Esq.', category: 'Tendões/Ligamentos', position: [-0.6, -6.15, 0], geometry: 'achilles-L', material: 'tendon',
    description: 'O mais forte (~15cm, até 12x peso corporal). Zona avascular 2-6cm.',
    details: { 'Testes': 'Thompson, Matles, Simmonds', 'Reabilitação': 'Protocolo de Alfredson' }
  },
  { id: 'achR', name: 'Tendão de Aquiles Dir.', category: 'Tendões/Ligamentos', position: [0.6, -6.15, 0], geometry: 'achilles-R', material: 'tendon',
    description: 'Espelho.',
    details: { 'Thompson': 'Compressão sem flexão plantar = ruptura' }
  },
  { id: 'plantL', name: 'Fáscia Plantar Esq.', category: 'Tendões/Ligamentos', position: [-0.6, -7.05, 0], geometry: 'plantar-L', material: 'tendon',
    description: 'Tub. calcâneo → cabeças metatarsais. Mecanismo de molinete.',
    details: { 'Patologias': 'Fascite plantar (dor matinal)', 'Windlass test': 'Dorsiflexão hálux → tensão fáscia' }
  },
  { id: 'plantR', name: 'Fáscia Plantar Dir.', category: 'Tendões/Ligamentos', position: [0.6, -7.05, 0], geometry: 'plantar-R', material: 'tendon',
    description: 'Espelho.',
    details: { 'Tratamento': 'Alongamento + Ondas de choque' }
  },
  { id: 'menL', name: 'Meniscos Joelho Esq.', category: 'Articulações', position: [-0.6, -3.32, 0.06], geometry: 'meniscus-L', material: 'cartilage',
    description: 'Medial (C) + Lateral (O). Absorve impacto e distribui carga.',
    details: { 'Testes': 'McMurray, Apley, Thessaly', 'Vascularização': 'Zona vermelha (periférica), Branca (avascular)' }
  },
  { id: 'menR', name: 'Meniscos Joelho Dir.', category: 'Articulações', position: [0.6, -3.32, 0.06], geometry: 'meniscus-R', material: 'cartilage',
    description: 'Espelho.',
    details: { 'Reparo': 'Zona vermelha → sutura | Zona branca → meniscectomia' }
  },
  { id: 'glenoL', name: 'Art. Glenoumeral Esq.', category: 'Articulações', position: [-1.52, 4.88, -0.02], geometry: 'gleno-joint-L', material: 'cartilage',
    description: 'Articulação mais móvel do corpo (3 GL). Esferoide — alta mobilidade com menor congruência.',
    details: { 'ADM': 'Flexão 180°, Extensão 45°, ABD 180°, RM 90°, RL 90°', 'Estabiliz. estática': 'Labrum, LGUH inf (mais resistente)', 'Estabiliz. dinâmica': 'SITS — manguito rotador, Deltóide', 'Testes': 'Apprehension, Jobe, Neer, Hawkins, O\'Brien' }
  },
  { id: 'glenoR', name: 'Art. Glenoumeral Dir.', category: 'Articulações', position: [1.52, 4.88, -0.02], geometry: 'gleno-joint-R', material: 'cartilage',
    description: 'Espelho. Glenoide cobre apenas 25% da cabeça umeral.',
    details: { 'Luxação': 'Anterior (95%) — Bankart + Hill-Sachs', 'Ritmo': 'Escapuloumeral 2:1 (GU:ET)' }
  },
  { id: 'coxaL', name: 'Art. Coxofemoral Esq.', category: 'Articulações', position: [-0.52, -0.65, 0], geometry: 'coxa-joint-L', material: 'cartilage',
    description: 'Esferoide (3 GL). Alta estabilidade ≠ glenoumeral. Acetábulo recobre 2/3 da cabeça.',
    details: { 'ADM': 'Flexão 120°, Extensão 30°, ABD 45°, ADD 30°, RM/RL 45°', 'Ligamentos': 'Iliofemoral (Y de Bigelow — mais resistente), Pubofemoral, Isquiofemoral', 'Testes': 'FABER (Patrick), FADIR, Thomas, Trendelenburg', 'Patologias': 'Osteoartrose, FAI (Cam/Pincer), Necrose avascular' }
  },
  { id: 'coxaR', name: 'Art. Coxofemoral Dir.', category: 'Articulações', position: [0.52, -0.65, 0], geometry: 'coxa-joint-R', material: 'cartilage',
    description: 'Espelho.',
    details: { 'Ângulo de cobertura': '≥25° para acetábulo normal (CE de Wiberg)', 'Trocânter maior': 'Palpável — bursite trocantérica' }
  },
  { id: 'elbowL', name: 'Art. do Cotovelo Esq.', category: 'Articulações', position: [-2.05, 1.52, 0], geometry: 'elbow-joint-L', material: 'cartilage',
    description: 'Composta: úmero-ulnar + úmero-radial + radio-ulnar prox. Flexo-extensão + pronossupinação.',
    details: { 'ADM': 'Flexão 145°, Extensão 0° (varo/valgo fisiológico)', 'Ângulo de carregamento': '5-10° (homem) / 10-15° (mulher)', 'Testes': 'Valgus stress (LCM), Varus stress (LCL), Moving valgus', 'Patologias': 'Epicondilite medial/lateral, Síndrome do túnel cubital' }
  },
  { id: 'elbowR', name: 'Art. do Cotovelo Dir.', category: 'Articulações', position: [2.05, 1.52, 0], geometry: 'elbow-joint-R', material: 'cartilage',
    description: 'Espelho.',
    details: { 'Epicondilite lat': 'Extensor carpi radialis brevis — "cotovelo do tenista"', 'Epicondilite med': 'Flexor carpi radialis — "cotovelo do golfista"' }
  },
  { id: 'ankleL', name: 'Art. Talocrural Esq.', category: 'Articulações', position: [-0.6, -6.45, 0.1], geometry: 'ankle-joint-L', material: 'cartilage',
    description: 'Mortise tibiotalar (1 GL). Dorsiflexão + Flexão plantar.',
    details: { 'ADM': 'Dorsiflexão 20°, Flexão plantar 50° (funcional: ≥10° DF)', 'Ligamentos lat': 'TALP (mais lesado), TFLP, Calcaneofibular', 'Ligamento med': 'Deltoide (4 fascículos)', 'Testes': 'Anterior Drawer, Talar Tilt, Thompson' }
  },
  { id: 'ankleR', name: 'Art. Talocrural Dir.', category: 'Articulações', position: [0.6, -6.45, 0.1], geometry: 'ankle-joint-R', material: 'cartilage',
    description: 'Espelho.',
    details: { 'Entorse grau III': 'Ruptura TALP + CF + TALP → instab. crônica', 'Ottawa Rules': 'Rx se dor osso + incapaz deambular' }
  },
  { id: 'siL', name: 'Art. Sacroilíaca Esq.', category: 'Articulações', position: [-0.38, 0.22, -0.16], geometry: 'si-joint-L', material: 'cartilage',
    description: 'Diartrósica (plana). Mínimo movimento — nutação/contranutação.',
    details: { 'Nutação': 'Sacro roda anterior + Base posterior (expande outlet)', 'Testes': 'FABER, Gaenslen, ASLR, Distração/Compressão, Thigh thrust', 'Patologias': 'Disfunção AS, Sacroileíte (Espondiloartrite)', 'Eixo': 'Oblíquo — movimento tri-planar acoplado' }
  },
  { id: 'siR', name: 'Art. Sacroilíaca Dir.', category: 'Articulações', position: [0.38, 0.22, -0.16], geometry: 'si-joint-R', material: 'cartilage',
    description: 'Espelho.',
    details: { 'ASLR': 'Active Straight Leg Raise — estabilidade pélvica' }
  },
  { id: 'acL', name: 'Art. Acromioclavicular Esq.', category: 'Articulações', position: [-1.72, 5.28, 0.12], geometry: 'ac-joint-L', material: 'cartilage',
    description: 'Plana. Liga clavícula ao acrômio — absorve forças de compressão.',
    details: { 'Ligamentos': 'AC (horizontal) + Coracoclaviculares: Conoide + Trapezoide (vertical)', 'Testes': 'Cross-body (adução horizontal), Paxinos, O\'Brien', 'Classificação': 'Rockwood I-VI (força direta no ombro)' }
  },
  { id: 'acR', name: 'Art. Acromioclavicular Dir.', category: 'Articulações', position: [1.72, 5.28, 0.12], geometry: 'ac-joint-R', material: 'cartilage',
    description: 'Espelho.',
    details: { 'Grau III-VI': 'Clavícula supradeslocada visível — "step-off sign"' }
  },
  { id: 'wristL', name: 'Art. do Punho Esq.', category: 'Articulações', position: [-2.5, 0.45, 0.1], geometry: 'wrist-joint-L', material: 'cartilage',
    description: 'Radiocarpal + Mediocárpica. Flexo-extensão + Desvios ulnar/radial.',
    details: { 'ADM': 'Flexão 80°, Extensão 70°, Des. Ulnar 30°, Des. Radial 20°', 'TFCC': 'Complexo triangular fibrocartilaginoso — absorvedor de carga', 'Testes': 'Finkelstein (De Quervain), Tinel, Allen, TFCC load test', 'Patologias': 'Síndrome do túnel do carpo, De Quervain, Cisto ganglionar' }
  },
  { id: 'wristR', name: 'Art. do Punho Dir.', category: 'Articulações', position: [2.5, 0.45, 0.1], geometry: 'wrist-joint-R', material: 'cartilage',
    description: 'Espelho.',
    details: { 'Escafoide': 'Mais fraturado osso do carpo → risco NAV' }
  },
  { id: 'discos', name: 'Discos Intervertebrais', category: 'Articulações', position: [0, 2.8, -0.25], geometry: 'discs', material: 'cartilage',
    description: 'Núcleo pulposo + Anel fibroso. Herniação posterolateral.',
    details: { 'Herniação': 'Posterolateral (anel + LLP mais finos)', 'Patologias': 'Protrusão, Extrusão, Sequestro' }
  },

  /* NERVOS */
  { id: 'plexBraqL', name: 'Plexo Braquial Esq.', category: 'Nervos', position: [-1.15, 5.42, 0.06], geometry: 'nerve-brachial-L', material: 'nerve',
    description: 'C5-T1: 5 raízes → 3 troncos → 6 divisões → 3 fascículos → 5 nervos.',
    details: { 'Erb-Duchenne': 'C5-C6 — paralisia ombro + cotovelo', 'Klumpke': 'C8-T1 — mão em garra', 'Nervos': 'Musculocutâneo, Mediano, Ulnar, Radial, Axilar' }
  },
  { id: 'plexBraqR', name: 'Plexo Braquial Dir.', category: 'Nervos', position: [1.15, 5.42, 0.06], geometry: 'nerve-brachial-R', material: 'nerve',
    description: 'Espelho.',
    details: { 'Triângulo posterior': 'Passa entre escalenos ant. e médio' }
  },
  { id: 'nCiaticoL', name: 'Nervo Ciático Esq.', category: 'Nervos', position: [-0.68, -0.72, 0], geometry: 'nerve-sciatic-L', material: 'nerve',
    description: 'L4-S3. Maior nervo do corpo (~2cm). Divide em tibial e fibular.',
    details: { 'Testes': 'Lasègue (SLR), Slump, Bonnet (piriforme)', 'Patologias': 'Ciatalgia, Síndrome do piriforme' }
  },
  { id: 'nCiaticoR', name: 'Nervo Ciático Dir.', category: 'Nervos', position: [0.68, -0.72, 0], geometry: 'nerve-sciatic-R', material: 'nerve',
    description: 'Espelho.',
    details: { 'Dermátomos': 'L4 (med perna), L5 (dorso pé), S1 (lat pé)' }
  },
  { id: 'nFemoralL', name: 'Nervo Femoral Esq.', category: 'Nervos', position: [-0.48, -0.42, 0], geometry: 'nerve-femoral-L', material: 'nerve',
    description: 'L2-L4. Motor: quadríceps. Reflexo patelar.',
    details: { 'Reflexo': 'Patelar (L3-L4)', 'N. safeno': 'Ramo sensitivo terminal → med perna' }
  },
  { id: 'nFemoralR', name: 'Nervo Femoral Dir.', category: 'Nervos', position: [0.48, -0.42, 0], geometry: 'nerve-femoral-R', material: 'nerve',
    description: 'Espelho.',
    details: { 'Triângulo femoral': 'NAV — Nervo-Artéria-Veia (lat→med)' }
  },
  { id: 'nMedianoL', name: 'Nervo Mediano Esq.', category: 'Nervos', position: [-2.12, 2.2, 0], geometry: 'nerve-median', material: 'nerve',
    description: 'C5-T1. Túnel do carpo — síndrome compressiva mais comum do MS.',
    details: { 'Testes': 'Phalen, Tinel, Durkan', 'Mão do pregador': 'Lesão alta → impossib. flexão 1º-3º dedos' }
  },
  { id: 'nMedianoR', name: 'Nervo Mediano Dir.', category: 'Nervos', position: [2.12, 2.2, 0], geometry: 'nerve-median', material: 'nerve',
    description: 'Espelho.',
    details: { 'LOAF': 'Lumbricais 1-2, Oponente polegar, Abdutor curto, Flexor curto' }
  },
  { id: 'nUlnarL', name: 'Nervo Ulnar Esq.', category: 'Nervos', position: [-2.22, 2.2, 0], geometry: 'nerve-ulnar', material: 'nerve',
    description: 'C8-T1. Passa posterior ao epicôndilo medial. Garra ulnar.',
    details: { 'Testes': 'Froment (adutor polegar), Wartenberg', 'Garra ulnar': 'Hiperext MF + flexão IF 4º-5º dedos' }
  },
  { id: 'nUlnarR', name: 'Nervo Ulnar Dir.', category: 'Nervos', position: [2.22, 2.2, 0], geometry: 'nerve-ulnar', material: 'nerve',
    description: 'Espelho.',
    details: { 'Paradoxo ulnar': 'Lesão alta → menos garra (FDP denervado)' }
  },
  { id: 'nRadialL', name: 'Nervo Radial Esq.', category: 'Nervos', position: [-2.1, 2.55, 0], geometry: 'nerve-radial', material: 'nerve',
    description: 'C5-T1. Wrist drop na lesão. Extensão punho/dedos.',
    details: { 'Wrist drop': 'Lesão sulco radial → queda do punho', 'Saturday night palsy': 'Compressão por posição' }
  },
  { id: 'nRadialR', name: 'Nervo Radial Dir.', category: 'Nervos', position: [2.1, 2.55, 0], geometry: 'nerve-radial', material: 'nerve',
    description: 'Espelho.',
    details: { 'Arcada de Fröhse': 'Compressão do n. interósseo posterior' }
  },
  { id: 'nTibialL', name: 'Nervo Tibial Esq.', category: 'Nervos', position: [-0.6, -4.38, 0], geometry: 'nerve-tibial-L', material: 'nerve',
    description: 'Divisão tibial do ciático. Túnel do tarso.',
    details: { 'Reflexo': 'Aquileu (S1-S2)', 'Motor': 'Flexão plantar, Intrínsecos plantares' }
  },
  { id: 'nTibialR', name: 'Nervo Tibial Dir.', category: 'Nervos', position: [0.6, -4.38, 0], geometry: 'nerve-tibial-R', material: 'nerve',
    description: 'Espelho.',
    details: { 'Nn. plantares': 'Medial (3,5 dedos) + Lateral (1,5 dedos)' }
  },
  { id: 'nFibularL', name: 'Nervo Fibular Esq.', category: 'Nervos', position: [-0.74, -3.72, 0], geometry: 'nerve-fibular-L', material: 'nerve',
    description: 'Contorna cabeça da fíbula (vulnerável!). Foot drop.',
    details: { 'Foot drop': 'Marcha escarvante (steppage gait)', 'Vulnerabilidade': 'Cabeça da fíbula — apenas pele + fáscia' }
  },
  { id: 'nFibularR', name: 'Nervo Fibular Dir.', category: 'Nervos', position: [0.74, -3.72, 0], geometry: 'nerve-fibular-R', material: 'nerve',
    description: 'Espelho.',
    details: { 'Dermátomo': 'L5 (dorso pé, 1º espaço interdigital)' }
  },
  { id: 'medulaEspinal', name: 'Medula Espinal', category: 'Nervos', position: [0, 4.0, -0.28], geometry: 'spinal-cord', material: 'nerve',
    description: 'C1 a L1-L2 (cone medular). 31 pares de nervos espinais.',
    details: { 'Extensão': 'Forame magno → L1-L2', 'Testes': 'ASIA, Babinski, Clonus', 'Cauda equina': 'Raízes nervosas abaixo de L1-L2' }
  },

  /* ÓRGÃOS */
  { id: 'cerebro', name: 'Cérebro', category: 'Órgãos', position: [0, 7.48, 0.12], geometry: 'brain', material: 'brain',
    description: '2 hemisférios, 4 lobos. ~86 bilhões de neurônios.',
    details: { 'Lobo frontal': 'Motor primário (M1), Broca (fala)', 'Lobo temporal': 'Auditivo, Wernicke, Hipocampo', 'Patologias': 'AVC, TCE, Tumores', 'Avaliação': 'NIHSS (AVC), Glasgow, MoCA' }
  },
  { id: 'cerebelo', name: 'Cerebelo', category: 'Órgãos', position: [0, 6.58, -0.58], geometry: 'cerebellum', material: 'brain',
    description: 'Coordenação motora, equilíbrio, tônus.',
    details: { 'Ataxia': 'Dismetria, Disdiadococinesia, Tremor intencional (DANISH)', 'Testes': 'Index-nariz, Calcanhar-joelho, Romberg' }
  },
  { id: 'coracao', name: 'Coração', category: 'Órgãos', position: [-0.18, 4.28, 0.52], geometry: 'heart-organ', material: 'heart',
    description: '4 câmaras. ~100.000 batimentos/dia. Irrigação coronariana.',
    details: { 'Coronárias': 'DA (ant), Cx (lat), CD (inf/post)', 'Débito cardíaco': 'DC = FC × VS (~5 L/min)', 'Patologias': 'IAM, ICC, Arritmias' }
  },
  { id: 'pulmaoL', name: 'Pulmão Esquerdo', category: 'Órgãos', position: [-0.62, 4.45, 0.18], geometry: 'lung-L', material: 'lung',
    description: '2 lobos (sup + inf). Língula. Troca gasosa O₂/CO₂.',
    details: { 'Volumes': 'VC (~500mL), VRI, VRE, VR', 'Fisioterapia': 'Manobras higiene brônquica, VNI, Incentivadores' }
  },
  { id: 'pulmaoR', name: 'Pulmão Direito', category: 'Órgãos', position: [0.62, 4.45, 0.18], geometry: 'lung-R', material: 'lung',
    description: '3 lobos (sup, med, inf). Brônquio D mais vertical → aspiração mais frequente.',
    details: { 'Patologias': 'Pneumonia, DPOC, Fibrose, Derrame pleural', 'Ausculta': '5 focos principais' }
  },
  { id: 'figado', name: 'Fígado', category: 'Órgãos', position: [0.45, 2.75, 0.42], geometry: 'liver-organ', material: 'liver',
    description: '~1500g. Metabolismo, detoxificação, bile.',
    details: { 'Irrigação': 'Art. hepática (25%) + Veia porta (75%)', 'Segmentos': '8 segmentos de Couinaud' }
  },
  { id: 'rimL', name: 'Rim Esquerdo', category: 'Órgãos', position: [-0.58, 2.18, -0.38], geometry: 'kidney-L', material: 'kidney',
    description: 'Retroperitoneal (~12cm). Filtra ~180L/dia.',
    details: { 'Sistema RAA': 'Renina → Angiotensina → Aldosterona', 'Patologias': 'Insuficiência renal, Cálculos' }
  },
  { id: 'rimR', name: 'Rim Direito', category: 'Órgãos', position: [0.58, 2.0, -0.38], geometry: 'kidney-R', material: 'kidney',
    description: 'Mais baixo que o esquerdo (fígado).',
    details: { 'Sinal de Giordano': 'Punho-percussão positiva → pielonefrite' }
  },
  { id: 'estomago', name: 'Estômago', category: 'Órgãos', position: [-0.28, 2.75, 0.52], geometry: 'stomach-organ', material: 'organ',
    description: '~1.5L. Digestão mecânica + química (HCl + pepsina).',
    details: { 'Regiões': 'Cárdia, Fundo, Corpo, Antro Pilórico', 'Patologias': 'Gastrite, Úlcera, DRGE' }
  },
  { id: 'diafragma', name: 'Diafragma', category: 'Órgãos', position: [0, 2.95, 0.12], geometry: 'diaphragm', material: 'muscleDeep',
    description: '60-80% da ventilação. N. frênico (C3-C5).',
    details: { 'Inervação': 'N. frênico (C3-5): "C3-4-5 keeps the diaphragm alive"', 'Hiatos': 'Aórtico (T12), Esofágico (T10), Cava (T8)' }
  },
  { id: 'intDelgado', name: 'Intestino Delgado', category: 'Órgãos', position: [0, 1.18, 0.48], geometry: 'intestine-small', material: 'organ',
    description: 'Duodeno + Jejuno + Íleo (~6m). Absorção de nutrientes.',
    details: { 'Vilosidades': '↑ área absortiva (~200m²)', 'Íleo': 'Placas de Peyer, absorve B12' }
  },
  { id: 'intGrosso', name: 'Intestino Grosso', category: 'Órgãos', position: [0, 0.82, 0.52], geometry: 'intestine-large', material: 'organ',
    description: '~1.5m. Absorção de água e formação fecal.',
    details: { 'Ceco': 'Válvula ileocecal + Apêndice', 'Flora': 'Microbioma — imunidade, vitamina K' }
  },
  { id: 'traqueia', name: 'Traqueia e Brônquios', category: 'Órgãos', position: [0, 5.45, 0.38], geometry: 'trachea', material: 'cartilage',
    description: '15-20 anéis em "C". Carina em T4-T5.',
    details: { 'Brônquio D': 'Mais vertical → aspiração mais frequente', 'Árvore brônquica': 'Principais → Lobares → Segmentares → Bronquíolos' }
  },

  /* ESTRUTURAS ESPECIAIS */
  { id: 'fasciaToracoL', name: 'Fáscia Toracolombar', category: 'Estruturas Especiais', position: [0, 2.0, -0.52], geometry: 'fascia-toracolombar', material: 'fascia',
    description: 'Conecta eretor espinal, transverso abd, grande dorsal e glúteo máximo.',
    details: { 'Estabilização': '"Espartilho natural" → ↑ estabilidade lombar', 'Relevância': 'McGill Big 3, Exercícios core' }
  },
  { id: 'bursaSubacL', name: 'Bursa Subacromial Esq.', category: 'Estruturas Especiais', position: [-1.58, 5.28, 0.18], geometry: 'bursa-subacromial-L', material: 'bursa',
    description: 'Entre acrômio/deltóide e manguito. Facilita deslizamento.',
    details: { 'Testes': 'Neer, Hawkins-Kennedy, Arco doloroso 60-120°' }
  },
  { id: 'bursaSubacR', name: 'Bursa Subacromial Dir.', category: 'Estruturas Especiais', position: [1.58, 5.28, 0.18], geometry: 'bursa-subacromial-R', material: 'bursa',
    description: 'Espelho.',
    details: { 'Arco doloroso': '60-120° → compressão máxima subacromial' }
  },
  { id: 'labrumGlenoL', name: 'Labrum Glenoidal Esq.', category: 'Estruturas Especiais', position: [-1.38, 4.75, -0.32], geometry: 'labrum-glenoidal-L', material: 'cartilage',
    description: '↑ Profundidade glenoide 50%. SLAP + Bankart.',
    details: { 'SLAP': 'Superior labrum anterior-posterior', 'Testes': 'O\'Brien, Crank, Apprehension' }
  },
  { id: 'labrumGlenoR', name: 'Labrum Glenoidal Dir.', category: 'Estruturas Especiais', position: [1.38, 4.75, -0.32], geometry: 'labrum-glenoidal-R', material: 'cartilage',
    description: 'Espelho.',
    details: { 'Hill-Sachs': 'Lesão impressa na luxação anterior' }
  },
  { id: 'titL', name: 'Trato Iliotibial Esq.', category: 'Estruturas Especiais', position: [-0.93, -2.45, 0.3], geometry: 'tit-L', material: 'fascia',
    description: 'Crista ilíaca → Tubérculo de Gerdy. Síndrome TIT em corredores.',
    details: { 'Testes': 'Ober, Noble compression', 'Tratamento': 'Glúteo médio + Foam roller' }
  },
  { id: 'titR', name: 'Trato Iliotibial Dir.', category: 'Estruturas Especiais', position: [0.93, -2.45, 0.3], geometry: 'tit-R', material: 'fascia',
    description: 'Espelho.',
    details: { 'Ober': 'DL — quadril estendido, verifica encurtamento' }
  },
];

const CATEGORIES = [...new Set(STRUCTURES.map(s => s.category))];

/* ═══════════════════════════════════════════════════════
   IMAGENS EDUCATIVAS (Domínio Público — Wikimedia Commons)
═══════════════════════════════════════════════════════ */

// Helper estável via MediaWiki FilePath API
const WP_IMG = (f, w = 220) =>
  `https://en.wikipedia.org/wiki/Special:FilePath/${f}?width=${w}`;

const STRUCTURE_IMAGES = {
  /* Esqueleto Axial */
  cranio:        WP_IMG('Human_skull_front_bones.svg'),
  face:          WP_IMG('Gray188.png'),
  cervical:      WP_IMG('Gray84.png'),
  toracica:      WP_IMG('Gray88.png'),
  lombar:        WP_IMG('Gray96.png'),
  sacro:         WP_IMG('Gray99.png'),
  costR:         WP_IMG('Gray115.png'),
  costL:         WP_IMG('Gray115.png'),
  esterno:       WP_IMG('Gray116.png'),
  /* Esqueleto Apendicular */
  pelve:         WP_IMG('Gray241.png'),
  scapL:         WP_IMG('Gray203.png'),
  scapR:         WP_IMG('Gray203.png'),
  clavL:         WP_IMG('Clavicula.png'),
  clavR:         WP_IMG('Clavicula.png'),
  humL:          WP_IMG('Gray207.png'),
  humR:          WP_IMG('Gray207.png'),
  frmL:          WP_IMG('Gray213.png'),
  frmR:          WP_IMG('Gray213.png'),
  handL:         WP_IMG('Gray219.png'),
  handR:         WP_IMG('Gray219.png'),
  femL:          WP_IMG('Gray243.png'),
  femR:          WP_IMG('Gray243.png'),
  patL:          WP_IMG('Gray346.png'),
  patR:          WP_IMG('Gray346.png'),
  legL:          WP_IMG('Gray259.png'),
  legR:          WP_IMG('Gray259.png'),
  footL:         WP_IMG('Gray268.png'),
  footR:         WP_IMG('Gray268.png'),
  /* Músculos */
  deltL:         WP_IMG('Deltoideus.png'),
  deltR:         WP_IMG('Deltoideus.png'),
  peitL:         WP_IMG('Pectoralis_major.png'),
  peitR:         WP_IMG('Pectoralis_major.png'),
  bicL:          WP_IMG('Biceps_brachii_2.png'),
  bicR:          WP_IMG('Biceps_brachii_2.png'),
  triL:          WP_IMG('Triceps_brachii_2.png'),
  triR:          WP_IMG('Triceps_brachii_2.png'),
  trap:          WP_IMG('Trapezius.png'),
  abdm:          WP_IMG('Rectus_abdominis.png'),
  oblL:          WP_IMG('External_oblique.png'),
  oblR:          WP_IMG('External_oblique.png'),
  quadL:         WP_IMG('Rectus_femoris.png'),
  quadR:         WP_IMG('Rectus_femoris.png'),
  hamL:          WP_IMG('Biceps_femoris_long_head.png'),
  hamR:          WP_IMG('Biceps_femoris_long_head.png'),
  glutL:         WP_IMG('Gluteus_maximus.png'),
  glutR:         WP_IMG('Gluteus_maximus.png'),
  gastL:         WP_IMG('Gastrocnemius.png'),
  gastR:         WP_IMG('Gastrocnemius.png'),
  tibL:          WP_IMG('Tibialis_anterior.png'),
  tibR:          WP_IMG('Tibialis_anterior.png'),
  rotL:          WP_IMG('Rotator_cuff.jpg'),
  rotR:          WP_IMG('Rotator_cuff.jpg'),
  /* Tendões / Ligamentos */
  achL:          WP_IMG('Achilles_tendon.jpg'),
  achR:          WP_IMG('Achilles_tendon.jpg'),
  lcaL:          WP_IMG('KneeLigaments.png'),
  lcaR:          WP_IMG('KneeLigaments.png'),
  mclL:          WP_IMG('Gray350.png'),
  mclR:          WP_IMG('Gray350.png'),
  menL:          WP_IMG('Gray349.png'),
  menR:          WP_IMG('Gray349.png'),
  discos:        WP_IMG('Cervical_vertebra_english.png'),
  /* Nervos */
  plexBraqL:     WP_IMG('Brachial_plexus_color.svg'),
  plexBraqR:     WP_IMG('Brachial_plexus_color.svg'),
  nCiaticoL:     WP_IMG('Gray430.png'),
  nCiaticoR:     WP_IMG('Gray430.png'),
  nFemoralL:     WP_IMG('Femoral_triangle.png'),
  nFemoralR:     WP_IMG('Femoral_triangle.png'),
  nMedianoL:     WP_IMG('Gray821.png'),
  nMedianoR:     WP_IMG('Gray821.png'),
  nUlnarL:       WP_IMG('Gray811.png'),
  nUlnarR:       WP_IMG('Gray811.png'),
  nRadialL:      WP_IMG('Gray818.png'),
  nRadialR:      WP_IMG('Gray818.png'),
  medulaEspinal: WP_IMG('Spinal_cord-en.png'),
  /* Órgãos */
  cerebro:       WP_IMG('Gray728.png'),
  cerebelo:      WP_IMG('Gray677.png'),
  coracao:       WP_IMG('Diagram_of_the_human_heart_(cropped).svg'),
  pulmaoL:       WP_IMG('Respiratory_System_en.svg'),
  pulmaoR:       WP_IMG('Respiratory_System_en.svg'),
  figado:        WP_IMG('Liver_(organ).svg'),
  rimL:          WP_IMG('Kidney_section.jpg'),
  rimR:          WP_IMG('Kidney_section.jpg'),
  estomago:      WP_IMG('Blausen_0811_Stomach.png'),
  diafragma:     WP_IMG('Thoracic_diaphragm.png'),
  intDelgado:    WP_IMG('Small_intestine.svg'),
  intGrosso:     WP_IMG('Large_intestine.svg'),
  traqueia:      WP_IMG('Illu_bronchi_lungs.jpg'),
  /* Estruturas Especiais */
  bursaSubacL:   WP_IMG('Shoulder_joint.svg'),
  bursaSubacR:   WP_IMG('Shoulder_joint.svg'),
  labrumGlenoL:  WP_IMG('Shoulder_joint.svg'),
  labrumGlenoR:  WP_IMG('Shoulder_joint.svg'),
  titL:          WP_IMG('Iliotibial_band.png'),
  titR:          WP_IMG('Iliotibial_band.png'),
  fasciaToracoL: WP_IMG('Thoracolumbar_fascia.png'),
  /* Novos músculos */
  latL:          WP_IMG('Latissimus_dorsi.png'),
  latR:          WP_IMG('Latissimus_dorsi.png'),
  serL:          WP_IMG('Serratus_anterior.png'),
  serR:          WP_IMG('Serratus_anterior.png'),
  rhom:          WP_IMG('Rhomboid_major.png'),
  iliopL:        WP_IMG('Psoas_major.png'),
  iliopR:        WP_IMG('Psoas_major.png'),
  sarL:          WP_IMG('Sartorius.png'),
  sarR:          WP_IMG('Sartorius.png'),
  addL:          WP_IMG('Adductor_longus.png'),
  addR:          WP_IMG('Adductor_longus.png'),
  gracL:         WP_IMG('Gracilis.png'),
  gracR:         WP_IMG('Gracilis.png'),
  brachiL:       WP_IMG('Brachialis.png'),
  brachiR:       WP_IMG('Brachialis.png'),
  fibL:          WP_IMG('Fibularis_longus.png'),
  fibR:          WP_IMG('Fibularis_longus.png'),
  poplL:         WP_IMG('Popliteus_muscle.png'),
  poplR:         WP_IMG('Popliteus_muscle.png'),
  /* Novos músculos — sessão 3 */
  scmL:          WP_IMG('Sternocleidomastoid_2.png'),
  scmR:          WP_IMG('Sternocleidomastoid_2.png'),
  erctL:         WP_IMG('Erector_spinae.png'),
  erctR:         WP_IMG('Erector_spinae.png'),
  levscapL:      WP_IMG('Levator_scapulae.png'),
  levscapR:      WP_IMG('Levator_scapulae.png'),
  pirL:          WP_IMG('Piriformis.png'),
  pirR:          WP_IMG('Piriformis.png'),
  tflL:          WP_IMG('TensorFasciaeLatae.png'),
  tflR:          WP_IMG('TensorFasciaeLatae.png'),
  solL:          WP_IMG('Soleus.png'),
  solR:          WP_IMG('Soleus.png'),
  /* Novas articulações */
  glenoL:        WP_IMG('Shoulder_joint.svg'),
  glenoR:        WP_IMG('Shoulder_joint.svg'),
  coxaL:         WP_IMG('Hip_joint.svg'),
  coxaR:         WP_IMG('Hip_joint.svg'),
  elbowL:        WP_IMG('Gray331.png'),
  elbowR:        WP_IMG('Gray331.png'),
  ankleL:        WP_IMG('Ankle_joint.svg'),
  ankleR:        WP_IMG('Ankle_joint.svg'),
  siL:           WP_IMG('Sacroiliac_joint.png'),
  siR:           WP_IMG('Sacroiliac_joint.png'),
  acL:           WP_IMG('Acromioclavicular_joint.png'),
  acR:           WP_IMG('Acromioclavicular_joint.png'),
  wristL:        WP_IMG('Gray334.png'),
  wristR:        WP_IMG('Gray334.png'),
};

/* ─── Card de imagem educativa (overlay 2D) Premium ─── */
function HoverImageCard({ hoveredId, isDarkMode }) {
  const [imgOk, setImgOk] = useState(true);
  const structure = useMemo(() => STRUCTURES.find(s => s.id === hoveredId), [hoveredId]);
  const imgUrl = hoveredId ? STRUCTURE_IMAGES[hoveredId] : null;

  useEffect(() => { setImgOk(true); }, [hoveredId]);

  if (!structure || !imgUrl) return null;

  const cfg = CATEGORY_CONFIG[structure.category];
  const firstDetail = Object.entries(structure.details || {})[0];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={hoveredId}
        initial={{ opacity: 0, y: 15, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15, scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
        className="absolute bottom-6 left-6 z-20 w-64 rounded-2xl overflow-hidden shadow-2xl pointer-events-none select-none backdrop-blur-2xl border"
        style={{
          backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Barra de cor superior brilhante */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${cfg?.color}, transparent)` }} />

        {/* Imagem anatômica */}
        {imgOk && (
          <div className="relative w-full h-36 overflow-hidden bg-slate-50 dark:bg-slate-900/50">
            <img
              src={imgUrl}
              alt={structure.name}
              className="w-full h-full object-contain p-3"
              onError={() => setImgOk(false)}
            />
            <span className="absolute bottom-1.5 right-2 text-[9px] font-medium bg-black/50 text-white/80 rounded px-1.5 py-0.5 backdrop-blur-md">
              Wikimedia Commons
            </span>
          </div>
        )}

        {/* Nome e categoria */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <p className={`text-[14px] font-bold leading-snug tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {structure.name}
            </p>
            <span
              className="text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 shadow-sm"
              style={{
                background: `${cfg?.color || '#0EA5E9'}25`,
                color: cfg?.color || '#0EA5E9',
              }}
            >
              {cfg?.icon}
            </span>
          </div>

          {firstDetail && (
            <div className={`rounded-xl px-3 py-2.5 ${isDarkMode ? 'bg-slate-800/60' : 'bg-slate-100/60'} border border-transparent dark:border-slate-700/50`}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1 opacity-90" style={{ color: cfg?.color }}>
                {firstDetail[0]}
              </p>
              <p className={`text-[12px] leading-relaxed font-medium line-clamp-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {firstDetail[1]}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function AnatomyMesh({ structure, isSelected, isHovered, onSelect, onHover }) {
  const meshRef = useRef();
  const mat = MAT[structure.material] || MAT.bone;
  const geo = useMemo(() => buildGeo(structure.geometry), [structure.geometry]);

  useEffect(() => {
    return () => { geo?.dispose(); };
  }, [geo]);

  const activeColor = useMemo(() => {
    if (isSelected) return '#38BDF8'; // Sky 400 for selection
    if (isHovered) {
      const c = new THREE.Color(mat.color);
      c.lerp(new THREE.Color('#BAE6FD'), 0.3); // Sky 200 for hover
      return '#' + c.getHexString();
    }
    return mat.color;
  }, [isSelected, isHovered, mat.color]);

  useFrame(({ clock }) => {
    if (!isSelected || !meshRef.current) return;
    meshRef.current.material.emissiveIntensity = 0.2 + Math.sin(clock.elapsedTime * 3) * 0.1;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geo}
      position={structure.position}
      onClick={e => { e.stopPropagation(); onSelect(structure.id); }}
      onPointerOver={e => { e.stopPropagation(); onHover(structure.id); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { onHover(null); document.body.style.cursor = 'auto'; }}
      receiveShadow
    >
      <meshStandardMaterial
        color={activeColor}
        roughness={mat.roughness ?? 0.6}
        metalness={mat.metalness ?? 0.0}
        transparent={mat.transparent ?? false}
        opacity={mat.opacity ?? 1}
        emissive={isSelected ? '#0284C7' : '#000000'}
        emissiveIntensity={isSelected ? 0.2 : 0}
        side={mat.transparent ? THREE.DoubleSide : THREE.FrontSide}
      />
    </mesh>
  );
}

// Label flutuante 3D (Estilo Tooltip Premium)
function StructureLabel({ structure, isSelected, isHovered }) {
  if (!isSelected && !isHovered) return null;
  const labelY = structure.position[1] + 0.8;
  return (
    <Html position={[structure.position[0], labelY, structure.position[2]]} center style={{ pointerEvents: 'none' }}>
      <div style={{
        background: isSelected ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${isSelected ? '#38BDF8' : 'rgba(0,0,0,0.1)'}`,
        borderRadius: 12,
        padding: '6px 12px',
        color: isSelected ? '#F8FAFC' : '#0F172A',
        fontSize: 13,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        boxShadow: isSelected ? '0 0 20px rgba(56, 189, 248, 0.4)' : '0 4px 15px rgba(0, 0, 0, 0.1)',
        letterSpacing: '-0.01em',
        transform: 'translateY(-4px)',
      }}>
        {structure.name}
      </div>
    </Html>
  );
}

// Base rotativa
function BaseRing() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.15;
  });
  return (
    <group ref={ref} position={[0, -7.5, 0]}>
      {[2.8, 3.5, 4.2].map((r, i) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 0.03, r, 80]} />
          <meshBasicMaterial
            color="#38BDF8"
            transparent
            opacity={0.08 - i * 0.02}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// Cena 3D
function Scene({ selectedId, hoveredId, onSelect, onHover, visCats }) {
  const { isDarkMode } = useTheme?.() ?? { isDarkMode: true };
  const filtered = useMemo(
    () => STRUCTURES.filter(s => visCats.includes(s.category)),
    [visCats]
  );

  const bgColor = isDarkMode ? '#0B1120' : '#F8FAFC'; // Cores sólidas de fundo do Tailwind (slate-950 / slate-50)
  
  return (
    <>
      <color attach="background" args={[bgColor]} />
      {/* Fog suave para integrar com o fundo */}
      <fog attach="fog" args={[bgColor, 15, 45]} />
      
      <ambientLight intensity={isDarkMode ? 0.4 : 0.6} color="#E8EFF5" />
      <directionalLight
        position={[8, 15, 10]}
        intensity={isDarkMode ? 1.0 : 1.3}
        color="#FFF5E8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={15}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-6, 8, -6]} intensity={0.3} color="#C8D8F5" />
      <pointLight position={[0, 6, 8]} intensity={0.6} color="#38BDF8" distance={25} decay={2} />

      <ContactShadows position={[0, -7.55, 0]} opacity={isDarkMode ? 0.4 : 0.2} scale={15} blur={2} far={10} color="#0F172A" />

      {filtered.map(s => (
        <React.Fragment key={s.id}>
          <AnatomyMesh
            structure={s}
            isSelected={selectedId === s.id}
            isHovered={hoveredId === s.id}
            onSelect={onSelect}
            onHover={onHover}
          />
          <StructureLabel
            structure={s}
            isSelected={selectedId === s.id}
            isHovered={hoveredId === s.id}
          />
        </React.Fragment>
      ))}

      <BaseRing />

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={4}
        maxDistance={30}
        target={[0, 1.0, 0]}
        makeDefault
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL — Layout com painel
═══════════════════════════════════════════════════════ */

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

export default function Atlas3D() {
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visCats, setVisCats] = useState([...CATEGORIES]);
  const [showFilters, setShowFilters] = useState(false);
  const { isDarkMode } = useTheme?.() ?? { isDarkMode: true };

  const [painelAberto, setPainelAberto] = useState(() => {
    try { return localStorage.getItem('atlas-panel') !== 'closed'; } catch { return true; }
  });
  
  useEffect(() => {
    try { localStorage.setItem('atlas-panel', painelAberto ? 'open' : 'closed'); } catch { /* ignore */ }
  }, [painelAberto]);

  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const canvasWrapperRef = useRef(null);
  const roRef = useRef(null);
  
  useEffect(() => {
    return () => {
      if (roRef.current) {
        roRef.current.disconnect();
        roRef.current = null;
      }
    };
  }, []);

  const selected = STRUCTURES.find(s => s.id === selectedId);

  const handleSelect = useCallback(id => {
    setSelectedId(p => {
      const next = p === id ? null : id;
      if (next && isMobile) setMobileDetailOpen(true);
      return next;
    });
  }, [isMobile]);

  const handleHover = useCallback(id => setHoveredId(id), []);
  const toggleCat = useCallback(c =>
    setVisCats(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]),
  []);

  const filtered = useMemo(() =>
    STRUCTURES.filter(s => {
      const q = searchTerm.toLowerCase();
      return visCats.includes(s.category) && (
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    }), [searchTerm, visCats]);

  const closeMobileList = useCallback(() => setMobileListOpen(false), []);
  const closeMobileDetail = useCallback(() => setMobileDetailOpen(false), []);

  return (
    <div className="atlas-layout">
      {/* ── PAINEL ESQUERDO (Glassmorphism Premium) ── */}
      <div 
        className={`atlas-panel flex flex-col z-30 transition-transform duration-300 ease-in-out ${!painelAberto && !isMobile ? 'collapsed -translate-x-full' : 'translate-x-0'} ${isMobile && mobileListOpen ? 'mobile-open translate-y-0' : (isMobile ? 'translate-y-full' : '')}`}
        style={{
          width: isMobile ? '100%' : '320px',
          height: '100%',
          position: 'absolute',
          left: 0,
          top: 0,
          backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRight: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
          boxShadow: '10px 0 30px rgba(0,0,0,0.1)'
        }}
      >
        {/* Header do Painel */}
        <div className="px-5 pt-6 pb-4 shrink-0 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-indigo-500 to-sky-500 shadow-sky-500/20">
              <Bone size={20} className="text-white" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[18px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-none mb-1">Atlas 3D</h1>
              <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{filtered.length} estruturas visíveis</p>
            </div>
            {isMobile && (
              <button onClick={closeMobileList} className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 transition-colors">
                <X size={18} />
              </button>
            )}
          </div>

          {/* Search Input Sleek */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar músculo, osso..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-[13px] font-medium rounded-xl outline-none transition-all bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
            />
          </div>

          {/* Layer filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <Filter size={14} />
            Camadas Ativas
            <ChevronDown size={14} className={`transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 flex-wrap pt-3 pb-1">
                  {CATEGORIES.map(cat => {
                    const active = visCats.includes(cat);
                    const cfg = CATEGORY_CONFIG[cat];
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleCat(cat)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          active ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-700' : 'opacity-40 line-through text-slate-500 border border-transparent'
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: active ? cfg?.color : 'var(--text-4)' }} />
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Structure list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <Search size={24} className="mb-2 opacity-30" />
              <p className="text-[13px] font-medium">Nenhuma estrutura encontrada</p>
            </div>
          ) : (
            <div className="px-3 py-2 space-y-1">
              {filtered.map(s => {
                const cfg = CATEGORY_CONFIG[s.category];
                const isActive = selectedId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      handleSelect(s.id);
                      if (isMobile) setMobileListOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 flex items-center gap-3 text-left transition-all rounded-xl ${
                      isActive ? 'bg-sky-50 dark:bg-sky-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[14px] shadow-sm"
                      style={{
                        background: isActive ? cfg?.color : `${cfg?.color}15`,
                        color: isActive ? '#fff' : cfg?.color,
                      }}
                    >
                      {cfg?.icon || '●'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-bold truncate leading-snug ${isActive ? 'text-sky-700 dark:text-sky-400' : 'text-slate-700 dark:text-slate-200'}`}>
                        {s.name}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5 uppercase tracking-wider">{s.category}</p>
                    </div>
                    <ChevronRight size={14} className={isActive ? 'text-sky-500' : 'text-slate-300 opacity-0 group-hover:opacity-100'} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── TOGGLE BUTTON (Floating Action Button) ── */}
      <button
        className="absolute z-40 flex items-center justify-center rounded-full shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95"
        onClick={() => {
          if (isMobile) {
            setMobileListOpen(p => !p);
          } else {
            setPainelAberto(p => !p);
          }
        }}
        title={painelAberto ? 'Ocultar painel' : 'Mostrar painel'}
        style={{
          bottom: isMobile ? '20px' : '30px',
          left: isMobile ? '50%' : (painelAberto ? '340px' : '30px'),
          transform: isMobile ? 'translateX(-50%)' : 'none',
          width: isMobile ? 'auto' : '48px',
          height: '48px',
          padding: isMobile ? '0 20px' : '0',
          backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)',
          border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
          color: isDarkMode ? '#F8FAFC' : '#0F172A',
        }}
      >
        {isMobile ? (
          <span className="text-[13px] font-bold flex items-center gap-2"><Layers size={16}/> Lista de Estruturas</span>
        ) : (
          painelAberto ? <ChevronLeft size={20} /> : <Layers size={20} />
        )}
      </button>

      {/* ── CANVAS 3D ── */}
      <div className="absolute inset-0 z-0" ref={canvasWrapperRef}>
        <Canvas
          shadows
          camera={{ position: [5.5, 3.5, 11], fov: 44, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
          dpr={[1, 1.5]}
          resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
          onCreated={({ gl, camera }) => {
            if (canvasWrapperRef.current) {
              let rafId;
              const ro = new ResizeObserver(entries => {
                if (rafId) cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(() => {
                  for (const entry of entries) {
                    const { width: w, height: h } = entry.contentRect;
                    if (w === 0 || h === 0) return;
                    gl.setSize(w, h, false);
                    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                    camera.aspect = w / h;
                    camera.updateProjectionMatrix();
                  }
                });
              });
              ro.observe(canvasWrapperRef.current);
              roRef.current = ro;
            }
          }}
        >
          <Suspense fallback={null}>
            <Scene
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={handleSelect}
              onHover={handleHover}
              visCats={visCats}
            />
          </Suspense>
        </Canvas>

        {/* Imagem educativa ao hover */}
        <HoverImageCard hoveredId={hoveredId} isDarkMode={isDarkMode} />

        {/* Legenda de camadas flutuante (desktop only) */}
        <div className="absolute top-6 left-[350px] hidden lg:flex gap-2 pointer-events-none transition-all duration-300" style={{ left: painelAberto ? '350px' : '30px' }}>
          {CATEGORIES.filter(c => visCats.includes(c)).map(cat => (
            <div
              key={cat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-md shadow-sm border border-white/10 dark:border-slate-700/50"
              style={{
                backgroundColor: isDarkMode ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.8)',
                color: isDarkMode ? '#CBD5E1' : '#475569',
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_CONFIG[cat]?.color }} />
              {cat}
            </div>
          ))}
        </div>

        {/* Botões de controle 3D */}
        <div className="absolute top-6 right-6 flex flex-col gap-3 z-20">
          <button
            onClick={() => { setSelectedId(null); setMobileDetailOpen(false); }}
            className="w-10 h-10 flex items-center justify-center rounded-full shadow-lg backdrop-blur-md border transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: isDarkMode ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.9)',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              color: isDarkMode ? '#94A3B8' : '#64748B',
            }}
            title="Limpar seleção"
          >
            <RotateCcw size={16} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setVisCats([...CATEGORIES])}
            className="w-10 h-10 flex items-center justify-center rounded-full shadow-lg backdrop-blur-md border transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: isDarkMode ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.9)',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              color: isDarkMode ? '#94A3B8' : '#64748B',
            }}
            title="Mostrar todas as camadas"
          >
            <Eye size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Hint de interação (desktop) */}
        {!selectedId && !hoveredId && !isMobile && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-full text-[13px] font-bold backdrop-blur-xl shadow-2xl pointer-events-none border"
            style={{
              backgroundColor: isDarkMode ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.85)',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              color: isDarkMode ? '#F8FAFC' : '#0F172A',
            }}
          >
            <Sparkles size={16} className="text-sky-500" />
            Clique em uma estrutura para explorar
          </motion.div>
        )}

        {/* ── PAINEL DE DETALHES — Desktop: Overlay Glassmorphism ── */}
        <AnimatePresence>
          {selected && !isMobile && (
            <motion.div
              className="absolute bottom-8 right-8 w-[400px] z-30"
              initial={{ y: 30, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div 
                className="rounded-[24px] shadow-2xl border overflow-hidden flex flex-col max-h-[75vh] backdrop-blur-2xl"
                style={{
                  backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.95)',
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                }}
              >
                {/* Header do Detalhe */}
                <div className="px-6 py-5 flex items-start justify-between shrink-0 border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex gap-4">
                    <div
                      className="w-12 h-12 rounded-[14px] flex items-center justify-center text-xl shadow-sm shrink-0"
                      style={{
                        background: CATEGORY_CONFIG[selected.category]?.color || '#0EA5E9',
                        color: '#fff',
                      }}
                    >
                      {CATEGORY_CONFIG[selected.category]?.icon || '🔬'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[18px] leading-tight mb-1 text-slate-900 dark:text-white tracking-tight">{selected.name}</h3>
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: CATEGORY_CONFIG[selected.category]?.color }}>
                        {selected.category}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {STRUCTURE_IMAGES[selected.id] && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-200/50 dark:border-slate-700/50">
                      <img
                        src={STRUCTURE_IMAGES[selected.id]}
                        alt={selected.name}
                        className="w-full h-40 object-contain rounded-xl"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <div className="p-6 space-y-6">
                    <p className="text-[14px] leading-relaxed font-medium text-slate-600 dark:text-slate-300">
                      {selected.description}
                    </p>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-md bg-sky-50 dark:bg-sky-900/30">
                          <Activity size={14} className="text-sky-500" strokeWidth={2.5} />
                        </div>
                        <h4 className="text-[13px] font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-200">
                          Aplicação Clínica
                        </h4>
                      </div>
                      
                      <div className="space-y-3">
                        {Object.entries(selected.details).map(([k, v]) => (
                          <div key={k} className="rounded-[16px] p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                            <p className="text-[12px] font-bold mb-1" style={{ color: CATEGORY_CONFIG[selected.category]?.color || '#0EA5E9' }}>{k}</p>
                            <p className="text-[13.5px] font-medium leading-relaxed text-slate-700 dark:text-slate-300">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── MOBILE: Overlay and Bottom Sheet ── */}
      <AnimatePresence>
        {(mobileListOpen || (mobileDetailOpen && selected)) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => { closeMobileList(); closeMobileDetail(); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobile && selected && mobileDetailOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-[32px] shadow-2xl flex flex-col max-h-[85vh]"
          >
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto my-4" />
            
            <button
              onClick={closeMobileDetail}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
            >
              <X size={16} strokeWidth={2.5} />
            </button>

            {/* Header Mobile */}
            <div className="flex items-center gap-4 px-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div
                className="w-12 h-12 rounded-[14px] flex items-center justify-center text-xl shadow-sm shrink-0"
                style={{ background: CATEGORY_CONFIG[selected.category]?.color || '#0EA5E9', color: '#fff' }}
              >
                {CATEGORY_CONFIG[selected.category]?.icon || '🔬'}
              </div>
              <div>
                <h3 className="font-extrabold text-[18px] text-slate-900 dark:text-white leading-tight mb-1">{selected.name}</h3>
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: CATEGORY_CONFIG[selected.category]?.color }}>{selected.category}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {STRUCTURE_IMAGES[selected.id] && (
                <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 rounded-[20px] p-4 border border-slate-100 dark:border-slate-700/50">
                  <img src={STRUCTURE_IMAGES[selected.id]} alt={selected.name} loading="lazy" className="w-full h-40 object-contain" />
                </div>
              )}

              <p className="text-[14px] leading-relaxed font-medium text-slate-600 dark:text-slate-300 mb-6">
                {selected.description}
              </p>

              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-md bg-sky-50 dark:bg-sky-900/30">
                  <Activity size={14} className="text-sky-500" strokeWidth={2.5} />
                </div>
                <h4 className="text-[13px] font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  Aplicação Clínica
                </h4>
              </div>
              <div className="space-y-3 pb-8">
                {Object.entries(selected.details).map(([k, v]) => (
                  <div key={k} className="rounded-[16px] p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                    <p className="text-[12px] font-bold mb-1" style={{ color: CATEGORY_CONFIG[selected.category]?.color || '#0EA5E9' }}>{k}</p>
                    <p className="text-[13.5px] font-medium leading-relaxed text-slate-700 dark:text-slate-300">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(148, 163, 184, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(148, 163, 184, 0.5); }
      `}</style>
    </div>
  );
}