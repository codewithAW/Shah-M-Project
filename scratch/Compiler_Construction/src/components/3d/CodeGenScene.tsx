import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, Billboard } from '@react-three/drei';
import { useCompilerStore } from '../../state/compilerStore';
import * as THREE from 'three';

const TargetBlock = ({ inst, index }: { inst: any, index: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { animationTrigger } = useCompilerStore();
  
  useFrame(() => {
    if (meshRef.current && animationTrigger) {
      const timeSinceTrigger = (Date.now() - animationTrigger) / 1000;
      if (timeSinceTrigger > index * 0.1 && timeSinceTrigger < index * 0.1 + 0.5) {
        meshRef.current.position.z = Math.sin((timeSinceTrigger - index * 0.1) * Math.PI * 2) * 0.5;
      } else {
        meshRef.current.position.z = 0;
      }
    }
  });

  const text = inst.op.endsWith(':') ? inst.op : `${inst.op} ${inst.args.join(', ')}`;
  const color = inst.op.endsWith(':') ? '#f43f5e' : '#8b5cf6';
  
  return (
    <group position={[0, -index * 1.2, 0]}>
      <mesh ref={meshRef}>
        <boxGeometry args={[4, 0.8, 0.5]} />
        <meshPhysicalMaterial 
          color={color} 
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

export const CodeGenScene: React.FC = () => {
  const { targetCode } = useCompilerStore();
  const displayCode = targetCode.slice(0, 5);

  return (
    <Canvas camera={{ position: [0, -2, 10], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#a855f7" />
      
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
        <group position={[0, 2, 0]}>
          {displayCode.map((inst, i) => (
            <TargetBlock key={i} inst={inst} index={i} />
          ))}
        </group>
      </Float>
    </Canvas>
  );
};
