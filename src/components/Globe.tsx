'use client'
import { useRef, useState } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'

interface Photo {
  id: string
  lat: number
  lng: number
  folderName: string
  url: string
  caption?: string
  createdAt: string
  user: { username: string }
  likes: { userId: string }[]
}

function latLngToVec3(lat: number, lng: number, r = 1) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  )
}

function EarthMarker({ photo, onClick }: { photo: Photo; onClick: (p: Photo) => void }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const pos = latLngToVec3(photo.lat, photo.lng, 1.02)

  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.scale.setScalar(hovered ? 1.8 : 1)
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.getElapsedTime() * 2
      ringRef.current.scale.setScalar(hovered ? 1.8 : 1)
    }
  })

  return (
    <group position={pos}>
      {/* Glow ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.032, 0.006, 8, 32]} />
        <meshBasicMaterial color={hovered ? '#f0abfc' : '#a78bfa'} transparent opacity={0.7} />
      </mesh>
      {/* Pin dot */}
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onClick(photo)}
      >
        <sphereGeometry args={[0.018, 16, 16]} />
        <meshBasicMaterial color={hovered ? '#f0abfc' : '#e879f9'} />
      </mesh>
      {hovered && (
        <Html distanceFactor={6} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.95), rgba(236,72,153,0.95))',
            borderRadius: 10,
            padding: '5px 12px',
            fontSize: 11,
            fontWeight: 600,
            color: '#fff',
            whiteSpace: 'nowrap',
            transform: 'translate(-50%, -150%)',
            boxShadow: '0 0 20px rgba(236,72,153,0.6)',
            letterSpacing: '0.5px',
          }}>
            📍 {photo.folderName}
          </div>
        </Html>
      )}
    </group>
  )
}

function NebulaBg() {
  // Large colored spheres very far away for nebula-like bg
  return (
    <>
      <mesh position={[-8, 4, -20]}>
        <sphereGeometry args={[6, 16, 16]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
      <mesh position={[10, -3, -20]}>
        <sphereGeometry args={[5, 16, 16]} />
        <meshBasicMaterial color="#db2777" transparent opacity={0.10} side={THREE.BackSide} />
      </mesh>
      <mesh position={[0, -8, -18]}>
        <sphereGeometry args={[4, 16, 16]} />
        <meshBasicMaterial color="#0891b2" transparent opacity={0.10} side={THREE.BackSide} />
      </mesh>
    </>
  )
}

function StarField() {
  const geo = new THREE.BufferGeometry()
  const count = 10000
  const pos = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const palette = [
    [1, 0.85, 1], [0.85, 0.7, 1], [0.7, 0.9, 1], [1, 0.7, 0.85], [1, 1, 1],
  ]
  for (let i = 0; i < count; i++) {
    const r = 80 + Math.random() * 20
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    pos[i * 3 + 2] = r * Math.cos(phi)
    const c = palette[Math.floor(Math.random() * palette.length)]
    colors[i * 3] = c[0]; colors[i * 3 + 1] = c[1]; colors[i * 3 + 2] = c[2]
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return <points geometry={geo}><pointsMaterial size={0.15} vertexColors transparent opacity={0.85} /></points>
}

function Earth({ photos, onMarkerClick }: { photos: Photo[]; onMarkerClick: (p: Photo) => void }) {
  const cloudsRef = useRef<THREE.Mesh>(null)
  const atmRef = useRef<THREE.Mesh>(null)

  const earthTex = useLoader(THREE.TextureLoader, 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r164/examples/textures/planets/earth_atmos_2048.jpg')
  const cloudTex = useLoader(THREE.TextureLoader, 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r164/examples/textures/planets/earth_clouds_1024.png')

  useFrame(({ clock }) => {
    if (cloudsRef.current) cloudsRef.current.rotation.y = clock.getElapsedTime() * 0.03
    if (atmRef.current) {
      const pulse = 0.08 + Math.sin(clock.getElapsedTime() * 0.8) * 0.02
      ;(atmRef.current.material as THREE.MeshBasicMaterial).opacity = pulse
    }
  })

  return (
    <>
      {/* Earth — MeshBasicMaterial = fully lit, no dark side */}
      <group>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshBasicMaterial map={earthTex} />
        </mesh>
        {photos.map(photo => (
          <EarthMarker key={photo.id} photo={photo} onClick={onMarkerClick} />
        ))}
      </group>

      {/* Clouds */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.008, 64, 64]} />
        <meshBasicMaterial map={cloudTex} transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* Vivid atmosphere glow — magenta/violet */}
      <mesh ref={atmRef}>
        <sphereGeometry args={[1.07, 64, 64]} />
        <meshBasicMaterial color="#c026d3" transparent opacity={0.08} side={THREE.FrontSide} depthWrite={false} />
      </mesh>
      {/* Outer halo */}
      <mesh>
        <sphereGeometry args={[1.12, 64, 64]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.04} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </>
  )
}

export default function GlobeCanvas({ photos, onMarkerClick }: { photos: Photo[]; onMarkerClick: (p: Photo) => void }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.8], fov: 45 }}
      style={{ background: 'transparent' }}
      gl={{ alpha: true, antialias: true }}
    >
      <StarField />
      <NebulaBg />
      <Earth photos={photos} onMarkerClick={onMarkerClick} />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={1.4}
        maxDistance={7}
        rotateSpeed={0.5}
        autoRotate={false}
      />
    </Canvas>
  )
}
