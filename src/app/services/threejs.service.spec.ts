import { TestBed } from '@angular/core/testing';

import { ThreeJsService } from './threejs.service';

describe('ThreeJsService', () => {
    let service: ThreeJsService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ThreeJsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
