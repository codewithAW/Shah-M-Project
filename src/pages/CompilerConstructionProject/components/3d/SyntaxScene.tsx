import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Line, Float, Billboard } from '@react-three/drei';
import { useCompilerStore } from '../../state/compilerStore';
import * as THREE from 'three';

/* ── Single AST node (octahedron + labels) ── */
const ASTNode3D = ({ type, name, position }: { type: string, name: string, position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { animationTrigger } = useCompilerStore();
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      if (animationTrigger) {
        const timeSinceTrigger = (Date.now() - animationTrigger) / 1000;
        if (timeSinceTrigger < 1) {
          const scale = 1 + Math.sin(timeSinceTrigger * Math.PI) * 0.2;
          meshRef.current.scale.set(scale, scale, scale);
        } else {
          meshRef.current.scale.set(1, 1, 1);
        }
      }
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.6, 1]} />
        <meshPhysicalMaterial 
          color="#6366f1" 
          transmission={0.6} 
          roughness={0.1} 
          transparent={true} 
          wireframe={true} 
        />
      </mesh>
      <Billboard>
        <Text position={[0, 0.9, 0]} fontSize={0.22} color="#4f46e5" anchorX="center">
          {type}
        </Text>
        {name ? (
          <Text position={[0, -0.9, 0]} fontSize={0.18} color="#818cf8" anchorX="center">
            {name}
          </Text>
        ) : null}
      </Billboard>
    </group>
  );
};

/* ── Layout helpers: compute positions then derive bounding box ── */
interface LayoutNode {
  type: string;
  name: string;
  x: number;
  y: number;
  parentX?: number;
  parentY?: number;
}

function layoutAST(node: any, depth: number, xOffset: number, result: LayoutNode[], spacing = 2.4): number {
  if (!node) return xOffset;

  let typeName = node.type;
  let name = '';
  if (node.type === 'FunctionDecl') name = node.name;
  else if (node.type === 'VarDecl') name = node.name;
  else if (node.type === 'Identifier') name = node.name;
  else if (node.type === 'Literal') name = String(node.value);
  else if (node.type === 'BinaryExpr') name = node.operator;
  else if (node.type === 'IncludeStmt') name = node.file;
  else if (node.type === 'AssignStmt') name = node.target;

  const children: any[] = [];
  if (node.body && Array.isArray(node.body)) children.push(...node.body);
  if (node.init) children.push(node.init);
  if (node.left) children.push(node.left);
  if (node.right) children.push(node.right);
  if (node.value && typeof node.value === 'object') children.push(node.value);

  // Leaf node
  if (children.length === 0) {
    result.push({ type: typeName, name, x: xOffset, y: -depth * 2 });
    return xOffset + spacing;
  }

  // Layout children first to determine our own x center
  const childStartX = xOffset;
  let nextX = xOffset;
  const childPositions: { x: number; y: number }[] = [];

  for (const child of children) {
    const childX = nextX;
    nextX = layoutAST(child, depth + 1, nextX, result, spacing);
    childPositions.push({ x: (childX + nextX - spacing) / 2, y: -(depth + 1) * 2 });
  }

  const myX = (childStartX + nextX - spacing) / 2;
  const myY = -depth * 2;

  // Add edges from parent to children
  for (const cp of childPositions) {
    result.push({ type: '__edge__', name: '', x: myX, y: myY, parentX: cp.x, parentY: cp.y });
  }

  result.push({ type: typeName, name, x: myX, y: myY });
  return nextX;
}

/* ── Camera auto-framing component ── */
const AutoFrameCamera = ({ bounds }: { bounds: { minX: number; maxX: number; minY: number; maxY: number } }) => {
  const { camera } = useThree();
  const hasFramed = useRef(false);
  const prevBounds = useRef(bounds);

  // Reset framing when bounds change significantly
  if (
    Math.abs(prevBounds.current.minX - bounds.minX) > 0.1 ||
    Math.abs(prevBounds.current.maxX - bounds.maxX) > 0.1 ||
    Math.abs(prevBounds.current.minY - bounds.minY) > 0.1 ||
    Math.abs(prevBounds.current.maxY - bounds.maxY) > 0.1
  ) {
    hasFramed.current = false;
    prevBounds.current = bounds;
  }

  useFrame(() => {
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const width = bounds.maxX - bounds.minX + 6; // generous padding
    const height = bounds.maxY - bounds.minY + 6;

    // Calculate required distance based on FOV
    const fov = (camera as THREE.PerspectiveCamera).fov;
    const aspect = (camera as THREE.PerspectiveCamera).aspect;
    const fovRad = (fov * Math.PI) / 180;
    const distForHeight = (height / 2) / Math.tan(fovRad / 2);
    const distForWidth = (width / 2) / (Math.tan(fovRad / 2) * aspect);
    const dist = Math.max(distForHeight, distForWidth, 8); // minimum distance of 8

    const targetX = centerX;
    const targetY = centerY;
    const targetZ = dist;

    if (!hasFramed.current) {
      // Snap immediately on first frame or bounds change
      camera.position.set(targetX, targetY, targetZ);
      (camera as THREE.PerspectiveCamera).lookAt(centerX, centerY, 0);
      hasFramed.current = true;
    } else {
      // Smoothly lerp the camera
      camera.position.x += (targetX - camera.position.x) * 0.12;
      camera.position.y += (targetY - camera.position.y) * 0.12;
      camera.position.z += (targetZ - camera.position.z) * 0.12;
      (camera as THREE.PerspectiveCamera).lookAt(centerX, centerY, 0);
    }
  });

  return null;
};

export const SyntaxScene: React.FC = () => {
  const { ast } = useCompilerStore();
  
  const { nodes, edges, bounds } = useMemo(() => {
    const layoutResult: LayoutNode[] = [];
    if (ast) {
      layoutAST(ast, 0, 0, layoutResult);
    }
    const nodeItems = layoutResult.filter(n => n.type !== '__edge__');
    const edgeItems = layoutResult.filter(n => n.type === '__edge__');

    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    for (const n of nodeItems) {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    }

    return { nodes: nodeItems, edges: edgeItems, bounds: { minX, maxX, minY, maxY } };
  }, [ast]);

  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#c084fc" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#38bdf8" />
      
      <AutoFrameCamera bounds={bounds} />

      <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.1}>
        <group>
          {edges.map((e, i) => (
            <Line
              key={`edge-${i}`}
              points={[[e.x, e.y - 0.4, 0], [e.parentX!, e.parentY! + 0.4, 0]]}
              color="#818cf8"
              lineWidth={2}
            />
          ))}
          {nodes.map((n, i) => (
            <ASTNode3D key={`node-${i}`} type={n.type} name={n.name} position={[n.x, n.y, 0]} />
          ))}
        </group>
      </Float>
    </Canvas>
  );
};
