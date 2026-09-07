import React, { useState, type FormEvent } from 'react'
import Navbar from '~/components/Navbar'
import FileUploader from '~/components/FileUploader'
import { usePuterStore } from '~/lib/puter'
import { useNavigate } from 'react-router'
import { convertPdfToImage } from '~/lib/pdfToImage'
import { extractResumeText } from '~/lib/resumeText'
import { generateUUID } from '~/lib/utils'
import { prepareInstructions } from '../../constants'
import { applySkillAnalysis } from '~/lib/skillMatching'
const Upload = () => {
    const { auth, fs, isLoading, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false)
    const [statusText, setStatusText] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }
    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: {
        companyName: string,
        jobTitle: string,
        jobDescription: string,
        file: File
    }) => {
        try {
            setIsProcessing(true);
            setStatusText('Extracting resume text...');
            const resume = await extractResumeText(file, (image) => ai.img2txt(image));
            console.info('Resume extraction:', {
                filename: file.name,
                mimeType: resume.mimeType,
                pageCount: resume.pageCount,
                textLength: resume.text.trim().length,
                usedOcr: resume.usedOcr,
            });
            if (!resume.text || resume.text.trim().length < 100) {
                return setStatusText(resume.error ?? 'Error: Could not extract enough resume text')
            }

            setStatusText('Uploading the file...');
            const uploadedFile = await fs.upload([file])
            if (!uploadedFile) return setStatusText('Error: Failed to upload file')
            const imageFile = file.type === 'application/pdf'
                ? await convertPdfToImage(file)
                : { file, imageUrl: '' }
            if (!imageFile.file) {
                return setStatusText(imageFile.error ?? 'Error: Failed to convert PDF')
            }
            setStatusText('Uploading Image')
            const uploadedImage = await fs.upload([imageFile.file]);
            if (!uploadedImage) return setStatusText('Error: failed to upload image')
            setStatusText('Preparing data...')
            const uuid = generateUUID();
            const data = {
                id:uuid,
                resumePath: uploadedFile.path,
                imagePath: uploadedImage.path,
                companyName,
                jobTitle,
                jobDescription,
                feedback:'',
            }
            await kv.set(`resume:${uuid}`, JSON.stringify(data));
            setStatusText('Analyzing...')

            const feedback = await ai.feedback(prepareInstructions({
                jobTitle,
                jobDescription,
                resumeText: resume.text,
            }));
            if(!feedback) return setStatusText('Error: Failed to analyze resume');
            const content = feedback.message?.content;
            const feedbackText = typeof content === 'string' ? content : content?.[0]?.text;
            if (typeof feedbackText !== 'string') {
                throw new Error('The AI returned an invalid response format')
            }

            const parsedFeedback = JSON.parse(feedbackText.replace(/^```(?:json)?\s*|\s*```$/g, '').trim())
            data.feedback = applySkillAnalysis(
                parsedFeedback,
                jobDescription,
                resume.text,
            )
            await kv.set(`resume:${uuid}`, JSON.stringify(data))
            setStatusText('Analysis Complete, redirecting...')
            console.log(data)
            navigate(`/resume/${uuid}`)
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : typeof error === 'string'
                    ? error
                    : JSON.stringify(error)
            console.error('Resume analysis failed:', error)
            setStatusText(`Error: ${message || 'Analysis failed'}`)
        }
    }
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if (!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string
        const jobTitle = formData.get('job-title') as string
        const jobDescription = formData.get('job-description') as string
        if (!file) return
        handleAnalyze({ companyName, jobTitle, jobDescription, file })
    }
    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />
            <section className="main-section">
                <div className="page-heading">
                    <h1>Smart Feedback for your dream job</h1>
                    {isProcessing ? (
                        <>
                            <h1>{statusText}</h1>
                            <img src="/images/resume-scan.gif" className='w-full' alt="" />
                        </>
                    ) : (
                        <>
                            <h2>Drop your resume for an ATS score and improvement tips</h2>
                        </>
                    )}
                    {!isProcessing && (
                        <form action="" id='upload-form' onSubmit={handleSubmit} className='flex flex-col gap-4 mt-8'>
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input type="text" name='company-name' placeholder='Company Name' id='company-name' />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input type="text" name='job-title' placeholder='Job Title' id='job-title' />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea rows={5} name='job-description' placeholder='Job Description' id='job-description' />
                            </div>
                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>
                            <button type="submit" className='primary-button'>Analyze Resume</button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}

export default Upload
