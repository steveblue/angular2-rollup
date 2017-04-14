(function (exports,_angular_core,_angular_common) {
'use strict';

class DefaultComponent {
    constructor() {
    }
}
DefaultComponent.decorators = [
    { type: _angular_core.Component, args: [{
                selector: 'default',
                template: "<a href=\"#\">A Bundled Component Is A Happy Component</a>",
                styles: [":host{font-family:Lato,sans-serif;background:red;color:#fff;padding:20px}"]
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

}((this['default-lib'] = this['default-lib'] || {}),_angular_core,_angular_common));
