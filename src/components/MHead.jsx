import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'

export function MHead(props) {
  const { nodes, materials } = useGLTF('/models/MHead.glb')
  return (
    <group scale={[13,17,12]} position={[0,-1.3,0.1]} {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Eyes.geometry}
        material={materials['Lava.001']}
        position={[0, -1.373, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Male_Head.geometry}
        material={materials['Ice.002']}
        position={[0, -1.373, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  )
}

useGLTF.preload('/models/MHead.glb')
