'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DefaultComponent = exports.DefaultModule = undefined;

var _core = require('@angular/core');

var _common = require('@angular/common');

class DefaultComponent {
    constructor() {}
}
DefaultComponent.decorators = [{ type: _core.Component, args: [{
        selector: 'default',
        template: "<a href=\"#\">A Bundled Component Is A Happy Component</a>",
        styles: [":host {\n  font-family: \"Lato\", sans-serif;\n  background: red;\n  color: white;\n  padding: 20px;\n}\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRlZmF1bHQuY29tcG9uZW50LmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLGdDQUFnQztFQUNoQyxnQkFBZ0I7RUFDaEIsYUFBYTtFQUNiLGNBQWM7Q0FDZiIsImZpbGUiOiJkZWZhdWx0LmNvbXBvbmVudC5jc3MiLCJzb3VyY2VzQ29udGVudCI6WyI6aG9zdCB7XG4gIGZvbnQtZmFtaWx5OiBcIkxhdG9cIiwgc2Fucy1zZXJpZjtcbiAgYmFja2dyb3VuZDogcmVkO1xuICBjb2xvcjogd2hpdGU7XG4gIHBhZGRpbmc6IDIwcHg7XG59XG4iXX0= */"]
    }] }];
DefaultComponent.ctorParameters = () => [];

class DefaultModule {}
DefaultModule.decorators = [{ type: _core.NgModule, args: [{
        imports: [_common.CommonModule],
        declarations: [DefaultComponent],
        exports: [DefaultComponent]
    }] }];
DefaultModule.ctorParameters = () => [];

exports.DefaultModule = DefaultModule;
exports.DefaultComponent = DefaultComponent;
