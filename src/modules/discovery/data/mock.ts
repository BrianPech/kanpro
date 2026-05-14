export interface Job {
  id: string
  company: string
  companyLogo: string
  title: string
  location: string
  salaryMin: number
  salaryMax: number
  type: "Full-time" | "Part-time" | "Contract" | "Freelance"
  category: "Design" | "Development" | "Marketing" | "Finance" | "Data"
  experience: "Junior" | "Mid" | "Senior" | "Lead"
  skills: string[]
  postedAt: string
  featured?: boolean
}

export interface Professional {
  id: string
  name: string
  avatar: string
  title: string
  location: string
  rating: number
  reviewCount: number
  category: "Design" | "Development" | "Marketing" | "Finance" | "Data"
  services: { name: string; rate: number }[]
  skills: string[]
  available: boolean
}

export const jobs: Job[] = [
  {
    id: "job-1",
    company: "Designify Studio",
    companyLogo: "DS",
    title: "Senior UI Designer",
    location: "Remote",
    salaryMin: 120000,
    salaryMax: 150000,
    type: "Full-time",
    category: "Design",
    experience: "Senior",
    skills: ["Figma", "Design Systems", "Prototyping", "User Research"],
    postedAt: "2d ago",
    featured: true,
  },
  {
    id: "job-2",
    company: "TechFlow Inc",
    companyLogo: "TF",
    title: "Full Stack Developer",
    location: "San Francisco, CA",
    salaryMin: 130000,
    salaryMax: 160000,
    type: "Full-time",
    category: "Development",
    experience: "Senior",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
    postedAt: "3d ago",
  },
  {
    id: "job-3",
    company: "GrowthPad",
    companyLogo: "GP",
    title: "Product Manager",
    location: "New York, NY",
    salaryMin: 110000,
    salaryMax: 140000,
    type: "Full-time",
    category: "Marketing",
    experience: "Mid",
    skills: ["Strategy", "Analytics", "Agile", "A/B Testing"],
    postedAt: "5d ago",
  },
  {
    id: "job-4",
    company: "ChainForge",
    companyLogo: "CF",
    title: "Smart Contract Engineer",
    location: "Remote",
    salaryMin: 150000,
    salaryMax: 200000,
    type: "Contract",
    category: "Development",
    experience: "Senior",
    skills: ["Solidity", "Web3", "Rust", "Ethereum"],
    postedAt: "1d ago",
    featured: true,
  },
  {
    id: "job-5",
    company: "BrandPulse",
    companyLogo: "BP",
    title: "Marketing Lead",
    location: "London, UK",
    salaryMin: 90000,
    salaryMax: 120000,
    type: "Full-time",
    category: "Marketing",
    experience: "Mid",
    skills: ["Growth Strategy", "Content", "SEO", "Analytics"],
    postedAt: "1w ago",
  },
  {
    id: "job-6",
    company: "DataPulse",
    companyLogo: "DP",
    title: "Data Analyst",
    location: "Remote",
    salaryMin: 80000,
    salaryMax: 110000,
    type: "Freelance",
    category: "Data",
    experience: "Junior",
    skills: ["SQL", "Python", "Tableau", "Excel"],
    postedAt: "4d ago",
  },
  {
    id: "job-7",
    company: "CloudStack",
    companyLogo: "CS",
    title: "DevOps Engineer",
    location: "Austin, TX",
    salaryMin: 140000,
    salaryMax: 180000,
    type: "Full-time",
    category: "Development",
    experience: "Senior",
    skills: ["AWS", "Kubernetes", "Terraform", "CI/CD"],
    postedAt: "6d ago",
  },
  {
    id: "job-8",
    company: "ExperienceLab",
    companyLogo: "EL",
    title: "UX Researcher",
    location: "Berlin, Germany",
    salaryMin: 100000,
    salaryMax: 130000,
    type: "Full-time",
    category: "Design",
    experience: "Mid",
    skills: ["User Research", "Usability Testing", "Figma", "Data Analysis"],
    postedAt: "2w ago",
  },
]

export const professionals: Professional[] = [
  {
    id: "pro-1",
    name: "Alex Chen",
    avatar: "AC",
    title: "Full-Stack Developer",
    location: "Remote",
    rating: 4.9,
    reviewCount: 32,
    category: "Development",
    services: [
      { name: "React Dashboard Development", rate: 80 },
      { name: "API Design & Implementation", rate: 100 },
      { name: "Database Architecture Consulting", rate: 120 },
    ],
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "GraphQL"],
    available: true,
  },
  {
    id: "pro-2",
    name: "Maria Garcia",
    avatar: "MG",
    title: "UI/UX Designer",
    location: "Mexico City",
    rating: 4.8,
    reviewCount: 27,
    category: "Design",
    services: [
      { name: "SaaS Design Systems", rate: 90 },
      { name: "Mobile App UI Design", rate: 85 },
      { name: "Design Thinking Workshops", rate: 150 },
    ],
    skills: ["Figma", "Design Systems", "Prototyping", "User Research", "Motion Design"],
    available: true,
  },
  {
    id: "pro-3",
    name: "James Wilson",
    avatar: "JW",
    title: "Smart Contract Developer",
    location: "Remote",
    rating: 5.0,
    reviewCount: 18,
    category: "Development",
    services: [
      { name: "Solidity Smart Contract Audits", rate: 200 },
      { name: "DeFi Protocol Development", rate: 180 },
      { name: "NFT Marketplace Architecture", rate: 160 },
    ],
    skills: ["Solidity", "Ethereum", "Web3.js", "Hardhat", "Rust"],
    available: true,
  },
  {
    id: "pro-4",
    name: "Sarah Kim",
    avatar: "SK",
    title: "Product Strategist",
    location: "New York, NY",
    rating: 4.7,
    reviewCount: 41,
    category: "Marketing",
    services: [
      { name: "Product Roadmap Planning", rate: 120 },
      { name: "Growth Strategy Consulting", rate: 140 },
      { name: "Market Research & Analysis", rate: 100 },
    ],
    skills: ["Strategy", "Analytics", "A/B Testing", "User Research", "ProductOps"],
    available: false,
  },
  {
    id: "pro-5",
    name: "David Park",
    avatar: "DP",
    title: "Data Engineer",
    location: "Seattle, WA",
    rating: 4.6,
    reviewCount: 23,
    category: "Data",
    services: [
      { name: "Data Pipeline Architecture", rate: 130 },
      { name: "Analytics Infrastructure Setup", rate: 110 },
      { name: "Machine Learning Model Deployment", rate: 160 },
    ],
    skills: ["Python", "SQL", "Spark", "Airflow", "AWS"],
    available: true,
  },
  {
    id: "pro-6",
    name: "Elena Torres",
    avatar: "ET",
    title: "Brand Designer",
    location: "Barcelona, Spain",
    rating: 4.9,
    reviewCount: 36,
    category: "Design",
    services: [
      { name: "Visual Identity Design", rate: 95 },
      { name: "Brand Guidelines Development", rate: 110 },
      { name: "Marketing Collateral Design", rate: 75 },
    ],
    skills: ["Figma", "Illustrator", "Typography", "Brand Strategy", "Packaging"],
    available: true,
  },
]
