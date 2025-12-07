import { 
  Component, ElementRef, Input, OnChanges, 
  OnDestroy, OnInit, SimpleChanges, ViewChild, 
  AfterViewInit, inject 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { ThreeJsFacadeService } from '../../services/threejs-facade.service';

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

  private threeFacade = inject(ThreeJsFacadeService);

  public get isLoading() { return this.threeFacade.isLoading; }

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.threeFacade.init(this.rendererContainer.nativeElement);
    if (this.modelUrl) this.threeFacade.loadModel(this.modelUrl, this.color).catch(err => console.error(err));
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Detecta mudança na URL do modelo
    if (changes['modelUrl'] && !changes['modelUrl'].firstChange) {
      if (this.modelUrl) {
        this.threeFacade.loadModel(this.modelUrl, this.color).catch(err => console.error(err));
      } else {
        this.threeFacade.clearScene();
      }
    }

    // Detecta mudança nos controles (Sliders)
    if (changes['rotationX'] || changes['rotationY']) {
      this.threeFacade.updateRotation(this.rotationX, this.rotationY);
    }

    if (changes['zoom']) {
      this.threeFacade.updateZoom(this.zoom);
    }
  }
  // Three.js lifecycle is handled by ThreeJsFacadeService

  ngOnDestroy(): void {
    this.threeFacade.dispose();
  }
}
