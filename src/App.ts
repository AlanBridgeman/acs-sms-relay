import express, { Application } from 'express';

import { Router } from './Router';

import { IRouteController } from './controllers/IRouteController';
import { HomeController } from './controllers/HomeController';
import { ListmonkController } from './controllers/ListmonkController';

/**
 * The main application class.
 */
export class App {
    /** The Express application. */
    private app: Application;
    /** The port to listen on. */
    private port: number;

    /**
     * Creates a new App instance.
     * 
     * @param port The port to listen on. Defaults to a PORT environment variable. Or 8080 if the environment variable is not set.
     */
    constructor(port?: number) {
        this.app = express();

        if(typeof port !== 'undefined') {
            this.port = port;
        }
        else if(typeof process.env.PORT !== 'undefined') {
            this.port = parseInt(process.env.PORT);
        }
        else {
            this.port = 8080;
        }

        this.setupMiddlewares();
        this.setupRoutes();
        this.setupViews();
    }

    /**
     * Sets up the middlewares for the application.
     */
    private setupMiddlewares() {
        this.app.use(express.static('public'));
        
        // FOR DEBUGGING
        /*this.app.use((req, res, next) => { 
            console.log(`Request: ${req.method} ${req.url}`); 
            console.log(`Headers: ${JSON.stringify(req.headers)}`);
            next(); 
        });*/
    }

    /**
     * Sets up the routes for the application.
     */
    private setupRoutes() {
        // TODO: Use reflection to automatically load all controllers.
        const controllers: IRouteController[] = [
            new HomeController(),
            new ListmonkController()
        ];

        const router = new Router(...controllers);
        router.setup(this.app);
    }

    /**
     * Sets up the views for the application.
     * Uses the [EJS](https://ejs.co/) templating engine.
     */
    private setupViews() {
        this.app.set('view engine', 'ejs');
        this.app.set('views', 'pages');
    }

    /**
     * Starts the server listening for incoming requests.
     * 
     * @param onStart A callback function to run when the server starts.
     * @param args Arguments to pass to the onStart callback function.
     */
    start(onStart?: (...args: any[]) => any, ...args: any[]) {
        this.app.listen(this.port, () => { 
            console.log(`Server started on port ${this.port}`);

            if(typeof onStart !== 'undefined') {
                onStart(...args);
            }
        });
    }
}