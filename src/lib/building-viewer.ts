import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { gsap } from 'gsap';

const MODEL_URL = '/gl/waverly.glb';
const DRACO_URL = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';

/**
 * Dedicated 3D slide — interactive orbit of the Waverly GLB.
 */
export class BuildingViewer {
  readonly canvas: HTMLCanvasElement;

  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
  private controls: OrbitControls | null = null;
  private pivot: THREE.Group | null = null;
  private loadPromise?: Promise<void>;
  private raf = 0;
  private active = false;
  private readonly rest = { theta: 0, phi: 0, radius: 10 };

  constructor(parent: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'building-view';
    this.canvas.setAttribute('aria-hidden', 'true');
    parent.appendChild(this.canvas);

    this.scene.background = new THREE.Color(0x6b5a44);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xfff4e8, 1.35);
    key.position.set(4, 8, 6);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xc8d8ff, 0.45);
    fill.position.set(-6, 2, -4);
    this.scene.add(fill);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  preload(): Promise<void> {
    return this.ensureLoaded();
  }

  private ensureLoaded(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = this.loadModel().catch((err) => {
        this.loadPromise = undefined;
        throw err;
      });
    }
    return this.loadPromise;
  }

  private async loadModel(): Promise<void> {
    const draco = new DRACOLoader();
    draco.setDecoderPath(DRACO_URL);
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    const gltf = await loader.loadAsync(MODEL_URL);
    draco.dispose();

    const model = gltf.scene;
    model.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);

    const pivot = new THREE.Group();
    pivot.add(model);
    this.pivot = pivot;
    this.scene.add(pivot);

    const maxDim = Math.max(size.x, size.y, size.z);
    const radius = maxDim * 1.35;
    const phi = THREE.MathUtils.degToRad(68);
    const theta = THREE.MathUtils.degToRad(24);

    this.rest.radius = radius;
    this.rest.phi = phi;
    this.rest.theta = theta;

    this.camera.position.setFromSphericalCoords(radius, phi, theta);
    this.camera.lookAt(0, size.y * 0.08, 0);
  }

  async activate(): Promise<void> {
    await this.ensureLoaded();
    if (!this.pivot || this.active) return;

    this.active = true;
    gsap.set(this.canvas, { autoAlpha: 1, pointerEvents: 'auto' });

    this.controls?.dispose();
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = hasFinePointer ? 1.6 : 0.9;
    this.controls.target.set(0, this.pivot.position.y, 0);

    const band = THREE.MathUtils.degToRad(18);
    this.controls.minPolarAngle = Math.max(0.25, this.rest.phi - band);
    this.controls.maxPolarAngle = Math.min(Math.PI / 2, this.rest.phi + band);

    this.camera.position.setFromSphericalCoords(this.rest.radius, this.rest.phi, this.rest.theta);
    this.controls.update();
    this.startLoop();
  }

  deactivate(): void {
    if (!this.active) return;
    this.active = false;

    this.controls?.dispose();
    this.controls = null;
    this.stopLoop();

    gsap.set(this.canvas, { autoAlpha: 0, pointerEvents: 'none' });

    if (this.pivot) {
      this.camera.position.setFromSphericalCoords(this.rest.radius, this.rest.phi, this.rest.theta);
      this.camera.lookAt(0, this.pivot.position.y, 0);
    }
  }

  private startLoop(): void {
    this.stopLoop();
    const tick = () => {
      this.raf = requestAnimationFrame(tick);
      this.controls?.update();
      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  private stopLoop(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  dispose(): void {
    this.deactivate();
    this.renderer.dispose();
    this.canvas.remove();
  }
}
