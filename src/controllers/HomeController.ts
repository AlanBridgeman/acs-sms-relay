import { Application, Request, Response } from 'express';

import { IRouteController } from './IRouteController';

/**
 * Controller for the home page
 */
export class HomeController implements IRouteController {
    /**
     * Renders the home page
     * 
     * @param req The Express request object
     * @param res The Express response object
     */
    private home(req: Request, res: Response) {
        res.render('home');
    }
    
    setup(app: Application): void {
        app.get('/', this.home.bind(this));
    }
}