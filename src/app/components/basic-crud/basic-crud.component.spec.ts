import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { BasicCrudComponent } from './basic-crud.component';

describe('BasicCrudComponent', () => {
  let component: BasicCrudComponent;
  let fixture: ComponentFixture<BasicCrudComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicCrudComponent, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BasicCrudComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
