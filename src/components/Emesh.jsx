import React, { useRef, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame, useLoader, extend } from "@react-three/fiber";
import { AccumulativeShadows, Backdrop, Environment, OrbitControls, RandomizedLight, shaderMaterial, Stage, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { MHead } from "./MHead";
import Loader from "./Loader";

const CustomShaderMaterial = shaderMaterial(
  {
    mousePosition: new THREE.Vector2(0.0, 0.0),
    lightPosition: new THREE.Vector3(1, 1, 2),
    time: 0.0,
    metalness: 0.3,   // Set metalness to 1
    roughness: 0.2,   // Set roughness to 0
  },
  // Vertex Shader
  `
uniform vec2 mousePosition;
uniform vec3 lightPosition;
uniform float time;
attribute vec3 color;
attribute vec3 displacement;

varying vec3 vNormal;
varying vec3 vColor;
varying vec3 vLightPosition;

void main() {
  vNormal = normal;
  vColor = color;
  vLightPosition = lightPosition;

  // Calculate the distance between the mouse position and the vertex position
  float distanceToMouse = distance(position.xy, mousePosition);

  // Set a smaller threshold to reduce the effect's area
  float threshold = 0.09;  // Smaller value to shrink the area of effect

  // Calculate proximity factor based on distance (sharp falloff outside threshold)
  float proximityFactor = smoothstep(threshold, 0.0, distanceToMouse);

  // Increase the push amount to move vertices farther away
  float pushAmount = 0.6 * proximityFactor;  // Larger push for more dramatic "explosion"

  // Push vertices away from the mouse position
  vec3 newPosition = position + normal * pushAmount;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}

  `,
  // Fragment Shader
  `
 uniform float metalness; // New uniform for metalness
uniform float roughness; // New uniform for roughness
varying vec3 vNormal;
varying vec3 vColor;
varying vec3 vLightPosition;

void main() {
  const float ambient = 0.1;
  vec3 light = normalize(vLightPosition);

  // Standard Lambertian reflection for directional light
  float directional = max(dot(vNormal, light), 0.0);

  // Calculate base color (e.g., gold)
  vec3 baseColor = vec3(1.0, 0.843, 0.0); // Gold color

  // Implement metalness and roughness using the basic approach
  vec3 reflectance = mix(vec3(0.04), baseColor, metalness); // Metalness mix
  vec3 diffuse = (1.0 - metalness) * baseColor; // Diffuse based on metalness

  // Roughness affects the sharpness of the specular highlight
  vec3 specular = reflectance * pow(max(directional, 0.0), (1.0 - roughness) * 128.0);

  // Combine diffuse and specular components
  vec3 color = ambient * baseColor + (diffuse + specular) * directional;

  gl_FragColor = vec4(color, 1.0);
}

`);

extend({ CustomShaderMaterial });

const Scene = () => {
  const [modelGeometry, setModelGeometry] = useState(null);
  const pointerPos = useRef(new THREE.Vector2(0, 0));
  const shaderMaterialRef = useRef();

  // Load OBJ model
  // const obj = useLoader(OBJLoader, "/models/MHead.obj");

  const { scene } = useGLTF("/models/MHeads.glb");
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        const geometry = child.geometry;
        geometry.center();
        

        // Set color and displacement attributes
        const numFaces = geometry.attributes.position.count / 3;
        const colors = new Float32Array(numFaces * 3 * 3);
        const displacement = new Float32Array(numFaces * 3 * 3);
        const color = new THREE.Color();

        for (let f = 0; f < numFaces; f++) {
          const index = 2 * f;
          let lightness = 0.3 + Math.random() * 0.7;
          color.setHSL(0.0, 1.0, lightness);
          let d = 0.05 * (0.5 - Math.random());

          for (let i = 0; i < 3; i++) {
            const { r, g, b } = color;
            colors[index + 3 * i] = r;
            colors[index + 3 * i + 1] = g;
            colors[index + 3 * i + 2] = b;

            displacement[index + 3 * i] = d;
            displacement[index + 3 * i + 1] = d;
            displacement[index + 3 * i + 2] = d;
          }
        }
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute("displacement", new THREE.BufferAttribute(displacement, 3));

        setModelGeometry(geometry);
      }
    });
  },[scene])
  // }, [obj]);

  useFrame(() => {
    if (shaderMaterialRef.current) {
      shaderMaterialRef.current.uniforms.mousePosition.value = pointerPos.current;
    }
  });

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (evt) => {
      pointerPos.current.set(
        (evt.clientX / window.innerWidth) * 2 - 1,
        -(evt.clientY / window.innerHeight) * 2 + 1
      );
    };
    window.addEventListener("mousemove", handleMouseMove);
  

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <>
      {modelGeometry && (
        <mesh castShadow geometry={modelGeometry} rotation={[Math.PI/2,0,0]}  position={[0,0.9,0]} scale={[16.7, 19.7, 18.7]}>
          <ambientLight intensity={1.5}/>
          <customShaderMaterial  ref={shaderMaterialRef} attach="material" />
        </mesh>
      )}
    </>
  );
};

const Emesh = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);
  return (
    <div>
      {
        loading ? (<Loader/>) : (
          <Suspense fallback={<Loader/>}>

          <Canvas  style={{ height: "100vh" }} camera={{ position: [0, 0, 35], fov: 20 }}>
          <Environment preset="city" blur={0} background={["true"]} backgroundBlurriness={0.7}  />
        <ambientLight intensity={1.5}/>
          <OrbitControls
            minPolarAngle={Math.PI / 2}  // Limit vertical rotation to a fixed angle
            maxPolarAngle={Math.PI / 2}    // Vertical rotation limit (keeping it as is)
            minAzimuthAngle={-0.0760}  // -5 degrees in radians
            maxAzimuthAngle={0.009} 
            maxDistance={35} minDistance={25}
            />
              <Backdrop receiveShadow scale={[35, 12, 15]} floor={1.5} position={[0, -4, -2]}>
            <meshPhysicalMaterial roughness={1} color="#e8dede" />
          </Backdrop>
        <MHead/>
          <Scene   />
        
        </Canvas>
            </Suspense>
        )
      }

  
       </div>
  );
};

export default Emesh;
