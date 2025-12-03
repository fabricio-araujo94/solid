import { 
  Component, ElementRef, Input, OnChanges, 
  OnDestroy, OnInit, SimpleChanges, ViewChild, 
  AfterViewInit 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';

@Component({
  selector: 'app-viewer3d',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './viewer3d.component.html',
  styleUrls: ['./viewer3d.component.css']
})
export class Viewer3dComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() modelUrl: string | null = null;
  @Input() color: number = 0x2ecc71; // Cor padrão (Verde SOLID)
  
  // Inputs para controle externo (Sprint VIII)
  @Input() rotationX: number = 0;
  @Input() rotationY: number = 0;
  @Input() zoom: number = 50;

  @ViewChild('rendererContainer') rendererContainer!: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private mesh: THREE.Mesh | null = null;
  private animationId: number | null = null;
  
  public isLoading = false;

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initThree();
    if (this.modelUrl) {
      this.loadModel(this.modelUrl);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Detecta mudança na URL do modelo
    if (changes['modelUrl'] && !changes['modelUrl'].firstChange) {
      if (this.modelUrl) {
        this.loadModel(this.modelUrl);
      } else {
        this.clearScene();
      }
    }

    // Detecta mudança nos controles (Sliders)
    if (this.mesh) {
      if (changes['rotationX'] || changes['rotationY']) {
        // Converte graus (0-360) para radianos
        this.mesh.rotation.x = THREE.MathUtils.degToRad(this.rotationX);
        this.mesh.rotation.y = THREE.MathUtils.degToRad(this.rotationY);
      }
      
      if (changes['zoom']) {
         this.updateZoom();
      }
    }
  }

  private initThree(): void {
    const width = this.rendererContainer.nativeElement.clientWidth;
    const height = this.rendererContainer.nativeElement.clientHeight;

    // 1. Cena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    // Adiciona uma grade para referência de chão
    const gridHelper = new THREE.GridHelper(200, 20); 
    this.scene.add(gridHelper);

    // 2. Câmera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 50, 100); // Posição inicial elevada
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    // 4. Luzes (Iluminação estilo estúdio)
    const ambientLight = new THREE.AmbientLight(0x404040, 2); // Luz suave
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(50, 50, 50);
    this.scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 1);
    backLight.position.set(-50, 20, -50);
    this.scene.add(backLight);

    this.animate();
  }

  private loadModel(url: string): void {
    if (!this.scene) return;
    this.clearScene();
    this.isLoading = true;

    const loader = new STLLoader();
    loader.load(
      url,
      (geometry) => {
        // Material Padrão (Fosco colorido)
        const material = new THREE.MeshPhongMaterial({ 
          color: this.color, 
          specular: 0x111111, 
          shininess: 200 
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Centralizar a geometria
        geometry.computeBoundingBox();
        geometry.center();

        // Rotacionar -90 no X porque STL geralmente vem "deitado"
        this.mesh.rotation.x = -Math.PI / 2;
        
        // Adicionar à cena
        this.scene.add(this.mesh);
        
        // Ajustar câmera para enquadrar o objeto
        this.fitCameraToSelection(this.camera, [this.mesh]);
        
        this.isLoading = false;
      },
      (xhr) => {
        // Progresso
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error('Erro ao carregar STL:', error);
        this.isLoading = false;
      }
    );
  }

  private clearScene(): void {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      if (this.mesh.geometry) this.mesh.geometry.dispose();
      // Não damos dispose no material se formos reutilizar, mas aqui é seguro
      this.mesh = null;
    }
  }

  private updateZoom(): void {
    // Zoom simples movendo a câmera no eixo Z
    // Zoom 100 = Perto (Z=50), Zoom 0 = Longe (Z=150)
    if (this.camera) {
      // Inverte: slider alto = zoom in (perto), slider baixo = zoom out (longe)
      // Mapeamento: 10 (perto) a 100 (longe) -> invertido na UI logicamente
      const distance = 150 - this.zoom; 
      this.camera.position.z = distance;
      this.camera.lookAt(0,0,0);
    }
  }

  // Função utilitária para enquadrar objeto
  private fitCameraToSelection(camera: THREE.PerspectiveCamera, objects: THREE.Object3D[]) {
    const box = new THREE.Box3();
    objects.forEach(obj => box.expandByObject(obj));
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    const maxSize = Math.max(size.x, size.y, size.z);
    const fitHeightDistance = maxSize / (2 * Math.tan(Math.PI * camera.fov / 360));
    const fitWidthDistance = fitHeightDistance / camera.aspect;
    const distance = 1.2 * Math.max(fitHeightDistance, fitWidthDistance); // 1.2 margin
    
    const direction = camera.position.clone().sub(center).normalize().multiplyScalar(distance);

    camera.position.copy(center).add(direction);
    camera.lookAt(center);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  ngOnDestroy(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    // Limpeza de memória básica seria boa aqui
  }
}
