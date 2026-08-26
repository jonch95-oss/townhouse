import * as THREE from 'three';
import type { SlideRenderer } from './renderer';

/**
 * The transition shader — motion-spec.md §5.
 *
 * A single full-screen quad. Three things happen in about forty lines of GLSL:
 * `object-fit: cover` is computed in-shader so the aspect logic lives in one
 * place; the wipe is a hard edge via `step(progress, vUv.y)`, not a crossfade
 * and not a feather; and the two plates counter-parallax at half the rate of
 * the edge, the outgoing travelling -50% of UV height while the incoming
 * travels +50% to 0. That counter-parallax is the single biggest contributor
 * to how the transition reads, and it has no good DOM equivalent.
 *
 * It implements SlideRenderer, so the slide machine drives it with exactly the
 * timeline that drives the crossfade — same `snappy` ease, same 1.5s and 2.25s.
 *
 * OFF BY DEFAULT. The crossfade is the shipping path — on real phones the
 * WebGL canvas was painting black while the photographs sat `display: none`
 * underneath. Enable with ?shader=1 to preview.
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D u_texture1;   // outgoing
  uniform sampler2D u_texture2;   // incoming
  uniform vec2  u_res;
  uniform vec2  u_size1;
  uniform vec2  u_size2;
  uniform float u_progress;
  uniform float u_direction;

  // object-fit: cover, in shader.
  vec2 uvCover(vec2 uv, vec2 screen, vec2 image) {
    vec2 ratio = vec2(
      min((screen.x / screen.y) / (image.x / image.y), 1.0),
      min((screen.y / screen.x) / (image.y / image.x), 1.0)
    );
    return vec2(
      uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      uv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );
  }

  void main() {
    float directed = u_direction > 0.0 ? u_progress : 1.0 - u_progress;

    // The plates travel at half the rate of the edge, in opposite directions.
    const float parallax = -0.5;
    vec2 offset1 = vec2(0.0,  directed         * parallax);
    vec2 offset2 = vec2(0.0, (directed - 1.0)  * parallax);

    vec4 t1 = texture2D(u_texture1, uvCover(vUv + offset1, u_res, u_size1));
    vec4 t2 = texture2D(u_texture2, uvCover(vUv + offset2, u_res, u_size2));

    // A hard edge. No feather, no blur, no dissolve.
    float mask = step(directed, vUv.y);
    gl_FragColor = mix(t2, t1, mask);
  }
`;

export class ShaderRenderer implements SlideRenderer {
  readonly canvas: HTMLCanvasElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly material: THREE.ShaderMaterial;
  private readonly textures: (THREE.Texture | null)[];
  private readonly onResize = () => this.resize();

  constructor(sources: (string | undefined)[]) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'gl-slides';

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

    const loader = new THREE.TextureLoader();
    this.textures = sources.map((src) => {
      if (!src) return null;
      const t = loader.load(src, () => this.render(this.lastProgress));
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearFilter;
      return t;
    });

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      uniforms: {
        u_texture1: { value: null },
        u_texture2: { value: null },
        u_size1: { value: new THREE.Vector2(1, 1) },
        u_size2: { value: new THREE.Vector2(1, 1) },
        u_res: { value: new THREE.Vector2(1, 1) },
        u_progress: { value: 0 },
        u_direction: { value: 1 },
      },
    });

    // One oversized triangle rather than a quad — three vertices, not six.
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
    this.scene.add(new THREE.Mesh(geometry, this.material));

    this.resize();
    window.addEventListener('resize', this.onResize);
  }

  private lastProgress = 1;

  private sizeOf(t: THREE.Texture | null): THREE.Vector2 {
    const img = t?.image as { width?: number; height?: number } | undefined;
    return new THREE.Vector2(img?.width || 1, img?.height || 1);
  }

  change(from: number, to: number): void {
    const u = this.material.uniforms;
    u.u_texture1!.value = this.textures[from] ?? null;
    u.u_texture2!.value = this.textures[to] ?? null;
    u.u_size1!.value = this.sizeOf(this.textures[from] ?? null);
    u.u_size2!.value = this.sizeOf(this.textures[to] ?? null);
    u.u_direction!.value = to > from ? 1 : -1;
  }

  render(progress: number): void {
    this.lastProgress = progress;
    this.material.uniforms.u_progress!.value = progress;
    this.renderer.render(this.scene, this.camera);
  }

  /** Paint a single slide with no transition in flight. */
  show(index: number): void {
    this.change(index, index);
    this.render(1);
  }

  private resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.material.uniforms.u_res!.value.set(w, h);
    this.render(this.lastProgress);
  }

  destroy(): void {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
