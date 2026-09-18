import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, Billboard } from '@react-three/drei';
import { useCompilerStore } from '../../state/compilerStore';
import * as THREE from 'three';

const OptBlock = ({ inst, index, isChanged }: { inst: any, index: number, isChanged: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { animationTrigger } = useCompilerStore();
  const color = isChanged ? '#f59e0b' : '#3b82f6';
  
  useFrame(() => {
    if (meshRef.current && animationTrigger && isChanged) {
      const timeSinceTrigger = (Date.now() - animationTrigger) / 1000;
      if (timeSinceTrigger < 2) {
        meshRef.current.scale.setScalar(1 + Math.sin(timeSinceTrigger * Math.PI * 5) * 0.1);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });
  
  let text = '';
  if (inst.op === '=') text = `${inst.result} = ${inst.arg1}`;
  else if (inst.op === 'print') text = `print ${inst.arg1}`;
  else if (inst.op === 'return') text = `return ${inst.arg1}`;
  else text = `${inst.result} = ${inst.arg1} ${inst.op} ${inst.arg2}`;
  
  return (
    <group position={[0, -index * 1.2, 0]}>
      <mesh ref={meshRef}>
        <boxGeometry args={[5, 0.8, 0.5]} />
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

export const OptimizationScene: React.FC = () => {
  const { optimizedIR, irInstructions } = useCompilerStore();
  const displayIR = optimizedIR.filter(i => i.op !== 'label').slice(0, 5);

  return (
    <Canvas camera={{ position: [0, -2, 10], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#fbbf24" />
      
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
        <group position={[0, 2, 0]}>
          {displayIR.map((inst, i) => {
            const origInst = irInstructions[i];
            const isChanged = origInst && (origInst.op !== inst.op || origInst.arg1 !== inst.arg1 || origInst.arg2 !== inst.arg2);
            return <OptBlock key={i} inst={inst} index={i} isChanged={!!isChanged} />
          })}
        </group>
      </Float>
    </Canvas>
  );
};
