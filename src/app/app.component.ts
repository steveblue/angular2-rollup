import { Component } from '@angular/core';

@Component({
    moduleId: module.id,
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.css']
})


export class AppComponent {
    url = 'https://github.com/steveblue/angular2-rollup';
    constructor() {}

}
