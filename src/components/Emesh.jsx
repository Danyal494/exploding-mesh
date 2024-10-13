import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useLoader, extend } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { AccumulativeShadows, Environment, OrbitControls, RandomizedLight, shaderMaterial, Stage } from "@react-three/drei";
import * as THREE from "three";
import { MHead } from "./MHead";

const CustomShaderMaterial = shaderMaterial(
  {
    mousePosition: new THREE.Vector2(0.0, 0.0),
    lightPosition: new THREE.Vector3(1, 1, 2),
    time: 0.0,
    metalness: 0.5,   // Set metalness to 1
    roughness: 0.1,   // Set roughness to 0
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
  float threshold = 0.15;  // Smaller value to shrink the area of effect

  // Calculate proximity factor based on distance (sharp falloff outside threshold)
  float proximityFactor = smoothstep(threshold, 0.0, distanceToMouse);

  // Increase the push amount to move vertices farther away
  float pushAmount = 0.2 * proximityFactor;  // Larger push for more dramatic "explosion"

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
  const obj = useLoader(OBJLoader, "/models/MHead.obj");
  useEffect(() => {
    obj.traverse((child) => {
      if (child.isMesh) {
        const geometry = child.geometry;
        geometry.center();
        

        // Set color and displacement attributes
        const numFaces = geometry.attributes.position.count / 3;
        const colors = new Float32Array(numFaces * 3 * 3);
        const displacement = new Float32Array(numFaces * 3 * 3);
        const color = new THREE.Color();

        for (let f = 0; f < numFaces; f++) {
          const index = 9 * f;
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
  }, [obj]);

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
        <mesh geometry={modelGeometry}  position={[0,0.06,0]} scale={[12.7, 11.9, 15]}>
          <customShaderMaterial  ref={shaderMaterialRef} attach="material" />
        </mesh>
      )}
    </>
  );
};

const Emesh = () => {
  return (
    <Canvas  style={{ height: "100vh" }} camera={{ position: [0, 0, 25], fov: 20 }}>
      {/* <ambientLight /> */}
      <spotLight position={[0, 15, 0]} angle={0.3} penumbra={1} castShadow intensity={2} shadow-bias={-0.0001} />
    
        <RandomizedLight amount={8} radius={10} ambient={0.5} position={[1, 5, -1]} />
    
      <Environment preset="sunset" blur={0} background={["true"]} backgroundBlurriness={0.7}  />
    
      <OrbitControls
   
       />
    <MHead/>
      <Scene  />
    
    </Canvas>
  );
};

export default Emesh;
