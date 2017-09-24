import { browser } from 'protractor';
import { TestBed, inject } from '@angular/core/testing';

import { NewService } from './new.service';

describe('NewService', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NewService]
    });
  });

  it('should ...', inject([NewService], (service: NewService) => {
    expect(service).toBeTruthy();
  }));

});




