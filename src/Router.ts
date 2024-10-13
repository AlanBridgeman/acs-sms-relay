import { Application } from 'express';

import { IRouteController } from './controllers/IRouteController';

export class Router {
    private controllers: IRouteController[];

    constructor(...controllers: IRouteController[]) {
        this.controllers = controllers;
    }

    setup(app: Application): void {
        this.controllers.forEach(controller => controller.setup(app));
    }
}