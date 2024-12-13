import * as fs from 'node:fs/promises';
import * as dotenv from 'dotenv'
import { Workbook } from 'exceljs';
import pdfParse from 'pdf-parse';
import { Ollama } from 'ollama';

dotenv.config();



interface ResumeData {
    Name?: string,
    Location?: string,
    Email?: string,
    PhoneNumber?: string,
    LinkedinID?: string,
    CurrentCompany?: string,
    Skills?: string,
    ExperienceInYears?: string,
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
]

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


async function processResume(filePath: string, filename:string, extraFields?: string[] ) {
    try{
        const fileData = await fs.readFile(filePath);
        const pdfData = await pdfParse(fileData);
        const fileContent = pdfData.text;
        const allFields = extraFields ? [...defaultFields, ...extraFields]: defaultFields
        const ollama = new Ollama({ host: 'http://127.0.0.1:11434' })

        const prompt = `Given the text from the resume, extract the following fields : ${allFields.join(',')} .If any data is not found add "No relevant data present" and respond in a string in json format , don't add anything else to response`

        const res = await ollama.chat({
            model: 'llama3.2',
            messages: [{ role: "user", content: prompt + fileContent }]
        });

        let extractedData: ResumeData= {};
    
        try {
            console.log(res.message.content)
            extractedData = JSON.parse(res.message.content || "{}");
        } catch (err) {
            console.log(err);
            extractedData = {};
        }
    
        const response =  { ...initialResumeData , ...extractedData} 
    
        return response;

    } catch (err){
        console.error(`Error parsing PDF: ${err}`)
         return initialResumeData;
    }

}


export async function generateExcelFile(resumeData :ResumeData[], fileName = 'resume_data') {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Resume Data');

    const headers = Object.keys(resumeData[0]);
    worksheet.addRow(headers);

    resumeData.forEach(row => {
        const values = Object.values(row)
        worksheet.addRow(values);
    })


    const filePath = `${fileName}.xlsx`;
    await workbook.xlsx.writeFile(filePath);

    return filePath;
}

export {processResume}