import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearDeploy } from './crear-deploy';

describe('CrearDeploy', () => {
  let component: CrearDeploy;
  let fixture: ComponentFixture<CrearDeploy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearDeploy]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearDeploy);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
