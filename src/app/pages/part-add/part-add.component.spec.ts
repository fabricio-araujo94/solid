import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartAddComponent } from './part-add.component';

describe('PartAddComponent', () => {
  let component: PartAddComponent;
  let fixture: ComponentFixture<PartAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartAddComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
