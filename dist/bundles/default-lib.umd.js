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
        styles: [":host{font-family:Lato,sans-serif;background:red;color:#fff;padding:20px}"]
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
