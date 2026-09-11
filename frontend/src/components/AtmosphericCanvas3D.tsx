import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useWeather } from '../context/WeatherContext';
import { AtmosphericViewState } from '../types';

interface AtmosphericCanvas3DProps {
  className?: string;
}

export const AtmosphericCanvas3D: React.FC<AtmosphericCanvas3DProps> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { weather, viewState, timeRailStep } = useWeather();

  const weatherRef = useRef(weather);
  const viewStateRef = useRef(viewState);
  const timeRailRef = useRef(timeRailStep);

  useEffect(() => {
    weatherRef.current = weather;
  }, [weather]);

  useEffect(() => {
    viewStateRef.current = viewState;
  }, [viewState]);

  useEffect(() => {
    timeRailRef.current = timeRailStep;
  }, [timeRailStep]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.008);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1500);
    camera.position.set(0, 15, 45);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 3. Lighting & Celestial Environment
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.2);
    sunLight.position.set(50, 80, 40);
    scene.add(sunLight);

    const atmosphereGlowLight = new THREE.PointLight(0x06b6d4, 1.5, 300);
    atmosphereGlowLight.position.set(0, 0, 0);
    scene.add(atmosphereGlowLight);

    // 4. Starfield & Cosmic Background
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1800;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 800;
      starPositions[i + 1] = Math.random() * 500 + 20;
      starPositions[i + 2] = (Math.random() - 0.5) * 800;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 1.2,
      transparent: true,
      opacity: 0.75,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // 5. 3D Earth Globe (ORBIT View)
    const earthGroup = new THREE.Group();
    earthGroup.position.set(0, 0, 0);

    const earthGeom = new THREE.SphereGeometry(18, 48, 48);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x0f3b5c,
      roughness: 0.7,
      metalness: 0.1,
      wireframe: false,
    });
    const earthMesh = new THREE.Mesh(earthGeom, earthMat);
    earthGroup.add(earthMesh);

    // Earth Atmosphere Halo Glow
    const haloGeom = new THREE.SphereGeometry(19.2, 48, 48);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const haloMesh = new THREE.Mesh(haloGeom, haloMat);
    earthGroup.add(haloMesh);

    // Grid wireframe continents locator
    const gridWireGeom = new THREE.WireframeGeometry(new THREE.SphereGeometry(18.05, 24, 24));
    const gridWireMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.12 });
    const gridWire = new THREE.LineSegments(gridWireGeom, gridWireMat);
    earthGroup.add(gridWire);

    // India Pin Marker on Earth
    const pinGeom = new THREE.SphereGeometry(0.5, 16, 16);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const pinMesh = new THREE.Mesh(pinGeom, pinMat);
    pinMesh.position.set(8.5, 9.2, 12.8);
    earthGroup.add(pinMesh);

    scene.add(earthGroup);

    // 6. City Ground Horizon Grid (CITY / REGION View)
    const cityGroup = new THREE.Group();
    cityGroup.position.set(0, -10, 0);

    const groundGrid = new THREE.GridHelper(160, 40, 0x06b6d4, 0x1e293b);
    (groundGrid.material as THREE.Material).transparent = true;
    (groundGrid.material as THREE.Material).opacity = 0.45;
    cityGroup.add(groundGrid);

    // Minimalistic geometric city buildings
    const buildingGeom = new THREE.BoxGeometry(2, 6, 2);
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.8,
    });
    const buildingCount = 60;
    const instancedBuildings = new THREE.InstancedMesh(buildingGeom, buildingMat, buildingCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < buildingCount; i++) {
      const bx = (Math.random() - 0.5) * 120;
      const bz = (Math.random() - 0.5) * 120;
      const bh = Math.random() * 4 + 1;
      dummy.position.set(bx, bh * 3, bz);
      dummy.scale.set(1 + Math.random() * 1.5, bh, 1 + Math.random() * 1.5);
      dummy.updateMatrix();
      instancedBuildings.setMatrixAt(i, dummy.matrix);
    }
    cityGroup.add(instancedBuildings);
    scene.add(cityGroup);

    // 7. Dynamic Cloud Strata Field
    const cloudCount = 70;
    const cloudGroup = new THREE.Group();
    const cloudGeom = new THREE.DodecahedronGeometry(4, 1);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.35,
      roughness: 0.9,
      flatShading: true,
    });

    const clouds: THREE.Mesh[] = [];
    for (let i = 0; i < cloudCount; i++) {
      const c = new THREE.Mesh(cloudGeom, cloudMat.clone());
      c.position.set(
        (Math.random() - 0.5) * 140,
        15 + Math.random() * 12,
        (Math.random() - 0.5) * 140
      );
      const s = 1 + Math.random() * 2;
      c.scale.set(s * 1.8, s * 0.7, s * 1.4);
      cloudGroup.add(c);
      clouds.push(c);
    }
    scene.add(cloudGroup);

    // 8. Wind Particle Field
    const windCount = 800;
    const windGeom = new THREE.BufferGeometry();
    const windPositions = new Float32Array(windCount * 3);
    const windVelocities: { x: number; y: number; z: number }[] = [];

    for (let i = 0; i < windCount; i++) {
      windPositions[i * 3] = (Math.random() - 0.5) * 120;
      windPositions[i * 3 + 1] = 2 + Math.random() * 25;
      windPositions[i * 3 + 2] = (Math.random() - 0.5) * 120;
      windVelocities.push({
        x: (Math.random() * 0.4 + 0.3),
        y: (Math.random() - 0.5) * 0.05,
        z: (Math.random() * 0.4 + 0.2),
      });
    }
    windGeom.setAttribute('position', new THREE.BufferAttribute(windPositions, 3));
    const windMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.8,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const windParticles = new THREE.Points(windGeom, windMat);
    scene.add(windParticles);

    // 9. Rain Particle Field
    const rainCount = 1200;
    const rainGeom = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 100;
      rainPositions[i * 3 + 1] = Math.random() * 50;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    rainGeom.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.9,
      transparent: true,
      opacity: 0.8,
    });
    const rainParticles = new THREE.Points(rainGeom, rainMat);
    scene.add(rainParticles);

    // 10. Thermal / Pressure Isobaric Rings (THERMAL & PRESSURE View)
    const isobarGroup = new THREE.Group();
    for (let r = 10; r <= 50; r += 10) {
      const ringGeom = new THREE.RingGeometry(r, r + 0.4, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: r > 30 ? 0xf97316 : 0x06b6d4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3,
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = (r / 50) * 10;
      isobarGroup.add(ring);
    }
    scene.add(isobarGroup);

    // Camera target positions for different view states
    const cameraTargets: Record<AtmosphericViewState, { x: number; y: number; z: number; targetY: number }> = {
      ORBIT: { x: 0, y: 12, z: 52, targetY: 0 },
      REGION: { x: 0, y: 28, z: 42, targetY: 5 },
      CITY: { x: 0, y: 10, z: 32, targetY: 3 },
      DISTRICT: { x: 8, y: 8, z: 24, targetY: 2 },
      STREET: { x: 0, y: 3, z: 16, targetY: 2 },
      WIND: { x: 12, y: 16, z: 30, targetY: 10 },
      RAIN: { x: 0, y: 14, z: 28, targetY: 6 },
      THERMAL: { x: 0, y: 36, z: 36, targetY: 0 },
      PRESSURE: { x: 0, y: 32, z: 40, targetY: 0 },
      ATMOSPHERE: { x: 0, y: 16, z: 40, targetY: 6 },
      RISK: { x: 5, y: 18, z: 38, targetY: 5 },
      NWP: { x: 0, y: 25, z: 45, targetY: 4 },
      CLIMATE: { x: -8, y: 22, z: 48, targetY: 2 },
    };

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let orbitAngleX = 0;
    let orbitAngleY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        orbitAngleX += deltaX * 0.005;
        orbitAngleY = Math.max(-0.6, Math.min(0.6, orbitAngleY + deltaY * 0.005));
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop & Dynamic Weather Environment State
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let lightningCountdown = 4.0;
    let isFlashing = false;
    let flashTimer = 0;

    const TIME_STEP_HOURS: Record<string, number> = {
      'PAST': -1,
      'NOW': 0,
      '+15m': 0.25,
      '+30m': 0.5,
      '+45m': 0.75,
      '+1h': 1,
      '+3h': 3,
      '+6h': 6,
      '+12h': 12,
      '+24h': 24,
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      const currentWeatherData = weatherRef.current;
      const currentViewState = viewStateRef.current;
      const currentTimeRail = timeRailRef.current;

      // 1. Resolve Weather & Forecast Telemetry (accounts for Time Rail scrubber)
      const hourOffset = TIME_STEP_HOURS[currentTimeRail] || 0;
      const hourlyList = currentWeatherData?.hourly || [];
      const forecastItem = hourOffset > 0 && hourlyList.length > 0
        ? hourlyList[Math.min(hourlyList.length - 1, Math.max(0, Math.round(hourOffset)))]
        : null;

      const rawCondition = (forecastItem?.condition?.main || currentWeatherData?.current?.condition?.main || 'Clear').toLowerCase();
      const rawClouds = forecastItem?.clouds ?? currentWeatherData?.current?.clouds ?? 35;
      const windSpeed = forecastItem?.wind_speed ?? currentWeatherData?.current?.wind_speed ?? 12;
      const windDeg = forecastItem?.wind_deg ?? currentWeatherData?.current?.wind_deg ?? 80;
      const rad = (windDeg * Math.PI) / 180;
      const windDirX = Math.sin(rad);
      const windDirZ = Math.cos(rad);

      // Simulated local hour calculation for day/night/golden hour cycle
      const baseDt = currentWeatherData?.current?.dt ? currentWeatherData.current.dt * 1000 : Date.now();
      const simDate = new Date(baseDt + hourOffset * 3600 * 1000);
      const simHour = simDate.getHours() + simDate.getMinutes() / 60;

      // Celestial phase
      const isDawn = (simHour >= 5.2 && simHour < 6.8);
      const isDusk = (simHour >= 17.5 && simHour < 19.2);
      const isDay = (simHour >= 6.0 && simHour < 18.5);

      // Weather condition categories
      const isThunder = rawCondition.includes('thunder');
      const isRain = rawCondition.includes('rain') || rawCondition.includes('drizzle') || (forecastItem ? forecastItem.pop > 0.4 : (currentWeatherData?.rain_intelligence?.max_pop_pct || 0) > 35) || currentViewState === 'RAIN';
      const isSnow = rawCondition.includes('snow') || rawCondition.includes('flurry');
      const isFog = rawCondition.includes('fog') || rawCondition.includes('mist') || rawCondition.includes('haze');
      const isOvercast = rawClouds > 65 && !isRain && !isThunder;

      // Dynamic 3D Environmental Target Parameters
      const targetSky = new THREE.Color(0x0a1628);
      const targetAmbient = new THREE.Color(0x1e293b);
      let targetAmbientIntensity = 0.3;
      const targetSun = new THREE.Color(0xfff7ed);
      let targetSunIntensity = 0.8;
      const targetSunPos = new THREE.Vector3(40, 70, 30);
      const targetCloudColor = new THREE.Color(0xe2e8f0);
      let targetStarOpacity = 0.0;
      let targetFogDensity = 0.007;

      if (isThunder) {
        // Severe Tempest / Thunderstorm
        targetSky.setHex(0x050711);
        targetAmbient.setHex(0x1e1b4b);
        targetAmbientIntensity = 0.22;
        targetSun.setHex(0x475569);
        targetSunIntensity = 0.3;
        targetCloudColor.setHex(0x1e293b);
        targetStarOpacity = 0.0;
        targetFogDensity = 0.016;
      } else if (isRain) {
        // Rain / Showers / Monsoon
        targetSky.setHex(0x091422);
        targetAmbient.setHex(0x1e3a5f);
        targetAmbientIntensity = 0.38;
        targetSun.setHex(0x60a5fa);
        targetSunIntensity = 0.52;
        targetCloudColor.setHex(0x334155);
        targetStarOpacity = 0.0;
        targetFogDensity = 0.013;
      } else if (isFog) {
        // Fog / Mist / Haze
        targetSky.setHex(0x1e293b);
        targetAmbient.setHex(0x64748b);
        targetAmbientIntensity = 0.52;
        targetSun.setHex(0xfde047);
        targetSunIntensity = 0.45;
        targetCloudColor.setHex(0x94a3b8);
        targetStarOpacity = 0.0;
        targetFogDensity = 0.024;
      } else if (isSnow) {
        // Snow / Arctic flurries
        targetSky.setHex(0x0f2238);
        targetAmbient.setHex(0x38bdf8);
        targetAmbientIntensity = 0.46;
        targetSun.setHex(0xe0f2fe);
        targetSunIntensity = 0.95;
        targetCloudColor.setHex(0xf1f5f9);
        targetStarOpacity = 0.08;
        targetFogDensity = 0.011;
      } else if (isDawn || isDusk) {
        // Sunrise / Sunset Golden Hour
        targetSky.setHex(0x1e1028);
        targetAmbient.setHex(0xf97316);
        targetAmbientIntensity = 0.5;
        targetSun.setHex(0xfb923c);
        targetSunIntensity = 1.3;
        targetSunPos.set(70, 15, 25);
        targetCloudColor.setHex(0xfdba74);
        targetStarOpacity = 0.25;
        targetFogDensity = 0.008;
      } else if (isDay) {
        // Daytime (Clear vs Overcast)
        if (isOvercast) {
          targetSky.setHex(0x17253a);
          targetAmbient.setHex(0x334155);
          targetAmbientIntensity = 0.45;
          targetSun.setHex(0x94a3b8);
          targetSunIntensity = 0.72;
          targetCloudColor.setHex(0x64748b);
          targetStarOpacity = 0.0;
          targetFogDensity = 0.010;
        } else {
          targetSky.setHex(0x0c2540);
          targetAmbient.setHex(0x38bdf8);
          targetAmbientIntensity = 0.58;
          targetSun.setHex(0xfffbeb);
          targetSunIntensity = 1.4;
          targetSunPos.set(40, 80, 35);
          targetCloudColor.setHex(0xf8fafc);
          targetStarOpacity = 0.0;
          targetFogDensity = 0.006;
        }
      } else {
        // Clear Starry Night
        targetSky.setHex(0x030712);
        targetAmbient.setHex(0x0f172a);
        targetAmbientIntensity = 0.24;
        targetSun.setHex(0x93c5fd); // Moon glow
        targetSunIntensity = 0.46;
        targetSunPos.set(-35, 60, -30);
        targetCloudColor.setHex(0x1e293b);
        targetStarOpacity = 0.85;
        targetFogDensity = 0.007;
      }

      // Smoothly interpolate scene background and fog color
      if (scene.background) {
        (scene.background as THREE.Color).lerp(targetSky, 0.04);
      }
      (scene.fog as THREE.FogExp2).color.lerp(targetSky, 0.04);
      (scene.fog as THREE.FogExp2).density = THREE.MathUtils.lerp(
        (scene.fog as THREE.FogExp2).density,
        targetFogDensity,
        0.04
      );

      // Smoothly interpolate ambient & celestial directional lighting
      ambientLight.color.lerp(targetAmbient, 0.04);
      ambientLight.intensity = THREE.MathUtils.lerp(ambientLight.intensity, targetAmbientIntensity, 0.04);

      sunLight.color.lerp(targetSun, 0.04);
      sunLight.intensity = THREE.MathUtils.lerp(sunLight.intensity, targetSunIntensity, 0.04);
      sunLight.position.lerp(targetSunPos, 0.04);

      // Starfield visibility
      starMaterial.opacity = THREE.MathUtils.lerp(starMaterial.opacity, targetStarOpacity, 0.04);

      // Procedural Lightning Simulation for Thunderstorms
      if (isThunder) {
        lightningCountdown -= delta;
        if (lightningCountdown <= 0) {
          isFlashing = true;
          flashTimer = 0.12 + Math.random() * 0.12;
          lightningCountdown = 3.5 + Math.random() * 5.0; // next flash in 3.5 to 8.5 seconds
        }
      } else {
        isFlashing = false;
      }

      if (isFlashing) {
        flashTimer -= delta;
        if (flashTimer > 0) {
          sunLight.intensity = 3.8;
          sunLight.color.setHex(0xede9fe); // flash electric violet-white
          (scene.fog as THREE.FogExp2).color.setHex(0x2e1065);
        } else {
          isFlashing = false;
        }
      }

      const cloudCoverage = rawClouds / 100;
      const hasRain = isRain || isThunder;

      // 1. Smooth Camera Transition towards target
      const targetState = cameraTargets[currentViewState] || cameraTargets.ATMOSPHERE;
      const desiredCamX = targetState.x + Math.sin(orbitAngleX) * 15;
      const desiredCamY = targetState.y + orbitAngleY * 15;
      const desiredCamZ = targetState.z + Math.cos(orbitAngleX) * 10;

      camera.position.x += (desiredCamX - camera.position.x) * 0.04;
      camera.position.y += (desiredCamY - camera.position.y) * 0.04;
      camera.position.z += (desiredCamZ - camera.position.z) * 0.04;
      camera.lookAt(0, targetState.targetY, 0);

      // 2. Animate Earth Rotation (ORBIT View visibility)
      if (currentViewState === 'ORBIT') {
        earthGroup.visible = true;
        earthGroup.rotation.y += 0.003;
        cityGroup.visible = false;
      } else {
        earthGroup.visible = false;
        cityGroup.visible = true;
      }

      // 3. Animate Clouds
      const cloudSpeed = (windSpeed / 50) * 0.08;
      clouds.forEach((cloud, idx) => {
        cloud.position.x += windDirX * cloudSpeed * 1.5;
        cloud.position.z += windDirZ * cloudSpeed * 1.5;
        cloud.rotation.y += 0.001 * (idx % 2 === 0 ? 1 : -1);

        if (cloud.position.x > 80) cloud.position.x = -80;
        if (cloud.position.x < -80) cloud.position.x = 80;
        if (cloud.position.z > 80) cloud.position.z = -80;
        if (cloud.position.z < -80) cloud.position.z = 80;

        // Modulate cloud color & opacity based on weather
        const mat = cloud.material as THREE.MeshStandardMaterial;
        mat.color.lerp(targetCloudColor, 0.04);
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, Math.min(0.88, 0.2 + cloudCoverage * 0.65), 0.05);
      });

      // 4. Animate Wind Particles
      const posAttr = windGeom.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;
      const windSpeedMult = Math.max(0.4, (windSpeed / 20) * 1.2);

      for (let i = 0; i < windCount; i++) {
        posArray[i * 3] += windDirX * windSpeedMult;
        posArray[i * 3 + 2] += windDirZ * windSpeedMult;
        posArray[i * 3 + 1] += Math.sin(elapsedTime * 2 + i) * 0.02;

        if (Math.abs(posArray[i * 3]) > 70) posArray[i * 3] = -posArray[i * 3] * 0.9;
        if (Math.abs(posArray[i * 3 + 2]) > 70) posArray[i * 3 + 2] = -posArray[i * 3 + 2] * 0.9;
      }
      posAttr.needsUpdate = true;
      windParticles.visible = currentViewState !== 'ORBIT';

      // 5. Animate Rain & Snow Particles
      const activePrecipitation = (hasRain || isSnow) && currentViewState !== 'ORBIT';
      if (activePrecipitation) {
        rainParticles.visible = true;
        const rainAttr = rainGeom.attributes.position as THREE.BufferAttribute;
        const rainArray = rainAttr.array as Float32Array;
        const fallSpeed = isSnow ? 0.45 : (1.4 + (windSpeed / 35));
        const lateralWind = isSnow ? windDirX * 0.35 : windDirX * 0.15;

        for (let i = 0; i < rainCount; i++) {
          rainArray[i * 3 + 1] -= fallSpeed;
          rainArray[i * 3] += lateralWind;
          rainArray[i * 3 + 2] += lateralWind;

          if (rainArray[i * 3 + 1] < -8) {
            rainArray[i * 3 + 1] = 45 + Math.random() * 5;
            rainArray[i * 3] = (Math.random() - 0.5) * 100;
            rainArray[i * 3 + 2] = (Math.random() - 0.5) * 100;
          }
        }
        rainAttr.needsUpdate = true;
        rainMat.color.setHex(isSnow ? 0xffffff : 0x93c5fd);
        rainMat.size = isSnow ? 1.5 : 0.9;
      } else {
        rainParticles.visible = false;
      }

      // 6. Isobaric Rings visibility (THERMAL & PRESSURE)
      isobarGroup.visible = currentViewState === 'THERMAL' || currentViewState === 'PRESSURE';
      if (isobarGroup.visible) {
        isobarGroup.rotation.y += 0.002;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      if (container && domElement.parentNode === container) {
        container.removeChild(domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`fixed inset-0 pointer-events-auto z-0 overflow-hidden ${className}`}
      style={{ touchAction: 'none' }}
    />
  );
};
