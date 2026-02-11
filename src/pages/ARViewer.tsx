import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Camera, Box, RotateCcw, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Monument {
  id: string;
  title: string;
  description: string;
  location: string;
  era: string;
}

interface ModelConfig {
  url: string;
  scale: number;
  y: number;
  rotationY?: number;
}

// Fallback monument data
const fallbackMonuments: Record<string, { title: string; story: string }> = {
  hampi: {
    title: "Hampi Ruins",
    story: "Once a thriving capital of the Vijayanagara Empire, Hampi witnessed grand festivals and royal ceremonies.",
  },
  meenakshi: {
    title: "Meenakshi Temple",
    story: "Built to honor Goddess Meenakshi, this temple is where the divine marriage of Shiva and Parvati took place.",
  },
  golconda: {
    title: "Golconda Fort",
    story: "Famous for its acoustic system, a clap at the entrance can be heard at the top.",
  },
};

const modelConfigs: Record<string, ModelConfig> = {
  golconda: { url: '/models/create_golconda_fort.glb', scale: 0.6, y: -1.6 },
  'golconda-fort': { url: '/models/create_golconda_fort.glb', scale: 0.6, y: -1.6 },
  meenakshi: { url: '/models/meenakshi-temple.glb', scale: 1.0, y: -1.6 },
  'meenakshi-temple': { url: '/models/meenakshi-temple.glb', scale: 1.0, y: -1.6 },
  hampi: { url: '/models/hampi-ruins.glb', scale: 1.1, y: -1.6 },
  'hampi-ruins': { url: '/models/hampi-ruins.glb', scale: 1.1, y: -1.6 },
};

const ARViewer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const monumentId = searchParams.get("monument");
  const [monument, setMonument] = useState<Monument | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'3d' | 'camera'>('3d');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [modelScale, setModelScale] = useState(0.15);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number>();
  const modelScaleRef = useRef(0.15);

  useEffect(() => {
    if (monumentId) {
      fetchMonument();
    } else {
      setLoading(false);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      stopCamera();
    };
  }, [monumentId]);

  useEffect(() => {
    if (!loading && (mode === '3d' || mode === 'camera')) {
      initThreeJS(mode === 'camera');
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [loading, mode, monument]);

  useEffect(() => {
    if (mode === 'camera' && cameraStream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = cameraStream;
      video.muted = true;
      video.playsInline = true;
      video.play().catch((error) => {
        console.error('Video play error:', error);
        setCameraError('Camera started, but video could not play. Please tap the screen to start playback.');
      });
    }
  }, [mode, cameraStream]);

  useEffect(() => {
    modelScaleRef.current = modelScale;
  }, [modelScale]);

  const fetchMonument = async () => {
    try {
      // Check if it's a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (monumentId && uuidRegex.test(monumentId)) {
        const { data, error } = await supabase
          .from('monuments')
          .select('id, title, description, location, era')
          .eq('id', monumentId)
          .maybeSingle();

        if (error) throw error;
        if (data) setMonument(data);
      }
    } catch (error) {
      console.error('Error fetching monument:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentMonument = () => {
    if (monument) {
      return {
        title: monument.title,
        story: monument.description?.substring(0, 150) + "..." || "Explore this historic monument.",
      };
    }
    const key = monumentId?.toLowerCase() || 'hampi';
    return fallbackMonuments[key] || fallbackMonuments.hampi;
  };

  const normalizeKey = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const getModelConfig = () => {
    if (monument?.title) {
      const titleKey = normalizeKey(monument.title);
      if (modelConfigs[titleKey]) return modelConfigs[titleKey];
    }
    const key = monumentId?.toLowerCase() || 'hampi';
    return modelConfigs[key] || null;
  };

  const initThreeJS = async (isCameraMode: boolean) => {
    if (!canvasRef.current) return;

    const THREE = await import('three');
    
    const canvas = canvasRef.current;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = isCameraMode ? null : new THREE.Color(0x1a1a2e);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 7;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    if (isCameraMode) {
      renderer.setClearColor(0x000000, 0);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xc1502e, 1, 100);
    pointLight.position.set(-5, 3, 5);
    scene.add(pointLight);

    // Model group (realistic glTF model)
    const modelRoot = new THREE.Group();
    scene.add(modelRoot);

    let ring: InstanceType<typeof THREE.Mesh> | null = null;
    const orbs: InstanceType<typeof THREE.Mesh>[] = [];

    const createFallbackMonument = () => {
      // Base platform
      const platformGeometry = new THREE.CylinderGeometry(2, 2.2, 0.3, 32);
      const platformMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8b4513,
        metalness: 0.3,
        roughness: 0.7
      });
      const platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.y = -1.5;
      modelRoot.add(platform);

      // Main structure (temple-like)
      const baseGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
      const baseMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xc1502e,
        metalness: 0.2,
        roughness: 0.8
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = -0.8;
      modelRoot.add(base);

      // Tower
      const towerGeometry = new THREE.ConeGeometry(0.8, 2, 4);
      const towerMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffd700,
        metalness: 0.5,
        roughness: 0.3
      });
      const tower = new THREE.Mesh(towerGeometry, towerMaterial);
      tower.position.y = 0.7;
      tower.rotation.y = Math.PI / 4;
      modelRoot.add(tower);

      // Decorative ring
      const ringGeometry = new THREE.TorusGeometry(1.2, 0.08, 16, 100);
      const ringMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffd700,
        metalness: 0.8,
        roughness: 0.2
      });
      ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.y = 0;
      ring.rotation.x = Math.PI / 2;
      modelRoot.add(ring);

      // Floating orbs
      const orbGeometry = new THREE.SphereGeometry(0.15, 32, 32);
      const orbColors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3];
      
      for (let i = 0; i < 4; i++) {
        const orbMaterial = new THREE.MeshStandardMaterial({
          color: orbColors[i],
          emissive: orbColors[i],
          emissiveIntensity: 0.3
        });
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        orb.position.set(
          Math.cos(i * Math.PI / 2) * 2,
          0.5,
          Math.sin(i * Math.PI / 2) * 2
        );
        modelRoot.add(orb);
        orbs.push(orb);
      }
    };

    const modelConfig = getModelConfig();
    const baseScale = modelConfig?.scale ?? 1;

    if (modelConfig) {
      try {
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const loader = new GLTFLoader();
        loader.load(
          modelConfig.url,
          (gltf) => {
            modelRoot.clear();
            const model = gltf.scene;
            model.traverse((child: InstanceType<typeof THREE.Object3D>) => {
              const mesh = child as InstanceType<typeof THREE.Mesh>;
              if (mesh.isMesh) {
                mesh.castShadow = true;
                mesh.receiveShadow = true;
              }
            });
            model.scale.setScalar(1);
            model.position.y = modelConfig.y;
            if (modelConfig.rotationY) {
              model.rotation.y = modelConfig.rotationY;
            }
            modelRoot.add(model);
          },
          undefined,
          () => {
            createFallbackMonument();
          }
        );
      } catch (error) {
        console.error('Model load error:', error);
        createFallbackMonument();
      }
    } else {
      createFallbackMonument();
    }

    // Stars background
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 200;
    const positions = new Float32Array(starsCount * 3);
    
    for (let i = 0; i < starsCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 50;
      positions[i + 1] = (Math.random() - 0.5) * 50;
      positions[i + 2] = (Math.random() - 0.5) * 50 - 10;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Mouse interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotationY = 0;
    let rotationX = 0;

    canvas.addEventListener('mousedown', () => isDragging = true);
    canvas.addEventListener('mouseup', () => isDragging = false);
    canvas.addEventListener('mouseleave', () => isDragging = false);
    
    canvas.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        rotationY += deltaX * 0.01;
        rotationX += deltaY * 0.01;
        rotationX = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, rotationX));
      }
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
      isDragging = true;
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });
    canvas.addEventListener('touchend', () => isDragging = false);
    canvas.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;
        rotationY += deltaX * 0.01;
        rotationX += deltaY * 0.01;
        rotationX = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, rotationX));
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    });

    // Animation
    let time = 0;
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      time += 0.01;

      // Auto rotate when not dragging
      if (!isDragging) {
        rotationY += 0.003;
      }

      // Apply rotations
      modelRoot.rotation.y = rotationY;
      modelRoot.scale.setScalar(baseScale * modelScaleRef.current);
      if (ring) ring.rotation.z = time;

      // Animate orbs
      if (orbs.length) {
        orbs.forEach((orb, i) => {
          orb.position.x = Math.cos(time + i * Math.PI / 2) * 2;
          orb.position.z = Math.sin(time + i * Math.PI / 2) * 2;
          orb.position.y = 0.5 + Math.sin(time * 2 + i) * 0.3;
        });
      }

      // Camera orbit based on rotation
      camera.position.x = Math.sin(rotationY * 0.3) * 3.5;
      camera.position.y = 2.5 + rotationX * 2;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
  };

  const startCamera = async () => {
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);
      setMode('camera');
    } catch (error: any) {
      console.error('Camera error:', error);
      setCameraError(
        error.name === 'NotAllowedError' 
          ? 'Camera access denied. Please allow camera permissions in your browser settings.'
          : 'Could not access camera. Make sure no other app is using it.'
      );
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setMode('3d');
  };

  const currentMonument = getCurrentMonument();

  if (loading) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-heritage-terracotta" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-background to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-foreground hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit
            </Button>
            <Link to="/">
              <Button variant="outline" size="sm" className="text-foreground">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
          <h1 className="text-foreground text-lg font-bold">{currentMonument.title}</h1>
          <div className="w-20" />
        </div>
      </div>

      {/* 3D Canvas View / AR Overlay */}
      <canvas 
        ref={canvasRef} 
        className={`w-full h-full ${mode === 'camera' ? 'pointer-events-none absolute inset-0 z-10' : 'touch-none'}`}
      />

      {/* Camera View with AR Overlay */}
      {mode === 'camera' && (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {/* AR Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm rounded-xl p-6 max-w-sm mx-4 text-center animate-pulse">
              <h2 className="text-heritage-gold text-2xl font-bold mb-2">
                {currentMonument.title}
              </h2>
              <p className="text-white text-sm">
                {currentMonument.story}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {cameraError && (
        <div className="absolute top-20 left-4 right-4 z-50">
          <div className="bg-destructive/90 text-destructive-foreground p-4 rounded-lg text-sm">
            {cameraError}
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="absolute bottom-20 left-0 right-0 z-50 p-4">
        <div className="bg-card/95 backdrop-blur-sm text-card-foreground p-4 rounded-xl max-w-md mx-auto shadow-lg border">
          <h3 className="font-bold text-lg text-heritage-terracotta mb-2">
            {currentMonument.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {currentMonument.story}
          </p>
          <p className="text-xs text-muted-foreground">
            {mode === '3d' ? '👆 Drag to rotate the 3D view' : '📱 Point camera at any surface'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-0 right-0 z-50 flex justify-center gap-3 px-4">
        {mode === '3d' ? (
          <>
            <div className="flex items-center gap-3 bg-card/90 backdrop-blur-sm border rounded-lg px-3 py-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Model Size</span>
              <input
                type="range"
                min={0.1}
                max={1.5}
                step={0.05}
                value={modelScale}
                onChange={(e) => setModelScale(Number(e.target.value))}
                className="w-28 accent-heritage-terracotta"
              />
              <span className="text-xs text-muted-foreground w-10 text-right">
                {Math.round(modelScale * 100)}%
              </span>
            </div>
            <Button
              onClick={startCamera}
              className="bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-heritage-cream"
            >
              <Camera className="mr-2 h-4 w-4" />
              Open Camera AR
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (animationRef.current) {
                  cancelAnimationFrame(animationRef.current);
                }
                initThreeJS();
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset View
            </Button>
          </>
        ) : (
          <Button
            onClick={stopCamera}
            variant="secondary"
          >
            <Box className="mr-2 h-4 w-4" />
            Back to 3D View
          </Button>
        )}
      </div>
    </div>
  );
};

export default ARViewer;
