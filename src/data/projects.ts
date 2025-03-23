export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
  assigneeId?: string;
  dueDate?: Date;
  createdAt: Date;
};

export type Project = {
  id: string;
  code: string;
  name: string;
  description: string;
  startDate: Date | null;
  dueDate: Date | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  category: "DEVELOPMENT" | "DESIGN" | "MARKETING" | "RESEARCH" | "OTHER";
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
  updatedAt: Date;
  teamMembers?: TeamMember[];
  tasks?: Task[];
};

// Mock team members
const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Alex Johnson",
    email: "alex@example.com",
    role: "Project Manager",
  },
  {
    id: "2",
    name: "Sam Taylor",
    email: "sam@example.com",
    role: "Developer",
  },
  {
    id: "3",
    name: "Jordan Lee",
    email: "jordan@example.com",
    role: "Designer",
  },
  {
    id: "4",
    name: "Casey Williams",
    email: "casey@example.com",
    role: "Marketing Specialist",
  },
  {
    id: "5",
    name: "Morgan Brown",
    email: "morgan@example.com",
    role: "QA Engineer",
  }
];

// Generate mock tasks for a project
const generateMockTasks = (projectId: string, count: number = 5): Task[] => {
  const statuses: Task["status"][] = ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"];
  const tasks: Task[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const randomMemberIndex = Math.floor(Math.random() * teamMembers.length);
    
    tasks.push({
      id: `${projectId}-task-${i + 1}`,
      title: `Task ${i + 1} for Project ${projectId}`,
      description: `This is a mock task description for task ${i + 1}`,
      status: randomStatus,
      assigneeId: teamMembers[randomMemberIndex].id,
      dueDate: new Date(Date.now() + Math.random() * 15 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    });
  }
  
  return tasks;
};

// Assign random team members and tasks to projects
const assignTeamAndTasks = (projects: Project[]): Project[] => {
  return projects.map(project => {
    // Assign 2-4 random team members
    const memberCount = 2 + Math.floor(Math.random() * 3);
    const shuffledMembers = [...teamMembers].sort(() => 0.5 - Math.random());
    const projectMembers = shuffledMembers.slice(0, memberCount);
    
    // Generate 3-8 tasks for the project
    const taskCount = 3 + Math.floor(Math.random() * 6);
    const tasks = generateMockTasks(project.id, taskCount);
    
    return {
      ...project,
      teamMembers: projectMembers,
      tasks
    };
  });
};

export const projects: Project[] = assignTeamAndTasks([
  {
    id: "1",
    code: "LM-001",
    name: "Website Redesign",
    description: "Redesign the company website with modern UI/UX principles",
    startDate: new Date("2023-05-01"),
    dueDate: new Date("2023-06-30"),
    priority: "HIGH",
    category: "DESIGN",
    status: "IN_PROGRESS",
    updatedAt: new Date("2023-05-15")
  },
  {
    id: "2",
    code: "LM-002",
    name: "Mobile App Development",
    description: "Develop a mobile application for iOS and Android",
    startDate: new Date("2023-06-01"),
    dueDate: new Date("2023-09-30"),
    priority: "HIGH",
    category: "DEVELOPMENT",
    status: "NOT_STARTED",
    updatedAt: new Date("2023-05-20")
  },
  {
    id: "3",
    code: "LM-003",
    name: "Content Marketing Campaign",
    description: "Create and launch a content marketing campaign for Q3",
    startDate: new Date("2023-07-01"),
    dueDate: new Date("2023-09-30"),
    priority: "MEDIUM",
    category: "MARKETING",
    status: "NOT_STARTED",
    updatedAt: new Date("2023-05-25")
  },
  {
    id: "4",
    code: "LM-004",
    name: "Market Research",
    description: "Conduct market research for new product line",
    startDate: new Date("2023-04-15"),
    dueDate: new Date("2023-05-30"),
    priority: "MEDIUM",
    category: "RESEARCH",
    status: "COMPLETED",
    updatedAt: new Date("2023-05-30")
  },
  {
    id: "5",
    code: "LM-005",
    name: "Database Migration",
    description: "Migrate legacy database to new cloud infrastructure",
    startDate: new Date("2023-06-15"),
    dueDate: new Date("2023-07-15"),
    priority: "HIGH",
    category: "DEVELOPMENT",
    status: "NOT_STARTED",
    updatedAt: new Date("2023-06-01")
  },
  {
    id: "6",
    code: "LM-006",
    name: "Employee Training Program",
    description: "Develop training program for new software tools",
    startDate: new Date("2023-05-01"),
    dueDate: new Date("2023-06-15"),
    priority: "LOW",
    category: "OTHER",
    status: "IN_PROGRESS",
    updatedAt: new Date("2023-05-28")
  },
  {
    id: "7",
    code: "LM-007",
    name: "Social Media Strategy",
    description: "Develop and implement a new social media strategy",
    startDate: new Date("2023-06-01"),
    dueDate: new Date("2023-07-31"),
    priority: "MEDIUM",
    category: "MARKETING",
    status: "NOT_STARTED",
    updatedAt: new Date("2023-05-29")
  },
  {
    id: "8",
    code: "LM-008",
    name: "API Integration",
    description: "Integrate third-party APIs into our platform",
    startDate: new Date("2023-05-15"),
    dueDate: new Date("2023-06-30"),
    priority: "HIGH",
    category: "DEVELOPMENT",
    status: "IN_PROGRESS",
    updatedAt: new Date("2023-06-05")
  },
  {
    id: "9",
    code: "LM-009",
    name: "Security Audit",
    description: "Perform a comprehensive security audit",
    startDate: new Date("2023-07-01"),
    dueDate: new Date("2023-07-31"),
    priority: "HIGH",
    category: "DEVELOPMENT",
    status: "NOT_STARTED",
    updatedAt: new Date("2023-06-10")
  },
  {
    id: "10",
    code: "LM-010",
    name: "Customer Feedback Analysis",
    description: "Analyze and report on customer feedback from Q2",
    startDate: new Date("2023-06-01"),
    dueDate: new Date("2023-06-30"),
    priority: "LOW",
    category: "RESEARCH",
    status: "IN_PROGRESS",
    updatedAt: new Date("2023-06-15")
  }
]); 