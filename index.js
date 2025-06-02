import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createDbAndTables } from './controllers/mainControllers.js';
import createDynamicMulterMiddleware from './utils/multerDestinaProps.js';
import session from 'express-session';
import mainRouter from './allRoutes.js'
// import './controllers/addCities_states.js'

dotenv.config();

const PORT = process.env.PORT || 3009;
const base_url = process.env.BASE_URL || `http://localhost:${PORT}`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dynamicImageUpload = createDynamicMulterMiddleware();

const startServer = async () => {
    try {
        await createDbAndTables();
        const app = express();

        app.use(express.static(path.join(__dirname, 'public')));
        app.use(express.static("dist"));

        app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

        app.set('view engine', 'ejs');
        app.set('views', path.join(__dirname, 'views'));


        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(
            session({
                secret: process.env.SESSION_SECRET || "mysecretkey",
                resave: false,
                saveUninitialized: true,
                cookie: { secure: false }, // set secure: true if using HTTPS
            })
        );
        app.use((req, res, next) => {
            res.locals.currentPath = req.path;
            next();
        });

        app.use(mainRouter);


        app.post('/upload/:module/:moduleId', dynamicImageUpload.single('image'), (req, res) => {
            res.json({
                message: 'File uploaded successfully',
                file: `${base_url}/${req.filePath}`,
            });
        });

        app.get('/', (req, res) => {
            res.render('index', { name: 'User' });
        });

        app.listen(PORT, () => {
            console.log(`Server started on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
};

startServer();
