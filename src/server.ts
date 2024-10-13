import dotenv from 'dotenv';

import { App } from './App';

// Load environment variables from .env file.
dotenv.config();

// Create a new App instance and start it.
const app = new App();
app.start();