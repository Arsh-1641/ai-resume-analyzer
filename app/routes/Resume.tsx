import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import ATS from '~/components/ATS'
import Details from '~/components/Details'
import Summary from '~/components/Summary'
import { usePuterStore } from '~/lib/puter'

export const meta = ()=>([
    {title:'Resumind | Review'},
    {name:'description', content:"Detailed overview of your resume"}
])

function Resume() {
  const { id } = useParams()
  const {auth,isLoading,fs,kv} = usePuterStore()
  const [imageUrl, setImageUrl] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const navigate = useNavigate();

  useEffect(() => {
      if(!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`)
    }, [isLoading])

  useEffect(() => {
    const loadResume = async()=>{
      const resume = await kv.get(`resume:${id}`)
      if(!resume) return;
      const data = JSON.parse(resume)
      const resumeBlob = await fs.read(data.resumePath)
      if(!resumeBlob) return;
      const pdfBlob = new Blob([resumeBlob], {type:'application/pdf'})
      const resumeUrl = URL.createObjectURL(pdfBlob)
      setResumeUrl(resumeUrl)
      const imageBlob = await fs.read(data.imagePath);
      if(!imageBlob) return;
      const imageUrl = URL.createObjectURL(imageBlob);
      setImageUrl(imageUrl)
      setFeedback(data.feedback)
      console.log({resumeUrl,imageUrl,feedback})
    }
    loadResume();
  }, [id])
  

  return (
    <main className='pt-0!'>
        <nav className='resume-nav'>
          <Link to='/' className='back-button'>
            <img src="/icons/back.svg" alt="logo" className='w-2.5 h-2.5' />
            <span className='text-gray-800 text-sm font-semibold'>Back to Homepage</span>
          </Link>
        </nav>
        <div className='flex flex-row w-full max-lg:flex-col-reverse'>
            <section className='feedback-section flex w-full min-w-0 min-h-screen bg-[url("/images/bg-small.svg")] bg-cover sticky top-0 items-center justify-center overflow-hidden px-4 lg:px-8' >
              {imageUrl && resumeUrl && (
                <div className='animate-in fade-in duration-1000 gradient-border max-sm:m-0 max-xl:h-fit w-full max-w-3xl min-w-0'>
                  <a href={resumeUrl} target='_blank'>
                    <img src={imageUrl}
                      className='block w-full h-auto max-h-[calc(100vh-8rem)] object-contain rounded-xl'
                      title='resume'
                    alt="" />
                  </a>
                </div>
              )}  
            </section>
            <section className="feedback-section">
              <h2 className='text-4xl text-black font-bold'>Resume Review</h2>
              {feedback ? (
                <div className='flex flex-col gap-8 animate-in fade-in duration-1000'>
                  <Summary feedback={feedback} />
                  <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
                  <Details feedback={feedback} />
                </div>
              ):(
                <img src="/images/resume-scan-2.gif" className='w-full' alt="" />
              )}
            </section>
        </div>
    </main>
  )
}

export default Resume
