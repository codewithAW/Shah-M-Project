import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, Billboard } from '@react-three/drei';
import { useCompilerStore } from '../../state/compilerStore';
import * as THREE from 'three';

const TokenBlock = ({ token, index, total }: { token: any, index: number, total: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { animationTrigger } = useCompilerStore();

  // Arrange in rows of up to 5 tokens to keep them in view
  const cols = 5;
  const row = Math.floor(index / cols);
  const col = index % cols;
  
  // Center the grid horizontally and vertically
  const totalRows = Math.ceil(total / cols);
  const itemsInThisRow = row === totalRows - 1 && total % cols !== 0 ? total % cols : cols;
  
  const startX = (col - itemsInThisRow / 2 + 0.5) * 1.5;
  const targetX = startX;
  const targetY = ((totalRows / 2) - row - 0.5) * 1.5;

  const startPos = new THREE.Vector3(startX, 10 + row * 2, -5); // Drop in from above
  const endPos = new THREE.Vector3(targetX, targetY, 0);

  useFrame(() => {
    if (!meshRef.current) return;
    if (!animationTrigger) {
      meshRef.current.position.copy(startPos);
      return;
    }
    
    const timeSinceTrigger = (Date.now() - animationTrigger) / 1000;
    const delay = index * 0.08; // Staggered drop
    if (timeSinceTrigger > delay) {
      meshRef.current.position.lerp(endPos, 0.08);
    } else {
      meshRef.current.position.copy(startPos);
    }
  });

  let color = '#3b82f6';
  if (token.type === 'KEYWORD') color = '#ec4899';
  if (token.type === 'IDENTIFIER') color = '#8b5cf6';
  if (token.type === 'LITERAL' || token.type === 'INTEGER_LITERAL') color = '#10b981';

  return (
    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
      <mesh ref={meshRef} position={startPos}>
        <boxGeometry args={[1.2, 0.6, 0.4]} />
        <meshPhysicalMaterial 
          color={color} 
          transmission={0.8} 
          opacity={1} 
          roughness={0.2} 
          transparent={true} 
        />
        <Billboard>
          <Text 
            position={[0, 0, 0.25]} 
            fontSize={0.25} 
            color="#ffffff" 
            anchorX="center" 
            anchorY="middle"
          >
            {token.value}
          </Text>
        </Billboard>
      </mesh>
    </Float>
  );
};

export const LexicalScene: React.FC = () => {
  const { tokens } = useCompilerStore();
  const displayTokens = tokens.slice(0, 15); // Show first 15 tokens in 3D

  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} color="#0ea5e9" intensity={0.5} />
      
      <group position={[0, 0, 0]}>
        {displayTokens.map((token, i) => (
          <TokenBlock key={i} token={token} index={i} total={displayTokens.length} />
        ))}
      </group>
    </Canvas>
  );
};
