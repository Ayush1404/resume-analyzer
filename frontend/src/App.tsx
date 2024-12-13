import React, { useState } from 'react';
import axios from 'axios';
import { useFormik } from 'formik';

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

interface AppProps {

}

const App:React.FC<AppProps> = () => {
     const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState<ResumeData[]>([]);

     const formik = useFormik({
         initialValues: {
             files: [] as File[],
            extraFields: ""
         },
        onSubmit: async (values) => {
             setUploading(true);
              const formData = new FormData();

           
           values.files.forEach((file)=> formData.append('files', file))
 
           formData.append('extraFields', values.extraFields)

            try {
                 const response = await axios.post('http://localhost:3001/upload', formData, {
                     headers: { 'Content-Type': 'multipart/form-data' },
                 });
                const { results } = response.data;
                 setResults(results);

                 const excelResponse = await axios.post(
                   'http://localhost:3001/excel',
                   {
                     resumeData: results,
                   },
                   {
                     responseType: 'blob',
                   }
                 );

                 const url = window.URL.createObjectURL(new Blob([excelResponse.data]));
                 const link = document.createElement('a');
                 link.href = url;
                 link.setAttribute('download', 'resume_data.xlsx');
                 document.body.appendChild(link);
                 link.click();
                
                  setUploading(false)
             } catch (error) {
                 console.error('Error uploading files:', error);
                  setUploading(false)
             }
        },
    });

    return (
         <div>
             <h1>Resume Processor</h1>

            <form onSubmit={formik.handleSubmit}>
                <input
                    type="file"
                    multiple
                    onChange={(event) => {
                       formik.setFieldValue('files', Array.from(event.currentTarget.files || []));
                    }}
                   
                />
                
                 <input
                     type="text"
                     placeholder="Add custom fields separated by commas (eg. Age, Nationality)"
                     onChange={(event) => formik.setFieldValue('extraFields', event.target.value)}
                    
                  />



                <button type="submit" disabled={uploading}>
                     {uploading ? 'Uploading...' : 'Upload Resumes'}
                 </button>
             </form>

             {results.length > 0 && (
                 <div>
                    <h2>Processed Results</h2>
                
                    {results.map((result, index)=> (
                        <div key={index}>
                             { Object.entries(result).map(([key, value])=>(
                                <p key={key}><strong>{key}:</strong> {value || "No data available"}</p>
                             ))}
                            <hr />
                        </div>
                    ))}
                </div>
              )}
         </div>
     );
};

export default App;