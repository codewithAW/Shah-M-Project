import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, Billboard } from '@react-three/drei';
import { useCompilerStore } from '../../state/compilerStore';
import * as THREE from 'three';

const RegisterBlock = ({ name, value, index }: { name: string, value: number, index: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2 + index) * 0.2 + (index * 1.5 - 1.5);
    }
  });

  return (
    <group position={[-3, 0, 0]}>
      <mesh ref={meshRef}>
        <cylinderGeometry args={[0.8, 0.8, 1, 32]} />
        <meshPhysicalMaterial 
          color="#ef4444" 
          transmission={0.5} 
          roughness={0.2} 
          transparent={true} 
        />
        <Billboard>
          <Text position={[0, 0.8, 0]} fontSize={0.3} color="#ffffff">{name}</Text>
          <Text position={[0, 0, 0.9]} fontSize={0.4} color="#ffffff">{value}</Text>
        </Billboard>
      </mesh>
    </group>
  );
};

export const ExecutionScene: React.FC = () => {
  const { executionOutput, animationTrigger } = useCompilerStore();
  const cpuRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (cpuRef.current && animationTrigger) {
      const timeSinceTrigger = (Date.now() - animationTrigger) / 1000;
      if (timeSinceTrigger < 3) {
        cpuRef.current.rotation.x += 0.1;
        cpuRef.current.rotation.y += 0.1;
        cpuRef.current.scale.setScalar(1 + Math.sin(timeSinceTrigger * 20) * 0.1);
      } else {
        cpuRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ef4444" />
      
      <group>
        {Object.entries(executionOutput.registers).map(([reg, val], i) => (
          <RegisterBlock key={i} name={reg} value={val} index={i} />
        ))}
        
        {/* Simulated CPU Core */}
        <Float speed={3} rotationIntensity={0.5} floatIntensity={0.1}>
          <mesh ref={cpuRef} position={[2, 0, 0]}>
            <boxGeometry args={[3, 3, 3]} />
            <meshPhysicalMaterial 
              color="#10b981" 
              transmission={0.9} 
              roughness={0} 
              transparent={true} 
              wireframe={true}
            />
            <Billboard>
              <Text position={[0, 0, 0]} fontSize={0.5} color="#10b981">CPU</Text>
            </Billboard>
          </mesh>
        </Float>
      </group>
    </Canvas>
  );
};
