import multer from "multer";
import { v4 as secure } from "@lukeed/uuid/secure";

const storage = multer.diskStorage({
    destination: function (_req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (_req, file, cb) {
        cb(null, secure() + "-" + file.originalname);
    },
});

export const upload = multer({ storage: storage, limits: 100 * 1024 * 1024 }); // 100 MB limit
