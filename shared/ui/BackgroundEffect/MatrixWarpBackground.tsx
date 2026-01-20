'use client';

import React, { useEffect, useRef } from 'react';

interface MatrixWarpBackgroundProps {
  className?: string;
  speed?: number;
  density?: number;
  chars?: string;
}

export const MatrixWarpBackground: React.FC<MatrixWarpBackgroundProps> = ({
  className = '',
  speed = 6,
  density = 600,
  chars = '0123456789ABCDEF',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let cx = 0;
    let cy = 0;

    // Star state
    interface Star {
      x: number;
      y: number;
      z: number;
      char: string;
      speedMult: number; // Add random speed multiplier for variation
    }

    const stars: Star[] = [];

    const initStars = () => {
      stars.length = 0;
      for (let i = 0; i < density; i++) {
        stars.push({
          x: Math.random() * width - cx,
          y: Math.random() * height - cy,
          z: Math.random() * width, // Start anywhere in Z
          char: chars[Math.floor(Math.random() * chars.length)],
          speedMult: Math.random() * 0.5 + 0.75, // 0.75x to 1.25x speed
        });
      }
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      cx = width / 2;
      cy = height / 2;
      canvas.width = width;
      canvas.height = height;
      initStars();
    };

    // Scroll interaction state
    let scrollY = 0;
    let targetScrollY = 0;

    const handleScroll = () => {
      targetScrollY = window.scrollY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    handleResize();

    const render = () => {
      // Smooth scroll interpolation
      scrollY += (targetScrollY - scrollY) * 0.1;

      // Clear with transparency for trail effect (optional, strictly clearing for now)
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);

      // Adjust Vanishing Point based on scroll
      // As we scroll down, the vanishing point moves up (or effect looks like we are looking down)
      const vanishingPointY = cy - scrollY * 0.5;

      ctx.fillStyle = '#0f0'; // Default Matrix green, can be overridden by props or context if needed, but keeping simple for now
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const star of stars) {
        // Move star AWAY from camera (increase z) -> "Sucked in" effect
        star.z += speed * star.speedMult;

        // Reset if too far
        if (star.z >= width) {
          star.z = 1; // Reset near camera (but not 0 to avoid div/0)
          star.x = Math.random() * width - cx;
          star.y = Math.random() * height - cy;
          star.char = chars[Math.floor(Math.random() * chars.length)];
        }

        // Project 3D position to 2D
        // Perspective formula: x' = x * (focal_length / z)
        const k = 256 / star.z; // Focal length approximation
        const px = star.x * k + cx;
        const py = star.y * k + vanishingPointY;

        // Size and opacity based on Z
        // Farther stars (larger z) are smaller and dimmer
        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          // As z increases (moving away), opacity should NOT just fade, strictly.
          // In "warp" usually they fade as they reach center, or get small.
          // Standard perspective handles size. 
          // Let's fade out as they get very far (near limit) to avoid sudden disappearance?
          // OR fade in as they start?
          const zLimit = width;
          const nearFade = Math.min(star.z / 100, 1); // Fade in when very close to camera
          const farFade = 1 - (star.z / zLimit); // Fade out as it reaches limit
          
          const opacity = nearFade * farFade;
          
          const size = (1 - star.z / zLimit) * 5 + 10; // Simple size scaling? No, K does perspective sizing.
          // Actually K scales positions. Size should also scale by K.
          const fontSize = 14 * (256 / star.z);

          if (opacity > 0 && fontSize > 0.5) {
            ctx.globalAlpha = opacity;
            ctx.fillStyle = `rgba(0, 255, 0, ${opacity})`; // Green tint
            ctx.font = `${fontSize}px monospace`;
            ctx.fillText(star.char, px, py);
          }
        }
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, [speed, density, chars]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 left-0 w-full h-full pointer-events-none -z-10 ${className}`}
      style={{ backgroundColor: 'black' }}
    />
  );
};
