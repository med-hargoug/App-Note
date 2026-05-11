import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FolderSideBarComponent } from './folder-side-bar-component';

describe('FolderSideBarComponent', () => {
  let component: FolderSideBarComponent;
  let fixture: ComponentFixture<FolderSideBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderSideBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FolderSideBarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
