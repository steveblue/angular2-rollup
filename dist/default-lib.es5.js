import { Component, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

class DefaultComponent {
    constructor() {
    }
}
DefaultComponent.decorators = [
    { type: Component, args: [{
                selector: 'default',
                templateUrl: 'default.component.html',
                styleUrls: ['default.component.css']
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
