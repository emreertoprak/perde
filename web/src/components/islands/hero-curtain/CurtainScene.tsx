import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { scroll } from 'motion';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { ShaderMaterial } from 'three';
import { DoubleSide, MathUtils, PlaneGeometry, Vector2, Vector3 } from 'three';
import fragmentShader from './curtain.frag.glsl?raw';
import vertexShader from './curtain.vert.glsl?raw';

export type CurtainTier = 1 | 2;

interface Quality {
  segmentsX: number;
  segmentsY: number;
  maxDpr: number;
  noise: boolean;
  pointer: boolean;
  antialias: boolean;
}

const QUALITY: Record<CurtainTier, Quality> = {
  1: { segmentsX: 40, segmentsY: 56, maxDpr: 1.5, noise: false, pointer: false, antialias: false },
  2: { segmentsX: 128, segmentsY: 160, maxDpr: 2, noise: true, pointer: true, antialias: true },
};

/** CSS paletiyle ayni sRGB degerleri (renk yonetimi kapali: `linear` + `flat`). */
const IVORY = new Vector3(0.957, 0.937, 0.902);

interface ScrollState {
  progress: number;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

function CurtainPanel({
  side,
  quality,
  scrollState,
}: {
  side: -1 | 1;
  quality: Quality;
  scrollState: RefObject<ScrollState>;
}) {
  const viewport = useThree((state) => state.viewport);
  const width = viewport.width * 0.6;
  const height = viewport.height * 1.12;
  const offsetX = side * (viewport.width * 0.5 + viewport.width * 0.04 - width * 0.5);

  const geometry = useMemo(
    () => new PlaneGeometry(1, 1, quality.segmentsX, quality.segmentsY),
    [quality.segmentsX, quality.segmentsY],
  );

  const uniforms = useMemo(
    () => ({
      uTime: { value: side > 0 ? 3.7 : 0 },
      uOpen: { value: 0 },
      uSide: { value: side },
      uWidth: { value: 1 },
      uHeight: { value: 1 },
      uWind: { value: 0.085 },
      uPleats: { value: 13 },
      uPleatDepth: { value: 0.045 },
      uPointer: { value: new Vector2(-10, -10) },
      uPointerStrength: { value: 0 },
      uColor: { value: IVORY.clone() },
      uLightDir: { value: new Vector3(-0.35, 0.45, 1) },
      uOpacity: { value: 0.4 },
    }),
    [side],
  );

  const defines = useMemo(() => (quality.noise ? { USE_NOISE: '' } : {}), [quality.noise]);

  const materialRef = useRef<ShaderMaterial | null>(null);
  const lastPointer = useRef(new Vector2());

  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;

    const step = Math.min(delta, 1 / 20);
    // ShaderMaterial.uniforms indeksli tip dondurur; kendi olusturdugumuz nesnenin tipine daraltiyoruz.
    const values = material.uniforms as unknown as typeof uniforms;

    values.uWidth.value = width;
    values.uHeight.value = height;
    values.uTime.value += step;

    const target = clamp01((scrollState.current.progress - 0.08) / 0.55);
    values.uOpen.value = MathUtils.damp(values.uOpen.value, target, 5, step);

    if (!quality.pointer) return;

    const pointerX = (state.pointer.x * state.viewport.width) / 2;
    const pointerY = (state.pointer.y * state.viewport.height) / 2;
    values.uPointer.value.set(
      (pointerX - (offsetX - width / 2)) / width,
      (pointerY + height / 2) / height,
    );

    const speed = lastPointer.current.distanceTo(state.pointer) / Math.max(step, 1 / 240);
    lastPointer.current.copy(state.pointer);

    values.uPointerStrength.value = MathUtils.damp(
      values.uPointerStrength.value,
      Math.min(speed * 0.06, 1),
      3,
      step,
    );
  });

  return (
    <mesh
      geometry={geometry}
      position={[offsetX, 0, side * 0.002]}
      frustumCulled={false}
      renderOrder={side > 0 ? 2 : 1}
    >
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        defines={defines}
        transparent
        depthWrite={false}
        premultipliedAlpha
        side={DoubleSide}
      />
    </mesh>
  );
}

/** FPS dusukse DPR'i bir kez 1'e indirir (drei PerformanceMonitor yerine ~20 satir). */
function AdaptiveDpr({ onDecline }: { onDecline: () => void }) {
  const samples = useRef<number[]>([]);
  const declined = useRef(false);

  useFrame((_, delta) => {
    if (declined.current) return;
    samples.current.push(delta);
    if (samples.current.length < 90) return;

    const average = samples.current.reduce((sum, value) => sum + value, 0) / samples.current.length;
    samples.current = [];
    if (average > 1 / 45) {
      declined.current = true;
      onDecline();
    }
  });

  return null;
}

export default function CurtainScene({ tier }: { tier: CurtainTier }) {
  const quality = QUALITY[tier];
  const [hero] = useState(() => document.querySelector<HTMLElement>('[data-hero]'));
  const [dpr, setDpr] = useState(quality.maxDpr);
  const [active, setActive] = useState(true);
  const scrollState = useRef<ScrollState>({ progress: 0 });

  useEffect(() => {
    if (!hero) return;

    const stopScroll = scroll(
      (progress: number) => {
        scrollState.current.progress = progress;
      },
      { target: hero, offset: ['start start', 'end end'] },
    );

    // Hero ekranda degilken render tamamen durur.
    const observer = new IntersectionObserver((entries) => {
      setActive(entries[0]?.isIntersecting ?? false);
    });
    observer.observe(hero);

    return () => {
      stopScroll();
      observer.disconnect();
    };
  }, [hero]);

  const eventProps = hero ? { eventSource: hero, eventPrefix: 'client' as const } : {};

  return (
    <Canvas
      dpr={[1, dpr]}
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 0, 5], fov: 35 }}
      gl={{ alpha: true, antialias: quality.antialias, powerPreference: 'default' }}
      flat
      linear
      {...eventProps}
      onCreated={() => {
        requestAnimationFrame(() => {
          hero?.setAttribute('data-webgl-ready', '');
        });
      }}
    >
      <AdaptiveDpr
        onDecline={() => {
          setDpr(1);
        }}
      />
      <CurtainPanel side={-1} quality={quality} scrollState={scrollState} />
      <CurtainPanel side={1} quality={quality} scrollState={scrollState} />
    </Canvas>
  );
}
