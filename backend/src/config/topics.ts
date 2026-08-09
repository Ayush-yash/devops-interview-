export interface Topic {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const topics: Topic[] = [
  {
    id: 'docker',
    name: 'Docker',
    description: 'Containerization basics, Dockerfiles, multi-stage builds, networking, and volumes.',
    icon: '🐳'
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    description: 'Orchestration, Pods, Deployments, Services, ConfigMaps, Secrets, and Ingress.',
    icon: '☸️'
  },
  {
    id: 'cicd',
    name: 'CI/CD (Jenkins/GitHub Actions)',
    description: 'Continuous Integration & Deployment pipelines, workflows, runners, and automation.',
    icon: '🚀'
  },
  {
    id: 'linux-shell',
    name: 'Linux & Shell Scripting',
    description: 'System administration, bash scripting, file systems, permissions, and process management.',
    icon: '🐧'
  },
  {
    id: 'git-vcs',
    name: 'Git & Version Control',
    description: 'Branching strategies, rebasing, merge conflict resolution, and git internals.',
    icon: '🌲'
  },
  {
    id: 'cloud-fundamentals',
    name: 'Cloud Fundamentals (AWS/Azure/GCP)',
    description: 'IAM, virtual machines, networking (VPCs), managed services, and serverless.',
    icon: '☁️'
  },
  {
    id: 'monitoring-logging',
    name: 'Monitoring & Logging',
    description: 'Prometheus, Grafana, ELK/EFK stack, alert rules, and metrics collection.',
    icon: '📈'
  },
  {
    id: 'iac',
    name: 'Infrastructure as Code (Terraform/Ansible)',
    description: 'Declarative resource provisioning, state management, modules, and configuration management.',
    icon: '🏗️'
  },
  {
    id: 'networking-basics',
    name: 'Networking Basics',
    description: 'TCP/IP, DNS, HTTP/HTTPS, SSL/TLS, firewalls, and load balancing.',
    icon: '🌐'
  },
  {
    id: 'mixed-random',
    name: 'Mixed / Random',
    description: 'A comprehensive interview pulling questions from all topics across the DevOps spectrum.',
    icon: '🎲'
  }
];
