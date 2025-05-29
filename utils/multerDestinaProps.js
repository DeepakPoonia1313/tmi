import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

// Multer configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createDynamicMulterMiddleware() {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const module = req.params.module || req.body.module || req.query.module;
            const moduleId = req.params.moduleId || req.body.moduleId || req.query.moduleId;

            if (!module || !moduleId) {
                return cb(new Error('Missing module or moduleId'));
            }

            const folderPath = path.join(__dirname, '..', 'public', 'uploads', module, moduleId);

            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }

            req.filePath = `uploads/${module}/${moduleId}`

            cb(null, folderPath);
        },

        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            const filename = file.fieldname + '-' + uniqueSuffix + ext;

            // Optional: Store relative full file path
            if (req.filePath) {
                req.filePath = path.join('/',req.filePath, filename); // Example: "upload/module/123/file-xyz.png"
            }

            cb(null, filename);
        }
    });

    return multer({ storage }); // <-- No fileFilter
}

export default createDynamicMulterMiddleware;


// const createDynamicMulterMiddleware = require('./middlewares/createMulterMiddleware');

// const upload = createDynamicMulterMiddleware();

// router.post('/upload/:module/:moduleId', upload.single('image'), (req, res) => {
//     res.json({
//         message: 'File uploaded successfully',
//         file: req.file,
//     });
// });

// module.exports = router;

// {
//     "fieldname": "image",
//     "originalname": "example-image.jpg",
//     "encoding": "7bit",
//     "mimetype": "image/jpeg",
//     "destination": "/absolute/path/to/project/upload/users/abc123",
//     "filename": "image-1715770632441-572839823.jpg",
//     "path": "/absolute/path/to/project/upload/users/abc123/image-1715770632441-572839823.jpg",
//     "size": 185739
//   }
