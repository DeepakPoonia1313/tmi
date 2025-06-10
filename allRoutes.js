import express from 'express';
import routes from './routes/users.js';
import admminRoutes from './routes/adminAuth/adminAuth.js'
import adminAuthEjsRoutes from './routes/adminAuth/adminAuthEjs.js';
import adminDestRoutes from './routes/adminDestRoutes/ejsRoutes.js'
import adminDestControllerRoutes from './routes/adminDestRoutes/destControllerRoutes.js';

// import adminPackageRoutes from './routes/adminPackages/ejsRoutes.js';
import adminThemRoutes from './routes/adminThemes/ejsRoutes.js';
import adminThemeControllerRoutes from './routes/adminThemes/controllers.js';

// admin package imports
import adminPackageRoutes from './routes/adminPackages/ejsRoutes.js';
import adminPackageControllerRoutes from './routes/adminPackages/controllerRoutes.js';

// admin hotel routes
import adminHotelRoutes from './routes/adminHotels/ejsRoutes.js';
import adminHotelControllerRoutes from './routes/adminHotels/controllers.js';

// itinerary routes
import adminItineraryRoutes from './routes/itinerary/ejsRoutes.js';
import adminItineraryControllerRoutes from './routes/itinerary/controllerRoutes.js';

const mainRouter = express.Router();

mainRouter.use('/api', routes);
mainRouter.use('/admin', admminRoutes)

// ejs routes
mainRouter.use('/admin', adminAuthEjsRoutes)
mainRouter.use('/admin', adminDestRoutes)
mainRouter.use('/admin', adminThemRoutes);
mainRouter.use('/admin', adminPackageRoutes);
mainRouter.use('/admin', adminHotelRoutes);
mainRouter.use('/admin', adminItineraryRoutes);

// controller routes
mainRouter.use('/admin', adminDestControllerRoutes)
// mainRouter.use('/admin', adminPackageRoutes);
mainRouter.use('/admin', adminThemeControllerRoutes);
mainRouter.use('/admin', adminPackageControllerRoutes);
mainRouter.use('/admin', adminHotelControllerRoutes);
mainRouter.use('/admin', adminItineraryControllerRoutes);


export default mainRouter;