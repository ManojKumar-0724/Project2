import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import "aframe";
import "ar.js";

const ARViewer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const monumentId = searchParams.get("monument");
  const sceneRef = useRef<HTMLDivElement>(null);

  const monuments = {
    hampi: {
      title: "Hampi Ruins",
      story: "Once a thriving capital of the Vijayanagara Empire, Hampi witnessed grand festivals and royal ceremonies. Legend says the boulders were weapons thrown by monkey warriors in the Ramayana.",
    },
    meenakshi: {
      title: "Meenakshi Temple",
      story: "Built to honor Goddess Meenakshi, this temple is where the divine marriage of Shiva and Parvati took place. The towering gopurams are adorned with thousands of colorful deities.",
    },
    golconda: {
      title: "Golconda Fort",
      story: "Famous for its acoustic system, a clap at the entrance can be heard at the top. This fort was home to the legendary Koh-i-Noor diamond and withstood many sieges.",
    },
  };

  const currentMonument = monuments[monumentId as keyof typeof monuments] || monuments.hampi;

  useEffect(() => {
    // Ensure A-Frame is fully loaded
    const checkAFrame = setInterval(() => {
      if ((window as any).AFRAME) {
        clearInterval(checkAFrame);
      }
    }, 100);
    
    return () => clearInterval(checkAFrame);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit AR
          </Button>
          <h1 className="text-white text-lg font-bold">{currentMonument.title}</h1>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-20 left-0 right-0 z-50 p-4">
        <div className="bg-black/80 text-white p-4 rounded-lg backdrop-blur-sm max-w-md mx-auto">
          <p className="text-sm text-center">
            Point your camera at the marker to reveal the story
          </p>
        </div>
      </div>

      {/* A-Frame AR Scene */}
      <div ref={sceneRef}>
        <a-scene
          embedded
          arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
          vr-mode-ui="enabled: false"
          renderer="logarithmicDepthBuffer: true; precision: medium;"
        >
          {/* Camera */}
          <a-camera gps-camera rotation-reader></a-camera>

          {/* Marker-based AR */}
          <a-marker preset="hiro" raycaster="objects: .clickable" emitevents="true" cursor="fuse: false; rayOrigin: mouse;">
            {/* 3D Text Story */}
            <a-text
              value={currentMonument.story}
              color="#FFD700"
              align="center"
              width="4"
              position="0 1 0"
              wrap-count="30"
              animation="property: rotation; to: 0 360 0; loop: true; dur: 10000"
            ></a-text>

            {/* Decorative Elements */}
            <a-box
              position="0 0.5 0"
              rotation="0 45 0"
              color="#C1502E"
              opacity="0.8"
              animation="property: position; to: 0 0.8 0; dir: alternate; dur: 2000; loop: true"
            ></a-box>

            <a-torus
              position="0 1.5 0"
              color="#FFD700"
              radius="0.3"
              radius-tubular="0.05"
              animation="property: rotation; to: 360 0 360; loop: true; dur: 5000"
            ></a-torus>

            {/* Ambient particles */}
            <a-sphere
              position="1 1 0"
              radius="0.1"
              color="#4F7CAC"
              opacity="0.6"
              animation="property: position; to: -1 1 0; dir: alternate; dur: 3000; loop: true"
            ></a-sphere>
            <a-sphere
              position="-1 1 0"
              radius="0.1"
              color="#4F7CAC"
              opacity="0.6"
              animation="property: position; to: 1 1 0; dir: alternate; dur: 3000; loop: true"
            ></a-sphere>
          </a-marker>

          {/* Entity for device orientation */}
          <a-entity camera></a-entity>
        </a-scene>
      </div>

      {/* Marker Download */}
      <div className="absolute bottom-4 left-0 right-0 z-50 flex justify-center">
        <Button
          onClick={() => window.open("https://github.com/AR-js-org/AR.js/blob/master/data/images/hiro.png", "_blank")}
          className="bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-heritage-cream"
        >
          Download AR Marker
        </Button>
      </div>
    </div>
  );
};

export default ARViewer;
