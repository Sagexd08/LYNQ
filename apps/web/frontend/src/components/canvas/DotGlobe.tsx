import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';



interface DotGlobeProps {
    className?: string;
}

interface GlobeDot {
    
    phi: number;
    theta: number;
    
    x: number;
    y: number;
    z: number;
    
    baseOpacity: number;
    pulsePhase: number;
    isActive: boolean;
    chain?: string; 
}

interface PulseWave {
    id: number;
    startPhi: number;
    startTheta: number;
    progress: number;
    chain: string;
    color: string;
}


const CHAIN_COLORS: Record<string, string> = {
    ETH: '#627EEA',
    POLYGON: '#8247E5',
    APTOS: '#00F0FF',
    FLOW: '#00EF8B',
    MANTLE: '#F5A623',
};

const CHAINS = Object.keys(CHAIN_COLORS);


const generateFibonacciSphere = (numPoints: number): GlobeDot[] => {
    const dots: GlobeDot[] = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleIncrement = Math.PI * 2 * goldenRatio;

    for (let i = 0; i < numPoints; i++) {
        const t = i / (numPoints - 1);
        const phi = Math.acos(1 - 2 * t); 
        const theta = angleIncrement * i; 

        
        const x = Math.sin(phi) * Math.cos(theta);
        const y = Math.sin(phi) * Math.sin(theta);
        const z = Math.cos(phi);

        
        const seed = Math.sin(i * 12.9898 + i * 78.233) * 43758.5453;
        const baseOpacity = 0.1 + (seed - Math.floor(seed)) * 0.15;
        const pulsePhase = (seed * 1000 - Math.floor(seed * 1000)) * Math.PI * 2;

        dots.push({
            phi,
            theta,
            x,
            y,
            z,
            baseOpacity,
            pulsePhase,
            isActive: false,
        });
    }

    return dots;
};

export const DotGlobe: React.FC<DotGlobeProps> = ({ className = '' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const rotationRef = useRef({ x: 0, y: 0 });
    const targetRotationRef = useRef({ x: 0, y: 0 });
    const pulseWavesRef = useRef<PulseWave[]>([]);
    const pulseIdRef = useRef(0);
    const lastPulseTimeRef = useRef(0);

    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isReducedMotion, setIsReducedMotion] = useState(false);

    const dots = useMemo(() => generateFibonacciSphere(800), []);
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setIsReducedMotion(mediaQuery.matches);

        const handleChange = (e: MediaQueryListEvent) => {
            setIsReducedMotion(e.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({ width: rect.width, height: rect.height });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        mouseRef.current = {
            x: (e.clientX - centerX) / centerX,
            y: (e.clientY - centerY) / centerY,
        };
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [handleMouseMove]);

    const spawnPulseWave = useCallback(() => {
        const chainIndex = Math.floor((Date.now() % 10000) / 2000);
        const chain = CHAINS[chainIndex % CHAINS.length] ?? 'ETH';
        const chainColor = CHAIN_COLORS[chain] ?? '#627EEA';

        pulseWavesRef.current.push({
            id: pulseIdRef.current++,
            startPhi: Math.random() * Math.PI,
            startTheta: Math.random() * Math.PI * 2,
            progress: 0,
            chain,
            color: chainColor,
        });
    }, []);

    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || dimensions.width === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = dimensions.width * dpr;
        canvas.height = dimensions.height * dpr;
        ctx.scale(dpr, dpr);

        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;
        const radius = Math.min(dimensions.width, dimensions.height) * 0.35;

        let lastTime = performance.now();

        const animate = (currentTime: number) => {
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(0, 0, dimensions.width, dimensions.height);

            
            targetRotationRef.current.x = -mouseRef.current.y * 0.15;
            targetRotationRef.current.y = mouseRef.current.x * 0.25;

            const lerpFactor = 0.03;
            rotationRef.current.x += (targetRotationRef.current.x - rotationRef.current.x) * lerpFactor;
            rotationRef.current.y += (targetRotationRef.current.y - rotationRef.current.y) * lerpFactor;

            
            const autoRotation = isReducedMotion ? 0 : currentTime * 0.00004;

            
            if (!isReducedMotion && currentTime - lastPulseTimeRef.current > 3000) {
                spawnPulseWave();
                lastPulseTimeRef.current = currentTime;
            }

            
            pulseWavesRef.current = pulseWavesRef.current.filter(wave => {
                wave.progress += deltaTime * 0.3;
                return wave.progress < 1;
            });

            
            const transformedDots = dots.map((dot, index) => {
                const rotY = autoRotation + rotationRef.current.y;
                const rotX = rotationRef.current.x;

                
                const x1 = dot.x * Math.cos(rotY) - dot.z * Math.sin(rotY);
                const z1 = dot.x * Math.sin(rotY) + dot.z * Math.cos(rotY);

                
                const y2 = dot.y * Math.cos(rotX) - z1 * Math.sin(rotX);
                const z2 = dot.y * Math.sin(rotX) + z1 * Math.cos(rotX);

                
                const scale = 1 / (1 + z2 * 0.3);
                const screenX = centerX + x1 * radius * scale;
                const screenY = centerY + y2 * radius * scale;

                
                let pulseIntensity = 0;
                let pulseColor = '';

                for (const wave of pulseWavesRef.current) {
                    const distance = Math.sqrt(
                        Math.pow(dot.phi - wave.startPhi, 2) +
                        Math.pow(dot.theta - wave.startTheta, 2)
                    );
                    const waveRadius = wave.progress * 4;
                    const waveWidth = 0.5;

                    if (Math.abs(distance - waveRadius) < waveWidth) {
                        const waveIntensity = (1 - Math.abs(distance - waveRadius) / waveWidth) * (1 - wave.progress);
                        if (waveIntensity > pulseIntensity) {
                            pulseIntensity = waveIntensity;
                            pulseColor = wave.color;
                        }
                    }
                }

                
                const ambientPulse = Math.sin(currentTime * 0.0008 + dot.pulsePhase) * 0.1 + 0.9;

                return {
                    index,
                    x: screenX,
                    y: screenY,
                    z: z2,
                    scale,
                    opacity: (dot.baseOpacity * ambientPulse + pulseIntensity * 0.6) * (z2 > -0.2 ? 1 : 0.3),
                    pulseColor,
                    pulseIntensity,
                };
            });

            
            transformedDots.sort((a, b) => a.z - b.z);

            
            transformedDots.forEach(dot => {
                if (dot.z < -0.5) return; 

                const dotRadius = 1.2 + dot.scale * 0.8;
                const opacity = Math.max(0, Math.min(1, dot.opacity)) * 0.2; 

                if (dot.pulseIntensity > 0 && dot.pulseColor) {
                    
                    const gradient = ctx.createRadialGradient(
                        dot.x, dot.y, 0,
                        dot.x, dot.y, dotRadius * 3
                    );
                    gradient.addColorStop(0, dot.pulseColor);
                    gradient.addColorStop(0.5, dot.pulseColor.replace(')', ', 0.3)').replace('rgb', 'rgba'));
                    gradient.addColorStop(1, 'transparent');

                    ctx.beginPath();
                    ctx.arc(dot.x, dot.y, dotRadius * 3, 0, Math.PI * 2);
                    ctx.fillStyle = gradient;
                    ctx.globalAlpha = dot.pulseIntensity * 0.4;
                    ctx.fill();
                }

                
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2);
                ctx.fillStyle = dot.pulseColor && dot.pulseIntensity > 0.3
                    ? dot.pulseColor
                    : '#ffffff';
                ctx.globalAlpha = opacity;
                ctx.fill();
            });

            ctx.globalAlpha = 1;

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [dimensions, dots, isReducedMotion, spawnPulseWave]);

    return (
        <div
            ref={containerRef}
            className={`absolute inset-0 overflow-hidden ${className}`}
            style={{ background: 'radial-gradient(ellipse at center, #0a0a12 0%, #000000 100%)' }}
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{
                    width: dimensions.width || '100%',
                    height: dimensions.height || '100%',
                }}
            />

            {}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 0%, transparent 30%, rgba(0,0,0,0.6) 100%)',
                }}
            />

            {}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.02]"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
                    backgroundSize: '50px 50px',
                }}
            />
        </div>
    );
};

export default DotGlobe;
