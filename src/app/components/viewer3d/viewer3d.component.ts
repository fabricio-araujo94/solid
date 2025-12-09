import {
  Component, ElementRef, Input, OnChanges,
  OnDestroy, OnInit, SimpleChanges, ViewChild,
  AfterViewInit, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreeJsService } from '../../services/threejs.service';

@Component({
  selector: 'app-viewer3d',
  standalone: true,
  imports: [CommonModule],
  providers: [
    // provide a distinct ThreeJsFacadeService instance per component
    // so each viewer has its own scene, renderer and controls
    ThreeJsService
  ],
  templateUrl: './viewer3d.component.html',
  styleUrls: ['./viewer3d.component.css']
})
export class Viewer3dComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() modelUrl: string | null = null;
  @Input() color: number = 0x2ecc71;

  @Input() rotationX: number = 0;
  @Input() rotationY: number = 0;
  @Input() zoom: number = 50;

  @ViewChild('rendererContainer') rendererContainer!: ElementRef;

  private three = inject(ThreeJsService);

  public get isLoading() { return this.three.isLoading; }

  constructor() { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.three.init(this.rendererContainer.nativeElement);
    if (this.modelUrl) this.three.loadModel(this.modelUrl, this.color).catch(err => console.error(err));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['modelUrl'] && !changes['modelUrl'].firstChange) {
      if (this.modelUrl) {
        this.three.loadModel(this.modelUrl, this.color).catch(err => console.error(err));
      } else {
        this.three.clearScene();
      }
    }

    if (changes['rotationX'] || changes['rotationY']) {
      this.three.updateRotation(this.rotationX, this.rotationY);
    }

    if (changes['zoom']) {
      this.three.updateZoom(this.zoom);
    }
  }

  // Three.js lifecycle is handled by ThreeJsService
  ngOnDestroy(): void {
    this.three.dispose();
  }
}
