// Purged mock data
export interface Job {
  id: string
  company: string
  companyLogo: string
  title: string
  location: string
  salaryMin: number
  salaryMax: number
  type: string
  category: string
  experience: string
  skills: string[]
  postedAt: string
  featured?: boolean
}

export const jobs: Job[] = [];
