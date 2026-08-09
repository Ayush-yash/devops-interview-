import { callClaudeAndParseJSON } from './claudeClient';

export interface QuestionData {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  referenceAnswer?: string;
  keyPointsExpected?: string[];
}

type DifficultyPool = Record<'Easy' | 'Medium' | 'Hard', QuestionData[]>;

// ------------------------------------------------------------------
// Large mock question POOL — 5 unique questions per topic × difficulty
// Used when ANTHROPIC_API_KEY is not configured
// ------------------------------------------------------------------
const MOCK_POOL: Record<string, DifficultyPool> = {
  docker: {
    Easy: [
      {
        question: "What is the key architectural difference between a Docker Image and a Docker Container?",
        options: [
          "An image is a read-only blueprint; a container is an isolated runnable instance with a writable layer.",
          "An image can only run in production; a container runs in local development.",
          "A container contains the source code; an image contains only compiled binaries.",
          "Images require root access; containers run without any host kernel."
        ],
        correctOptionIndex: 0,
        explanation: "A Docker image is an immutable, read-only template. A container is a live instance of that image with a thin writable layer on top."
      },
      {
        question: "Which command is used to list all running Docker containers?",
        options: ["docker images", "docker ps", "docker ls --all", "docker inspect"],
        correctOptionIndex: 1,
        explanation: "`docker ps` shows running containers. Add `-a` flag to also see stopped ones."
      },
      {
        question: "What does the EXPOSE instruction in a Dockerfile do?",
        options: [
          "It opens a port on the host machine automatically.",
          "It maps container port to host port at runtime.",
          "It documents which port the container listens on, without actually publishing it.",
          "It forces the container to bind to all network interfaces."
        ],
        correctOptionIndex: 2,
        explanation: "EXPOSE is documentation only. The actual port publishing happens via `-p` flag in `docker run`."
      },
      {
        question: "What is the purpose of a .dockerignore file?",
        options: [
          "It prevents specific images from being pulled from Docker Hub.",
          "It excludes files/directories from the Docker build context to reduce image size.",
          "It stops containers from accessing specific host directories.",
          "It defines environment variables inside the container."
        ],
        correctOptionIndex: 1,
        explanation: ".dockerignore works like .gitignore — it tells the Docker daemon which files to exclude from the build context sent to the daemon."
      },
      {
        question: "Which Dockerfile instruction sets environment variables available at both build time and runtime?",
        options: ["ARG", "ENV", "SET", "CONFIG"],
        correctOptionIndex: 1,
        explanation: "ENV sets environment variables that persist in the final image and are available when the container runs. ARG is build-time only."
      }
    ],
    Medium: [
      {
        question: "Why are multi-stage Docker builds recommended for production CI/CD pipelines?",
        options: [
          "They automatically encrypt images during transmission to Docker Hub.",
          "They separate build-time dependencies from runtime assets, minimizing image size and attack surface.",
          "They allow running containers across multiple hosts without Kubernetes.",
          "They bypass Docker daemon socket permissions to speed up execution."
        ],
        correctOptionIndex: 1,
        explanation: "Multi-stage builds keep heavy build tools in early stages and copy only compiled artifacts into the final minimal runtime image."
      },
      {
        question: "A container restarts repeatedly with exit code 137. What is the most likely cause?",
        options: [
          "The container's CMD instruction is missing.",
          "The container process exceeded its memory limit and was OOM-killed.",
          "The Docker daemon lost connection to the registry.",
          "The container's base image is outdated."
        ],
        correctOptionIndex: 1,
        explanation: "Exit code 137 = 128 + 9 (SIGKILL). The Linux OOM killer sends SIGKILL when a process exceeds its cgroup memory limit."
      },
      {
        question: "What is the correct way to pass secrets to a Docker container in production?",
        options: [
          "Hardcode them in the Dockerfile ENV instruction.",
          "Pass them as plain text ARG values at build time.",
          "Use Docker Secrets (Swarm) or mount them as tmpfs/volume at runtime.",
          "Store them in a .env file inside the image."
        ],
        correctOptionIndex: 2,
        explanation: "Secrets should never be baked into images. Docker Secrets (Swarm) or external vaults mounted at runtime are the secure approach."
      },
      {
        question: "Which networking mode allows a Docker container to share the host's network stack directly?",
        options: ["bridge", "overlay", "host", "macvlan"],
        correctOptionIndex: 2,
        explanation: "In `--network=host` mode, the container bypasses Docker's virtual network and binds directly to the host's network interfaces — useful for high-throughput scenarios."
      },
      {
        question: "You need two containers to communicate on the same Docker host without exposing ports to the public. What is the best approach?",
        options: [
          "Use --network=host for both containers.",
          "Expose ports on 0.0.0.0 and use the host IP.",
          "Place both containers on a user-defined bridge network.",
          "Use --link flag (legacy) between the containers."
        ],
        correctOptionIndex: 2,
        explanation: "User-defined bridge networks provide automatic DNS resolution between containers by name, with no external exposure required."
      }
    ],
    Hard: [
      {
        question: "Which combination of Linux kernel features provides container process resource limits and syscall restriction?",
        options: [
          "IPTables and SELinux",
          "Control Groups (cgroups) and Seccomp profiles",
          "Namespaces and Systemd timers",
          "eBPF filters and Chroot jail"
        ],
        correctOptionIndex: 1,
        explanation: "cgroups enforce resource constraints (CPU, memory, I/O), while Seccomp restricts the syscalls a containerized process can invoke against the host kernel."
      },
      {
        question: "What is the primary security risk of mounting the Docker socket (/var/run/docker.sock) into a container?",
        options: [
          "It slows down container startup time.",
          "It grants the container full control over the Docker daemon, effectively giving it root on the host.",
          "It prevents the container from accessing external networks.",
          "It exposes the container's filesystem to all other containers."
        ],
        correctOptionIndex: 1,
        explanation: "The Docker socket gives root-level access to the host. Any container with this mount can spawn privileged containers, escape isolation, and compromise the entire host."
      },
      {
        question: "How does Docker's overlay2 storage driver manage image layers efficiently?",
        options: [
          "It copies all layers into a single flat filesystem on every container start.",
          "It uses Copy-on-Write (CoW) via overlayfs, stacking read-only layers with a thin writable top layer.",
          "It stores each layer as a compressed tar archive loaded into memory.",
          "It uses block-level deduplication across all images on the host."
        ],
        correctOptionIndex: 1,
        explanation: "overlay2 uses the Linux overlayfs kernel module to stack immutable image layers under a writable container layer, using CoW so unmodified files are never duplicated."
      },
      {
        question: "What happens to a container's writable layer data when the container is removed with `docker rm`?",
        options: [
          "The data is automatically persisted to the host filesystem.",
          "The data is committed back to the base image.",
          "The writable layer and all its data are permanently deleted.",
          "The data is moved to a Docker-managed archive volume."
        ],
        correctOptionIndex: 2,
        explanation: "Containers are ephemeral. When removed, the thin writable layer is permanently deleted. Only data in named volumes or bind mounts survives."
      },
      {
        question: "A production Docker build fails intermittently due to network timeouts during `apt-get install`. What is the best architectural fix?",
        options: [
          "Retry the build pipeline manually until it succeeds.",
          "Use a private artifact cache/proxy (e.g., Nexus, Artifactory) to cache apt packages.",
          "Increase the Docker build timeout flag to 3600 seconds.",
          "Switch to Alpine Linux which has smaller packages."
        ],
        correctOptionIndex: 1,
        explanation: "A private artifact proxy caches upstream packages internally. Builds no longer depend on external network availability, making them deterministic and fast."
      }
    ]
  },

  kubernetes: {
    Easy: [
      {
        question: "What is the smallest deployable computing unit in Kubernetes?",
        options: ["Docker Daemon", "Node", "Pod", "Cluster"],
        correctOptionIndex: 2,
        explanation: "A Pod encapsulates one or more containers that share network IP, storage, and runtime specs. It is the atomic unit Kubernetes schedules."
      },
      {
        question: "What is the role of the Kubernetes API Server?",
        options: [
          "It runs container workloads on worker nodes.",
          "It is the front-end for the Kubernetes control plane, handling all REST API requests.",
          "It monitors node health and restarts failed pods.",
          "It stores the cluster state in a local SQLite database."
        ],
        correctOptionIndex: 1,
        explanation: "The API Server validates and processes all API requests, then writes desired state to etcd. All control plane components communicate through it."
      },
      {
        question: "Which Kubernetes object ensures a specified number of Pod replicas are always running?",
        options: ["Service", "ConfigMap", "ReplicaSet", "Namespace"],
        correctOptionIndex: 2,
        explanation: "A ReplicaSet ensures the desired number of pod replicas are running at all times, replacing failed pods automatically."
      },
      {
        question: "What does a Kubernetes Service do?",
        options: [
          "It stores environment variables for pods.",
          "It provides a stable network endpoint to access a dynamic set of pods.",
          "It schedules pods onto specific nodes.",
          "It manages persistent disk volumes for stateful apps."
        ],
        correctOptionIndex: 1,
        explanation: "A Service gives a stable virtual IP and DNS name that load-balances traffic across a set of pods, even as pods are created and destroyed."
      },
      {
        question: "What is the purpose of a Kubernetes Namespace?",
        options: [
          "It defines the container runtime (Docker vs containerd).",
          "It provides a virtual cluster to logically isolate resources within a physical cluster.",
          "It sets resource limits on individual containers.",
          "It manages TLS certificates for ingress traffic."
        ],
        correctOptionIndex: 1,
        explanation: "Namespaces partition cluster resources between multiple teams or applications. They provide scope for names and enable RBAC and quota boundaries."
      }
    ],
    Medium: [
      {
        question: "When should you use a StatefulSet instead of a Deployment in Kubernetes?",
        options: [
          "When deploying stateless microservices needing rapid horizontal scaling.",
          "When pods require stable network identifiers and persistent storage across restarts.",
          "When running short-lived batch jobs that terminate after completion.",
          "When managing ingress routing and SSL certificate termination."
        ],
        correctOptionIndex: 1,
        explanation: "StatefulSets maintain ordinal pod indices (pod-0, pod-1) and dedicated PVC mappings — essential for databases like PostgreSQL or Redis."
      },
      {
        question: "A pod is stuck in `Pending` state. What are the most likely causes?",
        options: [
          "The pod's Docker image is corrupted.",
          "Insufficient cluster resources (CPU/memory) or no matching node satisfies the pod's scheduling constraints.",
          "The pod has too many environment variables configured.",
          "The kubelet service has crashed on all nodes."
        ],
        correctOptionIndex: 1,
        explanation: "Pending means the scheduler cannot place the pod. Common causes: insufficient CPU/memory, node selector/affinity mismatch, or taint/toleration issues."
      },
      {
        question: "What is the difference between a Kubernetes ConfigMap and a Secret?",
        options: [
          "ConfigMaps are cluster-scoped; Secrets are namespace-scoped.",
          "ConfigMaps store plain text config data; Secrets store base64-encoded sensitive data.",
          "ConfigMaps are immutable by default; Secrets are always mutable.",
          "Secrets are automatically encrypted by kubelet; ConfigMaps are not stored in etcd."
        ],
        correctOptionIndex: 1,
        explanation: "ConfigMaps hold non-sensitive config (env vars, files). Secrets hold sensitive data encoded in base64. Both are namespace-scoped; etcd encryption at rest is recommended for Secrets."
      },
      {
        question: "How does a Kubernetes Horizontal Pod Autoscaler (HPA) determine when to scale?",
        options: [
          "It monitors application logs for error rate spikes.",
          "It scales based on observed metrics (CPU/memory usage) versus configured thresholds.",
          "It scales based on the number of incoming HTTP requests per pod.",
          "It triggers scale-out on every new deployment rollout."
        ],
        correctOptionIndex: 1,
        explanation: "HPA queries the Metrics Server for resource utilization, compares it to target thresholds, and adjusts the replica count to maintain the desired utilization percentage."
      },
      {
        question: "What is the function of a Kubernetes Ingress resource?",
        options: [
          "It exposes pods on a NodePort for internal cluster communication.",
          "It manages HTTP/HTTPS routing rules from external traffic to cluster Services.",
          "It defines resource quotas for namespaces.",
          "It controls inter-pod communication via network policies."
        ],
        correctOptionIndex: 1,
        explanation: "An Ingress defines URL-path and hostname routing rules. An Ingress Controller (e.g., NGINX, Traefik) implements those rules at the cluster edge."
      }
    ],
    Hard: [
      {
        question: "How does the Kubernetes controller reconciliation loop resolve state drift?",
        options: [
          "It periodically restarts all nodes to purge stale cached configurations.",
          "It continuously watches etcd desired state and issues API calls to align actual cluster state.",
          "It delegates routing to external load balancers when CPU exceeds 90%.",
          "It rewrites deployment YAML files on disk when pod failures occur."
        ],
        correctOptionIndex: 1,
        explanation: "Controllers implement a watch-reconcile loop: observe current state, compare with desired state in etcd, compute a diff, and execute corrective API calls."
      },
      {
        question: "What is etcd's role in Kubernetes, and what happens to the cluster if etcd becomes unavailable?",
        options: [
          "etcd is an optional caching layer; cluster continues normally without it.",
          "etcd stores all cluster state; the control plane stops accepting mutations but running workloads continue.",
          "etcd manages container networking; pods lose network connectivity immediately.",
          "etcd schedules pods; all pending pods are evicted and rescheduled elsewhere."
        ],
        correctOptionIndex: 1,
        explanation: "etcd is the single source of truth for all cluster state. If etcd fails, the API server cannot persist changes. Existing running pods continue but no new scheduling or updates occur."
      },
      {
        question: "How do Kubernetes Pod Disruption Budgets (PDBs) protect application availability during node drains?",
        options: [
          "They pause deployments during maintenance windows automatically.",
          "They define the minimum number of pods that must remain available, blocking evictions that violate the constraint.",
          "They migrate pods to different namespaces during disruptions.",
          "They trigger automatic node scaling when pods are evicted."
        ],
        correctOptionIndex: 1,
        explanation: "PDBs instruct the eviction API to refuse pod eviction if doing so would drop the number of available pods below the `minAvailable` threshold, enabling safe rolling cluster maintenance."
      },
      {
        question: "What is the purpose of Kubernetes RBAC (Role-Based Access Control)?",
        options: [
          "It encrypts network traffic between pods using mutual TLS.",
          "It defines who (subjects) can perform which actions (verbs) on which resources in the cluster.",
          "It sets CPU and memory limits on container workloads.",
          "It controls which container images can be pulled from registries."
        ],
        correctOptionIndex: 1,
        explanation: "RBAC uses Roles/ClusterRoles (rules) and RoleBindings/ClusterRoleBindings (subject assignments) to implement least-privilege access to Kubernetes API resources."
      },
      {
        question: "A node shows `NotReady` in `kubectl get nodes`. What is your diagnostic sequence?",
        options: [
          "Immediately delete and recreate the node.",
          "Check kubelet status, node conditions (MemoryPressure/DiskPressure), system logs, and network connectivity to the API server.",
          "Reapply all deployment manifests to trigger rescheduling.",
          "Restart the kube-apiserver pod on the control plane."
        ],
        correctOptionIndex: 1,
        explanation: "NotReady usually means kubelet is down or cannot reach the API server. Check: `systemctl status kubelet`, `kubectl describe node <name>` for conditions, and review `/var/log/syslog` or journald on the node."
      }
    ]
  },

  "ci/cd": {
    Easy: [
      {
        question: "What does CI stand for in CI/CD?",
        options: ["Container Integration", "Continuous Integration", "Code Inspection", "Cluster Initialization"],
        correctOptionIndex: 1,
        explanation: "CI (Continuous Integration) is the practice of frequently merging developer code into a shared repository, followed by automated builds and tests."
      },
      {
        question: "What is the primary purpose of a CI/CD pipeline?",
        options: [
          "To manually deploy code to production servers.",
          "To automate the build, test, and deployment process for software changes.",
          "To monitor application performance in production.",
          "To manage container orchestration across multiple nodes."
        ],
        correctOptionIndex: 1,
        explanation: "A CI/CD pipeline automates the path from code commit to production, reducing manual errors and enabling rapid, reliable software delivery."
      },
      {
        question: "Which GitHub Actions trigger runs a workflow when code is pushed to any branch?",
        options: ["on: pull_request", "on: schedule", "on: push", "on: release"],
        correctOptionIndex: 2,
        explanation: "`on: push` triggers the workflow on every push event. You can restrict it to specific branches using `branches:` filter."
      },
      {
        question: "What is an artifact in the context of a CI/CD pipeline?",
        options: [
          "A security vulnerability found during scanning.",
          "A file or set of files produced during a pipeline run (e.g., compiled binary, Docker image).",
          "A rollback strategy for failed deployments.",
          "A YAML configuration for a Kubernetes deployment."
        ],
        correctOptionIndex: 1,
        explanation: "Artifacts are outputs of pipeline stages — binaries, test reports, Docker images — that can be passed between stages or archived for later use."
      },
      {
        question: "What does 'CD' stand for in a modern DevOps context?",
        options: [
          "Code Deployment only",
          "Continuous Delivery and/or Continuous Deployment",
          "Container Distribution",
          "Cluster Disruption"
        ],
        correctOptionIndex: 1,
        explanation: "CD can mean Continuous Delivery (code is always release-ready, deployed manually) or Continuous Deployment (every passing build is deployed to production automatically)."
      }
    ],
    Medium: [
      {
        question: "What is the difference between Continuous Delivery and Continuous Deployment?",
        options: [
          "Continuous Delivery uses containers; Continuous Deployment uses VMs.",
          "Continuous Delivery requires manual approval before production; Continuous Deployment releases automatically on passing tests.",
          "Continuous Delivery tests only unit tests; Continuous Deployment runs integration tests.",
          "They are the same concept with different naming conventions."
        ],
        correctOptionIndex: 1,
        explanation: "Continuous Delivery stops before production and requires a human gate. Continuous Deployment goes fully hands-off — every green build ships automatically."
      },
      {
        question: "How do you securely inject API keys into a GitHub Actions workflow without hardcoding them?",
        options: [
          "Store them as plain text in the workflow YAML file.",
          "Use GitHub Actions Secrets accessed via `${{ secrets.SECRET_NAME }}`.",
          "Pass them as environment variables in the Docker image.",
          "Encode them in Base64 and store in the repository README."
        ],
        correctOptionIndex: 1,
        explanation: "GitHub Actions Secrets are encrypted at rest and injected at runtime. They are never exposed in logs and cannot be read by forked repositories."
      },
      {
        question: "What is a blue-green deployment strategy?",
        options: [
          "Routing a small percentage of users to the new version while keeping most on the old one.",
          "Running two identical environments (blue=live, green=new) and switching traffic atomically.",
          "Deploying to staging first, then running smoke tests before promoting to production.",
          "Gradually replacing old pods with new ones in a rolling fashion."
        ],
        correctOptionIndex: 1,
        explanation: "Blue-green maintains two parallel environments. After validating the green (new) environment, the load balancer switches 100% of traffic instantly, enabling zero-downtime rollback."
      },
      {
        question: "What does a Docker image vulnerability scanner (e.g., Trivy) check for during a CI pipeline?",
        options: [
          "Syntax errors in Dockerfile instructions.",
          "Known CVEs in OS packages and language dependencies bundled in the image.",
          "Unused environment variables inside the container.",
          "Port conflicts between container services."
        ],
        correctOptionIndex: 1,
        explanation: "Trivy and similar tools compare installed packages against CVE databases (NVD, OSV), reporting vulnerabilities with severity levels (CRITICAL, HIGH, MEDIUM, LOW)."
      },
      {
        question: "Why is it important to cache dependencies (e.g., node_modules) between CI pipeline runs?",
        options: [
          "It prevents pipelines from running on weekends.",
          "It reduces pipeline execution time by reusing previously downloaded packages.",
          "It guarantees reproducible builds across all environments.",
          "It automatically upgrades packages to their latest versions."
        ],
        correctOptionIndex: 1,
        explanation: "Caching stores downloaded dependencies between runs. If package lockfiles haven't changed, the cache is restored and network downloads are skipped, dramatically reducing build time."
      }
    ],
    Hard: [
      {
        question: "How would you implement zero-downtime rolling updates for a stateful service in a CD pipeline?",
        options: [
          "Take the service offline, deploy the update, then bring it back online.",
          "Use canary releases with feature flags, blue-green switching at the load balancer, combined with readiness probes.",
          "Deploy all replicas simultaneously to minimize the total downtime window.",
          "Use a cron job to schedule the deployment during low-traffic hours."
        ],
        correctOptionIndex: 1,
        explanation: "Zero-downtime updates for stateful services require canary traffic splitting, readiness/liveness probes, schema backward-compatibility, and atomic LB switchover. No single approach fits all; a combination is required."
      },
      {
        question: "What is the security risk of using `latest` Docker image tags in a production CD pipeline?",
        options: [
          "Latest tags are rejected by most container registries.",
          "`latest` is mutable — a rebuild can silently change what gets deployed, breaking reproducibility and auditability.",
          "Latest images always have larger file sizes, slowing deployment.",
          "Using `latest` tags disables Docker layer caching in CI."
        ],
        correctOptionIndex: 1,
        explanation: "`latest` is not a version — it just points to the most recent build. If the base image is updated silently, your pipeline deploys a different image without any record. Always pin to immutable digests or SemVer tags."
      },
      {
        question: "How do you design a CI/CD pipeline for a monorepo containing 10 microservices to avoid rebuilding all services on every commit?",
        options: [
          "Run all pipelines in parallel every time to minimize total build duration.",
          "Use path-based filters (changed files detection) to trigger only the pipelines affected by each commit's diff.",
          "Deploy all services on every merge to ensure they remain in sync.",
          "Use a single shared Dockerfile that builds all services together."
        ],
        correctOptionIndex: 1,
        explanation: "Monorepo CI efficiency requires changed-path detection (git diff) to identify affected services and trigger only their pipelines — using tools like Nx, Turborepo, or custom `paths:` filters in GitHub Actions."
      },
      {
        question: "What is GitOps, and how does it differ from traditional push-based CD?",
        options: [
          "GitOps uses SSH keys instead of HTTPS for deployments.",
          "GitOps stores desired state in Git as the source of truth; agents pull and reconcile state continuously instead of pipelines pushing changes.",
          "GitOps requires manual approval for every production deployment.",
          "GitOps only works with Kubernetes and cannot be used with bare-metal servers."
        ],
        correctOptionIndex: 1,
        explanation: "In GitOps (Flux, ArgoCD), a Git repo is the single source of truth. Agents continuously reconcile actual cluster state with Git state. Push-based CD has pipelines imperatively pushing changes, which is harder to audit and reconcile."
      },
      {
        question: "How would you handle a failed production deployment that requires immediate rollback in a CD pipeline?",
        options: [
          "Manually SSH into production servers and revert the binary.",
          "Trigger automated rollback using the previous known-good image tag, verified by health checks and alerting.",
          "Re-run the failing pipeline until it succeeds.",
          "Restore the production database backup and redeploy the old code."
        ],
        correctOptionIndex: 1,
        explanation: "A mature CD rollback strategy: detect failure via health checks/canary metrics, automatically revert to the previous image tag (or Helm release), validate via readiness probes, and alert the team — all without manual SSH access."
      }
    ]
  },

  "linux & shell scripting": {
    Easy: [
      {
        question: "Which command displays the current working directory in a Linux shell?",
        options: ["ls", "cd", "pwd", "mkdir"],
        correctOptionIndex: 2,
        explanation: "`pwd` (Print Working Directory) outputs the absolute path of the current directory."
      },
      {
        question: "What does the `chmod 755 script.sh` command do?",
        options: [
          "Deletes the file and recreates it with default permissions.",
          "Sets read+write+execute for owner, and read+execute for group and others.",
          "Makes the file readable only by the root user.",
          "Compresses the file using the 755 algorithm."
        ],
        correctOptionIndex: 1,
        explanation: "chmod 755 = owner: rwx (7), group: r-x (5), others: r-x (5). The owner can read/write/execute; group and others can read and execute."
      },
      {
        question: "How do you view the last 50 lines of a log file in real time?",
        options: ["cat -50 /var/log/app.log", "tail -f -n 50 /var/log/app.log", "head -50 /var/log/app.log", "grep -50 /var/log/app.log"],
        correctOptionIndex: 1,
        explanation: "`tail -f` follows the file for new lines. `-n 50` starts output from the last 50 lines. Essential for real-time log monitoring."
      },
      {
        question: "What does the pipe operator `|` do in a shell command?",
        options: [
          "It redirects stdout to a file.",
          "It passes the output of one command as input to another.",
          "It runs two commands simultaneously in parallel.",
          "It appends output to the previous command's result."
        ],
        correctOptionIndex: 1,
        explanation: "The pipe `|` connects stdout of the left command to stdin of the right command, enabling powerful command composition like `ps aux | grep nginx`."
      },
      {
        question: "Which command finds all files larger than 100MB in the /var directory?",
        options: [
          "ls -lh /var | grep 100M",
          "find /var -size +100M",
          "du -sh /var | awk '$1 > 100'",
          "locate /var --size=100MB"
        ],
        correctOptionIndex: 1,
        explanation: "`find /var -size +100M` recursively searches /var for files exceeding 100 megabytes. The `+` means 'greater than'."
      }
    ],
    Medium: [
      {
        question: "A shell script exits with code 0 even after a command inside it fails. How do you fix this?",
        options: [
          "Add `#!/bin/sh` at the top instead of `#!/bin/bash`.",
          "Add `set -e` at the top to make the script exit immediately on any non-zero return code.",
          "Wrap every command in an if-else block.",
          "Use `echo $?` after every command to log the exit code."
        ],
        correctOptionIndex: 1,
        explanation: "`set -e` causes bash to exit immediately if any command returns a non-zero exit code. Combine with `set -o pipefail` to also catch failures in pipelines."
      },
      {
        question: "What is the difference between `>` and `>>` redirection operators?",
        options: [
          "`>` appends to a file; `>>` overwrites it.",
          "`>` overwrites (truncates) the file; `>>` appends to it.",
          "`>` redirects stderr; `>>` redirects stdout.",
          "They are identical — both append to the file."
        ],
        correctOptionIndex: 1,
        explanation: "`>` truncates the file and writes fresh content. `>>` appends to the existing file without destroying previous content."
      },
      {
        question: "How do you recursively search for the string 'ERROR' in all .log files under /var/log?",
        options: [
          "find /var/log -name '*.log' | cat | grep ERROR",
          "grep -r 'ERROR' /var/log --include='*.log'",
          "awk '/ERROR/' /var/log/**/*.log",
          "locate 'ERROR' /var/log/*.log"
        ],
        correctOptionIndex: 1,
        explanation: "`grep -r` recurses into directories. `--include='*.log'` filters to only .log files. This is the most efficient and correct approach."
      },
      {
        question: "What does `2>&1` mean in a shell command like `command > output.txt 2>&1`?",
        options: [
          "Run the command twice and merge both outputs.",
          "Redirect stderr (fd 2) to wherever stdout (fd 1) is currently going.",
          "Suppress all output from the command.",
          "Send stdout to fd 2 and stderr to fd 1."
        ],
        correctOptionIndex: 1,
        explanation: "`2>&1` means 'redirect file descriptor 2 (stderr) to the same destination as file descriptor 1 (stdout)'. Combined with `>`, both streams go to the same file."
      },
      {
        question: "A process is consuming 100% CPU on a Linux server. What is your diagnostic sequence?",
        options: [
          "Immediately kill all processes and restart the server.",
          "Use `top` or `htop` to identify the PID, then `ps aux`, `strace`, and system logs for root cause.",
          "Run `df -h` to check disk space and restart the process.",
          "Reboot the server and monitor if it recurs."
        ],
        correctOptionIndex: 1,
        explanation: "Use `top`/`htop` to find the offending PID. Then `ps aux | grep <pid>`, `strace -p <pid>` or `perf top` to inspect what the process is doing. Check `/var/log` for application errors."
      }
    ],
    Hard: [
      {
        question: "Explain how Linux `cgroups v2` differs from `cgroups v1` for container resource management.",
        options: [
          "cgroups v2 is deprecated; containers now use namespaces exclusively.",
          "cgroups v2 uses a unified hierarchy with atomic resource delegation, fixing coordination issues present in cgroups v1's split hierarchy.",
          "cgroups v2 requires kernel module installation; v1 is built into the kernel.",
          "cgroups v2 only controls memory; v1 manages all resource types."
        ],
        correctOptionIndex: 1,
        explanation: "cgroups v1 used separate hierarchies per controller (memory, cpu, etc.), causing inconsistencies. v2 introduces a single unified tree with proper delegation, enabling accurate resource accounting for containers."
      },
      {
        question: "How would you use `awk` to calculate the total memory used by all processes owned by user `www-data`?",
        options: [
          "grep www-data /proc/*/status | sum",
          "ps aux | awk '$1==\"www-data\" {sum+=$6} END {print sum/1024\" MB\"}'",
          "top -u www-data | awk '{print $10}'",
          "find /proc -user www-data -name status | xargs cat | grep VmRSS"
        ],
        correctOptionIndex: 1,
        explanation: "`ps aux` column $1=user, $6=RSS(KB). awk filters by user, accumulates RSS, and prints MB total. This is the idiomatic one-liner for per-user memory accounting."
      },
      {
        question: "A Linux server has hundreds of TIME_WAIT TCP connections. What is the recommended kernel tuning fix?",
        options: [
          "Disable the TCP stack and switch to UDP for all services.",
          "Set `net.ipv4.tcp_tw_reuse=1` and tune `net.ipv4.tcp_fin_timeout` in sysctl to reduce TIME_WAIT duration.",
          "Increase the system file descriptor limit with `ulimit -n`.",
          "Restart the network interface to flush all socket states."
        ],
        correctOptionIndex: 1,
        explanation: "TIME_WAIT sockets are normal but excessive counts indicate short-lived connections. `tcp_tw_reuse` allows reusing TIME_WAIT sockets for new connections; tuning `tcp_fin_timeout` reduces how long sockets stay in TIME_WAIT."
      },
      {
        question: "What is the difference between a hard link and a symbolic (soft) link in Linux?",
        options: [
          "Hard links work across filesystems; symbolic links do not.",
          "A hard link is a directory entry pointing to the same inode; a symlink is a separate file containing a path to the target.",
          "Symbolic links preserve file permissions; hard links do not.",
          "Hard links can only be created by root; symbolic links are available to all users."
        ],
        correctOptionIndex: 1,
        explanation: "Hard links share the same inode — deleting the original leaves the hard link intact. Symlinks are separate files storing a path; deleting the target breaks the symlink. Hard links cannot span filesystems or point to directories."
      },
      {
        question: "How does Linux handle the out-of-memory (OOM) condition, and how can you influence which process gets killed?",
        options: [
          "Linux halts all processes equally and swaps everything to disk.",
          "The OOM Killer scores processes by memory usage and oom_score_adj; you can protect critical processes by setting oom_score_adj to -1000.",
          "Linux restarts the system automatically when RAM is exhausted.",
          "The OOM Killer always kills the process with the highest CPU usage, not memory."
        ],
        correctOptionIndex: 1,
        explanation: "The OOM Killer assigns each process an oom_score based on memory footprint. Setting `/proc/<pid>/oom_score_adj` to -1000 makes the process immune. Positive values make it more likely to be killed."
      }
    ]
  },

  git: {
    Easy: [
      {
        question: "What does `git clone` do?",
        options: [
          "Creates a new empty repository in the current directory.",
          "Creates a local copy of a remote repository including its full history.",
          "Pushes local commits to a remote repository.",
          "Merges all remote branches into the current branch."
        ],
        correctOptionIndex: 1,
        explanation: "`git clone` copies the entire remote repository — all commits, branches, and tags — to your local machine and sets up the remote as `origin`."
      },
      {
        question: "What is a Git branch?",
        options: [
          "A saved snapshot of the repository at a specific point in time.",
          "A lightweight moveable pointer to a commit, enabling parallel lines of development.",
          "A copy of the entire repository stored on a remote server.",
          "An archived version of the codebase for release tracking."
        ],
        correctOptionIndex: 1,
        explanation: "A branch is simply a named pointer to a commit. It moves forward automatically as you make new commits, enabling isolated feature development."
      },
      {
        question: "Which command stages all modified and new files for the next commit?",
        options: ["git commit -a", "git push --all", "git add .", "git stash"],
        correctOptionIndex: 2,
        explanation: "`git add .` stages all changes in the current directory and subdirectories. Use `git add -p` for interactive staging of specific hunks."
      },
      {
        question: "What does `git status` show?",
        options: [
          "The full commit history of the repository.",
          "The current branch, staged changes, unstaged changes, and untracked files.",
          "A diff of all changes since the last release tag.",
          "The remote server's current branch state."
        ],
        correctOptionIndex: 1,
        explanation: "`git status` reports which files are staged for commit, which are modified but not staged, and which are untracked — giving you a snapshot of the working tree."
      },
      {
        question: "What is the purpose of `.gitignore`?",
        options: [
          "It prevents specific users from pushing to the repository.",
          "It lists file patterns that Git should not track or include in commits.",
          "It defines merge conflict resolution strategies.",
          "It configures remote repository access credentials."
        ],
        correctOptionIndex: 1,
        explanation: "`.gitignore` tells Git to ignore matching files/directories (e.g., `node_modules/`, `*.env`). Ignored files won't appear in `git status` or be accidentally committed."
      }
    ],
    Medium: [
      {
        question: "What is the difference between `git merge` and `git rebase`?",
        options: [
          "Merge creates a new commit combining histories; rebase moves your commits onto the target branch, producing a linear history.",
          "Rebase deletes the source branch; merge keeps both branches active.",
          "Merge is for remote branches only; rebase works on local branches only.",
          "They are identical operations with different command syntax."
        ],
        correctOptionIndex: 0,
        explanation: "`git merge` preserves the full branching history with a merge commit. `git rebase` replays your commits on top of the target, rewriting SHAs for a cleaner linear history — but should never be used on shared branches."
      },
      {
        question: "How do you undo the last commit without losing the file changes?",
        options: [
          "git revert HEAD",
          "git reset --soft HEAD~1",
          "git reset --hard HEAD~1",
          "git checkout HEAD~1"
        ],
        correctOptionIndex: 1,
        explanation: "`git reset --soft HEAD~1` moves the HEAD pointer back one commit but keeps all changes staged. `--hard` would also discard file changes."
      },
      {
        question: "What is a Git tag, and when would you use an annotated tag over a lightweight tag?",
        options: [
          "Tags are temporary bookmarks; annotated tags expire automatically.",
          "Both are permanent refs; annotated tags include a message, author, and GPG signature — preferred for release markers.",
          "Lightweight tags persist across clones; annotated tags are local-only.",
          "Annotated tags are created automatically by GitHub on pull request merge."
        ],
        correctOptionIndex: 1,
        explanation: "Annotated tags are full Git objects with metadata and can be signed (GPG). Use them for release versions (e.g., `v1.2.0`). Lightweight tags are just a named pointer — useful for temporary local marks."
      },
      {
        question: "How does a pull request (PR) / merge request (MR) workflow improve code quality?",
        options: [
          "It automatically deploys code to production before review.",
          "It enables peer code review, automated CI checks, and discussion before merging into the main branch.",
          "It prevents any developer from pushing directly to feature branches.",
          "It compresses commit history into a single commit on merge."
        ],
        correctOptionIndex: 1,
        explanation: "PRs/MRs enforce a review gate: code is reviewed by peers, CI pipelines run tests and linters, and only approved, green code is merged — significantly reducing defects reaching main."
      },
      {
        question: "What does `git cherry-pick <commit-hash>` do?",
        options: [
          "Deletes a specific commit from the repository history.",
          "Applies the changes introduced by a specific commit onto the current branch.",
          "Creates a new branch starting from the specified commit.",
          "Squashes multiple commits into one using the specified commit as a base."
        ],
        correctOptionIndex: 1,
        explanation: "`git cherry-pick` applies the diff of a specific commit to the current branch as a new commit. Useful for backporting bug fixes to release branches without merging all changes."
      }
    ],
    Hard: [
      {
        question: "A developer accidentally committed secrets to the main branch and pushed to GitHub. What is the correct remediation sequence?",
        options: [
          "Delete the commit with `git reset --hard` and force-push; no further action needed.",
          "Immediately rotate/revoke the secrets, use `git filter-repo` to purge the commit from all history, force-push, and notify all collaborators to re-clone.",
          "Revert the commit with `git revert` and rotate the secrets.",
          "Archive the repository and create a fresh copy without the commit."
        ],
        correctOptionIndex: 1,
        explanation: "Secrets in Git history are permanently exposed until history is rewritten. Rotation must happen immediately (the secret is already compromised). `git filter-repo` rewrites all commits. Force-pushing doesn't remove it from forks/clones — all collaborators must re-clone."
      },
      {
        question: "How does Git's three-way merge resolve conflicts, and what is the role of the common ancestor?",
        options: [
          "Git picks the newer file automatically without inspecting the content.",
          "Git compares both branch tips against their common ancestor (merge base), accepting non-conflicting changes from each side and marking conflicts where both sides diverged.",
          "Git always accepts changes from the branch being merged in, overwriting the base.",
          "Git uses file timestamps to decide which version to keep."
        ],
        correctOptionIndex: 1,
        explanation: "Three-way merge uses the merge base (LCA commit) as reference. If only one side changed a hunk, that change is accepted automatically. If both sides changed the same hunk differently, a conflict is marked for manual resolution."
      },
      {
        question: "What is the `git reflog` and when is it critical for recovery?",
        options: [
          "It shows the diff of all uncommitted file changes.",
          "It records every movement of HEAD (including resets and rebases), enabling recovery of commits that appear lost after destructive operations.",
          "It displays remote tracking branch history.",
          "It logs all git push operations to the remote server."
        ],
        correctOptionIndex: 1,
        explanation: "The reflog is a local journal of HEAD movements. After an accidental `git reset --hard` or rebase gone wrong, `git reflog` reveals the SHA of the previous HEAD, allowing `git reset --hard <sha>` recovery."
      },
      {
        question: "Describe the Git branching strategy used in GitFlow and its main trade-off compared to trunk-based development.",
        options: [
          "GitFlow uses only one branch; trunk-based uses infinite branches.",
          "GitFlow uses long-lived feature/release/hotfix branches enabling structured releases, but increases merge conflicts and slows delivery compared to trunk-based short-lived branches with feature flags.",
          "GitFlow is only suitable for open-source projects; trunk-based for enterprise.",
          "GitFlow automates deployments; trunk-based requires manual releases."
        ],
        correctOptionIndex: 1,
        explanation: "GitFlow provides clear release management (develop, release, hotfix branches) but long-lived branches diverge significantly, causing painful merges. Trunk-based development with feature flags enables continuous integration, smaller diffs, and faster delivery."
      },
      {
        question: "How does `git bisect` work, and in what scenario would you use it?",
        options: [
          "It splits a large commit into smaller ones automatically.",
          "It performs a binary search through commit history, checking out commits to help pinpoint the exact commit that introduced a regression.",
          "It merges every second commit to reduce history size.",
          "It identifies duplicate commits across branches for cleanup."
        ],
        correctOptionIndex: 1,
        explanation: "`git bisect start` marks a bad commit and a known-good commit. Git binary-searches the history, checking out midpoint commits. You mark each as good/bad until the first bad commit is identified — extremely efficient for finding regressions in large histories."
      }
    ]
  },

  cloud: {
    Easy: [
      {
        question: "What is the fundamental concept of cloud computing that allows you to pay only for resources you actually use?",
        options: [
          "Reserved Instances pricing",
          "Pay-as-you-go (on-demand) pricing model",
          "Spot instance billing",
          "Committed use discounts"
        ],
        correctOptionIndex: 1,
        explanation: "The pay-as-you-go model is a core cloud principle: you are billed for actual consumption (compute hours, storage GB, API calls) rather than paying upfront for fixed capacity."
      },
      {
        question: "What is the difference between IaaS, PaaS, and SaaS cloud service models?",
        options: [
          "IaaS = infrastructure only; PaaS = infrastructure + OS + runtime; SaaS = fully managed application.",
          "IaaS manages application code; PaaS manages networking; SaaS manages databases.",
          "They are three names for the same cloud delivery model used by different providers.",
          "IaaS is public cloud; PaaS is private cloud; SaaS is hybrid cloud."
        ],
        correctOptionIndex: 0,
        explanation: "IaaS (e.g., EC2) gives you raw compute/network/storage. PaaS (e.g., Elastic Beanstalk, App Engine) manages the runtime platform. SaaS (e.g., Gmail, Salesforce) delivers a fully managed application — you only manage your data."
      },
      {
        question: "What is an AWS S3 bucket primarily used for?",
        options: [
          "Running containerized applications",
          "Storing and retrieving any amount of unstructured object data",
          "Hosting relational databases",
          "Managing DNS records for domains"
        ],
        correctOptionIndex: 1,
        explanation: "Amazon S3 is an object storage service designed for high durability (11 nines) and scalability. It stores files, backups, logs, static website assets, and any binary data as objects in buckets."
      },
      {
        question: "What is a cloud region in AWS/Azure/GCP?",
        options: [
          "A group of data centers within the same building.",
          "A geographic area containing multiple isolated availability zones with separate power and networking.",
          "A virtual network segment within a single data center.",
          "A reserved pool of compute resources for enterprise customers."
        ],
        correctOptionIndex: 1,
        explanation: "A region is a physical location around the world (e.g., us-east-1, eastus). Each region contains multiple Availability Zones (AZs) that are isolated from each other to provide fault tolerance."
      },
      {
        question: "What is the purpose of a cloud VPC (Virtual Private Cloud)?",
        options: [
          "To provide a dedicated physical server for a single tenant.",
          "To create a logically isolated private network within the public cloud where you control IP ranges, subnets, and routing.",
          "To enable serverless function execution without infrastructure management.",
          "To replicate data across multiple cloud providers simultaneously."
        ],
        correctOptionIndex: 1,
        explanation: "A VPC is your own private section of the cloud with full control over IP address ranges (CIDR), subnets (public/private), route tables, internet gateways, and security groups."
      }
    ],
    Medium: [
      {
        question: "What is the difference between vertical scaling (scale-up) and horizontal scaling (scale-out) in cloud architecture?",
        options: [
          "Vertical scaling adds more servers; horizontal scaling upgrades existing servers.",
          "Vertical scaling increases the size of a single instance; horizontal scaling adds more instances behind a load balancer.",
          "Vertical scaling is only available in AWS; horizontal is only for GCP.",
          "They are equivalent approaches with different costs."
        ],
        correctOptionIndex: 1,
        explanation: "Vertical scaling (bigger instance) has a ceiling and requires downtime. Horizontal scaling (more instances + load balancer) is theoretically unlimited and more resilient. Cloud-native applications are designed for horizontal scaling."
      },
      {
        question: "How does AWS IAM enforce least-privilege access for cloud resources?",
        options: [
          "By assigning all permissions to a single admin user who grants access manually.",
          "By using policies that explicitly grant only the specific actions and resources a principal needs, with all other actions denied by default.",
          "By using VPC security groups to control API access.",
          "By rotating access keys every 24 hours automatically."
        ],
        correctOptionIndex: 1,
        explanation: "IAM uses a default-deny model: unless an action is explicitly allowed by an attached policy, it is denied. Least-privilege means granting only the minimum permissions required for a task."
      },
      {
        question: "What is the difference between an AWS Security Group and a Network ACL (NACL)?",
        options: [
          "Security Groups are stateless; NACLs are stateful.",
          "Security Groups are stateful and operate at instance level; NACLs are stateless and operate at subnet level, requiring explicit inbound and outbound rules.",
          "NACLs only control outbound traffic; Security Groups only control inbound traffic.",
          "They are identical — Security Groups replaced NACLs in modern AWS."
        ],
        correctOptionIndex: 1,
        explanation: "Security Groups track connection state (return traffic is automatically allowed). NACLs evaluate every packet independently (stateless) and act as a coarse-grained subnet firewall with ordered allow/deny rules."
      },
      {
        question: "What is an AWS Auto Scaling Group, and how does it respond to increased load?",
        options: [
          "It manually increases instance size when CPU exceeds a threshold.",
          "It automatically adds EC2 instances when scaling triggers fire (CPU, custom metrics) and removes them when load drops, maintaining defined min/max/desired counts.",
          "It distributes traffic across multiple regions using Route 53.",
          "It caches frequently accessed data in memory to reduce compute load."
        ],
        correctOptionIndex: 1,
        explanation: "An ASG maintains a fleet of EC2 instances. CloudWatch alarms trigger scale-out (add instances) or scale-in (remove instances) policies. The ASG respects min/desired/max boundaries and replaces unhealthy instances automatically."
      },
      {
        question: "What is the difference between AWS RDS Multi-AZ and Read Replicas?",
        options: [
          "Multi-AZ is for read scaling; Read Replicas provide high availability.",
          "Multi-AZ provides synchronous replication for automatic failover (HA); Read Replicas use asynchronous replication for read scaling and offloading query load.",
          "They are the same feature with different naming in different regions.",
          "Multi-AZ requires manual failover; Read Replicas failover automatically."
        ],
        correctOptionIndex: 1,
        explanation: "Multi-AZ maintains a synchronous standby replica in a different AZ; on primary failure, AWS automatically promotes it (no data loss). Read Replicas replicate asynchronously and are used to distribute read traffic — they are not automatic failover targets."
      }
    ],
    Hard: [
      {
        question: "How would you design a multi-region active-active architecture on AWS for an e-commerce platform with an RTO of <1 minute?",
        options: [
          "Deploy identical stacks in two regions; use Route 53 health checks with failover routing to switch traffic on failure.",
          "Deploy active stacks in multiple regions with Route 53 latency routing, DynamoDB Global Tables for multi-master replication, S3 Cross-Region Replication, and CloudFront for edge caching — with automated health-check-based traffic shifting.",
          "Use a single region with Multi-AZ RDS and trust AWS SLAs for RTO.",
          "Use S3 cross-region replication only for static assets; use a single database region."
        ],
        correctOptionIndex: 1,
        explanation: "Active-active multi-region requires: multi-master data stores (DynamoDB Global Tables), distributed session management, Route 53 health checks with weighted/latency routing, CDN edge caching, and idempotent API design. RTO <1min is achievable only with pre-warmed infrastructure in both regions."
      },
      {
        question: "Explain the shared responsibility model in cloud security and give an example of what the customer is responsible for on AWS EC2.",
        options: [
          "AWS is responsible for everything; the customer only manages application code.",
          "AWS manages security OF the cloud (hardware, facilities, hypervisor); the customer manages security IN the cloud (OS patching, IAM, encryption, data, application security on EC2).",
          "The customer manages networking; AWS manages compute and storage security.",
          "Security responsibility is split 50/50 with no clear boundary."
        ],
        correctOptionIndex: 1,
        explanation: "On EC2, AWS secures the physical host and hypervisor. The customer is responsible for: OS patching, security group configuration, IAM roles, encryption of data at rest/transit, and application-level security — the entire guest OS stack upward."
      },
      {
        question: "What is AWS PrivateLink, and why is it preferred over VPC Peering for service-to-service connectivity?",
        options: [
          "PrivateLink is a VPN tunnel; VPC Peering is a direct fiber connection.",
          "PrivateLink exposes services as private endpoints without routing traffic through the internet or requiring overlapping CIDR resolution — unlike VPC Peering, which requires non-overlapping CIDRs and transitive routing workarounds.",
          "VPC Peering supports cross-account; PrivateLink is limited to single accounts.",
          "PrivateLink is a managed NAT gateway; VPC Peering bypasses NAT."
        ],
        correctOptionIndex: 1,
        explanation: "PrivateLink creates interface endpoints backed by NLBs, keeping traffic on the AWS backbone. VPC Peering has limitations: no transitive routing, overlapping CIDR conflicts. PrivateLink scales better for service mesh patterns (e.g., SaaS provider exposing endpoints to many customers)."
      },
      {
        question: "How does AWS Lambda handle cold starts, and what strategies reduce their impact in latency-sensitive workloads?",
        options: [
          "Cold starts don't exist in Lambda; all functions use warm containers.",
          "Cold starts occur when Lambda provisions a new execution environment (loading code, runtime initialization). Mitigations: Provisioned Concurrency, keeping functions warm with scheduled pings, reducing package size, and using lighter runtimes (Node.js vs. Java).",
          "Cold starts only occur during Lambda layer updates.",
          "Increasing Lambda memory eliminates cold starts entirely."
        ],
        correctOptionIndex: 1,
        explanation: "A cold start happens when there's no idle execution environment — Lambda must download code, start the runtime, and initialize the handler. Provisioned Concurrency pre-warms environments, eliminating cold starts for that concurrency level. Minimizing package size and using faster runtimes (Go, Node) also reduces initialization time."
      },
      {
        question: "Your cloud bill spiked 300% this month. Describe your systematic approach to cost anomaly detection and optimization.",
        options: [
          "Immediately delete unused resources without investigation.",
          "Use Cost Explorer and CloudWatch Billing Alarms to identify the service/resource driving cost, check for runaway Auto Scaling or data transfer charges, then apply rightsizing, Reserved Instances, Savings Plans, and lifecycle policies.",
          "Switch all workloads to spot instances immediately.",
          "Contact AWS support and wait for a billing adjustment."
        ],
        correctOptionIndex: 1,
        explanation: "Systematic approach: (1) AWS Cost Explorer to identify anomalous service/account/tag; (2) CloudTrail to find who created expensive resources; (3) Trusted Advisor for rightsizing recommendations; (4) Apply: Reserved Instances for steady-state, Spot for fault-tolerant workloads, S3 lifecycle rules, NAT Gateway review for data transfer costs."
      }
    ]
  },

  monitoring: {
    Easy: [
      {
        question: "What is the difference between monitoring and observability?",
        options: [
          "Monitoring is for production; observability is for development environments only.",
          "Monitoring tracks predefined metrics to detect known failures; observability uses metrics, logs, and traces to understand and debug any system state — including unknown unknowns.",
          "Observability only applies to distributed systems; monitoring works for all systems.",
          "They are interchangeable terms describing the same practice."
        ],
        correctOptionIndex: 1,
        explanation: "Monitoring asks 'Is the system healthy?' using predefined dashboards/alerts. Observability — via the three pillars (metrics, logs, traces) — lets you ask arbitrary questions to diagnose any failure, even previously unseen ones."
      },
      {
        question: "What are the three pillars of observability?",
        options: [
          "CPU, Memory, Disk",
          "Metrics, Logs, and Traces",
          "Alerts, Dashboards, and Reports",
          "Prometheus, Grafana, and Jaeger"
        ],
        correctOptionIndex: 1,
        explanation: "The three pillars are: Metrics (time-series numeric data), Logs (discrete event records with context), and Traces (end-to-end request journey across distributed services)."
      },
      {
        question: "What is Prometheus primarily used for in a DevOps stack?",
        options: [
          "Centralized log aggregation and search.",
          "Collecting and storing time-series metrics from instrumented applications and infrastructure.",
          "Distributed request tracing across microservices.",
          "Alerting only — it does not store any data."
        ],
        correctOptionIndex: 1,
        explanation: "Prometheus scrapes metrics from /metrics endpoints (pull model), stores them as time-series data with labels, and provides PromQL for querying. It integrates with Alertmanager for alert routing."
      },
      {
        question: "What is Grafana used for?",
        options: [
          "Collecting logs from Kubernetes pods.",
          "Visualizing time-series data from sources like Prometheus, InfluxDB, and Elasticsearch through dashboards.",
          "Running automated load tests against APIs.",
          "Managing deployment pipelines for microservices."
        ],
        correctOptionIndex: 1,
        explanation: "Grafana is a visualization platform that connects to multiple data sources (Prometheus, Loki, Elasticsearch, CloudWatch) and renders rich dashboards, graphs, heatmaps, and alerts."
      },
      {
        question: "What is an SLO (Service Level Objective)?",
        options: [
          "A legal contract between a provider and a customer defining minimum service standards.",
          "An internal measurable target (e.g., 99.9% availability) that defines acceptable service performance from a user perspective.",
          "A document describing the on-call rotation schedule.",
          "A threshold that triggers auto-scaling of infrastructure."
        ],
        correctOptionIndex: 1,
        explanation: "An SLO is an internal reliability target (e.g., p99 latency < 200ms for 99.9% of requests). SLOs drive error budget calculations and engineering prioritization. SLAs are the external contractual counterpart."
      }
    ],
    Medium: [
      {
        question: "What is an error budget in SRE, and how does it influence development velocity?",
        options: [
          "It is the maximum number of bugs allowed per sprint.",
          "It is the allowable amount of downtime/errors before the SLO is breached; when exhausted, new feature releases are paused to focus on reliability.",
          "It is a financial budget allocated for incident response tools.",
          "It measures the number of failed deployments per month."
        ],
        correctOptionIndex: 1,
        explanation: "Error budget = 1 − SLO. If your 99.9% SLO allows 43.8 min/month downtime, that's your budget. When the budget is consumed, engineering focuses on reliability over features. When budget is healthy, new features can ship faster."
      },
      {
        question: "How does Prometheus alerting work with Alertmanager?",
        options: [
          "Prometheus sends push notifications directly to Slack without Alertmanager.",
          "Prometheus evaluates alert rules against metrics; when conditions are met, it fires alerts to Alertmanager, which deduplicates, groups, silences, and routes them to receivers (Slack, PagerDuty, email).",
          "Alertmanager scrapes metrics and generates alerts independently of Prometheus.",
          "Prometheus stores alerts in a database; Alertmanager queries it on a schedule."
        ],
        correctOptionIndex: 1,
        explanation: "Prometheus runs alert rules (PromQL expressions). When a rule fires, it sends alert data to Alertmanager. Alertmanager handles routing (who gets notified), grouping (reduce noise), silencing, and inhibition."
      },
      {
        question: "What is distributed tracing, and which problem does it solve that metrics and logs cannot?",
        options: [
          "It replaces logs and metrics entirely for modern systems.",
          "It tracks a single request's journey across multiple microservices, showing latency at each hop — solving the problem of correlating failures across service boundaries.",
          "It monitors network packet loss between data centers.",
          "It traces container resource consumption at the kernel level."
        ],
        correctOptionIndex: 1,
        explanation: "In a microservices architecture, a single user request touches many services. Distributed tracing (via Jaeger, Zipkin, OpenTelemetry) assigns trace and span IDs, allowing you to reconstruct the full call chain and identify which service introduced latency or errors."
      },
      {
        question: "What is the USE method for infrastructure performance analysis?",
        options: [
          "Uptime, Scalability, Efficiency — for measuring cloud ROI.",
          "Utilization, Saturation, Errors — a systematic method to check every resource for performance bottlenecks.",
          "Users, Sessions, Events — for web application analytics.",
          "Update, Scale, Evaluate — the DevOps release methodology."
        ],
        correctOptionIndex: 1,
        explanation: "The USE method (by Brendan Gregg) checks every system resource for: Utilization (how busy it is), Saturation (is there a queue building?), and Errors (are there failures?). It provides a systematic framework for diagnosing resource bottlenecks."
      },
      {
        question: "You see a sudden spike in HTTP 500 errors on your dashboard. Describe your structured triage process.",
        options: [
          "Restart all services immediately and notify the team afterward.",
          "Correlate the error spike timeline with recent deployments, check application logs for exception details, inspect upstream dependencies (DB, cache), and review trace data to isolate the failing service.",
          "Scale up the infrastructure and wait for the errors to resolve.",
          "Roll back all recent changes without further investigation."
        ],
        correctOptionIndex: 1,
        explanation: "Structured triage: (1) Check deployment timeline — did a recent release coincide? (2) Inspect logs (ELK/Loki) for stack traces. (3) Check dependent service health (DB connections, cache hit rate). (4) Use traces to identify the failing service in the call chain. (5) Rollback or hotfix based on root cause."
      }
    ],
    Hard: [
      {
        question: "How would you implement an SLO-based alerting strategy that minimizes alert fatigue while ensuring critical issues are caught early?",
        options: [
          "Set a single threshold alert on every metric at 90% usage.",
          "Use multi-window multi-burn-rate alerts: short windows (5m/1h) catch fast burn; long windows (6h/3d) catch slow burn. Alert only when error budget consumption rate is dangerously high.",
          "Page on-call for every single error or anomaly, regardless of severity.",
          "Disable all alerts and rely on customer reports to detect incidents."
        ],
        correctOptionIndex: 1,
        explanation: "The Google SRE approach uses burn rate alerts: at 14.4x burn rate over 1h, the error budget burns out in 5 days — page immediately. At 6x over 6h — page. At 3x over 3d — create a ticket. This balances responsiveness with fatigue reduction."
      },
      {
        question: "How does OpenTelemetry unify observability instrumentation across different languages and backends?",
        options: [
          "It forces all services to use Prometheus format exclusively.",
          "It provides vendor-neutral APIs, SDKs, and a Collector that instruments code once and exports metrics, logs, and traces to any backend (Jaeger, Datadog, Honeycomb) via standard protocols (OTLP).",
          "It replaces application code with auto-generated monitoring wrappers.",
          "It only supports cloud-managed observability platforms."
        ],
        correctOptionIndex: 1,
        explanation: "OpenTelemetry (OTel) standardizes instrumentation: one API, multiple SDKs (Go, Java, Python, JS). The OTel Collector receives telemetry, processes it (sampling, enrichment), and exports to any backend. This eliminates vendor lock-in and lets you swap backends without re-instrumenting."
      },
      {
        question: "Explain how Prometheus remote_write and long-term storage solutions (e.g., Thanos, Cortex) solve Prometheus scaling limitations.",
        options: [
          "Prometheus scales infinitely by adding more RAM; external storage is optional.",
          "Prometheus is designed for single-node operation with limited retention. Thanos/Cortex add horizontally scalable query layers, multi-tenant support, object storage-backed long-term retention, and global query federation across multiple Prometheus instances.",
          "Thanos replaces Prometheus entirely with a distributed alternative.",
          "remote_write mirrors data to a backup Prometheus for disaster recovery only."
        ],
        correctOptionIndex: 1,
        explanation: "Prometheus has limited retention (local disk) and single-node query capacity. Thanos adds: Sidecar (exposes Prometheus blocks), Store Gateway (queries object storage), Querier (global view), Compactor (downsampling). remote_write ships metrics to Cortex/Thanos for multi-year retention at scale."
      },
      {
        question: "What is an AIOps observability platform, and what are its limitations compared to traditional rule-based alerting?",
        options: [
          "AIOps fully replaces human judgment in incident response.",
          "AIOps uses ML to detect anomalies and correlate events automatically; limitations include model opacity (hard to explain alerts), training data requirements, false positive rates during model warm-up, and inability to alert on truly novel failure modes without training data.",
          "AIOps only works for cloud-native applications, not on-premises systems.",
          "AIOps eliminates the need for SLOs and error budgets."
        ],
        correctOptionIndex: 1,
        explanation: "AIOps (e.g., Dynatrace Davis, Datadog Watchdog) uses ML for anomaly detection and root cause correlation. Benefits: reduces noise, finds patterns humans miss. Limitations: black-box decisions, cold start (needs historical data), may miss novel failure modes, and can't replace human judgment for complex incidents."
      },
      {
        question: "How do you implement a log aggregation pipeline that handles 1 million log events per second with sub-second query latency?",
        options: [
          "Write all logs directly to a single Elasticsearch node with a large heap.",
          "Use a streaming pipeline: agents (Fluent Bit) → message broker (Kafka) for buffering → indexing (Elasticsearch/ClickHouse) with hot-warm-cold tiering, pre-aggregated dashboards (Grafana), and sampling for high-volume debug logs.",
          "Store raw logs in S3 and query them with Athena for all use cases.",
          "Reduce logging verbosity to bring volume under manageable thresholds."
        ],
        correctOptionIndex: 1,
        explanation: "At 1M events/sec: lightweight agents (Fluent Bit) forward to Kafka (backpressure buffer). Consumers write to Elasticsearch with index sharding, hot-warm-cold ILM policies. Pre-aggregate dashboards avoid expensive real-time queries. Sample verbose debug logs. ClickHouse or Loki can replace ES for cost efficiency at scale."
      }
    ]
  },

  iac: {
    Easy: [
      {
        question: "What is Infrastructure as Code (IaC)?",
        options: [
          "Writing application code that runs on cloud servers.",
          "Managing and provisioning infrastructure through machine-readable configuration files rather than manual processes.",
          "Monitoring infrastructure performance using scripts.",
          "Compiling source code into deployable infrastructure packages."
        ],
        correctOptionIndex: 1,
        explanation: "IaC treats infrastructure configuration as code: it is version-controlled, reviewed, tested, and applied automatically. This enables reproducibility, consistency, and auditability of infrastructure changes."
      },
      {
        question: "What is the difference between Terraform and Ansible?",
        options: [
          "Terraform manages containers; Ansible manages virtual machines.",
          "Terraform is declarative and focuses on provisioning infrastructure state; Ansible is procedural and focuses on configuring and managing software on existing servers.",
          "Ansible is cloud-only; Terraform works on-premises only.",
          "They are identical tools with different command syntax."
        ],
        correctOptionIndex: 1,
        explanation: "Terraform declares desired infrastructure state (EC2 instances, VPCs) and converges to it. Ansible defines ordered tasks (install nginx, configure SSL) and configures software on already-existing servers. They complement each other."
      },
      {
        question: "What does `terraform init` do?",
        options: [
          "Applies all pending infrastructure changes immediately.",
          "Initializes the working directory, downloads required providers and modules.",
          "Validates the Terraform configuration syntax.",
          "Creates a new Terraform workspace for the project."
        ],
        correctOptionIndex: 1,
        explanation: "`terraform init` downloads provider plugins (AWS, GCP), installs required modules, and initializes the backend for state storage. It must be run before any other Terraform command."
      },
      {
        question: "What is Terraform state?",
        options: [
          "The current status of the Terraform CLI process.",
          "A file (terraform.tfstate) that maps Terraform configuration to real-world infrastructure resources for tracking and managing changes.",
          "A log of all plan outputs for the last 30 days.",
          "The list of approved providers in a Terraform registry."
        ],
        correctOptionIndex: 1,
        explanation: "Terraform state records the mapping between your configuration and real-world resources (e.g., which AWS instance ID corresponds to `aws_instance.web`). It is the source of truth for what Terraform manages."
      },
      {
        question: "What does an Ansible playbook define?",
        options: [
          "The network topology for cloud infrastructure.",
          "An ordered set of tasks to be executed on target hosts to bring them to a desired configuration state.",
          "The IAM roles required to deploy infrastructure.",
          "Docker image build instructions for containerized applications."
        ],
        correctOptionIndex: 1,
        explanation: "An Ansible playbook is a YAML file that defines plays (hosts + tasks). Each task calls an Ansible module (apt, copy, service, template) to configure the host. Playbooks are idempotent by design."
      }
    ],
    Medium: [
      {
        question: "Why is storing Terraform state in a remote backend (e.g., S3 + DynamoDB) essential for team collaboration?",
        options: [
          "It automatically applies Terraform plans without human approval.",
          "It provides a shared, consistent state file with state locking (via DynamoDB) to prevent concurrent runs from corrupting state, and enables auditability with versioned S3.",
          "It encrypts Terraform plans before they are run.",
          "It eliminates the need for a Terraform Cloud subscription."
        ],
        correctOptionIndex: 1,
        explanation: "Local state causes team conflicts. Remote state (S3 backend) is shared and versioned. DynamoDB locking prevents two engineers from running `terraform apply` simultaneously, which would corrupt state. S3 versioning enables rollback."
      },
      {
        question: "What is `terraform plan` and why is it critical before `terraform apply`?",
        options: [
          "It applies changes in dry-run mode without touching real infrastructure.",
          "It generates an execution plan showing exactly what Terraform will create, change, or destroy — enabling human review before any infrastructure is modified.",
          "It uploads the state file to the remote backend.",
          "It validates the HCL syntax without connecting to cloud providers."
        ],
        correctOptionIndex: 1,
        explanation: "`terraform plan` computes the diff between current state and desired configuration, showing a human-readable preview of all changes. Reviewing the plan prevents accidental deletions or unexpected replacements in production."
      },
      {
        question: "How does Ansible achieve idempotency, and why is it important for configuration management?",
        options: [
          "Ansible tracks changes in a database and skips already-applied tasks.",
          "Ansible modules check the current state before making changes — if the desired state already exists, they do nothing. Running a playbook multiple times produces the same result.",
          "Idempotency in Ansible requires manually adding `when: not already_done` conditions to every task.",
          "Ansible is not idempotent; it applies all tasks every run regardless."
        ],
        correctOptionIndex: 1,
        explanation: "Ansible modules are designed to be idempotent: `apt: name=nginx state=present` checks if nginx is installed before attempting installation. This makes playbooks safe to re-run without side effects — critical for drift correction and CI-driven configuration."
      },
      {
        question: "What is a Terraform module, and how does it improve IaC maintainability?",
        options: [
          "A Terraform plugin that connects to a specific cloud provider.",
          "A reusable, self-contained collection of Terraform resources with defined inputs and outputs that encapsulates infrastructure patterns.",
          "A Terraform workspace for separating production and staging environments.",
          "A script that runs after Terraform apply to configure instances."
        ],
        correctOptionIndex: 1,
        explanation: "Modules are the unit of code reuse in Terraform. A module encapsulates resources (e.g., an opinionated VPC module) with input variables and output values. Teams can share modules via registries, enforcing standards and reducing duplication."
      },
      {
        question: "What is Ansible Vault and when would you use it?",
        options: [
          "A secure password manager that stores SSH keys for Ansible connections.",
          "A built-in feature that encrypts sensitive data (secrets, passwords, API keys) within Ansible files so they can be safely committed to version control.",
          "A cloud key management service integrated with Ansible Tower.",
          "A module for creating and managing HashiCorp Vault instances."
        ],
        correctOptionIndex: 1,
        explanation: "Ansible Vault encrypts strings or entire files using AES256. `ansible-vault encrypt_string` lets you store encrypted secrets in playbooks or variable files, committed to Git safely. The vault password is provided at runtime via --vault-password-file or environment variables."
      }
    ],
    Hard: [
      {
        question: "A `terraform apply` run is causing unexpected resource replacements (destroy + create) instead of in-place updates. How do you diagnose and prevent this?",
        options: [
          "Always use `terraform taint` to force resource recreation before applying.",
          "Review the plan output for `# forces replacement` annotations, check provider changelog for breaking changes, use `lifecycle { ignore_changes }` for immutable attributes, and test in a non-production workspace first.",
          "Disable state locking to allow concurrent applies to resolve conflicts.",
          "Increase the `terraform apply` timeout to allow longer in-place updates."
        ],
        correctOptionIndex: 1,
        explanation: "Replacements happen when a provider determines an attribute change requires resource recreation (e.g., changing an EC2 instance type in some cases). Use `terraform plan -out=plan.tfplan`, review `# forces replacement` lines, and use `lifecycle { ignore_changes = [...] }` for attributes you manage outside Terraform."
      },
      {
        question: "How would you manage Terraform configuration for 50 microservices across development, staging, and production environments without code duplication?",
        options: [
          "Copy the entire Terraform codebase three times, one per environment.",
          "Use reusable modules with environment-specific tfvars files, a consistent directory structure (modules/, envs/dev|staging|prod), remote state per environment, and a workspace or Terragrunt for DRY variable management.",
          "Use a single `terraform.tfvars` file with if-else conditions for each environment.",
          "Deploy all environments from a single state file, using resource naming conventions to differentiate."
        ],
        correctOptionIndex: 1,
        explanation: "The recommended pattern: shared modules in `/modules`, environment directories (`/envs/prod`, `/envs/dev`) each with their own backend config and `terraform.tfvars`. Terragrunt can further DRY this up with `inputs = {}` inheritance. Each environment has its own isolated state."
      },
      {
        question: "What is Terraform's `lifecycle` block and how do `create_before_destroy` and `prevent_destroy` differ in behavior?",
        options: [
          "They both prevent accidental deletion but work at different cloud provider levels.",
          "`create_before_destroy` ensures the replacement resource is created first (zero-downtime replacement); `prevent_destroy` raises an error if Terraform attempts to destroy the resource, protecting critical infrastructure.",
          "`lifecycle` blocks are deprecated in Terraform 1.x in favor of import blocks.",
          "Both flags require manual confirmation before applying any change."
        ],
        correctOptionIndex: 1,
        explanation: "`create_before_destroy`: Terraform creates the new resource, updates references, then destroys the old one — critical for databases and load balancers. `prevent_destroy`: protects resources from accidental `terraform destroy` by raising a plan-time error — ideal for production databases and DNS zones."
      },
      {
        question: "How do you implement policy-as-code for Terraform to enforce organizational cloud governance standards?",
        options: [
          "Manually review every Terraform plan before applying in production.",
          "Use Sentinel (Terraform Enterprise) or Open Policy Agent (OPA) with Conftest to write policies that enforce rules (e.g., no public S3 buckets, required tags, allowed instance types) as part of the CI/CD pipeline before apply.",
          "Use Terraform's built-in `validation` blocks for all governance rules.",
          "Write shell scripts that grep for policy violations in HCL files."
        ],
        correctOptionIndex: 1,
        explanation: "Policy-as-code tools evaluate Terraform plans against organizational rules before apply. Sentinel (Terraform Enterprise) or OPA/Conftest can enforce: required resource tags, approved regions, instance type allowlists, no public S3 buckets. They integrate into CI pipelines and block non-compliant applies."
      },
      {
        question: "Explain how Ansible dynamic inventory works and why it is preferable over static inventory in cloud environments.",
        options: [
          "Dynamic inventory queries external databases; static inventory queries cloud APIs.",
          "Dynamic inventory scripts or plugins query cloud APIs (AWS EC2, GCP, Azure) at runtime to discover hosts, allowing Ansible to automatically target new or autoscaled instances without manual inventory file updates.",
          "Static inventory is always more accurate because it is manually maintained.",
          "Dynamic inventory only works with AWS and not other cloud providers."
        ],
        correctOptionIndex: 1,
        explanation: "In cloud environments, instances come and go dynamically. Dynamic inventory (e.g., `aws_ec2` plugin) queries the AWS API at playbook execution time, filtering by tags or regions. This means autoscaled instances are automatically included without editing any inventory files."
      }
    ]
  },

  networking: {
    Easy: [
      {
        question: "What is the OSI model, and which layer does TCP operate at?",
        options: [
          "A vendor-specific network standard; TCP operates at Layer 2.",
          "A 7-layer conceptual framework for network communication; TCP operates at Layer 4 (Transport).",
          "A physical cabling standard; TCP operates at Layer 1.",
          "An application framework; TCP operates at Layer 7 (Application)."
        ],
        correctOptionIndex: 1,
        explanation: "The OSI model has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application. TCP (Transmission Control Protocol) provides reliable, ordered delivery at Layer 4 (Transport), handling segmentation, flow control, and error correction."
      },
      {
        question: "What is the difference between TCP and UDP?",
        options: [
          "TCP is faster; UDP provides guaranteed delivery.",
          "TCP provides reliable, ordered, connection-oriented delivery with acknowledgments; UDP is connectionless, with no delivery guarantees, offering lower latency.",
          "UDP works on LANs only; TCP is for internet traffic.",
          "TCP uses port numbers; UDP uses IP addresses for routing."
        ],
        correctOptionIndex: 1,
        explanation: "TCP uses a 3-way handshake, sequence numbers, and ACKs for reliable delivery. UDP sends packets without establishing a connection or tracking delivery — lower overhead, used for DNS, video streaming, and gaming where speed matters more than reliability."
      },
      {
        question: "What does DNS do, and what is a DNS A record?",
        options: [
          "DNS encrypts network traffic; an A record stores SSL certificates.",
          "DNS translates human-readable domain names to IP addresses; an A record maps a hostname to an IPv4 address.",
          "DNS routes packets between networks; an A record defines allowed IP ranges.",
          "DNS manages email delivery; an A record specifies mail server addresses."
        ],
        correctOptionIndex: 1,
        explanation: "DNS (Domain Name System) resolves domain names (api.example.com) to IP addresses. An A record maps a hostname to an IPv4 address. AAAA records map to IPv6. CNAME records are aliases. MX records handle email routing."
      },
      {
        question: "What is a subnet mask, and what does /24 mean in CIDR notation?",
        options: [
          "A subnet mask identifies the MAC address range; /24 means 24 available hosts.",
          "A subnet mask divides an IP address into network and host portions; /24 means the first 24 bits are the network, allowing 254 usable host addresses.",
          "A subnet mask is used for NAT translation; /24 indicates 24 routers are needed.",
          "A subnet mask is a firewall rule; /24 allows access from 24 IP addresses."
        ],
        correctOptionIndex: 1,
        explanation: "/24 means a 255.255.255.0 mask — 24 bits for network, 8 bits for hosts. A /24 subnet has 256 addresses (0-255), with 254 usable for hosts (network and broadcast addresses are reserved)."
      },
      {
        question: "What is a load balancer and what problem does it solve?",
        options: [
          "A device that compresses network packets to increase bandwidth.",
          "A component that distributes incoming network traffic across multiple backend servers to ensure high availability, scalability, and no single point of failure.",
          "A network device that encrypts traffic between clients and servers.",
          "A tool that monitors network latency and reroutes slow connections."
        ],
        correctOptionIndex: 1,
        explanation: "Load balancers distribute requests across a pool of servers using algorithms (round-robin, least-connections, IP hash). They provide health checking (remove failed backends), scalability (add servers behind the LB), and HA (no single server is a bottleneck)."
      }
    ],
    Medium: [
      {
        question: "What is the difference between a Layer 4 load balancer and a Layer 7 load balancer?",
        options: [
          "L4 handles HTTP traffic; L7 handles TCP/UDP traffic.",
          "L4 routes based on IP address and TCP/UDP port without inspecting content; L7 routes based on HTTP content (URL path, headers, cookies) enabling advanced traffic management.",
          "L7 is faster than L4 because it uses hardware acceleration.",
          "L4 provides SSL termination; L7 does not support HTTPS."
        ],
        correctOptionIndex: 1,
        explanation: "L4 (AWS NLB, HAProxy TCP mode) routes by IP:port — fast, no content inspection. L7 (AWS ALB, NGINX) can route /api/* to one backend and /static/* to another, perform SSL termination, add headers, and do sticky sessions based on cookies."
      },
      {
        question: "How does NAT (Network Address Translation) work, and why is it used in cloud VPCs?",
        options: [
          "NAT translates domain names to IP addresses at the network boundary.",
          "NAT maps private IP addresses to a public IP for outbound internet traffic, allowing private subnet resources to reach the internet without being directly reachable from it.",
          "NAT encrypts all outbound traffic from the private subnet.",
          "NAT is used exclusively to route traffic between availability zones."
        ],
        correctOptionIndex: 1,
        explanation: "In cloud VPCs, private subnets host databases and backends with no direct internet access. A NAT Gateway in a public subnet allows these private resources to make outbound internet calls (package downloads, API calls) while blocking all unsolicited inbound connections."
      },
      {
        question: "What is BGP (Border Gateway Protocol), and why is it critical for internet routing?",
        options: [
          "BGP is a LAN protocol for routing within a single organization's network.",
          "BGP is the internet's routing protocol — it exchanges prefix reachability information between autonomous systems (ISPs, cloud providers) to determine optimal inter-AS routing paths.",
          "BGP is used exclusively for data center fabric routing between switches.",
          "BGP is a VPN protocol for site-to-site encrypted tunnel establishment."
        ],
        correctOptionIndex: 1,
        explanation: "BGP is the glue of the internet. Each Autonomous System (AS) announces its IP prefixes via BGP. ISPs use BGP to build routing tables. AWS Direct Connect and cloud VPN connections use BGP for dynamic route exchange between on-premises networks and cloud VPCs."
      },
      {
        question: "A service is responding slowly and you suspect a network bottleneck. What CLI tools would you use to diagnose it and why?",
        options: [
          "Only `ping` is needed to diagnose all network performance issues.",
          "Use `traceroute`/`mtr` for hop-by-hop latency, `ss`/`netstat` for socket state, `iperf3` for bandwidth testing, `tcpdump` for packet inspection, and `curl -w` for HTTP timing breakdown.",
          "Restart the network interface and monitor if performance improves.",
          "Use `top` to identify high CPU processes causing network slowness."
        ],
        correctOptionIndex: 1,
        explanation: "Systematic network diagnosis: `mtr` shows per-hop RTT and packet loss (real-time traceroute). `ss -s` shows socket statistics. `iperf3` benchmarks raw throughput. `tcpdump -i eth0 port 443` captures packets for analysis. `curl -w '%{time_total}'` shows DNS + connect + TTFB breakdown."
      },
      {
        question: "What is mTLS (mutual TLS) and when is it used in microservices architectures?",
        options: [
          "mTLS is a protocol that encrypts only the request headers, not the body.",
          "mTLS requires both the client and server to present and validate X.509 certificates, providing bidirectional authentication — commonly used in service meshes (Istio, Linkerd) for zero-trust service-to-service communication.",
          "mTLS is only used for external-facing HTTPS endpoints, not internal services.",
          "mTLS uses shared symmetric keys instead of certificates for performance."
        ],
        correctOptionIndex: 1,
        explanation: "Standard TLS authenticates only the server. mTLS adds client certificate validation — both parties prove their identity cryptographically. Service meshes implement mTLS transparently via sidecar proxies, enabling zero-trust networking where every service-to-service call is authenticated and encrypted."
      }
    ],
    Hard: [
      {
        question: "How does a service mesh like Istio implement traffic management without modifying application code?",
        options: [
          "It modifies the kernel network stack to intercept all traffic.",
          "It injects a sidecar proxy (Envoy) into every pod that intercepts all inbound/outbound traffic using iptables rules, enabling features like load balancing, circuit breaking, retries, mTLS, and observability at the proxy layer.",
          "It requires applications to use the Istio SDK for traffic control.",
          "It replaces Kubernetes Services with custom DNS-based routing."
        ],
        correctOptionIndex: 1,
        explanation: "Istio injects Envoy sidecar containers into pods. iptables rules redirect all traffic through the sidecar. The Istio control plane (istiod) pushes configuration (VirtualServices, DestinationRules) to sidecars via xDS API. Applications communicate normally — the mesh handles retries, timeouts, circuit breakers, and mTLS transparently."
      },
      {
        question: "Explain the CAP theorem and its implications for distributed system design.",
        options: [
          "A system can achieve Consistency, Availability, and Partition tolerance simultaneously with modern hardware.",
          "A distributed system can only guarantee two of three properties simultaneously: Consistency (all nodes see the same data), Availability (every request gets a response), or Partition tolerance (system continues despite network splits) — and partition tolerance is mandatory in practice, so you choose CA vs. AP.",
          "CAP theorem applies only to databases, not to distributed compute systems.",
          "CAP theorem has been disproven by modern consensus algorithms like Raft."
        ],
        correctOptionIndex: 1,
        explanation: "Since network partitions are unavoidable in distributed systems, you must choose between CP (consistent but unavailable during partition — ZooKeeper, etcd) or AP (available but potentially stale — Cassandra, DynamoDB). Modern systems like Google Spanner blur CP/AP with carefully bounded latency guarantees."
      },
      {
        question: "How does Kubernetes networking implement pod-to-pod communication across different nodes using CNI plugins?",
        options: [
          "Kubernetes pods communicate only within the same node; cross-node communication requires a gateway.",
          "The CNI plugin (Calico, Flannel, Cilium) assigns each pod a routable IP from a cluster CIDR and configures the host network (routes, VXLAN, BGP, or eBPF) so any pod can directly reach any other pod IP across nodes without NAT.",
          "Pods communicate across nodes using the host's physical IP and NodePort services.",
          "CNI plugins tunnel all cross-node traffic through the kube-apiserver."
        ],
        correctOptionIndex: 1,
        explanation: "Kubernetes mandates: every pod gets a unique cluster-wide IP, and any pod can reach any other pod without NAT. CNI plugins implement this: Flannel uses VXLAN overlay, Calico uses BGP peering to advertise pod subnets natively, Cilium uses eBPF for kernel-level routing. The implementation varies but the contract is the same."
      },
      {
        question: "What is ECMP (Equal-Cost Multi-Path) routing and how does it improve network throughput and resilience?",
        options: [
          "ECMP is a backup path that activates only when the primary link fails.",
          "ECMP distributes traffic across multiple equal-cost paths simultaneously using a hashing algorithm on flow identifiers (src/dst IP:port), increasing aggregate bandwidth and providing link-level redundancy without failover delay.",
          "ECMP is a QoS mechanism that prioritizes certain traffic classes.",
          "ECMP is used exclusively within BGP for internet-scale routing."
        ],
        correctOptionIndex: 1,
        explanation: "ECMP allows a router to load-balance across multiple paths with identical routing metrics. Traffic is hashed per-flow (consistent hashing avoids packet reordering). If one link fails, flows are redistributed across remaining paths. Used heavily in data center spine-leaf architectures and cloud provider backbone networks."
      },
      {
        question: "How do you harden network security for a Kubernetes cluster running in production?",
        options: [
          "Use only NodePort services to expose all workloads and restrict by IP manually.",
          "Implement NetworkPolicies (default-deny all ingress/egress, allow only required flows), enable mTLS via a service mesh, restrict API server access to known CIDRs, use PodSecurity standards, enable Kubernetes audit logging, and scan for exposed ports with network scanners.",
          "Enable host networking for all pods to bypass CNI complexity.",
          "Use a single shared namespace for all workloads to simplify policy management."
        ],
        correctOptionIndex: 1,
        explanation: "Kubernetes network hardening: (1) NetworkPolicies with default-deny (CNI must support them). (2) API server endpoint restricted to VPN/bastion CIDRs. (3) mTLS between all services (Istio/Linkerd). (4) No privileged containers or host networking. (5) Audit logs for API server calls. (6) Ingress with WAF for external traffic."
      }
    ]
  },

  mixed: {
    Easy: [
      {
        question: "What does the acronym 'DevOps' combine, and what is its core goal?",
        options: [
          "Development and Operations — its goal is to eliminate the operations team.",
          "Development and Operations — its core goal is to shorten the development lifecycle and deliver high-quality software continuously by fostering collaboration between dev and ops teams.",
          "Deployment and Optimization — focused on reducing cloud costs.",
          "Design and Operations — focused on UI/UX improvement cycles."
        ],
        correctOptionIndex: 1,
        explanation: "DevOps is a cultural and technical movement combining Development and Operations. The goal is faster, more reliable software delivery through automation, continuous feedback, shared responsibility, and eliminating silos between development and operations."
      },
      {
        question: "What is a container registry and how is it used in a DevOps workflow?",
        options: [
          "A registry is a server that stores Terraform state files.",
          "A container registry (e.g., Docker Hub, ECR, GCR) stores and distributes Docker images; CI pipelines push built images to the registry, and deployment environments pull images from it.",
          "A container registry manages Kubernetes cluster configuration.",
          "A container registry is a database for storing application environment variables."
        ],
        correctOptionIndex: 1,
        explanation: "In a DevOps pipeline: code is built → Docker image is created → pushed to a registry (ECR, GCR, Docker Hub) → deployment systems (Kubernetes, ECS) pull the specific image tag. The registry is the artifact store for container images."
      },
      {
        question: "What is 'shift left' in the context of DevSecOps?",
        options: [
          "Moving all testing from pre-production to post-production.",
          "Integrating security practices (SAST, dependency scanning, secrets detection) early in the development pipeline — at code commit time — rather than at the end before release.",
          "Shifting workloads from right-side data centers to left-side regions.",
          "Promoting junior developers to senior roles earlier in their career."
        ],
        correctOptionIndex: 1,
        explanation: "Shift left means moving security and quality checks earlier (left) in the development timeline. SAST in the IDE, dependency vulnerability scanning in CI, and secrets detection on pre-commit — catching issues when they're cheapest to fix."
      },
      {
        question: "What is the purpose of environment variables in a containerized application?",
        options: [
          "They compile application code with environment-specific optimizations.",
          "They externalize configuration (database URLs, feature flags, API keys) from the container image, enabling the same image to run in dev, staging, and production with different settings.",
          "They manage network routing between containers.",
          "They control which user can access the container's files."
        ],
        correctOptionIndex: 1,
        explanation: "The 12-Factor App methodology prescribes storing config in environment variables. This separates configuration from code, making the same container image portable across environments — different env vars for different environments without rebuilding the image."
      },
      {
        question: "What is an on-call rotation in SRE, and what is its purpose?",
        options: [
          "A scheduled maintenance window for applying OS patches.",
          "A roster where engineers take turns being responsible for responding to production incidents, ensuring 24/7 coverage and distributing the operational burden across the team.",
          "A weekly meeting to review deployment pipeline metrics.",
          "A training program for new engineers joining the operations team."
        ],
        correctOptionIndex: 1,
        explanation: "On-call rotations ensure that someone is always available to respond to production alerts. Engineers rotate through primary/secondary on-call duties, respond to pages, conduct post-mortems, and use toil reduction to improve system reliability over time."
      }
    ],
    Medium: [
      {
        question: "What is the difference between horizontal pod autoscaling and cluster autoscaling in Kubernetes?",
        options: [
          "HPA scales storage; Cluster Autoscaler scales compute.",
          "HPA adjusts the number of pods within existing nodes based on metrics; Cluster Autoscaler adds or removes nodes when pods cannot be scheduled due to insufficient cluster capacity.",
          "HPA works with stateful sets; Cluster Autoscaler only works with deployments.",
          "They are the same mechanism operating at different timescales."
        ],
        correctOptionIndex: 1,
        explanation: "HPA operates within the existing cluster: more pods when load increases. When HPA has scaled pods but nodes are full, the Cluster Autoscaler kicks in and provisions new nodes from the cloud provider. They work together for end-to-end auto-scaling."
      },
      {
        question: "What is an incident post-mortem, and what makes it blameless?",
        options: [
          "A report filed with management to identify and discipline responsible engineers.",
          "A structured retrospective after an incident that focuses on identifying systemic failures and improving processes without assigning individual blame, recognizing that errors are symptoms of system problems.",
          "A legal document that records the financial impact of an outage.",
          "A checklist of actions taken during incident response."
        ],
        correctOptionIndex: 1,
        explanation: "Blameless post-mortems (from Google SRE culture) assume engineers acted with the best information available. The goal is to find systemic causes (missing alerts, insufficient documentation, fragile systems) and implement improvements — not to punish individuals, which suppresses honest reporting."
      },
      {
        question: "What is the role of a secrets manager (e.g., HashiCorp Vault, AWS Secrets Manager) in a DevOps pipeline?",
        options: [
          "To store application source code securely.",
          "To centrally store, rotate, and dynamically inject secrets (API keys, DB passwords, TLS certs) into applications at runtime — eliminating static secrets in code, configs, or environment variables.",
          "To manage TLS certificates for load balancers only.",
          "To encrypt CI/CD pipeline configuration files."
        ],
        correctOptionIndex: 1,
        explanation: "Secrets managers provide: centralized secret storage with encryption, fine-grained access control, automatic rotation, and dynamic secrets (Vault generates short-lived DB credentials on demand). Applications fetch secrets at startup from the manager, removing the need to store them in configs or container images."
      },
      {
        question: "How do you implement a canary deployment to safely release a new version to production?",
        options: [
          "Deploy the new version to all users on weekends when traffic is low.",
          "Route a small percentage of production traffic (e.g., 5%) to the new version, monitor error rates and latency, and gradually increase the percentage if metrics are healthy — rolling back if anomalies are detected.",
          "Deploy the new version to a staging environment and mark it as canary.",
          "Deploy the new version first and monitor for 24 hours before removing the old version."
        ],
        correctOptionIndex: 1,
        explanation: "Canary deployments limit blast radius: only a small user segment sees the new version initially. Monitor SLOs (error rate, p99 latency) via observability tools. If metrics remain healthy, progressively shift more traffic using Kubernetes traffic splitting (Argo Rollouts, Istio VirtualService) or load balancer weights."
      },
      {
        question: "What is configuration drift, and how do IaC tools help prevent it?",
        options: [
          "Configuration drift is when application code diverges from its documentation.",
          "Configuration drift is when actual infrastructure state diverges from the desired state defined in code due to manual changes. IaC tools (Terraform, Ansible) detect and reconcile drift by re-applying the declared desired state.",
          "Drift occurs when container images are not updated regularly.",
          "Drift is a network routing phenomenon caused by BGP route changes."
        ],
        correctOptionIndex: 1,
        explanation: "Drift happens when engineers make manual changes (e.g., SSH into a server and install a package) that aren't reflected in the IaC code. Tools detect drift: `terraform plan` shows differences between state and real infrastructure. Ansible's idempotent tasks correct drift on each playbook run."
      }
    ],
    Hard: [
      {
        question: "How would you design a disaster recovery strategy for a critical production system with an RPO of 1 hour and an RTO of 30 minutes?",
        options: [
          "Take a daily backup and restore manually from S3 when disaster strikes.",
          "Implement continuous replication (database streaming replication, S3 CRR), automated failover with Route 53 health checks, pre-provisioned standby infrastructure in a secondary region, and regular DR drills that verify RTO/RPO compliance.",
          "Deploy everything in a single AZ with enhanced hardware redundancy.",
          "Use a backup region but only spin up infrastructure after a disaster is declared."
        ],
        correctOptionIndex: 1,
        explanation: "RPO=1h requires continuous or near-continuous replication (not daily backups). RTO=30min requires pre-provisioned standby infrastructure (warm standby) not cold provisioning. Components: database streaming replication, S3 CRR, pre-deployed app stack in secondary region (scaled down), automated Route 53 failover, and runbook-automated DR activation tested quarterly."
      },
      {
        question: "What is toil in SRE, and how do you systematically eliminate it?",
        options: [
          "Toil is technical debt; eliminate it by rewriting legacy systems.",
          "Toil is manual, repetitive operational work that scales with service load and provides no lasting value. Eliminate it by automating recurring tasks, establishing service ownership, tracking toil as engineering work, and capping toil at <50% of team time.",
          "Toil is unplanned downtime; eliminate it by improving monitoring.",
          "Toil refers to customer complaints; handle it by improving documentation."
        ],
        correctOptionIndex: 1,
        explanation: "Google SRE defines toil as: manual, repetitive, automatable, reactive work that scales linearly with service growth. Examples: manual deployments, password resets, certificate renewals. Systematically eliminate by: identifying with toil tracking, automating with scripts/pipelines, enforcing SLOs that reduce on-call work, and capping toil at 50% of eng time."
      },
      {
        question: "How would you conduct a capacity planning exercise for a service expecting 10x traffic growth over the next 6 months?",
        options: [
          "Simply multiply current infrastructure by 10 and provision it immediately.",
          "Profile current resource utilization at peak load, establish scaling ratios (requests/CPU/memory), model traffic growth curves, identify bottlenecks (DB connections, I/O), implement auto-scaling with headroom, and validate with load tests simulating 10x before the growth arrives.",
          "Wait for the traffic to arrive and scale reactively using auto-scaling groups.",
          "Buy reserved instances for 10x capacity 6 months in advance."
        ],
        correctOptionIndex: 1,
        explanation: "Capacity planning: (1) Baseline current metrics at peak. (2) Establish per-unit cost (CPU/memory per RPS). (3) Project growth curve (linear? exponential?). (4) Identify bottlenecks (DB connection pools, disk I/O, network bandwidth). (5) Load test at projected 10x. (6) Implement auto-scaling with 30-40% headroom. (7) Review monthly against actuals."
      },
      {
        question: "What is the strangler fig pattern, and when is it appropriate for migrating a monolith to microservices?",
        options: [
          "It immediately replaces the entire monolith with microservices in a single big-bang migration.",
          "It incrementally wraps the monolith with new microservices that handle specific functions, routing traffic to the new services via a facade — gradually strangling the old system until it can be decommissioned safely.",
          "It requires rewriting the monolith in a new language as a prerequisite.",
          "It is only applicable to serverless migration patterns, not microservices."
        ],
        correctOptionIndex: 1,
        explanation: "The strangler fig pattern (Martin Fowler) avoids risky big-bang rewrites. An API facade (NGINX, API Gateway) sits in front of the monolith. New functionality is built as microservices; traffic for migrated features is routed to them. Over time, the monolith shrinks as each domain is extracted, until it can be retired."
      },
      {
        question: "How do you measure and improve Mean Time to Recovery (MTTR) for a high-frequency release team?",
        options: [
          "MTTR is only improved by slowing down release frequency to reduce incidents.",
          "Improve MTTR by: automated incident detection (shorter MTTD), runbook automation, pre-built rollback pipelines, chaos engineering to practice recovery, feature flags for instant kill-switches, and post-mortem action items that eliminate classes of failure.",
          "MTTR is improved solely by hiring more on-call engineers.",
          "MTTR improvement requires migrating to a serverless architecture."
        ],
        correctOptionIndex: 1,
        explanation: "MTTR = MTTD + time-to-mitigate + time-to-resolve. Reduce MTTD: better alerting, distributed tracing. Reduce mitigation time: feature flags (instant disable), automated rollbacks, runbook automation. Reduce resolution time: chaos engineering builds muscle memory, post-mortems eliminate repeat failures. High release frequency is compatible with low MTTR with the right tooling."
      }
    ]
  }
};

// Normalize topic key for lookup
const normalizeTopic = (topic: string): string => {
  const t = topic.toLowerCase().trim();
  if (t.includes('docker')) return 'docker';
  if (t.includes('kubernetes') || t === 'k8s') return 'kubernetes';
  if (t.includes('ci') || t.includes('cd') || t.includes('cicd') || t.includes('pipeline') || t.includes('jenkins') || t.includes('github actions')) return 'ci/cd';
  if (t.includes('linux') || t.includes('shell') || t.includes('bash') || t.includes('scripting')) return 'linux & shell scripting';
  if (t.includes('git') && !t.includes('github actions')) return 'git';
  if (t.includes('cloud') || t.includes('aws') || t.includes('azure') || t.includes('gcp')) return 'cloud';
  if (t.includes('monitor') || t.includes('logging') || t.includes('observ') || t.includes('metric') || t.includes('alert')) return 'monitoring';
  if (t.includes('infrastructure as code') || t.includes('terraform') || t.includes('ansible') || t.includes('iac')) return 'iac';
  if (t.includes('network')) return 'networking';
  if (t.includes('mixed') || t.includes('random')) return 'mixed';
  return 'mixed'; // default fallback for unrecognized topics
};

export const generateQuestion = async (
  topic: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  previousQuestions: string[]
): Promise<QuestionData> => {
  const systemPrompt = `You are a Senior DevOps Technical Interviewer. Your role is to conduct a professional, rigorous technical interview for a DevOps candidate.
You must generate ONE multiple-choice technical question (MCQ) on the specified topic, matching the exact difficulty level requested.

Difficulty Guidelines:
- "Easy": Focus on fundamental concepts, definitions, basic tools, commands, or core configuration concepts. Suitable for junior engineers.
- "Medium": Focus on practical scenario-based questions ("How would you achieve X?", "Configure Y for a real scenario", "Identify the correct command/architecture"). Suitable for mid-level engineers.
- "Hard": Focus on complex troubleshooting, system architecture, performance optimization, trade-off discussions, or failure recovery. Suitable for senior/lead engineers.

Output Format:
You must return your output strictly in JSON format. Do not write any explanatory text, markdown notes, or code blocks outside the JSON.
The JSON object must have exactly these keys:
{
  "question": "The text of the scenario question",
  "options": [
    "Option A text",
    "Option B text",
    "Option C text",
    "Option D text"
  ],
  "correctOptionIndex": 0,
  "explanation": "Detailed professional explanation of why the correct option is right and why the alternative options are incorrect."
}

Rules:
1. Provide exactly 4 options in the "options" array.
2. "correctOptionIndex" must be an integer from 0 to 3 corresponding to the correct option index in the "options" array.
3. The question must not be similar to or repeat any of these previously asked questions: ${JSON.stringify(previousQuestions)}.
4. Ensure options are distinct, technically plausible, and rigorous.`;

  const userPrompt = `Generate a "${difficulty}" difficulty DevOps Multiple Choice Question (MCQ) on the topic: "${topic}".`;

  // Fallback: pick a random question from pool, excluding already-asked ones
  const getFallbackQuestion = (): QuestionData => {
    const key = normalizeTopic(topic);
    const pool = (MOCK_POOL[key] || MOCK_POOL['docker']!)[difficulty];

    // Filter out questions that have already been asked (by question text)
    const available = pool.filter(q => !previousQuestions.includes(q.question));

    if (available.length > 0) {
      // Random pick from available questions
      return available[Math.floor(Math.random() * available.length)];
    }

    // All questions exhausted — pick random from full pool (shouldn't normally happen)
    return pool[Math.floor(Math.random() * pool.length)];
  };

  return callClaudeAndParseJSON<QuestionData>(systemPrompt, userPrompt, getFallbackQuestion, 'interviewer');
};
