import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sphere } from '@react-three/drei';

const vertexShader = `
    varying vec2 vUv;
    varying float vDistance;
    varying float vSequence;
    attribute float aDistance;
    attribute float aSequence;
    void main() {
        vDistance = aDistance;
        vSequence = aSequence;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform float time;
    uniform vec3 color;
    uniform float opacity;
    uniform float mode; // 0: Idle, 1: Reactive/Thinking
    varying float vDistance;
    varying float vSequence;
    void main() {
        // Pulso base viajante (Thinking/Reactive)
        float traveler = step(0.97, fract(vDistance * 0.5 - time * 0.8 + vSequence));
        
        // Brilho de "respiração" (Idle)
        float breathing = (0.5 + 0.5 * sin(time * 0.5)) * 0.3;
        
        float pulse = mix(breathing, traveler, step(0.1, mode));
        vec3 finalColor = mix(color * 0.15, color, pulse);
        
        float finalOpacity = opacity * (0.4 + pulse * 0.6);
        gl_FragColor = vec4(finalColor, finalOpacity);
    }
`;

const NeuralSphere = ({ stats, isListening, isThinking, awakening = 1 }) => {
    const groupRef = useRef();
    const nodesRef = useRef();
    const linesRef = useRef();

    const NODE_COUNT = 200;
    const safeStats = stats || { amplitude: 0, bass: 0, treble: 0 };
    const amp = safeStats.amplitude;

    // Gerar posições dos nós (Fibonacci Sphere)
    const nodePositions = useMemo(() => {
        const positions = new Float32Array(NODE_COUNT * 3);
        const phi = Math.PI * (Math.sqrt(5) - 1);

        for (let i = 0; i < NODE_COUNT; i++) {
            const y = 1 - (i / (NODE_COUNT - 1)) * 2;
            const radius = Math.sqrt(1 - y * y);
            const theta = phi * i;

            positions[i * 3] = Math.cos(theta) * radius * 3;
            positions[i * 3 + 1] = y * 3;
            positions[i * 3 + 2] = Math.sin(theta) * radius * 3;
        }
        return positions;
    }, []);

    // Conexões e dados para o Shader (pulso) - Densidade Aumentada (v2.1)
    const { linePositions, lineDistances, lineSequences } = useMemo(() => {
        const pos = [];
        const dists = [];
        const seqs = [];
        const maxDist = 3.2;

        for (let i = 0; i < NODE_COUNT; i++) {
            const p1 = new THREE.Vector3(nodePositions[i * 3], nodePositions[i * 3 + 1], nodePositions[i * 3 + 2]);
            let conns = 0;
            for (let j = i + 1; j < NODE_COUNT && conns < 6; j++) {
                const p2 = new THREE.Vector3(nodePositions[j * 3], nodePositions[j * 3 + 1], nodePositions[j * 3 + 2]);
                const d = p1.distanceTo(p2);
                if (d < maxDist) {
                    pos.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
                    dists.push(0, d);
                    seqs.push(Math.random(), Math.random());
                    conns++;
                }
            }
        }
        return {
            linePositions: new Float32Array(pos),
            lineDistances: new Float32Array(dists),
            lineSequences: new Float32Array(seqs)
        };
    }, [nodePositions]);

    const lineUniforms = useMemo(() => ({
        time: { value: 0 },
        color: { value: new THREE.Color("#00ffff") },
        opacity: { value: 0 },
        mode: { value: 0 }
    }), []);

    const tempVec = useMemo(() => new THREE.Vector3(), []);
    const wakeLevelRef = useRef(0);
    const nodeTexture = useMemo(() => new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAACx0lEQVRYR8VXTW7bMBCeInXhInURA6mu46KuYqA+SCD1AeoD9EUKpD5AH6BfIkDqI/RRCqQ9QB+gD1Kg9AECqYvYhYvURfS7KFKiRImSKMo6wG+G2tHszOf7I0fS4u7Yl+f58D0f8vE9H6Yh8ZpGvGa87zHeS/XkL96f8H6H9/uE5zAn8f6A96/E83f4OUn4m/f68HzE8zH+S8LPyfD8mveP8PNrPL/mvS7PJzz/hf/neL8nC37K6Zp0PUnXpGvS9SRdk64n6Zp0XZ7n6Zp0TVO6Jl2TrknXpGvS9SRdk67L8zxdk65X0TWNek0jXpOurpM8XatO8nS9Ok7ydL1I16Sre036mBfXm40W9XqvRaPaa9L7vLhebbaq680W9V6LRrXXpPd5cb3abFXXmy3qvRaNaq9J7/Piers6XpXxeunB5f6Dy/0Hl/sPLvcfXO4/uNx/cLn/4HL/weX+g8v9B5f7Dy73H1zuP7jcf3C5/+By/8Hl/oPL/QeX+w8u9x9U09L90oPL/QeX+g8u9x9U1Xl+VOf5UZ3nR3Wen9V5flTn+VGd50d1nh/VeX5U5/lRner8rM7P6vyv6vys6h7rve6x3use673usd7rHuu97rHe6x7rvXpX9+rdM+99Y977xpj3rjHvfWTMex+Z+feI+Wff++Sbe795Kte8l/Mezs9o/u9h/XfO/m/Kvl8M69fC97swfx7mX0u++CbeX0vD/H0Z5p8rw7xzhXmzG+bPzZvfNO+/6v/R8/6H9n04u+Z78F7xXvFeme91fH8Y8ZzxvsaS943xXvLeO/nF9zve0/mF3H5G837Fe99Z+fH9ivcjnh/y/Uge/SOf9498H5FH/Ujv+5G8H8vH8/f4mST8Xv7R7+Uf/f6H9yOef8PPr+XpX99/efpX8mvyfS7PN+/P5PdffL/6Bdfi5LlcM8n1kL+rff1GvT8H3B897id87p4tX6/id/4H/mH6G3H+H8V7PfwGv+Bmf58/t/+R/w8Bv8Hvc66e/J8E0P8fAn6D/+58/p3z8e8Z/An+Of475+PeM/gT/HP870p/Abm3P5p+v5/XAAAAAElFTkSuQmCC'), []);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        const amp = safeStats.amplitude;

        // Determinar nível de "Alerta" visual para transições suaves
        let targetWake = 0;
        if (isThinking) targetWake = 2.5; // Overdrive no thinking
        else if (isListening) targetWake = 1.0;

        // Transição Suave (Lerp de 2 segundos aprox)
        wakeLevelRef.current = THREE.MathUtils.lerp(wakeLevelRef.current, targetWake, isThinking ? 0.05 : 0.02);
        const wake = wakeLevelRef.current;

        if (groupRef.current) {
            // Rotação Calm vs Active
            const rotSpeed = 0.15 + wake * 0.3;
            groupRef.current.rotation.y += rotSpeed * 0.01;

            // Respiração de IDLE (6s cycle) - Sutil expansão
            const breathing = Math.sin(time * (Math.PI / 3)) * 0.025;
            const targetScale = 1.0 + breathing + (amp * 0.5) + (wake * 0.2);

            tempVec.setScalar(targetScale);
            groupRef.current.scale.lerp(tempVec, 0.1);
        }

        if (linesRef.current) {
            // Pulso via Shaders
            const speedFact = isThinking ? 2.5 : (amp > 0.1 ? 4.5 : 1.2);
            linesRef.current.material.uniforms.time.value = time * speedFact;
            linesRef.current.material.uniforms.mode.value = wake > 0.1 ? 1.0 : 0.0;

            // Opacidade: 20% base em IDLE, escala até 100% no pico
            const baseOpacity = 0.2 + (wake * 0.4) + (amp * 0.4);
            linesRef.current.material.uniforms.opacity.value = Math.min(1.0, baseOpacity);
        }

        if (nodesRef.current) {
            nodesRef.current.rotation.y -= 0.003;

            // Jitter só se estiver "Acordado"
            const jitter = amp * 0.15 * Math.min(wake, 1.0);
            nodesRef.current.position.x = Math.sin(time * 20) * jitter;
            nodesRef.current.position.y = Math.cos(time * 25) * jitter;

            // Efeito de Clusters (Cognition) no Thinking
            if (isThinking) {
                const clusterPulse = Math.sin(time * 10) * 0.5 + 0.5;
                nodesRef.current.material.opacity = 0.5 + clusterPulse * 0.5;
                nodesRef.current.material.size = 0.18 + clusterPulse * 0.06;
            } else {
                // Brilho persistente em Standby (30% conforme pedido)
                const standbyGlow = 0.3 + (wake * 0.7);
                nodesRef.current.material.opacity = Math.min(1.0, standbyGlow + amp * 0.5);
                nodesRef.current.material.size = 0.16;
            }
        }
    });

    return (
        <group ref={groupRef}>
            {/* Somente a Rede Neural - Sem fundo opaco */}

            {/* Neurônios (Pontos Redondos) */}
            <points ref={nodesRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        array={nodePositions}
                        count={nodePositions.length / 3}
                        itemSize={3}
                    />
                </bufferGeometry>
                <pointsMaterial
                    color="#00ffff"
                    size={0.16}
                    transparent
                    opacity={0.4 + awakening * 0.6}
                    sizeAttenuation
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    map={nodeTexture}
                />
            </points>

            {/* Sinapses (Linhas Finas e Pulsantes) */}
            <lineSegments ref={linesRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        array={linePositions}
                        count={linePositions.length / 3}
                        itemSize={3}
                    />
                    <bufferAttribute
                        attach="attributes-aDistance"
                        array={lineDistances}
                        count={lineDistances.length}
                        itemSize={1}
                    />
                    <bufferAttribute
                        attach="attributes-aSequence"
                        array={lineSequences}
                        count={lineSequences.length}
                        itemSize={1}
                    />
                </bufferGeometry>
                <shaderMaterial
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    uniforms={lineUniforms}
                />
            </lineSegments>
        </group>
    );
};

export default NeuralSphere;
