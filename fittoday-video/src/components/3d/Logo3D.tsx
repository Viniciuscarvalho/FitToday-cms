import React, { useRef } from "react";
import { Mesh } from "three";
import { colors } from "../../theme/colors";

interface Logo3DProps {
  frame: number;
  scale?: number;
}

/**
 * Logo3D - A dumbbell shape rendered with React Three Fiber primitives.
 * Must be placed inside a Three.js canvas context (ThreeCanvas from @remotion/three).
 */
export const Logo3D: React.FC<Logo3DProps> = ({ frame, scale = 1 }) => {
  const groupRef = useRef<any>(null);

  // Gentle Y rotation + subtle float
  const rotationY = frame * 0.02;
  const floatY = Math.sin(frame * 0.03) * 0.1;

  const emerald = colors.primary[500]; // #10b981

  const metalMaterial = {
    color: emerald,
    metalness: 0.8,
    roughness: 0.2,
  };

  const plateMaterial = {
    color: colors.primary[700], // slightly darker plates
    metalness: 0.85,
    roughness: 0.15,
  };

  return (
    <group
      ref={groupRef}
      rotation={[0.15, rotationY, 0]}
      position={[0, floatY, 0]}
      scale={[scale, scale, scale]}
    >
      {/* Central bar */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 2.4, 16]} />
        <meshStandardMaterial {...metalMaterial} />
      </mesh>

      {/* Left side weight plates */}
      {/* Inner plate */}
      <mesh position={[-0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.38, 0.38, 0.12, 24]} />
        <meshStandardMaterial {...plateMaterial} />
      </mesh>
      {/* Outer plate */}
      <mesh position={[-1.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.46, 0.46, 0.14, 24]} />
        <meshStandardMaterial {...plateMaterial} />
      </mesh>
      {/* End cap */}
      <mesh position={[-1.28, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 16]} />
        <meshStandardMaterial {...metalMaterial} />
      </mesh>

      {/* Right side weight plates */}
      {/* Inner plate */}
      <mesh position={[0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.38, 0.38, 0.12, 24]} />
        <meshStandardMaterial {...plateMaterial} />
      </mesh>
      {/* Outer plate */}
      <mesh position={[1.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.46, 0.46, 0.14, 24]} />
        <meshStandardMaterial {...plateMaterial} />
      </mesh>
      {/* End cap */}
      <mesh position={[1.28, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 16]} />
        <meshStandardMaterial {...metalMaterial} />
      </mesh>

      {/* Grip rings on the bar (decorative) */}
      {[-0.3, 0, 0.3].map((xPos, i) => (
        <mesh key={i} position={[xPos, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.1, 0.02, 8, 16]} />
          <meshStandardMaterial color={colors.primary[600]} metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
    </group>
  );
};
