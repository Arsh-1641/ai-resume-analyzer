import Navbar from "~/components/Navbar";
import type { Route } from "./+types/home";
import ResumeCard from "~/components/ResumeCard";
import { usePuterStore } from "~/lib/puter";
import { Link, useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job" },
  ];
}

export default function Home() {
  const { auth, kv } = usePuterStore();
    const navigate = useNavigate();
   const [resumes, setResumes] = useState<Resume[]>([])
   const [loadingResumes, setLoadingResumes] = useState(false)
   useEffect(() => {
      if (!auth.isAuthenticated) return;

      const loadResumes = async () => {
        setLoadingResumes(true)
        try {
          const storedResumes = (await kv.list('resume:*', true)) as KVItem[]
          const parsedResumes = storedResumes?.map((resume) =>
            JSON.parse(resume.value) as Resume
          )
          setResumes(parsedResumes || [])
        } finally {
          setLoadingResumes(false)
        }
      }

      loadResumes()
   }, [auth.isAuthenticated, kv])
    useEffect(() => {
      if(!auth.isAuthenticated) navigate('/auth?next=/')
    }, [auth.isAuthenticated])

    
  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar />
    <section className="main-section">
      <div className="page-heading py-16">
        <h1>Track Your Applications & Resume Ratings</h1>
        {!loadingResumes && resumes?.length==0 ?(
          <h2>No Resumes found. upload your first resume to get feedback.</h2>
        ):(
          <h2>Review your submissions and check AI-powered feedback</h2>
        )}
      </div>
      {loadingResumes && (
        <div className="flex flex-col items-center justify-center">
          <img src="/images/resume-scan-2.gif" className="w-50" alt="" />
        </div>
      )}
    {!loadingResumes &&  resumes.length > 0 && <div className="resume-section grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
    {resumes.map((resume)=>(
      <ResumeCard key={resume.id} resume={resume} />
    ))}
    </div>}
    {!loadingResumes && resumes?.length ===0 && (
      <div>
        <Link className="primary-button w-fit text-xl font-semibold" to='/upload'>
        Upload Resume</Link>
      </div>
    )}
    </section>
  </main>;
}
