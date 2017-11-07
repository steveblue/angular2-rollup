import { Inject, Injectable, Injector } from '@angular/core';
import { Router, Routes, Route } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { HomeComponent } from './shared/components/home/home.component';

@Injectable()
export class AppConfig {

    constructor(private injector: Injector,
        private http: HttpClient) {}

    public load() {

        return new Promise((resolve, reject) => {

            this.http.get('lazy.config.json').toPromise().then((res) => {

                let routerConfig = res;

                let routes: Routes = [
                    { path: '', component: HomeComponent }
                ];

                routerConfig['routes'].forEach((route: Route) => {
                    routes.push({ path: route['path'], loadChildren: route['loadChildren'] });
                });

                this.injector.get(Router).resetConfig(routes);

                resolve(routes);

            })

        });

    }
}
