import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { gsap } from 'gsap';
import { duration } from './motion';

const MODEL_URL = '/gl/waverly.glb';
const DRACO_URL = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';

/**
 * Press-and-hold hero orbit — motion-spec.md §7.1, adapted for the Waverly GLB.
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

  async enter(event: PointerEvent, hasFinePointer: boolean): Promise<void> {
    await this.ensureLoaded();
    if (!this.pivot || this.active) return;

    this.active = true;
    gsap.set(this.canvas, { autoAlpha: 0, pointerEvents: 'none' });
    gsap.to(this.canvas, {
      autoAlpha: 1,
      pointerEvents: 'auto',
      duration: duration(0.5),
      ease: 'power1.in',
    });

    this.controls?.dispose();
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

    this.controls.enabled = false;
    this.controls.enabled = true;
    this.replayPointer(event, hasFinePointer);
    this.controls.update();

    this.startLoop();
  }

  private replayPointer(event: PointerEvent, hasFinePointer: boolean): void {
    if (!this.controls) return;
    const controls = this.controls as OrbitControls & {
      _onPointerDown?: (e: PointerEvent) => void;
      _onMouseDown?: (e: PointerEvent) => void;
      _onTouchStart?: (e: PointerEvent) => void;
    };

    controls._onPointerDown?.(event);
    if (hasFinePointer) controls._onMouseDown?.(event);
    else controls._onTouchStart?.(event);
  }

  async exit(): Promise<void> {
    if (!this.active || !this.controls) return;
    this.active = false;

    const controls = this.controls;
    const target = this.controls.target.clone();
    const start = {
      theta: controls.getAzimuthalAngle(),
      phi: controls.getPolarAngle(),
      radius: controls.getDistance(),
    };
    const delta = Math.abs(start.theta - this.rest.theta) + Math.abs(start.phi - this.rest.phi);
    const tweenDur = Math.min(delta * 0.65, duration(1));

    await new Promise<void>((resolve) => {
      gsap.to(start, {
        theta: this.rest.theta,
        phi: this.rest.phi,
        radius: this.rest.radius,
        duration: tweenDur,
        ease: 'power3.inOut',
        onUpdate: () => {
          this.camera.position.setFromSphericalCoords(start.radius, start.phi, start.theta);
          this.camera.lookAt(target);
          controls.update();
        },
        onComplete: resolve,
      });
    });

    controls.dispose();
    this.controls = null;
    this.stopLoop();

    await gsap.to(this.canvas, {
      autoAlpha: 0,
      pointerEvents: 'none',
      duration: duration(0.45),
      ease: 'power1.out',
    });
  }

  private startLoop(): void {
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
    this.stopLoop();
    this.controls?.dispose();
    this.renderer.dispose();
    this.canvas.remove();
  }
}
