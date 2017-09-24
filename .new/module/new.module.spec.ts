import { browser } from 'protractor';
import { NewModule } from './new.module';

describe('NewModule', () => {
  let NewModule;

  beforeEach(() => {
    NewModule = new NewModule();
  });

  it('should create an instance', () => {
    expect(NewModule).toBeTruthy();
  })
});
