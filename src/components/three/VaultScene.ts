import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const isSoftwareGl = (() => {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
})();

export type VaultTheme = 'indigo' | 'emerald' | 'cyber' | 'gold';

// Pre-allocated scratch helpers at module scope (Zero GC in loop)
const _vec3 = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _curLookAt = new THREE.Vector3(0, 1.2, 0);
const _dummy = new THREE.Object3D();

export class VaultScene {
  private container: HTMLElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private frameId: number = 0;
  private startTime: number = performance.now();
  private lastFrameTime: number = performance.now();
  private webglAvailable: boolean = false;

  // 3D Subject Groups
  private mainGroup!: THREE.Group;
  private vaultGroup!: THREE.Group;
  private dialGroup!: THREE.Group;
  private crystalMesh!: THREE.Mesh;
  private ringMesh!: THREE.Mesh;
  private particlesMesh!: THREE.InstancedMesh;
  private pylonGroup!: THREE.Group;

  // Material references for real-time theme swapping
  private crystalMaterial!: THREE.MeshPhysicalMaterial;
  private glowRingMaterial!: THREE.MeshStandardMaterial;
  private goldAccentMaterial!: THREE.MeshStandardMaterial;
  private keyLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;

  // Interactive animation states
  private targetDialAngle: number = 0;
  private currentDialAngle: number = 0;
  private pointerNorm: { x: number; y: number } = { x: 0, y: 0 };
  private isUnlocked: boolean = false;
  private unlockProgress: number = 0;
  private cameraPreset: 'front' | 'angle' | 'top' = 'angle';

  constructor(container: HTMLElement) {
    this.container = container;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;

    try {
      // 1. Scene & Atmosphere
      this.scene = new THREE.Scene();
      const bgColor = new THREE.Color(0x060f14);
      this.scene.background = bgColor;
      this.scene.fog = new THREE.FogExp2(0x060f14, 0.05);

      // 2. Camera Setup
      const initW = container.clientWidth || window.innerWidth || 1280;
      const initH = container.clientHeight || window.innerHeight || 800;
      const aspect = initW / Math.max(initH, 1);
      this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
      this.camera.position.set(1.2, 2.4, 5.2);
      this.camera.lookAt(0.35, 1.15, 0);

      // 3. Renderer Setup with automatic fallback if high-performance WebGL context fails
      try {
        this.renderer = new THREE.WebGLRenderer({
          antialias: !isSoftwareGl,
          powerPreference: 'default',
          alpha: false,
          preserveDrawingBuffer: true,
        });
      } catch {
        this.renderer = new THREE.WebGLRenderer({ alpha: false });
      }

      this.renderer.setSize(initW, initH);
      this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.4;
      this.renderer.shadowMap.enabled = !isSoftwareGl;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      container.appendChild(this.renderer.domElement);

      // 4. Studio Environment Reflection (RoomEnvironment on GPU; fast multi-light rig on software GL)
      if (!isSoftwareGl) {
        try {
          const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
          this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
          pmremGenerator.dispose();
        } catch {
          // Ignore PMREM generation failure on restricted GPUs
        }
      }

      // 5. Studio Lighting Rig (Warm Key + Cool Fill + Edge Rims + Core Point Light)
      this.hemiLight = new THREE.HemisphereLight(0x34d399, 0x0f172a, 1.4);
      this.scene.add(this.hemiLight);

      this.keyLight = new THREE.DirectionalLight(0xfff7ed, 3.2);
      this.keyLight.position.set(4, 6.5, 4.5);
      if (!isSoftwareGl) {
        this.keyLight.castShadow = true;
        this.keyLight.shadow.mapSize.width = 1024;
        this.keyLight.shadow.mapSize.height = 1024;
        this.keyLight.shadow.camera.near = 0.5;
        this.keyLight.shadow.camera.far = 15;
        this.keyLight.shadow.camera.left = -3;
        this.keyLight.shadow.camera.right = 3;
        this.keyLight.shadow.camera.top = 3;
        this.keyLight.shadow.camera.bottom = -3;
        this.keyLight.shadow.bias = -0.0005;
        this.keyLight.shadow.normalBias = 0.02;
      }
      this.scene.add(this.keyLight);

      const rimLight = new THREE.DirectionalLight(0x10b981, 2.8);
      rimLight.position.set(-4.5, 3.5, -2.5);
      this.scene.add(rimLight);

      const coreLight = new THREE.PointLight(0x10b981, 3.5, 8);
      coreLight.position.set(-1.0, 2.2, 1.2);
      this.scene.add(coreLight);

      // 6. Build Composite 3-12 Part Procedural 3D Subject
      this.mainGroup = new THREE.Group();
      this.mainGroup.position.set(-1.05, -0.1, 0);
      this.scene.add(this.mainGroup);

      const {
        vaultGroup,
        dialGroup,
        crystalMesh,
        ringMesh,
        particlesMesh,
        pylonGroup,
        crystalMat,
        glowRingMat,
        goldMat,
      } = this.buildVaultModel();

      this.vaultGroup = vaultGroup;
      this.dialGroup = dialGroup;
      this.crystalMesh = crystalMesh;
      this.ringMesh = ringMesh;
      this.particlesMesh = particlesMesh;
      this.pylonGroup = pylonGroup;
      this.crystalMaterial = crystalMat;
      this.glowRingMaterial = glowRingMat;
      this.goldAccentMaterial = goldMat;

      this.webglAvailable = true;

      // Attach listeners
      this.handleResize = this.handleResize.bind(this);
      this.handlePointerMove = this.handlePointerMove.bind(this);
      window.addEventListener('resize', this.handleResize);
      window.addEventListener('pointermove', this.handlePointerMove);

      // Start render loop
      this.animate = this.animate.bind(this);
      this.animate();
    } catch (err) {
      console.warn('WebGL VaultScene fallback activated:', err);
      this.webglAvailable = false;
    }
  }

  /**
   * Generates a high-resolution dial face with ticks and typography
   */
  private createDialTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Background circular dial metal tone
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 512);

    ctx.save();
    ctx.translate(256, 256);

    // Concentric ring grooves
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 230, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 210, 0, Math.PI * 2);
    ctx.stroke();

    // 60 tick marks around the perimeter
    for (let i = 0; i < 60; i++) {
      const angle = (i * Math.PI * 2) / 60;
      const isMajor = i % 5 === 0;
      const rInner = isMajor ? 175 : 190;
      const rOuter = 205;

      ctx.strokeStyle = isMajor ? '#10b981' : '#64748b';
      ctx.lineWidth = isMajor ? 4 : 2;

      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * rInner, Math.sin(angle) * rInner);
      ctx.lineTo(Math.cos(angle) * rOuter, Math.sin(angle) * rOuter);
      ctx.stroke();

      // Numerals at major ticks
      if (isMajor) {
        ctx.save();
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(i), 0, -145);
        ctx.restore();
      }
    }

    // Center branding
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPLITMATE', 0, -40);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText('SECURE LEDGER', 0, -20);

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    if (this.renderer) {
      texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    }
    return texture;
  }

  /**
   * Procedural contact shadow disc
   */
  private createContactShadowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Assembles a 3-12 part procedural model of the SplitMate Security Vault & Floating Ledger
   */
  private buildVaultModel() {
    // 1. Pedestal Base (Primary Silhouette Scale 1)
    const baseGeo = new THREE.CylinderGeometry(2.3, 2.5, 0.35, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: isSoftwareGl ? 0.35 : 0.78,
      roughness: 0.3,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.175;
    baseMesh.receiveShadow = !isSoftwareGl;
    this.mainGroup.add(baseMesh);

    // 2. Beveled Metallic Stepping Ring
    const stepGeo = new THREE.CylinderGeometry(2.0, 2.2, 0.2, 48);
    const stepMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: isSoftwareGl ? 0.4 : 0.82,
      roughness: 0.25,
    });
    const stepMesh = new THREE.Mesh(stepGeo, stepMat);
    stepMesh.position.y = 0.45;
    stepMesh.receiveShadow = !isSoftwareGl;
    this.mainGroup.add(stepMesh);

    // 3. Vault Assembly Group
    const vaultGroup = new THREE.Group();
    vaultGroup.position.y = 0.55;
    this.mainGroup.add(vaultGroup);

    // 4. Outer Reinforced Steel Drum
    const drumGeo = new THREE.CylinderGeometry(1.6, 1.7, 1.25, 48);
    const drumMat = new THREE.MeshStandardMaterial({
      color: 0x263548,
      metalness: isSoftwareGl ? 0.45 : 0.85,
      roughness: 0.22,
    });
    const drumMesh = new THREE.Mesh(drumGeo, drumMat);
    drumMesh.position.y = 0.625;
    drumMesh.castShadow = !isSoftwareGl;
    drumMesh.receiveShadow = !isSoftwareGl;
    vaultGroup.add(drumMesh);

    // 5. Heavy Circular Door Frame
    const doorFrameGeo = new THREE.TorusGeometry(1.4, 0.16, 24, 48);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0x78350f,
      emissiveIntensity: 0.35,
      metalness: isSoftwareGl ? 0.45 : 0.92,
      roughness: 0.2,
    });
    const doorFrameMesh = new THREE.Mesh(doorFrameGeo, goldMat);
    doorFrameMesh.rotation.x = Math.PI / 2;
    doorFrameMesh.position.y = 1.25;
    vaultGroup.add(doorFrameMesh);

    // 6. Interactive Rotating Dial Mechanism (Secondary Read Scale 2)
    const dialGroup = new THREE.Group();
    dialGroup.position.y = 1.26;
    vaultGroup.add(dialGroup);

    // Dial face disc with high-res CanvasTexture
    const dialTex = this.createDialTexture();
    const dialGeo = new THREE.CylinderGeometry(1.25, 1.25, 0.12, 48);
    const dialMat = new THREE.MeshStandardMaterial({
      map: dialTex,
      metalness: 0.75,
      roughness: 0.25,
    });
    const dialMesh = new THREE.Mesh(dialGeo, dialMat);
    dialMesh.castShadow = !isSoftwareGl;
    dialGroup.add(dialMesh);

    // 7. Four Radial Locking Spoke Handles with Gold Grips
    const spokeGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 16);
    const spoke1 = new THREE.Mesh(spokeGeo, goldMat);
    spoke1.rotation.z = Math.PI / 2;
    spoke1.position.y = 0.12;
    dialGroup.add(spoke1);

    const spoke2 = new THREE.Mesh(spokeGeo, goldMat);
    spoke2.rotation.x = Math.PI / 2;
    spoke2.position.y = 0.12;
    dialGroup.add(spoke2);

    // 4 Spherical Finial Grips on spoke tips
    const sphereGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const tipPositions = [
      [0.9, 0.12, 0],
      [-0.9, 0.12, 0],
      [0, 0.12, 0.9],
      [0, 0.12, -0.9],
    ];
    tipPositions.forEach(([x, y, z]) => {
      const tip = new THREE.Mesh(sphereGeo, goldMat);
      tip.position.set(x, y, z);
      dialGroup.add(tip);
    });

    // 8. Glowing Concentric Energy Track Ring
    const glowRingMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 2.0,
      roughness: 0.25,
    });
    const ringGeo = new THREE.TorusGeometry(1.95, 0.035, 16, 64);
    const ringMesh = new THREE.Mesh(ringGeo, glowRingMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.47;
    this.mainGroup.add(ringMesh);

    // 9. Floating Holographic Currency Crystal / Core (Accent Detail Scale 3)
    const crystalGeo = new THREE.OctahedronGeometry(0.55, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x34d399,
      emissive: 0x047857,
      emissiveIntensity: 1.4,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalMesh.position.y = 2.1;
    this.mainGroup.add(crystalMesh);

    // 10. Four Corner Energy Pylons (symbolizing connected group members)
    const pylonGroup = new THREE.Group();
    const pylonGeo = new THREE.CylinderGeometry(0.09, 0.12, 1.6, 16);
    const pylonCapGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const pylonPositions = [
      [1.7, 0, 1.7],
      [-1.7, 0, 1.7],
      [1.7, 0, -1.7],
      [-1.7, 0, -1.7],
    ];

    pylonPositions.forEach(([x, _, z]) => {
      const pylon = new THREE.Mesh(pylonGeo, baseMat);
      pylon.position.set(x, 0.8, z);
      pylon.castShadow = !isSoftwareGl;
      pylonGroup.add(pylon);

      const cap = new THREE.Mesh(pylonCapGeo, glowRingMat);
      cap.position.set(x, 1.62, z);
      pylonGroup.add(cap);
    });
    this.mainGroup.add(pylonGroup);

    // 11. Soft Radial Contact Shadow Plane (Flush to Ground)
    const shadowTex = this.createContactShadowTexture();
    const shadowGeo = new THREE.PlaneGeometry(6, 6);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.75,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.01;
    this.mainGroup.add(shadowMesh);

    // 12. Floating Data Particle Dust (InstancedMesh >20 items)
    const particleCount = 45;
    const partGeo = new THREE.TetrahedronGeometry(0.045, 0);
    const partMat = new THREE.MeshStandardMaterial({
      color: 0x6ee7b7,
      emissive: 0x10b981,
      emissiveIntensity: 1.5,
      roughness: 0.3,
    });
    const particlesMesh = new THREE.InstancedMesh(partGeo, partMat, particleCount);
    particlesMesh.frustumCulled = false;

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.2 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const y = 0.4 + Math.random() * 2.8;

      _dummy.position.set(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
      _dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      _dummy.scale.setScalar(0.7 + Math.random() * 0.8);
      _dummy.updateMatrix();
      particlesMesh.setMatrixAt(i, _dummy.matrix);
    }
    particlesMesh.instanceMatrix.needsUpdate = true;
    this.mainGroup.add(particlesMesh);

    return {
      vaultGroup,
      dialGroup,
      crystalMesh,
      ringMesh,
      particlesMesh,
      pylonGroup,
      crystalMat,
      glowRingMat,
      goldMat,
    };
  }

  public isReady(): boolean {
    return this.webglAvailable && this.renderer !== null;
  }

  /**
   * Spins the vault combination dial smoothly when user types or interacts
   */
  public spinDial(angleDelta: number = Math.PI / 3) {
    this.targetDialAngle += angleDelta;
  }

  /**
   * Triggers the full vault opening sequence on successful login
   */
  public unlockVault(onComplete?: () => void) {
    this.isUnlocked = true;
    this.targetDialAngle += Math.PI * 4;

    setTimeout(() => {
      if (onComplete) onComplete();
    }, this.webglAvailable ? 650 : 150);
  }

  /**
   * Changes real-time theme & color palette across materials & lighting
   */
  public setTheme(theme: VaultTheme) {
    if (!this.webglAvailable) return;
    if (theme === 'indigo') {
      this.crystalMaterial.color.setHex(0x818cf8);
      this.crystalMaterial.emissive.setHex(0x4338ca);
      this.glowRingMaterial.color.setHex(0x6366f1);
      this.glowRingMaterial.emissive.setHex(0x4f46e5);
      this.hemiLight.color.setHex(0x818cf8);
      this.scene.background = new THREE.Color(0x0c0a1d);
      (this.scene.fog as THREE.FogExp2).color.setHex(0x0c0a1d);
    } else if (theme === 'emerald') {
      this.crystalMaterial.color.setHex(0x34d399);
      this.crystalMaterial.emissive.setHex(0x047857);
      this.glowRingMaterial.color.setHex(0x10b981);
      this.glowRingMaterial.emissive.setHex(0x059669);
      this.hemiLight.color.setHex(0x10b981);
      this.scene.background = new THREE.Color(0x060f14);
      (this.scene.fog as THREE.FogExp2).color.setHex(0x060f14);
    } else if (theme === 'cyber') {
      this.crystalMaterial.color.setHex(0x38bdf8);
      this.crystalMaterial.emissive.setHex(0x0284c7);
      this.glowRingMaterial.color.setHex(0x0ea5e9);
      this.glowRingMaterial.emissive.setHex(0x0369a1);
      this.hemiLight.color.setHex(0x38bdf8);
      this.scene.background = new THREE.Color(0x090d16);
      (this.scene.fog as THREE.FogExp2).color.setHex(0x090d16);
    } else if (theme === 'gold') {
      this.crystalMaterial.color.setHex(0xfbbf24);
      this.crystalMaterial.emissive.setHex(0xb45309);
      this.glowRingMaterial.color.setHex(0xf59e0b);
      this.glowRingMaterial.emissive.setHex(0xd97706);
      this.hemiLight.color.setHex(0xf59e0b);
      this.scene.background = new THREE.Color(0x160f06);
      (this.scene.fog as THREE.FogExp2).color.setHex(0x160f06);
    }
  }

  /**
   * Sets camera viewpoint preset
   */
  public setCameraPreset(preset: 'front' | 'angle' | 'top') {
    this.cameraPreset = preset;
  }

  private handlePointerMove(e: PointerEvent) {
    this.pointerNorm.x = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
    this.pointerNorm.y = -(e.clientY / Math.max(window.innerHeight, 1)) * 2 + 1;
  }

  private handleResize() {
    if (!this.container || !this.renderer || !this.webglAvailable) return;
    const w = this.container.clientWidth || window.innerWidth || 1280;
    const h = this.container.clientHeight || window.innerHeight || 800;
    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Main animation loop with exponential damping and software-WebGL pacing
   */
  private animate() {
    if (!this.renderer || !this.webglAvailable) return;

    const now = performance.now();
    const delta = Math.min((now - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = now;
    const elapsed = (now - this.startTime) / 1000;

    // 1. Smooth Dial Rotation Damping
    this.currentDialAngle = THREE.MathUtils.damp(
      this.currentDialAngle,
      this.targetDialAngle,
      6,
      delta
    );
    this.dialGroup.rotation.y = this.currentDialAngle;

    // 2. Floating Crystal Sinusoidal Bobbing & Twisting
    this.crystalMesh.position.y = 2.1 + Math.sin(elapsed * 2.2) * 0.12;
    this.crystalMesh.rotation.y += delta * 0.8;
    this.crystalMesh.rotation.x = Math.sin(elapsed * 1.5) * 0.15;

    // 3. Ambient Particle Drift
    this.particlesMesh.rotation.y += delta * 0.12;

    // 4. Vault Door Unlocking Animation Progression
    if (this.isUnlocked) {
      this.unlockProgress = THREE.MathUtils.damp(this.unlockProgress, 1, 3.5, delta);
      this.vaultGroup.position.y = 0.55 + this.unlockProgress * 0.35;
      this.ringMesh.scale.setScalar(1 + this.unlockProgress * 0.2);
      this.glowRingMaterial.emissiveIntensity = 1.8 + this.unlockProgress * 3.0;
    }

    // 5. Camera Damped Kinematics & Viewpoint Presets
    if (this.cameraPreset === 'angle') {
      _targetCamPos.set(1.4, 2.5, 5.4);
      _targetLookAt.set(0.35, 1.15, 0);
    } else if (this.cameraPreset === 'front') {
      _targetCamPos.set(-0.2, 2.1, 5.6);
      _targetLookAt.set(0.25, 1.15, 0);
    } else if (this.cameraPreset === 'top') {
      _targetCamPos.set(-0.3, 5.8, 2.4);
      _targetLookAt.set(0.2, 1.0, 0);
    }

    // Add subtle pointer parallax offset
    _targetCamPos.x += this.pointerNorm.x * 0.45;
    _targetCamPos.y += this.pointerNorm.y * 0.35;

    // Exponential camera damping (1 - Math.exp(-k * dt))
    const dampFactor = 1 - Math.exp(-4 * delta);
    this.camera.position.lerp(_targetCamPos, dampFactor);
    _curLookAt.lerp(_targetLookAt, dampFactor);
    this.camera.lookAt(_curLookAt);

    // 6. Render
    this.renderer.render(this.scene, this.camera);

    // 7. Software WebGL Loop Pacing
    if (isSoftwareGl) {
      this.afterDraw(() => {
        this.frameId = requestAnimationFrame(this.animate);
      });
    } else {
      this.frameId = requestAnimationFrame(this.animate);
    }
  }

  /**
   * Software WebGL sync fence to prevent CPU starvation
   */
  private afterDraw(cb: () => void) {
    if (!this.renderer) return;
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 50);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 6);
      } else {
        gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 60);
      }
    };
    this.frameId = window.setTimeout(poll, 6);
  }

  /**
   * Proper disposal of geometries, materials, and WebGL context
   */
  public dispose() {
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('pointermove', this.handlePointerMove);

    if (this.scene) {
      this.scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else if (mesh.material) {
            mesh.material.dispose();
          }
        }
      });
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
