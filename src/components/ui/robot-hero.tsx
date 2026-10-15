import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";

function themeColor(token: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return new THREE.Color(`hsl(${value})`);
}

function RobotFigure({ reducedMotion }: { reducedMotion: boolean }) {
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const eyesRef = useRef<THREE.Group>(null);
  const shell = useMemo(() => themeColor("--robot-shell"), []);
  const shadow = useMemo(() => themeColor("--robot-shadow"), []);
  const screen = useMemo(() => themeColor("--robot-screen"), []);
  const trim = useMemo(() => themeColor("--robot-trim"), []);

  useFrame(({ clock, pointer }, rawDelta) => {
    if (reducedMotion) return;
    const delta = Math.min(rawDelta, 0.05);
    const ease = 1 - Math.exp(-3.5 * delta);
    const time = clock.getElapsedTime();

    if (bodyRef.current) {
      bodyRef.current.position.y = -0.3 + Math.sin(time * 0.8) * 0.045;
      bodyRef.current.rotation.y = THREE.MathUtils.damp(bodyRef.current.rotation.y, pointer.x * 0.18, 3.5, delta);
      bodyRef.current.rotation.z = THREE.MathUtils.damp(bodyRef.current.rotation.z, -pointer.x * 0.045, 3.5, delta);
    }
    if (headRef.current) {
      headRef.current.rotation.y = THREE.MathUtils.damp(headRef.current.rotation.y, pointer.x * 0.28, 4.5, delta);
      headRef.current.rotation.x = THREE.MathUtils.damp(headRef.current.rotation.x, -pointer.y * 0.12, 4.5, delta);
    }
    if (eyesRef.current) {
      const phase = time % 3.8;
      const blink = phase > 3.62 ? Math.max(0.08, 1 - Math.sin(((phase - 3.62) / 0.18) * Math.PI)) : 1;
      eyesRef.current.scale.y = THREE.MathUtils.damp(eyesRef.current.scale.y, blink, 24, delta);
    }
    if (bodyRef.current) bodyRef.current.scale.x = THREE.MathUtils.damp(bodyRef.current.scale.x, 1, 3.5, delta);
  });

  const material = (color: THREE.Color, roughness: number, metalness: number) =>
    new THREE.MeshPhysicalMaterial({ color, roughness, metalness, clearcoat: 0.6, clearcoatRoughness: 0.28 });

  return (
    <group ref={bodyRef} position={[0, -0.3, 0]}>
      {/* Rounded shell */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.52, 48, 40]} />
        <primitive object={material(shell, 0.28, 0.42)} attach="material" />
      </mesh>
      <mesh position={[0, 0.38, 0]} rotation-x={Math.PI / 2} castShadow>
        <torusGeometry args={[0.27, 0.018, 12, 48]} />
        <primitive object={material(trim, 0.24, 0.58)} attach="material" />
      </mesh>
      <mesh position={[0, 0.57, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.2, 0.2, 32]} />
        <primitive object={material(shell, 0.24, 0.5)} attach="material" />
      </mesh>

      {/* Visor and face */}
      <group ref={headRef} position={[0, 0.98, 0]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.37, 48, 40]} />
          <primitive object={material(shadow, 0.2, 0.32)} attach="material" />
        </mesh>
        <mesh position={[0, -0.015, 0.296]}>
          <sphereGeometry args={[0.302, 40, 32]} />
          <meshPhysicalMaterial color={shadow} roughness={0.12} metalness={0.25} clearcoat={1} clearcoatRoughness={0.1} />
        </mesh>
        <group ref={eyesRef} position={[0, -0.025, 0.342]}>
          <mesh position={[-0.105, 0, 0]}>
            <sphereGeometry args={[0.043, 24, 20]} />
            <meshBasicMaterial color={screen} toneMapped={false} />
          </mesh>
          <mesh position={[0.105, 0, 0]}>
            <sphereGeometry args={[0.043, 24, 20]} />
            <meshBasicMaterial color={screen} toneMapped={false} />
          </mesh>
        </group>

        {/* Side caps */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.39, 0, 0]}>
            <mesh rotation-z={Math.PI / 2} castShadow>
              <cylinderGeometry args={[0.075, 0.075, 0.07, 32]} />
              <primitive object={material(shell, 0.22, 0.6)} attach="material" />
            </mesh>
            <mesh position={[side * 0.038, 0, 0]} rotation-z={Math.PI / 2}>
              <torusGeometry args={[0.052, 0.008, 10, 32]} />
              <primitive object={material(trim, 0.2, 0.65)} attach="material" />
            </mesh>
          </group>
        ))}

        {/* Antenna */}
        <mesh position={[0, 0.405, 0]} castShadow>
          <cylinderGeometry args={[0.012, 0.018, 0.13, 16]} />
          <primitive object={material(trim, 0.22, 0.65)} attach="material" />
        </mesh>
        <mesh position={[0, 0.48, 0]}>
          <sphereGeometry args={[0.028, 20, 16]} />
          <meshBasicMaterial color={screen} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function RobotScene({ reducedMotion }: { reducedMotion: boolean }) {
  const highlight = useMemo(() => themeColor("--robot-screen"), []);
  const shell = useMemo(() => themeColor("--robot-shell"), []);

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 5, 4]} intensity={2.1} color={highlight} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 2, -3]} intensity={1.2} color={shell} />
      <Environment resolution={128}>
        <Lightformer intensity={2.2} position={[0, 4, 2]} scale={[5, 3, 1]} color={highlight} />
        <Lightformer intensity={1.4} position={[-4, 1, -2]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} color={shell} />
      </Environment>
      <RobotFigure reducedMotion={reducedMotion} />
      <ContactShadows position={[0, -0.78, 0]} opacity={0.52} scale={3.8} blur={2.4} far={2.4} resolution={256} />
    </>
  );
}

export function RobotHero() {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div className="h-full w-full" aria-hidden="true">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        frameloop={reducedMotion ? "demand" : "always"}
        camera={{ position: [0, 0.43, 4.6], fov: 36 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      >
        <RobotScene reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}

export default RobotHero;