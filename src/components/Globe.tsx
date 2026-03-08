'use client'
import { useRef, useState } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Stars, Html } from '@react-three/drei'
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
  const [hovered, setHovered] = useState(false)
  const pos = latLngToVec3(photo.lat, photo.lng, 1.02)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(hovered ? 1.6 : 1)
    }
  })

  return (
    <group position={pos}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onClick(photo)}
      >
        <sphereGeometry args={[0.018, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? '#a78bfa' : '#6495ff'}
          emissive={hovered ? '#7c3aed' : '#2244cc'}
          emissiveIntensity={0.6}
        />
      </mesh>
      {hovered && (
        <Html distanceFactor={6} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(10,14,30,0.9)',
            border: '1px solid rgba(100,140,255,0.4)',
            borderRadius: 8,
            padding: '4px 10px',
            fontSize: 11,
            color: '#fff',
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(8px)',
            transform: 'translate(-50%, -140%)',
          }}>
            {photo.folderName}
          </div>
        </Html>
      )}
    </group>
  )
}

function Earth({ photos, onMarkerClick }: { photos: Photo[]; onMarkerClick: (p: Photo) => void }) {
  const earthRef = useRef<THREE.Group>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)

  const earthTex = useLoader(THREE.TextureLoader, 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r164/examples/textures/planets/earth_atmos_2048.jpg')
  const specTex = useLoader(THREE.TextureLoader, 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r164/examples/textures/planets/earth_specular_2048.jpg')
  const normTex = useLoader(THREE.TextureLoader, 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r164/examples/textures/planets/earth_normal_2048.jpg')
  const cloudTex = useLoader(THREE.TextureLoader, 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r164/examples/textures/planets/earth_clouds_1024.png')

  useFrame(() => {
    if (earthRef.current) earthRef.current.rotation.y += 0.0006
    if (cloudsRef.current) cloudsRef.current.rotation.y += 0.0008
  })

  return (
    <>
      <group ref={earthRef}>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshPhongMaterial
            map={earthTex}
            specularMap={specTex}
            normalMap={normTex}
            normalScale={new THREE.Vector2(0.85, 0.85)}
            specular={new THREE.Color(0x2244aa)}
            shininess={25}
          />
        </mesh>
        {photos.map(photo => (
          <EarthMarker key={photo.id} photo={photo} onClick={onMarkerClick} />
        ))}
      </group>
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.008, 64, 64]} />
        <meshPhongMaterial map={cloudTex} transparent opacity={0.4} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.06, 64, 64]} />
        <meshPhongMaterial color="#2266ff" transparent opacity={0.06} depthWrite={false} />
      </mesh>
    </>
  )
}

export default function GlobeCanvas({ photos, onMarkerClick }: { photos: Photo[]; onMarkerClick: (p: Photo) => void }) {
  return (
    <Canvas camera={{ position: [0, 0, 2.8], fov: 45 }} style={{ background: 'transparent' }}>
      <ambientLight intensity={1.2} color="#334466" />
      <directionalLight position={[5, 3, 5]} intensity={3.5} color="#fff5e0" />
      <Stars radius={100} depth={50} count={8000} factor={4} saturation={0} fade />
      <Earth photos={photos} onMarkerClick={onMarkerClick} />
      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        minDistance={1.4}
        maxDistance={7}
        rotateSpeed={0.5}
      />
    </Canvas>
  )
}
