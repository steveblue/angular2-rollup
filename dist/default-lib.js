import { Component, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

class DefaultComponent {
    constructor() {
    }
}
DefaultComponent.decorators = [
    { type: Component, args: [{
                selector: 'default',
                template: "<a href=\"#\">A Bundled Component Is A Happy Component</a>",
                styles: [":host{font-family:Lato,sans-serif;background:red;color:#fff;padding:20px}"]
            },] },
];
DefaultComponent.ctorParameters = () => [];

class DefaultModule {
}
DefaultModule.decorators = [
    { type: NgModule, args: [{
                imports: [CommonModule],
                declarations: [DefaultComponent],
                exports: [DefaultComponent]
            },] },
];
DefaultModule.ctorParameters = () => [];

export { DefaultModule, DefaultComponent };
