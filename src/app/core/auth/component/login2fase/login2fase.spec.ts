import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Login2 } from './login2fase';

describe('Login2', () => {
  let component: Login2;
  let fixture: ComponentFixture<Login2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login2]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Login2);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
