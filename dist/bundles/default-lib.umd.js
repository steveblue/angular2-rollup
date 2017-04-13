(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('@angular/common')) :
	typeof define === 'function' && define.amd ? define(['exports', '@angular/core', '@angular/common'], factory) :
	(factory((global['default-lib'] = global['default-lib'] || {}),global._angular_core,global._angular_common));
}(this, (function (exports,_angular_core,_angular_common) { 'use strict';

class DefaultComponent {
    constructor() {
    }
}
DefaultComponent.decorators = [
    { type: _angular_core.Component, args: [{
                selector: 'default',
                template: '<a href="#">A Bundled Component Is A Happy Component</a>',
                styles: [':host{font-family:Lato,sans-serif;background:red;color:#fff;padding:20px}']
            },] },
];
DefaultComponent.ctorParameters = () => [];

class DefaultModule {
}
DefaultModule.decorators = [
    { type: _angular_core.NgModule, args: [{
                imports: [_angular_common.CommonModule],
                declarations: [DefaultComponent],
                exports: [DefaultComponent]
            },] },
];
DefaultModule.ctorParameters = () => [];

exports.DefaultModule = DefaultModule;
exports.DefaultComponent = DefaultComponent;

Object.defineProperty(exports, '__esModule', { value: true });

})));
