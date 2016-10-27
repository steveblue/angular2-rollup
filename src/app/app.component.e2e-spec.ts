describe('App', function () {

  beforeEach(function () {
    browser.get('/');
  });

  it('should have <router-outlet>', function () {
    expect(element(by.css('app-root outer-outlet')).isPresent()).toEqual(true);
  });

});
