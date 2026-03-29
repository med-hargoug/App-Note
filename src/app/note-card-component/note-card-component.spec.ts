import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteCardComponent } from './note-card-component';

describe('NoteCardComponent', () => {
  let component: NoteCardComponent;
  let fixture: ComponentFixture<NoteCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NoteCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
