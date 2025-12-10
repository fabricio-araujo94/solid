import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';

export interface IModelLoader {
  load(url: string): Promise<THREE.BufferGeometry>;
  supports(url: string): boolean;
}

export class STLModelLoader implements IModelLoader {
  load(url: string): Promise<THREE.BufferGeometry> {
    return new Promise((resolve, reject) => {
      const loader = new STLLoader();
      loader.load(
        url,
        (geometry) => {
          resolve(geometry as THREE.BufferGeometry);
        },
        undefined,
        (err) => reject(err)
      );
    });
  }

  supports(url: string): boolean {
    return typeof url === 'string' && url.toLowerCase().endsWith('.stl');
  }
}
