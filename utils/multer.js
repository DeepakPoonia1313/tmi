import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createMulterMiddleware() {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const module = req.body.module || req.params.module || 'hotel';
            const moduleId = req.body.moduleId || req.params.moduleId || 'hotel';

            if (!moduleId) return cb(new Error('Missing moduleId'));

            const folderPath = path.join(__dirname, '..', 'public', 'uploads', module, moduleId);

            fs.mkdirSync(folderPath, { recursive: true });
            cb(null, folderPath);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        }
    });

    const fileFilter = (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed!'), false);
    };

    return multer({ storage, fileFilter });
}

export default createMulterMiddleware;
