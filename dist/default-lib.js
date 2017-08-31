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
                styles: [":host{font-family:Lato,sans-serif;background:red;color:#fff;padding:20px}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRlZmF1bHQuY29tcG9uZW50LmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUNFLDRCQUFnQyxBQUNoQyxlQUFnQixBQUNoQixXQUFhLEFBQ2IsWUFBYyxDQUNmIiwiZmlsZSI6ImRlZmF1bHQuY29tcG9uZW50LmNzcyIsInNvdXJjZXNDb250ZW50IjpbIjpob3N0IHtcbiAgZm9udC1mYW1pbHk6IFwiTGF0b1wiLCBzYW5zLXNlcmlmO1xuICBiYWNrZ3JvdW5kOiByZWQ7XG4gIGNvbG9yOiB3aGl0ZTtcbiAgcGFkZGluZzogMjBweDtcbn1cbiJdfQ== */"]
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
