import express from "express";
import multer from "multer";
import { parse } from 'path';
import cors from 'cors'
import { processResume } from "./resumeProcessor";
import * as dotenv from 'dotenv'


dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors())
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.post("/upload", upload.array("files"), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        res.status(400).send("No files were uploaded.");
    }

    const files = req.files as Express.Multer.File[];

    try {
      const results = await Promise.all(
          files.map(async (file) => {
             const parsedFileName = parse(file.originalname);
            const filenameWithoutExt = parsedFileName.name
          const result = await processResume(file.path, filenameWithoutExt,  req.body?.extraFields);
          return result;
        }));
        res.json({ results });
    } catch (error) {
       console.error("Error processing files:", error);
       res.status(500).send("Error processing files.");
    }
});

app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
});