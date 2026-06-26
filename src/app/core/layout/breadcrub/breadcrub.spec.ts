import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Breadcrub } from './breadcrub';

describe('Breadcrub', () => {
  let component: Breadcrub;
  let fixture: ComponentFixture<Breadcrub>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Breadcrub);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

