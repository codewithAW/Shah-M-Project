import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, Billboard } from '@react-three/drei';
import { useCompilerStore } from '../../state/compilerStore';
import * as THREE from 'three';

const IRBlock = ({ inst, index }: { inst: any, index: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { animationTrigger } = useCompilerStore();

  useFrame(() => {
    if (meshRef.current && animationTrigger) {
      const timeSinceTrigger = (Date.now() - animationTrigger) / 1000;
      if (timeSinceTrigger < 2) {
        meshRef.current.position.x = Math.sin(timeSinceTrigger * Math.PI * 4 + index) * (2 - timeSinceTrigger) * 0.5;
      } else {
        meshRef.current.position.x = 0;
      }
    }
  });

  const text = inst.op === '=' ? `${inst.result} = ${inst.arg1}` : `${inst.result} = ${inst.arg1} ${inst.op} ${inst.arg2}`;
  
  return (
    <group position={[0, -index * 1.2, 0]}>
      <mesh ref={meshRef}>
        <boxGeometry args={[5, 0.8, 0.5]} />
        <meshPhysicalMaterial 
          color="#3b82f6" 
          transmission={0.7} 
          roughness={0.1} 
          transparent={true} 
        />
        <Billboard>
          <Text position={[0, 0, 0.3]} fontSize={0.3} color="#ffffff">{text}</Text>
        </Billboard>
      </mesh>
    </group>
  );
};

export const IRScene: React.FC = () => {
  const { irInstructions } = useCompilerStore();
  const displayIR = irInstructions.filter(i => i.op !== 'label').slice(0, 5);

  return (
    <Canvas camera={{ position: [0, -2, 10], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#60a5fa" />
      
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
        <group position={[0, 2, 0]}>
          {displayIR.map((inst, i) => (
            <IRBlock key={i} inst={inst} index={i} />
          ))}
        </group>
      </Float>
    </Canvas>
  );
};
