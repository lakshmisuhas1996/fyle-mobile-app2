import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SendBackComponent } from './send-back.component';

describe('SendBackComponent', () => {
  let component: SendBackComponent;
  let fixture: ComponentFixture<SendBackComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SendBackComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(SendBackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
