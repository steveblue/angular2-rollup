import { browser, element, by } from 'protractor';

describe('angular2-rollup E2E Tests', function () {

  beforeEach(function () {
    browser.get('');
  });

  it('should have <router-outlet>', function () {
    expect(element(by.css('router-outlet')).getText()).toEqual('');
  });

});
