import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'

interface Fan3DProps {
  speed: number // 0-255 PWM value
}

function RotatingFan({ speed }: Fan3DProps) {
  const fanGroupRef = useRef<Group>(null!)
  const bladeRefs = useRef<Mesh[]>([])
  const glitterTime = useRef(0)

  useFrame((state) => {
    if (fanGroupRef.current) {
      // Convert PWM (0-255) to rotation speed
      const rotationSpeed = (speed / 255) * 0.2
      fanGroupRef.current.rotation.z += rotationSpeed
    }
    
    // Add glittering effect to blades when spinning
    if (speed > 0) {
      glitterTime.current += 0.08
      bladeRefs.current.forEach((blade, index) => {
        if (blade && blade.material) {
          const material = blade.material as any
          // Create shimmering effect based on blade position and time
          const shimmer = Math.sin(glitterTime.current * 4 + index * Math.PI / 2) * 0.4 + 0.6
          material.metalness = 0.8 + shimmer * 0.2
          material.roughness = 0.15 - shimmer * 0.1
          
          // Increase effect at higher speeds
          const speedFactor = speed / 255
          material.emissiveIntensity = shimmer * speedFactor * 0.6
        }
      })
    }
  })

  // Create 3 fan blades for realistic look
  const blades = [0, 1, 2].map((index) => {
    const angle = (index * Math.PI * 2) / 3
    return (
      <group key={index} rotation={[0, 0, angle]}>
        {/* Main blade */}
        <mesh
          position={[0.4, 0, 0]}
          ref={(el) => {
            if (el) bladeRefs.current[index] = el
          }}
        >
          <boxGeometry args={[0.7, 0.15, 0.02]} />
          <meshStandardMaterial 
            color={speed > 0 ? '#60A5FA' : '#6B7280'}
            emissive={speed > 0 ? '#3B82F6' : '#000000'}
            emissiveIntensity={0}
            roughness={0.2}
            metalness={0.7}
          />
        </mesh>
        
        {/* Blade tip (rounded end) */}
        <mesh position={[0.75, 0, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial 
            color={speed > 0 ? '#60A5FA' : '#6B7280'}
            roughness={0.2}
            metalness={0.7}
          />
        </mesh>
      </group>
    )
  })

  return (
    <group>
      {/* Fan blades */}
      <group ref={fanGroupRef}>
        {blades}
        
        {/* Center motor hub */}
        <mesh>
          <cylinderGeometry args={[0.15, 0.15, 0.12, 32]} />
          <meshStandardMaterial 
            color="#4B5563"
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
        
        {/* Center cap */}
        <mesh position={[0, 0, 0.07]}>
          <cylinderGeometry args={[0.12, 0.15, 0.05, 32]} />
          <meshStandardMaterial 
            color="#6B7280"
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>
      </group>
      
      {/* Spinning light effect when active */}
      {speed > 30 && (
        <>
          {/* Bright center light */}
          <pointLight 
            position={[0, 0, 0.2]}
            color="#60A5FA"
            intensity={Math.min(speed / 255 * 3, 2)}
            distance={3}
          />
          
          {/* Inner glow ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
            <ringGeometry args={[0.6, 0.85, 32]} />
            <meshBasicMaterial 
              color="#60A5FA"
              transparent
              opacity={Math.min(speed / 255 * 0.6, 0.6)}
            />
          </mesh>
          
          {/* Outer glow effect */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.15]}>
            <ringGeometry args={[0.85, 1.0, 32]} />
            <meshBasicMaterial 
              color="#93C5FD"
              transparent
              opacity={Math.min(speed / 255 * 0.4, 0.4)}
            />
          </mesh>
          
          {/* Additional bloom effect */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.1]}>
            <circleGeometry args={[0.7, 32]} />
            <meshBasicMaterial 
              color="#93C5FD"
              transparent
              opacity={Math.min(speed / 255 * 0.3, 0.3)}
            />
          </mesh>
        </>
      )}
    </group>
  )
}

export default function Fan3D({ speed }: Fan3DProps) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.7} castShadow />
        <pointLight position={[-3, -3, 3]} intensity={0.4} color="#60A5FA" />
        <RotatingFan speed={speed} />
      </Canvas>
    </div>
  )
}
