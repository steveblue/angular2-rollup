import { Component, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

class DefaultComponent {
    constructor() {
    }
}
DefaultComponent.decorators = [
    { type: Component, args: [{
                selector: 'default',
                template: `<a href="#">Link</a>`,
                styles: [`:host {
  background: red;
}`]
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
