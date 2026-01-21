'use client';

import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface MatrixWarpBackgroundProps {
  className?: string;
  speed?: number;
  density?: number;
  chars?: string;
}

// Generate a texture atlas for characters with higher resolution for larger sizes
const createMatrixTexture = (chars: string) => {
  const fontSize = 128; // Increased from 64 for better clarity when large
  const cols = 8;
  const rows = Math.ceil(chars.length / cols);
  const width = cols * fontSize;
  const height = rows * fontSize;

  if (typeof document === 'undefined') return { texture: null, cols, rows };

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return { texture: null, cols, rows };

  ctx.clearRect(0, 0, width, height);
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * fontSize + fontSize / 2;
    const y = row * fontSize + fontSize / 2;
    ctx.fillText(char, x, y);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  
  return { texture, cols, rows };
};

const MatrixStarField = ({ speed, density, chars, direction = 'backward' }: { speed: number; density: number; chars: string; direction?: 'forward' | 'backward' }) => {
  const meshRef = useRef<THREE.Points>(null);
  const { viewport } = useThree();

  // Generate Geometry and Material once
  const { geometry, material, uniforms } = useMemo(() => {
    // Texture
    const { texture, cols, rows } = createMatrixTexture(chars);
    
    // Geometry
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(density * 3);
    const speeds = new Float32Array(density);
    const charIndices = new Float32Array(density);
    
    const depth = 100; // Deep field
    const spreadX = 120; // Slightly wider
    const spreadY = 120;

    for (let i = 0; i < density; i++) {
        positions[i * 3] = (Math.random() - 0.5) * spreadX;
        positions[i * 3 + 1] = (Math.random() - 0.5) * spreadY;
        positions[i * 3 + 2] = Math.random() * depth;
        
        speeds[i] = Math.random() * 0.4 + 0.6; // 0.6 to 1.0 multiplier
        charIndices[i] = Math.floor(Math.random() * chars.length);
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSpeedMulti', new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aCharIndex', new THREE.BufferAttribute(charIndices, 1));

    // Shader Material
    const mat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uSpeed: { value: speed },
            uDepth: { value: depth },
            uTexture: { value: texture },
            uCols: { value: cols },
            uRows: { value: rows },
            uColor: { value: new THREE.Color('#0f0') }
        },
        vertexShader: `
            uniform float uTime;
            uniform float uDepth;
            uniform float uSpeed;
            attribute float aSpeedMulti;
            attribute float aCharIndex;
            varying float vCharIndex;
            varying float vOpacity;
            
            void main() {
                vCharIndex = aCharIndex;
                vec3 pos = position;
                
                float travel = mod(pos.z + uTime * uSpeed * aSpeedMulti, uDepth);
                float z = -uDepth + travel;
                
                vec4 mvPosition = modelViewMatrix * vec4(pos.x, pos.y, z, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                
                gl_PointSize = 1200.0 / -mvPosition.z; 
                
                float normalizeZ = travel / uDepth; // 0=far, 1=close
                
                // Enhanced depth fade: Distant ones stay semi-transparent longer
                float fadeIn = pow(normalizeZ, 1.5); // Non-linear fade in for deeper look
                float fadeOut = smoothstep(1.0, 0.8, normalizeZ);
                
                vOpacity = fadeIn * fadeOut;
            }
        `,
        fragmentShader: `
            uniform sampler2D uTexture;
            uniform float uCols;
            uniform float uRows;
            uniform vec3 uColor;
            varying float vCharIndex;
            varying float vOpacity;
            
            void main() {
                // Minimum threshold for performance
                if (vOpacity < 0.05) discard;
            
                vec2 uv = gl_PointCoord;
                
                float index = floor(vCharIndex);
                float col = mod(index, uCols);
                float row = floor(index / uCols);
                
                float atlasV = (uRows - 1.0 - row + (1.0 - uv.y)) / uRows;
                float atlasU = (col + uv.x) / uCols;

                vec4 texColor = texture2D(uTexture, vec2(atlasU, atlasV));
                
                if (texColor.a < 0.5) discard;
                
                // Color gets darker with opacity (distance) for stronger depth perception
                // vOpacity here acts as both alpha and brightness multiplier
                vec3 finalColor = uColor * (0.2 + 0.8 * vOpacity);
                
                gl_FragColor = vec4(finalColor, texColor.a * vOpacity);
            }
        `,
        transparent: true,
        depthWrite: false,
    });

    return { geometry: geo, material: mat, uniforms: mat.uniforms };
  }, [chars, density, speed]);

  useFrame((state, delta) => {
    if (uniforms) {
        uniforms.uTime.value += delta;
        // If backward (default), we want particles to move AWAY from camera.
        // Current logic: Speed > 0 -> Travel increases -> Z increases (Far to Near).
        // To move Near to Far, we need Travel to decrease.
        // So passing negative speed works.
        const directionMult = direction === 'backward' ? -1 : 1;
        uniforms.uSpeed.value = speed * directionMult;
    }
  });

  return <points ref={meshRef} geometry={geometry} material={material} />;
};

export const MatrixWarpBackground: React.FC<MatrixWarpBackgroundProps & { direction?: 'forward' | 'backward' }> = ({
  className = '',
  speed = 10,
  density = 1000,
  chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  direction = 'backward',
}) => {
  useLayoutEffect(() => {
    // Dynamic theme color adaptation
    // When this background is active, we want the safe area (theme-color) to be black
    // to match the background, creating a seamless immersive experience.
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const originalThemeColor = metaThemeColor?.getAttribute('content');

    console.log("originalThemeColor => ", originalThemeColor);
    console.log("metaThemeColor => ", metaThemeColor);

    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#000000');
    }

    return () => {
      // Restore original theme color on unmount
      if (metaThemeColor && originalThemeColor) {
        metaThemeColor.setAttribute('content', originalThemeColor);
      }
    };
  }, []);

  return (
    <div className={`fixed top-0 left-0 w-full h-full pointer-events-none -z-10 bg-black ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: false, alpha: false }} // Optimization
        dpr={[1, 2]} // Handle high DPI but limit to 2x
      >
        <MatrixStarField speed={speed} density={density} chars={chars} direction={direction} />
      </Canvas>
      
      {/* Gradients */}
      <div 
        className="absolute top-0 left-0 w-full h-[15vh] pointer-events-none bg-linear-to-b from-black to-transparent"
      />
      <div 
        className="absolute bottom-0 left-0 w-full h-[15vh] pointer-events-none bg-linear-to-t from-black to-transparent"
      />
    </div>
  );
};
