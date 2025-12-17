import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { Mesh, PointLight } from 'three'

interface Led3DProps {
  isOn: boolean
}

function LedBulb({ isOn }: Led3DProps) {
  const bulbRef = useRef<Mesh>(null!)
  const filamentRef = useRef<Mesh>(null!)
  const lightRef = useRef<PointLight>(null!)

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    
    // Gentle floating animation
    if (bulbRef.current) {
      bulbRef.current.position.y = Math.sin(time * 0.5) * 0.08
    }
    
    // Pulsing glow when on
    if (isOn && lightRef.current) {
      lightRef.current.intensity = 2.5 + Math.sin(time * 3) * 0.4
    }
    
    // Filament glow animation when on
    if (isOn && filamentRef.current) {
      const material = filamentRef.current.material as any
      material.emissiveIntensity = 1 + Math.sin(time * 3) * 0.2
    }
  })

  return (
    <group>
      {/* Glass Bulb */}
      <mesh ref={bulbRef} position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshPhysicalMaterial 
          color={isOn ? '#FFFACD' : '#F5F5F5'}
          transparent
          opacity={isOn ? 0.3 : 0.5}
          roughness={0.1}
          metalness={0.05}
          transmission={isOn ? 0.9 : 0.7}
          thickness={0.5}
        />
      </mesh>
      
      {/* Filament inside */}
      <mesh ref={filamentRef} position={[0, 0.1, 0]} scale={[0.15, 0.35, 0.15]}>
        <torusGeometry args={[0.5, 0.15, 8, 12]} />
        <meshStandardMaterial 
          color={isOn ? '#FFD700' : '#808080'}
          emissive={isOn ? '#FF8C00' : '#000000'}
          emissiveIntensity={isOn ? 1 : 0}
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>
      
      {/* Light source when on */}
      {isOn && (
        <>
          <pointLight 
            ref={lightRef}
            position={[0, 0.1, 0]}
            color="#FFA500"
            intensity={2.5}
            distance={6}
          />
          {/* Outer glow */}
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.65, 24, 24]} />
            <meshBasicMaterial 
              color="#FFD700"
              transparent
              opacity={0.25}
            />
          </mesh>
        </>
      )}
      
      {/* Metal Base/Socket */}
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.3, 32]} />
        <meshStandardMaterial color="#A0A0A0" roughness={0.3} metalness={0.9} />
      </mesh>
      
      {/* Socket threads */}
      <mesh position={[0, -0.52, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 32]} />
        <meshStandardMaterial color="#707070" roughness={0.6} metalness={0.7} />
      </mesh>
    </group>
  )
}

export default function Led3D({ isOn }: Led3DProps) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.6} />
        <spotLight position={[-3, 3, 2]} angle={0.3} intensity={0.5} />
        <LedBulb isOn={isOn} />
      </Canvas>
    </div>
  )
}
