interface Job {
  title: string;
  description: string;
  location: string;
  requiredSkills: string[];
}

interface Resume {
  id: string;
  companyName?: string;
  jobTitle?: string;
  imagePath: string;
  resumePath: string;
  feedback: Feedback;
}

interface Feedback {
  overallScore: number;
  ATS: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
    }[];
  };
  toneAndStyle: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
      explanation: string;
    }[];
  };
  content: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
      explanation: string;
    }[];
  };
  structure: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
      explanation: string;
    }[];
  };
  skills: {
    score: number;
    matchedSkills?: {
      skill: string;
      matched: true;
      required: boolean;
      matchType: "full" | "partial";
      evidence: string;
    }[];
    missingSkills?: {
      skill: string;
      matched: false;
      required: boolean;
      matchType: "missing";
      evidence: null;
    }[];
    tips: {
      type: "good" | "improve";
      tip: string;
      explanation: string;
    }[];
  };
}