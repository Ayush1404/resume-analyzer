import * as fs from 'node:fs/promises';
import * as dotenv from 'dotenv';
import { Workbook } from 'exceljs';
import pdfParse from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

interface ResumeData {
    Name?: string;
    Location?: string;
    Email?: string;
    PhoneNumber?: string;
    LinkedinID?: string;
    CurrentCompany?: string;
    Skills?: string;
    ExperienceInYears?: string;
    [key: string]: any;
}

const defaultFields = [
    "Name",
    "Location",
    "Email",
    "PhoneNumber",
    "LinkedinID",
    "CurrentCompany",
    "Skills",
    "ExperienceInYears",
];

const initialResumeData: ResumeData = {
    Name: "",
    Location: "",
    Email: "",
    PhoneNumber: "",
    LinkedinID: "",
    CurrentCompany: "",
    Skills: "",
    ExperienceInYears: "",
};

async function processResume(filePath: string, filename: string, extraFields?: string[]) {
    try {
        const fileData = await fs.readFile(filePath);
        const pdfData = await pdfParse(fileData);
        const fileContent = pdfData.text;
        const allFields = extraFields ? [...defaultFields, ...extraFields] : defaultFields;

        const prompt = `Given the text from the resume, extract the following fields : ${allFields.join(
            ","
        )}.If any data is not found add "No relevant data present" and respond in json format`;

        console.log(prompt + fileContent);

        const result = await model.generateContent(prompt + fileContent);
        const response = await result.response;
        let text = response.text();

         // Clean up the response string
        text = text.trim();
        // Remove all leading and trailing backticks
        text = text.replace(/^`+|`+$/g, "");
       text = text.replace(/^json|json$/i, "");

        try {
            console.log("Raw Text",text);
            const extractedData: ResumeData = JSON.parse(text || "{}");
            const parsedResponse = { ...initialResumeData, ...extractedData };
            return parsedResponse;

        } catch (err) {
            console.error("Error parsing JSON:", err);
             // Log the problematic text
             console.error("Failed to parse:", text);

            return initialResumeData
        }

    } catch (err) {
        console.error(`Error processing PDF: ${err}`);
        return initialResumeData;
    }
}


export async function generateExcelFile(
    resumeData: ResumeData[],
    fileName = "resume_data"
) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Resume Data");

    const headers = Object.keys(resumeData[0]);
    worksheet.addRow(headers);

    resumeData.forEach((row) => {
        const values = Object.values(row);
        worksheet.addRow(values);
    });

    const filePath = `${fileName}.xlsx`;
    await workbook.xlsx.writeFile(filePath);

    return filePath;
}

export { processResume };