import { Injectable } from '@angular/core';
import { IModelLoader, STLModelLoader } from './stl-model-loader';

@Injectable({
  providedIn: 'root'
})
export class ModelLoaderFactory {
  private loaders: IModelLoader[] = [
    new STLModelLoader()
  ];

  getLoader(url: string): IModelLoader | null {
    if (!url) return null;
    return this.loaders.find(l => l.supports(url)) ?? null;
  }
}
