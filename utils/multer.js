// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// function createMulterMiddleware() {
//     const storage = multer.diskStorage({
//         destination: (req, file, cb) => {
//             const module = req.body.module || req.params.module || 'ndefined';
//             const moduleId = req.body.moduleId || req.params.moduleId || 'ndefined';

//             if (!moduleId) return cb(new Error('Missing moduleId'));

//             const folderPath = path.join(__dirname, '..', 'public', 'uploads', module, moduleId);

//             fs.mkdirSync(folderPath, { recursive: true });
//             cb(null, folderPath);
//         },
//         filename: (req, file, cb) => {
//             const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//             const ext = path.extname(file.originalname);
//             cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
//         }
//     });

//     const fileFilter = (req, file, cb) => {
//         if (file.mimetype.startsWith('image/')) cb(null, true);
//         else cb(new Error('Only image files are allowed!'), false);
//     };

//     return multer({ storage, fileFilter });
// }

// export default createMulterMiddleware;

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createMulterMiddleware() {
    const storage = multer.memoryStorage();

    const fileFilter = (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed!'), false);
    };

    const multerUpload = multer({ storage, fileFilter });

    // This function returns a middleware stack
    function fields(fieldDefinitions) {
        const multerMiddleware = multerUpload.fields(fieldDefinitions);

        const convertAndSave = async (req, res, next) => {
            try {
                const module = req.body.module || req.params.module || 'undefined';
                const moduleId = req.body.moduleId || req.params.moduleId || 'undefined';

                if (!req.files) return next();

                for (const fieldName in req.files) {
                    const files = req.files[fieldName];

                    for (const file of files) {
                        const folderPath = path.join(__dirname, '..', 'public', 'uploads', module, moduleId);
                        fs.mkdirSync(folderPath, { recursive: true });

                        const webpFilename = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
                        const outputPath = path.join(folderPath, webpFilename);

                        await sharp(file.buffer)
                            .webp({ quality: 80 })
                            .toFile(outputPath);

                        file.filename = webpFilename;
                        file.path = outputPath;
                        file.mimetype = 'image/webp';
                        file.originalname = webpFilename;
                    }
                }

                next();
            } catch (err) {
                next(err);
            }
        };

        // return combined middleware
        return [multerMiddleware, convertAndSave];
    }

    return { fields };
}

export default createMulterMiddleware;
