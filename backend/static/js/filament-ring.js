// TESSER — Three.js Filament Ring Implementation
(function () {
  function initFilamentRing() {
    const container = document.getElementById('canvas-3d');
    if (!container || !window.THREE) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 550;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const greenPointLight = new THREE.PointLight(0x00FF88, 1.8, 12);
    greenPointLight.position.set(2.5, 3.0, 2.0);
    scene.add(greenPointLight);

    const terracottaPointLight = new THREE.PointLight(0xEE5937, 1.8, 12);
    terracottaPointLight.position.set(-2.5, -3.0, -1.5);
    scene.add(terracottaPointLight);

    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    const darkMaterial = new THREE.MeshStandardMaterial({
      color: 0x1A1A1A,
      metalness: 0.92,
      roughness: 0.12,
    });

    const neonMaterial = new THREE.MeshStandardMaterial({
      color: 0x00FF88,
      metalness: 0.75,
      roughness: 0.15,
      emissive: 0x00FF88,
      emissiveIntensity: 0.85,
    });

    const terracottaMaterial = new THREE.MeshStandardMaterial({
      color: 0xEE5937,
      metalness: 0.75,
      roughness: 0.15,
      emissive: 0xEE5937,
      emissiveIntensity: 0.85,
    });

    let seed = 42891;
    function seededRandom() {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    }

    const STRAND_COUNT = 180;
    const SEGMENTS_PER_STRAND = 140;

    for (let i = 0; i < STRAND_COUNT; i++) {
      const strandIndexRatio = i / STRAND_COUNT;
      const baseRadius = 1.32 + seededRandom() * 0.16;
      const angleOffset = strandIndexRatio * Math.PI * 2;
      const zFrequency = 2 + Math.floor(seededRandom() * 4);
      const zAmplitude = 0.08 + seededRandom() * 0.14;
      const radialWobble = 0.04 + seededRandom() * 0.06;

      const controlPoints = [];
      const numPoints = 16;
      for (let p = 0; p <= numPoints; p++) {
        const theta = (p / numPoints) * Math.PI * 2 + angleOffset;
        const r = baseRadius + Math.sin(theta * 3 + i) * radialWobble;
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        const z = Math.sin(theta * zFrequency + angleOffset) * zAmplitude;
        controlPoints.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(controlPoints, true);
      const tubeGeo = new THREE.TubeGeometry(curve, SEGMENTS_PER_STRAND, 0.0038, 6, true);

      let strandMaterial = darkMaterial;
      const colorRoll = seededRandom();
      if (colorRoll < 0.16) {
        strandMaterial = neonMaterial;
      } else if (colorRoll < 0.32) {
        strandMaterial = terracottaMaterial;
      }

      const strandMesh = new THREE.Mesh(tubeGeo, strandMaterial);
      ringGroup.add(strandMesh);
    }

    let clock = new THREE.Clock();
    let isVisible = true;
    let animId;

    function animate() {
      if (!isVisible) return;
      animId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      if (!prefersReducedMotion) {
        ringGroup.rotation.y += 0.0016;
        ringGroup.rotation.z += 0.0009;
        ringGroup.rotation.x = Math.sin(elapsed * 0.4) * 0.08;

        const breathScale = 1.0 + Math.sin(elapsed * 0.8) * 0.03;
        ringGroup.scale.set(breathScale, breathScale, breathScale);
      }

      renderer.render(scene, camera);
    }

    animate();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          clock.start();
          animate();
        } else {
          cancelAnimationFrame(animId);
        }
      });
    }, { threshold: 0.05 });
    observer.observe(container);

    window.addEventListener('resize', () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (!newWidth || !newHeight) return;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFilamentRing);
  } else {
    initFilamentRing();
  }
})();
