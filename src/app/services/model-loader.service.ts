import { Injectable } from '@angular/core';
import { IModelLoader, STLModelLoader } from './stl-model-loader';

@Injectable({
  providedIn: 'root'
})
export class ModelLoaderService {
  private loaders: IModelLoader[] = [
    new STLModelLoader()
  ];

  getLoader(url: string): IModelLoader {
    if (!url) return this.loaders[0]; // Default to STL if no URL (though usually checks should be strict)
    return this.loaders.find(l => l.supports(url)) ?? this.loaders[0];
  }
}
