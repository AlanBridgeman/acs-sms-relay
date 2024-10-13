import { Application } from 'express';

/**
 * Interface for controllers (used in the Router)
 */
export interface IRouteController {
    /**
     * Sets up the routes for the controller
     * 
     * @param app The Express application where the routes will be added
     */
    setup(app: Application): void;
}