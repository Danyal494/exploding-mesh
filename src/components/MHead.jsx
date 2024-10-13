import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'

export function MHead(props) {
  const { nodes, materials } = useGLTF('/models/MHead.glb')
  return (
    <group scale={[10,10.9,10]} position={[0,-1.3,0]} {...props} dispose={null}>
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
