/* tslint:disable:no-unused-variable */

import { AppComponent } from './app.component';
import { TestBed }      from '@angular/core/testing';


describe('AppComponent', function () {

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AppComponent]
    });
  });

  it('should instantiate component', () => {

    TestBed.compileComponents().then(() => {
      let fixture = TestBed.createComponent(AppComponent);
      expect(fixture.componentInstance instanceof AppComponent).toBe(true, 'should create AppComponent');
    });

  });


});
