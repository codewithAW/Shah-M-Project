import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, Billboard } from '@react-three/drei';
import { useCompilerStore } from '../../state/compilerStore';
import * as THREE from 'three';

const SymbolEntry = ({ name, type, index }: { name: string, type: string, index: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const { animationTrigger } = useCompilerStore();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime + index) * 0.1 - index * 1.2;
      
      if (animationTrigger) {
         const timeSinceTrigger = (Date.now() - animationTrigger) / 1000;
         if (timeSinceTrigger > index * 0.2 && timeSinceTrigger < index * 0.2 + 0.5) {
             meshRef.current.rotation.x = Math.sin(timeSinceTrigger * 10) * 0.2;
         } else {
             meshRef.current.rotation.x = 0;
         }
      }
    }
  });

  return (
    <group position={[0, -index * 1.2, 0]}>
      <mesh ref={meshRef}>
        <boxGeometry args={[3, 0.8, 0.2]} />
        <meshPhysicalMaterial 
          color="#10b981" 
          transmission={0.5} 
          roughness={0.2} 
          transparent={true} 
        />
        <Billboard>
          <Text position={[-1, 0, 0.2]} fontSize={0.3} color="#ffffff">{name}</Text>
          <Text position={[1, 0, 0.2]} fontSize={0.2} color="#d1d5db">{type}</Text>
        </Billboard>
      </mesh>
    </group>
  );
};

export const SemanticScene: React.FC = () => {
  const { semanticResult } = useCompilerStore();

  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} color="#34d399" />
      
      <Float speed={2} rotationIntensity={0.05} floatIntensity={0.2}>
        <group position={[0, 2, 0]}>
          {semanticResult.symbolTable.slice(0, 5).map((sym, i) => (
            <SymbolEntry key={i} name={sym.name} type={sym.type} index={i} />
          ))}
        </group>
      </Float>
    </Canvas>
  );
};
