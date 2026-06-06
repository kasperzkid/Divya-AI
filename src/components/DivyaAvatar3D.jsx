import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function DivyaAvatar3D({ isSpeaking }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const width = 160;
    const height = 160;
    
    // Create scene, camera, renderer
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 4.5;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(renderer.domElement);
    }
    
    // Create a beautiful glowing futuristic holographic orb (representing Divya's AI core)
    const geometry = new THREE.SphereGeometry(1.0, 32, 32);
    
    // Custom material with wireframe/glow
    const material = new THREE.MeshStandardMaterial({
      color: 0x6b9080, // Sage green
      wireframe: true,
      transparent: true,
      opacity: 0.8,
      emissive: 0x52796f,
      roughness: 0.1,
      metalness: 0.9,
    });
    
    const orb = new THREE.Mesh(geometry, material);
    scene.add(orb);
    
    // Add particle rings/orbits around the core
    const particlesCount = 90;
    const particlesGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount; i++) {
      const angle = (i / particlesCount) * Math.PI * 2;
      const radius = 1.5 + Math.random() * 0.3;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      
      colors[i * 3] = 0.65; // accent-light
      colors[i * 3 + 1] = 0.8;
      colors[i * 3 + 2] = 0.7;
    }
    
    particlesGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const pointsMaterial = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    
    const particleRing = new THREE.Points(particlesGeom, pointsMaterial);
    scene.add(particleRing);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const dirLight1 = new THREE.DirectionalLight(0xa4c3b2, 1.5);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x799fa6, 1);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);
    
    let clock = new THREE.Clock();
    let animationFrameId;
    
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      
      // Rotate core orb and particle ring
      orb.rotation.y = elapsedTime * 0.5;
      orb.rotation.x = elapsedTime * 0.25;
      
      particleRing.rotation.y = -elapsedTime * 0.35;
      
      // Pulse scale if speaking
      if (isSpeaking) {
        const pulse = 1.0 + Math.sin(elapsedTime * 14) * 0.15;
        orb.scale.set(pulse, pulse, pulse);
        particleRing.scale.set(1.0 + Math.sin(elapsedTime * 14) * 0.08, 1, 1.0 + Math.sin(elapsedTime * 14) * 0.08);
      } else {
        // Soft breath animation when idle
        const breath = 1.0 + Math.sin(elapsedTime * 2.5) * 0.04;
        orb.scale.set(breath, breath, breath);
      }
      
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      geometry.dispose();
      material.dispose();
      particlesGeom.dispose();
      pointsMaterial.dispose();
      renderer.dispose();
    };
  }, [isSpeaking]);

  return (
    <div 
      ref={containerRef} 
      className="divya-avatar-container"
      style={{ 
        width: '160px', 
        height: '160px', 
        margin: '0 auto', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        borderRadius: '50%',
        boxShadow: isSpeaking ? '0 0 30px rgba(107, 144, 128, 0.45)' : 'none',
        transition: 'box-shadow 0.3s ease',
        background: 'rgba(255, 255, 255, 0.01)',
        border: '1px solid var(--border)'
      }} 
    />
  );
}
