import { Injectable, inject } from '@angular/core';
import * as THREE from 'three';
import { ModelLoaderService } from './model-loader.service';
import { OrbitControls } from 'three-stdlib';

@Injectable()
export class ThreeJsService {
  private ModelLoaderService = inject(ModelLoaderService);

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private mesh: THREE.Mesh | null = null;
  private animationId: number | null = null;
  private controls: any = null;

  public isLoading = false;

  init(container: HTMLElement): void {
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    const gridHelper = new THREE.GridHelper(200, 20);
    this.scene.add(gridHelper);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 50, 100);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    // Add orbit controls to allow rotating/panning/zooming with mouse
    try {
      this.controls = new (OrbitControls as any)(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.1;
      this.controls.screenSpacePanning = false;
      this.controls.minDistance = 10;
      this.controls.maxDistance = 2000;
    } catch (e) {
      console.warn('OrbitControls not available:', e);
      this.controls = null;
    }

    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(50, 50, 50);
    this.scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 1);
    backLight.position.set(-50, 20, -50);
    this.scene.add(backLight);

    this.animate();
  }

  loadModel(url: string, color: number = 0x2ecc71): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.scene) return reject(new Error('ThreeJs not initialized'));
      this.clearScene();
      this.isLoading = true;

      const loader = this.ModelLoaderService.getLoader(url);
      loader.load(url).then((geometry) => {
        this.createMeshFromGeometry(geometry, color);
        this.isLoading = false;
        resolve();
      }).catch((err) => {
        this.isLoading = false;
        reject(err);
      });
    });
  }

  private createMeshFromGeometry(geometry: THREE.BufferGeometry, color: number) {
    try {
      const hasNormals = !!geometry.getAttribute('normal');
      if (!hasNormals) {
        geometry.computeVertexNormals();
      }
    } catch (e) {
      console.warn('Failed to compute normals:', e);
    }

    try {
      geometry.computeBoundingBox();
      const box = geometry.boundingBox;
      if (box) {
        const center = box.getCenter(new THREE.Vector3());
        geometry.translate(-center.x, -center.y, -center.z);
      }
    } catch (e) {
      console.warn('Failed to compute/center bounding box:', e);
    }

    const material = new THREE.MeshPhongMaterial({ color, specular: 0x111111, shininess: 200, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.scene.add(this.mesh);

    try { geometry.computeBoundingSphere(); } catch { }

    this.fitCameraToSelection(this.camera, [this.mesh]);
  }

  updateRotation(xDeg: number, yDeg: number): void {
    if (this.mesh) {
      this.mesh.rotation.x = THREE.MathUtils.degToRad(xDeg);
      this.mesh.rotation.y = THREE.MathUtils.degToRad(yDeg);
    }
  }

  updateZoom(zoom: number): void {
    if (this.camera) {
      const distance = 150 - zoom;
      this.camera.position.z = distance;
      this.camera.lookAt(0, 0, 0);
    }
  }

  private fitCameraToSelection(camera: THREE.PerspectiveCamera, objects: THREE.Object3D[]) {
    const box = new THREE.Box3();
    objects.forEach(obj => box.expandByObject(obj));
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxSize = Math.max(size.x, size.y, size.z);
    const fitHeightDistance = maxSize / (2 * Math.tan(Math.PI * camera.fov / 360));
    const fitWidthDistance = fitHeightDistance / camera.aspect;
    const distance = 1.2 * Math.max(fitHeightDistance, fitWidthDistance);

    const direction = camera.position.clone().sub(center).normalize().multiplyScalar(distance);

    camera.position.copy(center).add(direction);
    camera.lookAt(center);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    if (this.controls && typeof this.controls.update === 'function') this.controls.update();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  clearScene(): void {
    if (!this.scene) return;

    if (this.mesh) {
      this.scene.remove(this.mesh);
      if ((this.mesh as any).geometry) (this.mesh as any).geometry.dispose?.();
      if ((this.mesh as any).material) {
        const mat = (this.mesh as any).material;
        if (Array.isArray(mat)) mat.forEach((m: any) => m.dispose?.());
        else mat.dispose?.();
      }
      this.mesh = null;
    }

    this.scene.traverse((obj: any) => {
      if (obj.geometry) obj.geometry.dispose?.();
      if (obj.material) {
        const m = obj.material;
        if (Array.isArray(m)) m.forEach((mat: any) => mat.dispose?.());
        else m.dispose?.();
      }
      if (obj.texture) obj.texture.dispose?.();
    });
  }

  dispose(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);

    try {
      if (this.renderer) {
        (this.renderer as any).forceContextLoss?.();
        this.renderer.dispose?.();
        const canvas = this.renderer.domElement;
        if (canvas && canvas.parentElement) canvas.parentElement.removeChild(canvas);
      }
    } catch (e) {
      console.warn('Erro ao descartar renderer:', e);
    }

    if (this.scene) {
      this.scene.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose?.();
        if (obj.material) {
          const m = obj.material;
          if (Array.isArray(m)) m.forEach((mat: any) => mat.dispose?.());
          else m.dispose?.();
        }
        if (obj.texture) obj.texture.dispose?.();
      });
    }
  }
}
