export type SkillMatchType = "full" | "partial" | "missing";

export interface SkillMatch {
  skill: string;
  matched: boolean;
  required: boolean;
  matchType: SkillMatchType;
  evidence: string | null;
}

interface SkillDefinition {
  name: string;
  requiredPatterns: RegExp[];
  resumePatterns: RegExp[];
  partialResumePatterns?: RegExp[];
  preferredPatterns?: RegExp[];
}

const SKILLS: SkillDefinition[] = [
  { name: "JavaScript", requiredPatterns: [/\bjavascript\b/i], resumePatterns: [/\bjavascript\b/i] },
  { name: "TypeScript", requiredPatterns: [/\btypescript\b/i], resumePatterns: [/\btypescript\b/i] },
  { name: "React.js", requiredPatterns: [/\breact(?:\.js)?\b/i], resumePatterns: [/\breact(?:\.js)?\b/i] },
  { name: "Node.js", requiredPatterns: [/\bnode(?:\.js)?\b/i], resumePatterns: [/\bnode(?:\.js)?\b/i] },
  { name: "Express.js", requiredPatterns: [/\bexpress(?:\.js)?\b/i], resumePatterns: [/\bexpress(?:\.js)?\b/i] },
  { name: "REST APIs", requiredPatterns: [/\brest(?:ful)?\s+apis?\b/i], resumePatterns: [/\brest(?:ful)?\s+apis?\b/i] },
  { name: "HTML5", requiredPatterns: [/\bhtml5\b|\bhtml\b/i], resumePatterns: [/\bhtml5\b|\bhtml\b/i] },
  { name: "CSS3", requiredPatterns: [/\bcss3\b|\bcss\b/i], resumePatterns: [/\bcss3\b|\bcss\b/i] },
  { name: "Responsive Design", requiredPatterns: [/\bresponsive\s+(?:web\s+)?design|responsive\s+development/i], resumePatterns: [/\bresponsive\s+(?:web\s+)?(?:design|development|interfaces?)/i] },
  {
    name: "SQL databases",
    requiredPatterns: [/\bsql\s+databases?\b|\brelational\s+databases?\b/i],
    resumePatterns: [/\bpostgres(?:ql)?\b|\bmysql\b|\bsql\s+databases?\b|\brelational\s+databases?\b/i],
    partialResumePatterns: [/\bmysql\b|\bsql\s+databases?\b|\brelational\s+databases?\b/i],
  },
  {
    name: "PostgreSQL",
    requiredPatterns: [/\bpostgres(?:ql)?\b/i],
    resumePatterns: [/\bpostgres(?:ql)?\b/i],
    preferredPatterns: [/prefer(?:red|ably)?[^.\n]*\bpostgres(?:ql)?\b|\bpostgres(?:ql)?\b[^.\n]*prefer/i],
  },
  { name: "MongoDB", requiredPatterns: [/\bmongodb\b/i], resumePatterns: [/\bmongodb\b/i] },
  { name: "Git/GitHub", requiredPatterns: [/\bgit(?:\s*\/\s*|\s+or\s+)?github\b|\bgit\s*\/\s*github\b/i], resumePatterns: [/\bgit\b|\bgithub\b/i] },
  { name: "Data Structures & Algorithms", requiredPatterns: [/\bdata structures?\b|\balgorithms?\b|\bdsa\b/i], resumePatterns: [/\bdata structures?\b|\balgorithms?\b|\bdsa\b|\balgorithm\s+visualizer/i] },
  { name: "Agile/SDLC", requiredPatterns: [/\bagile\b|\bsdlc\b/i], resumePatterns: [/\bagile\b|\bsdlc\b|\bscrum\b/i] },
  { name: "AWS/Azure", requiredPatterns: [/\baws\b|\bazure\b|\bcloud\b/i], resumePatterns: [/\baws\b|\bazure\b/i], preferredPatterns: [/preferred|nice to have|plus|bonus/i] },
  { name: "Docker", requiredPatterns: [/\bdocker\b/i], resumePatterns: [/\bdocker\b/i], preferredPatterns: [/preferred|nice to have|plus|bonus/i] },
  { name: "CI/CD", requiredPatterns: [/\bci\s*\/\s*cd\b|continuous integration|continuous delivery/i], resumePatterns: [/\bci\s*\/\s*cd\b|continuous integration|continuous delivery/i], preferredPatterns: [/preferred|nice to have|plus|bonus/i] },
  { name: "Redis", requiredPatterns: [/\bredis\b/i], resumePatterns: [/\bredis\b/i], preferredPatterns: [/preferred|nice to have|plus|bonus/i] },
  { name: "Next.js", requiredPatterns: [/\bnext(?:\.js)?\b/i], resumePatterns: [/\bnext(?:\.js)?\b/i], preferredPatterns: [/preferred|nice to have|plus|bonus/i] },
  { name: "Jest", requiredPatterns: [/\bjest\b/i], resumePatterns: [/\bjest\b/i], preferredPatterns: [/preferred|nice to have|plus|bonus|test/i] },
  { name: "React Testing Library", requiredPatterns: [/react\s+testing\s+library/i], resumePatterns: [/react\s+testing\s+library/i], preferredPatterns: [/preferred|nice to have|plus|bonus|test/i] },
];

function getEvidence(resumeText: string, pattern: RegExp): string | null {
  const lines = resumeText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const line = lines.find((candidate) => pattern.test(candidate));
  return line ? line.slice(0, 240) : null;
}

function isPreferred(skill: SkillDefinition, jobDescription: string): boolean {
  if (skill.name === "PostgreSQL") {
    return /(?:prefer(?:red|ably)?|nice\s+to\s+have|optional|plus|bonus)[^\n.]*\bpostgres(?:ql)?\b/i.test(jobDescription);
  }

  const match = jobDescription.match(skill.requiredPatterns[0]);
  if (!match) return false;
  const precedingText = jobDescription.slice(Math.max(0, match.index! - 100), match.index!);
  return /prefer(?:red|ably)?|nice\s+to\s+have|optional|plus|bonus/i.test(precedingText);
}

export function analyzeSkills(jobDescription: string, resumeText: string): {
  matches: SkillMatch[];
  score: number;
} {
  const matches: SkillMatch[] = [];

  for (const skill of SKILLS) {
    if (!skill.requiredPatterns.some((pattern) => pattern.test(jobDescription))) continue;

    const preferred = isPreferred(skill, jobDescription);
    const fullPattern = skill.resumePatterns.find((pattern) => pattern.test(resumeText));
    const partialPattern = skill.partialResumePatterns?.find((pattern) => pattern.test(resumeText));
    const matchType: SkillMatchType = fullPattern
      ? "full"
      : partialPattern
        ? "partial"
        : "missing";
    const evidencePattern = fullPattern ?? partialPattern;

    matches.push({
      skill: skill.name,
      matched: matchType !== "missing",
      required: !preferred,
      matchType,
      evidence: evidencePattern ? getEvidence(resumeText, evidencePattern) : null,
    });
  }

  const required = matches.filter((match) => match.required);
  const preferred = matches.filter((match) => !match.required);
  const weightedAverage = (items: SkillMatch[]) => items.length === 0
    ? 0
    : items.reduce((total, match) => total + (match.matchType === "full" ? 1 : match.matchType === "partial" ? 0.5 : 0), 0) / items.length;
  const score = Math.round((weightedAverage(required) * 0.75 + weightedAverage(preferred) * 0.25) * 100);

  return { matches, score };
}

export function applySkillAnalysis<T extends {
  overallScore: number;
  ATS: { score: number };
  toneAndStyle: { score: number };
  content: { score: number };
  structure: { score: number };
  skills: Record<string, unknown>;
}>(feedback: T, jobDescription: string, resumeText: string): T {
  const analysis = analyzeSkills(jobDescription, resumeText);
  const matchedSkills = analysis.matches.filter((match) => match.matched);
  const missingSkills = analysis.matches.filter((match) => !match.matched);
  const skills = {
    ...feedback.skills,
    score: analysis.score,
    matchedSkills,
    missingSkills,
  };
  const overallScore = Math.round(
    analysis.score * 0.55 +
    feedback.ATS.score * 0.15 +
    feedback.content.score * 0.15 +
    feedback.structure.score * 0.1 +
    feedback.toneAndStyle.score * 0.05
  );

  return { ...feedback, skills, overallScore };
}
