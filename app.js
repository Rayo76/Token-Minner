// Token Minner: fully client-side prompt builder.
(() => {
  "use strict";

  const TEXT_CATEGORY_TEMPLATES = {
    "Travel": { role: "Expert travel planner", targetAudience: "First-time travelers", objective: "Build a 5-day itinerary for Tokyo", context: "Budget, dates, preferences", mustInclude: "Day-wise plan\nBudget", mustAvoid: "Unsafe recommendations" },
    "Health": { role: "Certified health coach", targetAudience: "Busy professionals", objective: "Create a 30-day wellness plan", context: "Age, lifestyle, limitations", mustInclude: "Routine\nMeals", mustAvoid: "Medical diagnosis" },
    "Financial Planning": { role: "Certified financial planner", targetAudience: "Young professionals", objective: "Create a 5-year financial roadmap", context: "Income, expenses, debt, and goals", mustInclude: "Budget\nInvestments", mustAvoid: "Unqualified stock tips" },
    "App/PRD spec": { role: "Senior product manager", targetAudience: "Development team", objective: "Create a complete PRD", context: "Product problem, users, constraints, and platform", mustInclude: "User stories\nAcceptance criteria", mustAvoid: "Unrequested code" },
    "Product Comparison": { role: "Independent product analyst", targetAudience: "Prospective buyers", objective: "Create an unbiased product comparison", context: "Products, budget, priorities, and region", mustInclude: "Pros and cons\nDecision matrix", mustAvoid: "Unsupported claims" },
    "Resume Optimization": { role: "Professional resume writer", targetAudience: "Job seekers", objective: "Create an ATS-optimized resume", context: "Target role, experience, and job description", mustInclude: "Measured achievements\nRelevant keywords", mustAvoid: "Invented experience" },
    "Diet & Workout Plan": { role: "Qualified nutrition and fitness coach", targetAudience: "Fitness enthusiasts", objective: "Create a 12-week diet and workout plan", context: "Goals, restrictions, equipment, and schedule", mustInclude: "Meal structure\nWorkout progression", mustAvoid: "Extreme diets" },
    "Education & Learning": { role: "Curriculum designer", targetAudience: "Students", objective: "Create a structured learning path", context: "Current level, goal, available time, and resources", mustInclude: "Weekly schedule\nPractice tasks", mustAvoid: "Unmanageable workload" },
    "Debugging Issues": { role: "Senior debugging specialist", targetAudience: "Developers", objective: "Create a systematic diagnosis and fix plan", context: "Tech stack, symptoms, logs, and reproduction steps", mustInclude: "Evidence-based steps\nValidation", mustAvoid: "Unverified guesses" },
    "Other": { role: "", targetAudience: "", objective: "", context: "", mustInclude: "", mustAvoid: "" }
  };

  const PPT_PITCH_DECK_TEMPLATE = {
    role: "Senior presentation strategist and slide designer",
    targetAudience: "Investors or executive decision-makers",
    objective: "Create a persuasive deck with strong story and clear ask",
    context: "Subject, key message, time limit, and available data",
    mustInclude: "Slide-by-slide outline\nClear funding or business ask",
    mustAvoid: "Invented statistics\nText-heavy slides"
  };

  const CURRENT_DATA_CATEGORIES = new Set([
    "Travel",
    "Health",
    "Financial Planning",
    "Product Comparison",
    "Presentation/Pitch Deck"
  ]);

  function buildGuard(task, category, enabled) {
    if (!enabled) return undefined;

    if (task === "text" || task === "ppt") {
      const guard = [
        "use only supplied facts or actual tool results",
        "flag unknowns and assumptions inline",
        "never invent sources"
      ];

      if ((task === "text" && CURRENT_DATA_CATEGORIES.has(category)) || task === "ppt") {
        guard.push("mark unverified current data");
      }

      return guard;
    }

    if (task === "coding_loop") {
      return [
        "back every claim with evidence",
        "report only actions performed and results observed",
        "stop and ask on unknowns",
        "never infer permissions"
      ];
    }

    return undefined;
  }

  const TEXT_STEP_TEMPLATES = {
    "Travel": ["analyze trip requirements", "build itinerary", "validate logistics and budget"],
    "Health": ["analyze health context", "build safe wellness guidance", "validate limitations and uncertainty"],
    "Financial Planning": ["analyze financial context", "build financial plan", "validate assumptions and risks"],
    "App/PRD spec": ["analyze product requirements", "build specification", "validate scope and acceptance criteria"],
    "Product Comparison": ["analyze comparison criteria", "compare products", "validate evidence and tradeoffs"],
    "Resume Optimization": ["analyze target role and experience", "optimize resume", "validate factual accuracy and ATS fit"],
    "Diet & Workout Plan": ["analyze goals and restrictions", "build diet and workout plan", "validate safety and feasibility"],
    "Education & Learning": ["analyze current level and learning goals", "build learning plan", "validate workload and progression"],
    "Debugging Issues": ["analyze evidence", "diagnose root cause", "validate fix plan"],
    "Other": ["analyze input", "build response", "validate result"]
  };

  const PPT_STEP_TEMPLATE = ["analyze audience, goal, and core message", "build storyline and one-idea-per-slide outline", "validate flow, timing, and supporting evidence"];

  const GENERIC_WORKFLOW = [
    "Inspect current state",
    "Select the highest-priority unfinished task",
    "Plan the smallest safe change",
    "Implement the change",
    "Run required validation",
    "Review the diff and results",
    "Report progress",
    "Evaluate stop conditions"
  ].join("\n");

  const CODING_CATEGORY_TEMPLATES = {
    "Feature Development": {
      lead: "For feature development:",
      placeholders: {
        agentRole: "Senior software engineer familiar with the existing architecture",
        codingGoal: "Implement the requested feature without expanding scope",
        definitionOfDone: "Acceptance criteria pass\nTests cover the new behavior\nCompatibility is reviewed",
        startingContext: "Existing architecture, product requirements, and known constraints",
        taskQueue: "Inspect architecture\nImplement the smallest feature slice\nAdd tests\nRun quality gates",
        validationCommands: "Use the repository's documented build, test, lint, and type-check commands",
        codingMustAvoid: "Unrequested features\nBreaking public interfaces\nLarge unrelated rewrites",
        stopConditions: "Acceptance criteria pass\nA risky action needs approval\nA requirement is blocked"
      },
      workflow: ["Inspect existing architecture", "Confirm requirements and acceptance criteria", "Select the smallest implementable feature slice", "Implement the slice", "Add or update tests", "Run quality gates", "Review compatibility and diff", "Continue until complete"].join("\n")
    },
    "Bug Fixing": {
      lead: "For bug fixing:",
      placeholders: {
        agentRole: "Senior debugging engineer focused on evidence and regression safety",
        codingGoal: "Reproduce, isolate, and fix the verified defect",
        definitionOfDone: "Root cause is verified\nRegression test passes\nUnrelated behavior remains unchanged",
        startingContext: "Reproduction steps, logs, stack traces, and recent changes",
        taskQueue: "Reproduce the defect\nCapture evidence\nIsolate root cause\nAdd a regression test\nApply the smallest fix",
        validationCommands: "Run the regression test first, then relevant broader checks",
        codingMustAvoid: "Speculative fixes\nHiding errors\nDisabling valid tests\nTreating symptoms without evidence",
        stopConditions: "The regression test and broader checks pass\nThe defect cannot be reproduced\nA risky fix needs approval"
      },
      workflow: ["Reproduce the defect", "Record observable evidence", "Isolate the smallest verified root cause", "Add or identify a regression test", "Implement the smallest safe fix", "Run targeted and broader validation", "Confirm unrelated behavior remains unchanged"].join("\n")
    },
    "Refactoring & Migration": {
      lead: "For refactoring and migration:",
      placeholders: {
        agentRole: "Senior engineer experienced in incremental migrations and compatibility",
        codingGoal: "Complete the requested migration in reversible, reviewable steps",
        definitionOfDone: "Current behavior is preserved\nCompatibility checks pass\nDeprecated paths are removed only when safe",
        startingContext: "Current behavior, dependency graph, compatibility requirements, and migration target",
        taskQueue: "Record current behavior\nMap dependencies\nMake one reversible change\nRun regression checks",
        validationCommands: "Run compatibility, regression, build, and migration checks",
        codingMustAvoid: "Large unreviewable rewrites\nUnrelated features\nPremature removal of compatibility paths",
        stopConditions: "Migration checks pass\nRollback is not possible\nCompatibility risk needs approval"
      },
      workflow: ["Record current behavior", "Identify dependencies and migration order", "Make one reversible change", "Run compatibility and regression checks", "Review the diff", "Continue incrementally", "Remove deprecated code only when safe"].join("\n")
    },
    "Testing & Quality": {
      lead: "For testing and quality work:",
      placeholders: {
        agentRole: "Quality engineer focused on deterministic, high-value checks",
        codingGoal: "Improve the specified quality signal without weakening valid gates",
        definitionOfDone: "The stated threshold is measured and reached\nChecks are deterministic\nExisting valid tests still pass",
        startingContext: "Current baseline, failing checks, target threshold, and affected modules",
        taskQueue: "Measure baseline\nSelect the highest-value gap\nAdd or repair one check\nRun broader gates",
        validationCommands: "Run the affected check, then the broader quality-gate sequence",
        codingMustAvoid: "Deleting valid tests\nWeakening thresholds without approval\nBrittle tests\nUnmeasured coverage claims",
        stopConditions: "The measured threshold is reached\nA flaky or baseline failure blocks progress\nApproval is required"
      },
      workflow: ["Measure the current baseline", "Identify the highest-value quality gap", "Add or repair one check at a time", "Run the affected test or scan", "Run broader quality gates", "Verify determinism", "Continue until the stated threshold is reached"].join("\n")
    },
    "Other": {
      lead: "For this coding loop:",
      placeholders: {
        agentRole: "",
        codingGoal: "",
        definitionOfDone: "",
        startingContext: "",
        taskQueue: "",
        validationCommands: "",
        codingMustAvoid: "",
        stopConditions: ""
      },
      workflow: GENERIC_WORKFLOW
    }
  };

  const field = (id, label, tip, options = {}) => ({ id, label, tip, ...options });

  // File sanitization: remove control chars, bidi controls, zero-width chars, collapse whitespace, cap length
  function sanitizeFilename(name) {
    if (typeof name !== "string") return "";
    let s = name.replace(/[\u0000-\u001F\u007F\u202A-\u202E\u2066-\u2069\u200B-\u200D\uFEFF]/g, "");
    s = s.replace(/\s+/g, " ").trim();
    s = s.replace(/"/g, "'");
    s = s.substring(0, 200);
    return s;
  }

  // Extract the extension from the LAST segment of the sanitised name and check it
  // case-insensitively against an {ext: label} map. The accept attribute is only a hint;
  // this is the actual gate. Rejects extensionless names and anything not on the list.
  function getFileType(filename, extensionLabels) {
    const sanitized = sanitizeFilename(filename);
    if (!sanitized) return null;
    const parts = sanitized.split(".");
    if (parts.length < 2) return null;
    const ext = "." + parts[parts.length - 1].toLowerCase();
    return Object.prototype.hasOwnProperty.call(extensionLabels, ext) ? { name: sanitized, ext, label: extensionLabels[ext] } : null;
  }

  const PPT_SOURCE_EXTENSIONS = { ".docx": "Word", ".doc": "Word", ".xlsx": "Excel", ".xls": "Excel", ".pdf": "PDF", ".md": "Markdown" };
  const IMAGE_REFERENCE_EXTENSIONS = { ".png": "image", ".jpg": "image", ".jpeg": "image", ".webp": "image" };
  const VIDEO_START_FRAME_EXTENSIONS = { ".png": "image", ".jpg": "image", ".jpeg": "image", ".webp": "image" };

  // Closure-scoped store for attached filenames only. Never exposed on window;
  // the file itself is never read, so there is nothing else to hold.
  const attachedFiles = { pptSourceFile: null, imgReferenceFile: null, vidStartFrameFile: null };

  function renderFileChip(chipHostId, storeKey, inputId) {
    const host = document.getElementById(chipHostId);
    if (!host) return;
    host.replaceChildren();
    const file = attachedFiles[storeKey];
    if (!file) return;
    const chip = document.createElement("span");
    chip.className = "file-chip";
    chip.appendChild(document.createTextNode(`${file.label}: ${file.name}`));
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "file-chip-remove";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      attachedFiles[storeKey] = null;
      renderFileChip(chipHostId, storeKey, inputId);
      scheduleOutputRefresh();
    });
    chip.appendChild(removeBtn);
    host.appendChild(chip);
  }

  function setupFileInput(inputId, extensionLabels, storeKey, chipHostId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener("change", () => {
      const picked = input.files && input.files[0];
      input.value = ""; // release the file from memory immediately, whether accepted or not
      if (!picked) return;
      const file = getFileType(picked.name, extensionLabels);
      if (!file) {
        setError(input, `Unsupported file type. Allowed: ${Object.keys(extensionLabels).join(", ")}.`);
        return;
      }
      setError(input, "");
      attachedFiles[storeKey] = file;
      renderFileChip(chipHostId, storeKey, inputId);
      showToast("Using the file name only. The file was not read or stored, and it has been released. Attach it in your AI chat.");
      scheduleOutputRefresh();
    });
  }

  const CODING_BASIC_GROUPS = [
    {
      title: "Definition",
      fields: [
        field("loopName", "Loop Name", "give the loop a short name that is easy to identify."),
        field("agentRole", "Agent Role", "describe the engineering role and expertise expected."),
        field("codingGoal", "Goal", "state the exact coding outcome without granting extra permissions.", { type: "textarea" }),
        field("definitionOfDone", "Definition of Done", "list objective completion checks, one per line.", { type: "textarea", list: true }),
        field("startingContext", "Starting Context", "provide architecture, known state, constraints, and verified evidence.", { type: "textarea" })
      ]
    },
    {
      title: "Workspace",
      fields: [
        field("repositoryScope", "Repository or Working Scope", "name the repository, directory, or logical scope as inert text."),
        field("includedPaths", "Included Paths", "list paths the loop may inspect or modify, one per line.", { type: "textarea", list: true }),
        field("excludedPaths", "Excluded Paths", "list paths that must remain untouched, one per line.", { type: "textarea", list: true })
      ]
    },
    {
      title: "Work",
      fields: [
        field("taskQueue", "Task Queue", "list ordered tasks or backlog items, one per line.", { type: "textarea", list: true }),
        field("iterationWorkflow", "Iteration Workflow", "list the ordered steps followed during every iteration.", { type: "textarea", list: true, defaultValue: GENERIC_WORKFLOW }),
        field("allowedCommands", "Allowed Commands", "list only commands that are explicitly permitted, one per line.", { type: "textarea", list: true, command: true }),
        field("validationCommands", "Validation Commands", "list build, test, lint, or scan commands required for verification.", { type: "textarea", list: true, command: true })
      ]
    },
    {
      title: "Boundaries",
      fields: [
        field("codingMustAvoid", "Must Avoid", "list prohibited changes, shortcuts, assumptions, or behaviors.", { type: "textarea", list: true }),
        field("maxIterations", "Max Iterations", "set a hard limit from 1 to 1000 iterations.", { type: "number", min: 1, max: 1000, step: 1, defaultValue: "10" }),
        field("stopConditions", "Stop Conditions", "list conditions that complete or pause the loop, one per line.", { type: "textarea", list: true }),
        field("humanApproval", "Human Approval", "choose when the loop must pause for human approval.", { type: "select", defaultValue: "before_risky_actions", choices: [["before_risky_actions", "Before risky actions"], ["before_any_change", "Before any change"], ["not_required", "Not required"]] })
      ]
    },
    {
      title: "Reporting",
      fields: [
        field("iterationReport", "Per-Iteration Report", "specify the evidence reported after each iteration.", { type: "textarea", defaultValue: "Max 5 lines: summary, files changed, commands run (no logs), validation results, blockers, next action" }),
        field("finalReportRequirements", "Final Report Requirements", "specify final evidence, limitations, and unresolved risks.", { type: "textarea" })
      ]
    }
  ];

  const CODING_ADVANCED_GROUPS = [
    {
      title: "Workspace and Environment",
      fields: [
        field("repositoryLocation", "Repository URL or Local Path", "record the repository location as inert text."),
        field("workingDirectory", "Working Directory", "identify the allowed working directory without executing or opening it."),
        field("baseBranch", "Base Branch", "name the branch used as the comparison baseline."),
        field("workBranch", "Work Branch", "name the existing work branch; this does not grant branch-creation permission."),
        field("branchStrategy", "Branch Strategy", "choose a bounded branch strategy.", { type: "select", defaultValue: "existing_branch_only", choices: [["existing_branch_only", "Existing branch only"], ["create_branch_with_approval", "Create branch with approval"], ["no_branch_changes", "No branch changes"]] }),
        field("runtimeLanguage", "Runtime or Language", "state relevant language and runtime versions."),
        field("operatingSystem", "Operating System", "record relevant platform constraints without binding the prompt unnecessarily."),
        field("environmentSetupCommands", "Environment Setup Commands", "list only explicitly approved setup commands.", { type: "textarea", list: true, command: true }),
        field("environmentVariableNames", "Required Environment Variable Names", "list variable names only; never include secret values.", { type: "textarea", list: true }),
        field("networkAccess", "Network Access", "define the network boundary; the safe default is no access.", { type: "select", defaultValue: "not_allowed", choices: [["not_allowed", "Not allowed"], ["approval_required", "Approval required"], ["allowed_hosts_only", "Allowed hosts only"]] }),
        field("allowedNetworkHosts", "Allowed Network Hosts", "list approved hosts only when network access explicitly permits them.", { type: "textarea", list: true }),
        field("packageInstallationPolicy", "Package Installation Policy", "define whether package installation is prohibited or requires approval.", { type: "select", defaultValue: "approval_required", choices: [["not_allowed", "Not allowed"], ["approval_required", "Approval required"], ["allowed_list_only", "Allowed list only"]] }),
        field("allowedPackages", "Allowed Packages", "list packages explicitly approved for installation.", { type: "textarea", list: true })
      ]
    },
    {
      title: "Task Selection and Planning",
      fields: [
        field("priorityOrder", "Priority Order", "describe how queued tasks are ranked."),
        field("taskSelectionRule", "Task Selection Rule", "define the deterministic rule used to choose the next task."),
        field("planningRequirement", "Planning Requirement", "choose the planning evidence needed before edits begin.", { type: "select", defaultValue: "required_before_changes", choices: [["required_before_changes", "Required before changes"], ["lightweight", "Lightweight plan"], ["not_required", "Not required"]] }),
        field("maxActiveTasks", "Maximum Active Tasks", "limit concurrent active tasks from 1 to 100.", { type: "number", min: 1, max: 100, step: 1, defaultValue: "1" }),
        field("dependencyHandling", "Dependency Handling", "explain how blocked or dependent tasks are handled."),
        field("unknownsPolicy", "Unknowns Policy", "choose how unknowns are surfaced instead of guessed.", { type: "select", defaultValue: "stop_and_report", choices: [["stop_and_report", "Stop and report"], ["document_and_continue", "Document and continue"], ["request_approval", "Request approval"]] })
      ]
    },
    {
      title: "Execution Boundaries",
      fields: [
        field("autonomyLevel", "Autonomy Level", "set a bounded autonomy level that still respects approvals.", { type: "select", defaultValue: "bounded", choices: [["guided", "Guided"], ["bounded", "Bounded"], ["independent_within_permissions", "Independent within permissions"]] }),
        field("allowedOperations", "Allowed Operations", "list operations explicitly permitted by the user.", { type: "textarea", list: true }),
        field("forbiddenOperations", "Forbidden Operations", "list operations the loop must never perform.", { type: "textarea", list: true }),
        field("blockedCommands", "Blocked Commands", "list commands that must never be run.", { type: "textarea", list: true, command: true }),
        field("fileCreationPolicy", "File Creation Policy", "choose when files can be created within the approved scope.", { type: "select", defaultValue: "allowed_in_scope", choices: [["allowed_in_scope", "Allowed in scope"], ["approval_required", "Approval required"], ["not_allowed", "Not allowed"]] }),
        field("fileDeletionPolicy", "File Deletion Policy", "choose the deletion boundary; approval is the safe default.", { type: "select", defaultValue: "approval_required", choices: [["approval_required", "Approval required"], ["not_allowed", "Not allowed"]] }),
        field("dependencyChangePolicy", "Dependency Change Policy", "define approval and justification required for dependency changes."),
        field("configurationChangePolicy", "Configuration Change Policy", "define which configuration changes are permitted."),
        field("secretsPolicy", "Secrets Policy", "prohibit exposing, inventing, or logging secret values.", { defaultValue: "Never expose, invent, or log secret values" }),
        field("destructiveActionPolicy", "Destructive Action Policy", "require explicit approval for every destructive action.", { defaultValue: "Never perform destructive actions without explicit approval" })
      ]
    },
    {
      title: "Quality Gates",
      fields: [
        field("buildCommand", "Build Command", "provide the approved build command.", { command: true }),
        field("unitTestCommand", "Unit Test Command", "provide the approved unit-test command.", { command: true }),
        field("integrationTestCommand", "Integration Test Command", "provide the approved integration-test command.", { command: true }),
        field("lintCommand", "Lint Command", "provide the approved lint command.", { command: true }),
        field("typeCheckCommand", "Type Check Command", "provide the approved type-check command.", { command: true }),
        field("securityScanCommand", "Security Scan Command", "provide the approved security-scan command.", { command: true }),
        field("formattingCheckCommand", "Formatting Check Command", "provide the approved formatting-check command.", { command: true }),
        field("coverageCommand", "Coverage Command", "provide the approved coverage command.", { command: true }),
        field("minimumCoverage", "Minimum Coverage Percent", "set the measured threshold from 0 to 100.", { type: "number", min: 0, max: 100, step: 0.1 }),
        field("acceptanceChecks", "Acceptance Checks", "list product or behavior checks required for completion.", { type: "textarea", list: true }),
        field("gateOrder", "Gate Order", "list quality gates in execution order.", { type: "textarea", list: true }),
        field("gateFailureBehavior", "Gate Failure Behaviour", "choose the safe response when a quality gate fails.", { type: "select", defaultValue: "stop_and_report", choices: [["stop_and_report", "Stop and report"], ["retry_safe_checks", "Retry safe checks"], ["request_approval", "Request approval"]] }),
        field("baselineFailurePolicy", "Baseline Failure Policy", "explain how pre-existing failures are recorded without being hidden.")
      ]
    },
    {
      title: "Limits and Budgets",
      fields: [
        field("maxFailedIterations", "Max Consecutive Failed Iterations", "limit consecutive failed iterations from 0 to 20.", { type: "number", min: 0, max: 20, step: 1, defaultValue: "3" }),
        field("commandRetryLimit", "Command Retry Limit", "limit safe command retries from 0 to 20.", { type: "number", min: 0, max: 20, step: 1, defaultValue: "2" }),
        field("maxChangedFiles", "Maximum Changed Files per Iteration", "bound the number of changed files to a positive integer.", { type: "number", min: 1, max: 10000, step: 1 }),
        field("maxDiffLines", "Maximum Diff Lines per Iteration", "bound diff size to a positive integer.", { type: "number", min: 1, max: 1000000, step: 1 }),
        field("timeBudgetValue", "Time Budget Value", "set a non-negative time budget value.", { type: "number", min: 0, max: 1000000, step: 0.1 }),
        field("timeBudgetUnit", "Time Budget Unit", "choose the unit for the time budget.", { type: "select", choices: [["", "Not specified"], ["minutes", "Minutes"], ["hours", "Hours"], ["days", "Days"]] }),
        field("tokenBudget", "Token Budget", "set a non-negative integer token budget.", { type: "number", min: 0, max: 1000000000, step: 1 }),
        field("costBudget", "Cost Budget", "set a non-negative cost budget amount.", { type: "number", min: 0, max: 1000000000, step: 0.01 }),
        field("costCurrency", "Cost Currency", "choose the currency for the cost budget.", { type: "select", choices: [["", "Not specified"], ["USD", "USD"], ["EUR", "EUR"], ["GBP", "GBP"], ["INR", "INR"], ["other", "Other"]] }),
        field("budgetExceededBehavior", "Budget Exceeded Behaviour", "define whether the loop stops or requests approval when a budget is reached.")
      ]
    },
    {
      title: "Git and Change Management",
      fields: [
        field("commitPolicy", "Commit Policy", "choose whether commits are prohibited or require approval.", { type: "select", defaultValue: "not_allowed", choices: [["not_allowed", "Not allowed"], ["approval_required", "Approval required"], ["explicitly_allowed", "Explicitly allowed"]] }),
        field("commitMessagePattern", "Commit Message Pattern", "provide a pattern only when commits are explicitly permitted."),
        field("pushPolicy", "Push Policy", "choose whether pushing is prohibited or requires approval.", { type: "select", defaultValue: "not_allowed", choices: [["not_allowed", "Not allowed"], ["approval_required", "Approval required"], ["explicitly_allowed", "Explicitly allowed"]] }),
        field("pullRequestPolicy", "Pull Request Policy", "choose whether pull-request creation is prohibited or requires approval.", { type: "select", defaultValue: "not_allowed", choices: [["not_allowed", "Not allowed"], ["approval_required", "Approval required"], ["explicitly_allowed", "Explicitly allowed"]] }),
        field("amendCommits", "Amend Existing Commits", "define whether amending is prohibited or explicitly allowed.", { defaultValue: "Not allowed unless explicitly instructed" }),
        field("rebasePolicy", "Rebase Policy", "choose whether rebasing is prohibited or requires approval.", { type: "select", defaultValue: "not_allowed", choices: [["not_allowed", "Not allowed"], ["approval_required", "Approval required"], ["explicitly_allowed", "Explicitly allowed"]] }),
        field("generatedFilesPolicy", "Generated Files Policy", "define when canonical generators must be used."),
        field("lockfilePolicy", "Lockfile Policy", "define when lockfiles may change and how they are verified.")
      ]
    },
    {
      title: "Approval and Risk",
      fields: [
        field("approvalPolicy", "Approval Policy", "state which decisions require explicit human approval."),
        field("riskTriggers", "Risk Triggers", "list conditions that force the loop to pause for approval.", { type: "textarea", list: true }),
        field("protectedPaths", "Protected Paths", "list paths that cannot be changed without approval.", { type: "textarea", list: true }),
        field("protectedOperations", "Protected Operations", "list operations that require explicit approval.", { type: "textarea", list: true }),
        field("approvalRequestRequirements", "Approval Request Requirements", "state the evidence and tradeoffs an approval request must include."),
        field("approvalTimeoutBehavior", "Approval Timeout Behaviour", "define a safe stop behavior when approval is not received.")
      ]
    },
    {
      title: "Recovery",
      fields: [
        field("checkpointAfterIteration", "Checkpoint After Each Iteration", "choose whether a durable progress checkpoint is required.", { type: "select", defaultValue: "yes", choices: [["yes", "Yes"], ["no", "No"]] }),
        field("checkpointContents", "Checkpoint Contents", "list the state and evidence captured in each checkpoint.", { type: "textarea", list: true }),
        field("rollbackPolicy", "Rollback Policy", "define safe rollback behavior without granting destructive permissions."),
        field("failureAnalysisRequirement", "Failure Analysis Requirement", "state the root-cause evidence required after a failed iteration."),
        field("recoveryAttempts", "Recovery Attempts", "limit non-destructive recovery attempts from 0 to 20.", { type: "number", min: 0, max: 20, step: 1, defaultValue: "2" }),
        field("unrecoverableFailureBehavior", "Unrecoverable Failure Behaviour", "define the report and safe stop behavior for unrecoverable failures."),
        field("resumeInstructions", "Resume Instructions", "state the evidence needed to resume a stopped loop.", { type: "textarea" })
      ]
    },
    {
      title: "Reporting and Completion",
      fields: [
        field("reportChangedFiles", "Report Changed Files", "choose whether every report lists changed files.", { type: "select", defaultValue: "yes", choices: [["yes", "Yes"], ["no", "No"]] }),
        field("reportCommandsRun", "Report Commands Run", "choose whether every report lists commands run.", { type: "select", defaultValue: "yes", choices: [["yes", "Yes"], ["no", "No"]] }),
        field("reportValidationResults", "Report Validation Results", "choose whether every report includes observed validation results.", { type: "select", defaultValue: "yes", choices: [["yes", "Yes"], ["no", "No"]] }),
        field("reportRemainingRisks", "Report Remaining Risks", "choose whether the final report lists unresolved risks.", { type: "select", defaultValue: "yes", choices: [["yes", "Yes"], ["no", "No"]] }),
        field("reportUnfinishedTasks", "Report Unfinished Tasks", "choose whether the final report lists unfinished work.", { type: "select", defaultValue: "yes", choices: [["yes", "Yes"], ["no", "No"]] }),
        field("finalDiffReview", "Final Diff Review Required", "require a final review of the complete diff before completion.", { type: "select", defaultValue: "yes", choices: [["yes", "Yes"], ["no", "No"]] }),
        field("completionStatus", "Completion Status", "select the final status only when supported by observed evidence.", { type: "select", choices: [["", "Not set"], ["complete", "complete"], ["partial", "partial"], ["blocked", "blocked"], ["stopped_by_limit", "stopped_by_limit"], ["stopped_for_approval", "stopped_for_approval"]] })
      ]
    }
  ];

  const PPT_FIELDS = [
    {
      title: "Presentation Brief",
      fields: [
        field("pptRole", "Role", "describe the presenter's expertise and perspective.", {
          defaultValue: PPT_PITCH_DECK_TEMPLATE.role
        }),
        field("pptAudience", "Target Audience", "name the decision-maker or attendee type.", {
          defaultValue: PPT_PITCH_DECK_TEMPLATE.targetAudience
        }),
        field("pptObjective", "Objective", "state the exact outcome: build consensus, secure funding, or close a deal.", {
          type: "textarea",
          defaultValue: PPT_PITCH_DECK_TEMPLATE.objective
        }),
        field("pptContext", "Context", "provide the subject, key message, time limit, and available data.", {
          type: "textarea",
          defaultValue: PPT_PITCH_DECK_TEMPLATE.context
        }),
        field("pptMustInclude", "Must Include", "list required elements, one per line.", {
          type: "textarea",
          list: true,
          defaultValue: PPT_PITCH_DECK_TEMPLATE.mustInclude
        }),
        field("pptMustAvoid", "Must Avoid", "list prohibited content or approaches, one per line.", {
          type: "textarea",
          list: true,
          defaultValue: PPT_PITCH_DECK_TEMPLATE.mustAvoid
        })
      ]
    },
    {
      title: "Deliverable and Scope",
      fields: [
        field("pptDeliverable", "Deliverable", "choose the output format.", {
          type: "select",
          defaultValue: "slide_outline",
          choices: [
            ["slide_outline", "Slide-by-slide outline (text)"],
            ["pptx_file", "Downloadable .pptx file"],
            ["deck_tool_content", "Content for a deck tool (Gamma, Canva, Copilot)"]
          ]
        }),
        field("pptSlideCount", "Number of Slides", "choose a slide count or Unlimited (unbounded reply).", {
          type: "select",
          defaultValue: "5",
          choices: [
            ["5", "5 slides"], ["6", "6 slides"], ["7", "7 slides"], ["8", "8 slides"],
            ["9", "9 slides"], ["10", "10 slides"], ["11", "11 slides"], ["12", "12 slides"],
            ["0", "Unlimited ⚠"]
          ]
        }),
        field("pptWordsPerSlide", "Words per Slide or Bullets", "choose a word limit or bullet count.", {
          type: "select",
          defaultValue: "40_words",
          optgroups: [
            ["Words", [
              ["20_words", "Up to 20 words"], ["25_words", "Up to 25 words"], ["40_words", "Up to 40 words"],
              ["50_words", "Up to 50 words"], ["60_words", "Up to 60 words"], ["75_words", "Up to 75 words"]
            ]],
            ["Bullets", [
              ["3_bullets", "Up to 3 bullets"], ["4_bullets", "Up to 4 bullets"], ["5_bullets", "Up to 5 bullets"]
            ]]
          ],
          choices: [["custom_words", "Custom word count"]]
        }),
        field("pptCustomWords", "Custom Word Count", "enter a word limit from 10 to 150 (visible only when Custom is selected).", {
          type: "number",
          min: 10,
          max: 150,
          step: 1,
          hidden: true
        }),
        field("pptSpeakerNotes", "Speaker Notes", "include detailed speaker notes alongside slides.", {
          type: "checkbox"
        })
      ]
    },
    {
      title: "Source Material",
      fields: [
        field("pptSourceFile", "Select source file", "Word, Excel, PDF or Markdown. Only the file name is used.", {
          type: "file",
          fileInput: true,
          accept: ".docx,.doc,.xlsx,.xls,.pdf,.md"
        })
      ]
    }
  ];

  const elements = {};
  let toastTimer;
  let workflowManaged = true;
  let hasGeneratedOutput = false;
  let refreshTimer;
  let selectedProvider = "chatgpt";

  function createField(config) {
    const label = document.createElement("label");
    if (config.full) label.classList.add("full");
    if (config.hidden) label.hidden = true;
    label.appendChild(document.createTextNode(config.label));

    let control;
    if (config.type === "checkbox") {
      control = document.createElement("input");
      control.type = "checkbox";
    } else if (config.type === "file") {
      control = document.createElement("input");
      control.type = "file";
      if (config.accept) control.accept = config.accept;
    } else if (config.type === "textarea") {
      control = document.createElement("textarea");
      control.rows = 3;
      control.maxLength = 5000;
    } else if (config.type === "select") {
      control = document.createElement("select");
      const addOption = ([value, text]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        return option;
      };
      if (config.optgroups) {
        config.optgroups.forEach(([groupLabel, groupChoices]) => {
          const group = document.createElement("optgroup");
          group.label = groupLabel;
          groupChoices.forEach(pair => group.appendChild(addOption(pair)));
          control.appendChild(group);
        });
      }
      (config.choices || []).forEach(pair => control.appendChild(addOption(pair)));
    } else {
      control = document.createElement("input");
      control.type = config.type || "text";
      if (control.type === "text") control.maxLength = 500;
    }

    control.id = config.id;
    control.name = config.id;
    control.classList.add("coding-control");
    if (config.defaultValue !== undefined) {
      control.value = config.defaultValue;
      control.defaultValue = config.defaultValue;
      if (control.tagName === "SELECT") {
        Array.from(control.options).forEach(option => { option.defaultSelected = option.value === config.defaultValue; });
      }
    }
    if (config.placeholder) control.placeholder = config.placeholder;
    if (config.min !== undefined) control.min = String(config.min);
    if (config.max !== undefined) control.max = String(config.max);
    if (config.step !== undefined) control.step = String(config.step);
    if (config.list) control.dataset.list = "true";
    if (config.command) control.dataset.command = "true";

    const tip = document.createElement("small");
    tip.id = `${config.id}-tip`;
    tip.className = "field-hint coding-tip";
    tip.dataset.baseTip = config.tip;

    const error = document.createElement("small");
    error.id = `${config.id}-error`;
    error.className = "field-error";
    error.setAttribute("aria-live", "polite");
    control.setAttribute("aria-describedby", `${tip.id} ${error.id}`);
    label.append(control, tip, error);
    return label;
  }

  function renderGroup(group, advanced) {
    if (advanced) {
      const details = document.createElement("details");
      details.className = "coding-details";
      const summary = document.createElement("summary");
      summary.textContent = group.title;
      const grid = document.createElement("div");
      grid.className = "coding-fields-grid";
      group.fields.forEach(config => grid.appendChild(createField(config)));
      details.append(summary, grid);
      return details;
    }

    const section = document.createElement("div");
    section.className = "section-group";
    const heading = document.createElement("h3");
    heading.textContent = group.title;
    section.appendChild(heading);
    group.fields.forEach(config => section.appendChild(createField(config)));
    return section;
  }

  function renderPptFields() {
    const container = document.createDocumentFragment();
    PPT_FIELDS.forEach(group => {
      const section = document.createElement("div");
      section.className = "section-group";
      const heading = document.createElement("h3");
      heading.textContent = group.title;
      section.appendChild(heading);
      group.fields.forEach(config => {
        const el = createField(config);
        section.appendChild(el);
        if (config.fileInput) {
          const chipHost = document.createElement("div");
          chipHost.id = `${config.id}-chip`;
          chipHost.className = "file-chip-host";
          el.appendChild(chipHost);
          const helper = document.createElement("small");
          helper.className = "field-hint";
          helper.textContent = "The file is never read, uploaded or stored. Attach the same file in your AI chat.";
          el.appendChild(helper);
        }
      });
      container.appendChild(section);
    });
    elements.pptFieldsMount.replaceChildren(container);
    document.querySelectorAll("#pptFieldsMount .coding-tip").forEach(tip => { tip.textContent = tip.dataset.baseTip; });
    setupFileInput("pptSourceFile", PPT_SOURCE_EXTENSIONS, "pptSourceFile", "pptSourceFile-chip");
    document.getElementById("pptWordsPerSlide").addEventListener("change", updatePptWordsVisibility);
    document.getElementById("pptSlideCount").addEventListener("change", updatePptSlideCountTip);
    updatePptWordsVisibility();
    updatePptSlideCountTip();
  }

  function updatePptWordsVisibility() {
    const isCustom = value("pptWordsPerSlide") === "custom_words";
    const customField = document.getElementById("pptCustomWords")?.closest("label");
    if (customField) customField.hidden = !isCustom;
    if (!isCustom) setError(document.getElementById("pptCustomWords"), "");
  }

  // Unlimited is a warning, not a blocking error: generate must still work, so this
  // swaps the tip text directly instead of going through setError.
  function updatePptSlideCountTip() {
    const tip = document.getElementById("pptSlideCount-tip");
    if (!tip) return;
    const isUnlimited = value("pptSlideCount") === "0";
    tip.textContent = isUnlimited
      ? "No slide cap. The reply and its token use are unbounded."
      : tip.dataset.baseTip;
  }

  function renderCodingFields() {
    const intro = document.createElement("div");
    intro.className = "coding-intro-grid";
    intro.append(
      createField(field("codingCategory", "Category", "choose the work category; it changes guidance only and never grants permissions.", {
        type: "select",
        choices: Object.keys(CODING_CATEGORY_TEMPLATES).map(value => [value, value])
      })),
      createField(field("codingMode", "Coding Loop Mode", "choose Basic or reveal additional Advanced controls without clearing values.", {
        type: "select",
        choices: [["basic", "Basic"], ["advanced", "Advanced"]]
      }))
    );

    const basic = document.createElement("div");
    basic.id = "codingBasicFields";
    basic.className = "mode-section";
    CODING_BASIC_GROUPS.forEach(group => basic.appendChild(renderGroup(group, false)));

    const advanced = document.createElement("div");
    advanced.id = "codingAdvancedFields";
    advanced.className = "full";
    advanced.hidden = true;
    CODING_ADVANCED_GROUPS.forEach(group => advanced.appendChild(renderGroup(group, true)));
    advanced.classList.add("advanced-coding-groups");

    const evidenceGuard = document.createElement("div");
    evidenceGuard.className = "guard-row full";
    const guardCopy = document.createElement("div");
    guardCopy.className = "guard-copy";
    const guardLabel = document.createElement("span");
    guardLabel.className = "guard-label";
    guardLabel.textContent = "Evidence Guard";
    const tip = document.createElement("small");
    tip.id = "evidenceGuard-tip";
    tip.className = "field-hint";
    tip.textContent = "Prevents claims about edits, commands, tests, approvals, or results without observable evidence.";
    const error = document.createElement("small");
    error.id = "evidenceGuard-error";
    error.className = "field-error";
    error.setAttribute("aria-live", "polite");
    guardCopy.append(guardLabel, tip, error);

    const toggle = document.createElement("label");
    toggle.className = "switch";
    toggle.htmlFor = "evidenceGuard";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "evidenceGuard";
    checkbox.name = "evidenceGuard";
    checkbox.checked = true;
    checkbox.defaultChecked = true;
    checkbox.setAttribute("aria-describedby", `${tip.id} ${error.id}`);
    const slider = document.createElement("span");
    slider.className = "slider";
    slider.setAttribute("aria-hidden", "true");
    const state = document.createElement("span");
    state.id = "evidenceGuardState";
    state.textContent = "On";
    toggle.append(checkbox, slider, state);
    evidenceGuard.append(guardCopy, toggle);

    elements.codingFieldsMount.append(intro, evidenceGuard, basic, advanced);
  }

  function applyTextCategoryPlaceholders() {
    const template = TEXT_CATEGORY_TEMPLATES[elements.category.value] || TEXT_CATEGORY_TEMPLATES.Other;
    ["role", "targetAudience", "objective", "context", "mustInclude", "mustAvoid"].forEach(id => {
      const control = document.getElementById(id);
      if (control) control.placeholder = template[id] || "";
    });
  }

  const IMAGE_CATEGORY_TEMPLATES = {
    "Photo / Realistic": { subject: "Golden retriever wearing pilot goggles", style: "photorealistic, natural light", scene: "sunset beach with flying sand" },
    "Illustration / Art": { subject: "Fox reading a book by candlelight", style: "watercolor illustration, soft edges", scene: "cozy forest cabin interior" },
    "Logo / Icon": { subject: "Minimalist mountain peak mark", style: "flat vector, two-color", scene: "plain white background" },
    "Product Shot": { subject: "Ceramic coffee mug with steam", style: "studio product photography", scene: "seamless gradient backdrop" },
    "Poster / Social Graphic": { subject: "Bold headline over a concert crowd", style: "high-contrast graphic design", scene: "stage lights and haze" },
    "Infographic / Diagram": { subject: "Three-step onboarding flow", style: "clean flat infographic", scene: "labeled arrows and icons" },
    "UI / App Mockup": { subject: "Mobile dashboard screen", style: "modern flat UI design", scene: "phone frame on neutral background" },
    "Character / Sticker": { subject: "Cheerful cartoon otter mascot", style: "sticker-style vector art, bold outline", scene: "transparent background" },
    "Image Edit": { subject: "Existing photo with the sky replaced", style: "match original lighting and grain", scene: "unchanged foreground subject" }
  };

  const IMAGE_VIDEO_CATEGORY_FIELD_IDS = ["imgBasicSubject", "imgHqSubject", "imgBasicStyle", "imgHqStyle", "imgBasicScene", "imgHqScene", "vidBasicSubject", "vidSubject", "vidBasicScene", "vidScene"];

  // Capture each field's HTML-authored placeholder once, before any category ever overwrites it,
  // so switching back to "Not specified" restores the original rather than the last category's text.
  function captureDefaultPlaceholders() {
    IMAGE_VIDEO_CATEGORY_FIELD_IDS.forEach(id => {
      const control = document.getElementById(id);
      if (control && control.dataset.defaultPlaceholder === undefined) control.dataset.defaultPlaceholder = control.placeholder;
    });
  }

  function applyImageCategoryPlaceholders() {
    const template = IMAGE_CATEGORY_TEMPLATES[value("imageCategory")];
    [["imgBasicSubject", "subject"], ["imgHqSubject", "subject"], ["imgBasicStyle", "style"], ["imgHqStyle", "style"], ["imgBasicScene", "scene"], ["imgHqScene", "scene"]].forEach(([id, key]) => {
      const control = document.getElementById(id);
      if (control) control.placeholder = template ? template[key] : control.dataset.defaultPlaceholder;
    });
  }

  const VIDEO_CATEGORY_TEMPLATES = {
    "Cinematic Scene": { subject: "Lone rider crossing a canyon", scene: "dusk, wide desert vista", tip: "" },
    "Product Ad": { subject: "Watch rotating on a pedestal", scene: "studio backdrop with rim light", tip: "" },
    "Social Short (vertical)": { subject: "Creator holding up a product", scene: "bright indoor setting", tip: "Vertical 9:16 framing suits most social platforms." },
    "Explainer / Animation": { subject: "Animated arrow tracing a workflow", scene: "flat-design animated background", tip: "" },
    "Talking Head / UGC": { subject: "Presenter speaking to camera", scene: "casual indoor setting, natural light", tip: "" },
    "Music Video": { subject: "Band performing on stage", scene: "concert lighting and haze", tip: "" },
    "Seamless Loop": { subject: "Rotating abstract pattern", scene: "looping background motion", tip: "Ensure the first and last frame match for a clean loop." },
    "Animate an Image": { subject: "Subtle motion added to a still photo", scene: "same framing as the source image", tip: "Describe only the motion to add; the source image sets the composition." }
  };

  function applyVideoCategoryPlaceholders() {
    const template = VIDEO_CATEGORY_TEMPLATES[value("videoCategory")];
    [["vidBasicSubject", "subject"], ["vidSubject", "subject"], ["vidBasicScene", "scene"], ["vidScene", "scene"]].forEach(([id, key]) => {
      const control = document.getElementById(id);
      if (control) control.placeholder = template ? template[key] : control.dataset.defaultPlaceholder;
    });
    const categoryTip = document.getElementById("videoCategory-tip");
    if (categoryTip) categoryTip.textContent = (template && template.tip) || categoryTip.dataset.baseTip || "Choose a category to receive relevant in-field examples without changing your entries.";
  }

  function applyCodingCategoryGuidance() {
    const category = document.getElementById("codingCategory").value;
    const template = CODING_CATEGORY_TEMPLATES[category] || CODING_CATEGORY_TEMPLATES.Other;
    document.querySelectorAll(".coding-tip").forEach(tip => {
      tip.textContent = `${template.lead} ${tip.dataset.baseTip}`;
    });
    Object.entries(template.placeholders).forEach(([id, placeholder]) => {
      const control = document.getElementById(id);
      if (control) control.placeholder = placeholder;
    });
    const workflow = document.getElementById("iterationWorkflow");
    if (workflowManaged) workflow.value = template.workflow;
  }

  function updateModeVisibility() {
    const imageMode = document.getElementById("imageMode").value;
    document.getElementById("imageBasicFields").hidden = imageMode !== "basic";
    document.getElementById("imageHighFields").hidden = imageMode !== "high_quality";

    const videoMode = document.getElementById("videoMode").value;
    document.getElementById("videoBasicFields").hidden = videoMode !== "basic";
    document.getElementById("videoCinematicFields").hidden = videoMode !== "cinematic";

    const codingMode = document.getElementById("codingMode").value;
    document.getElementById("codingAdvancedFields").hidden = codingMode !== "advanced";
  }

  function updateProviderButtons(type) {
    const buttonLabels = {
      text: { chatgpt: "Copy for ChatGPT", claude: "Copy for Claude", gemini: "Copy for Gemini", grok: "Copy for Grok", generic: "Copy Generic" },
      image: { chatgpt: "Copy for ChatGPT Images", gemini: "Copy for Gemini Image", grok: "Copy for Grok Image", generic: "Copy Generic Image" },
      video: { gemini: "Copy for Gemini Video", grok: "Copy for Grok Video", generic: "Copy Generic Video" },
      coding: { chatgpt: "Copy for Codex", claude: "Copy for Claude Code", gemini: "Copy for Google Antigravity", grok: "Copy for Grok Build", generic: "Copy Generic Loop" },
      ppt: { chatgpt: "Copy for ChatGPT", claude: "Copy for Claude", gemini: "Copy for Gemini", grok: "Copy for Grok", copilot: "Copy for Microsoft Copilot", generic: "Copy Generic" }
    };
    const buttons = { chatgpt: elements.copyChatGptBtn, claude: elements.copyClaudeBtn, gemini: elements.copyGeminiBtn, grok: elements.copyGrokBtn, copilot: elements.copyCopilotBtn, generic: elements.copyGenericBtn };
    Object.entries(buttons).forEach(([provider, button]) => {
      const label = buttonLabels[type][provider];
      button.hidden = !label;
      if (label) button.textContent = label;
    });
    if (buttons[selectedProvider]?.hidden) selectedProvider = type === "video" ? "gemini" : "chatgpt";
  }

  function switchTab(type) {
    document.querySelectorAll(".interface-section").forEach(section => {
      section.hidden = section.id !== `${type}Fields`;
    });
    document.querySelectorAll(".tab-btn").forEach(button => {
      const selected = button.dataset.promptType === type;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    elements.promptType.value = type;
    updateProviderButtons(type);
    elements.status.textContent = "";
  }

  function value(id) {
    return document.getElementById(id)?.value.trim() || "";
  }

  // "Other" carries no information, so it never reaches the prompt.
  function categoryValue(id) {
    const category = value(id);
    return category === "Other" ? "" : category;
  }

  // Selects carry machine values (before_risky_actions); the prompt gets the readable label.
  function choice(id) {
    const control = document.getElementById(id);
    return control && control.value ? control.options[control.selectedIndex].text.trim() : "";
  }

  function lines(id) {
    return value(id).split(/\r?\n/).map(item => item.trim()).filter(Boolean);
  }

  function numberValue(id) {
    const raw = value(id);
    return raw === "" ? "" : Number(raw);
  }

  function checked(id) {
    return Boolean(document.getElementById(id)?.checked);
  }

  // Reads the Words per Slide select into a compact {unit, max} pair for both
  // display and JSON. Returns undefined when Custom is selected but empty/invalid.
  function pptPerSlide() {
    const selected = value("pptWordsPerSlide");
    if (selected === "custom_words") {
      const n = numberValue("pptCustomWords");
      return Number.isInteger(n) && n >= 10 && n <= 150 ? { unit: "words", max: n } : undefined;
    }
    const match = /^(\d+)_(words|bullets)$/.exec(selected);
    return match ? { unit: match[2], max: Number(match[1]) } : undefined;
  }

  function pruneEmpty(input) {
    if (Array.isArray(input)) return input.map(pruneEmpty).filter(item => item !== "" && item !== null && item !== undefined && (!Array.isArray(item) || item.length));
    if (input && typeof input === "object") {
      const result = {};
      Object.entries(input).forEach(([key, raw]) => {
        const item = pruneEmpty(raw);
        const emptyObject = item && typeof item === "object" && !Array.isArray(item) && Object.keys(item).length === 0;
        if (item === "" || item === null || item === undefined || emptyObject || (Array.isArray(item) && item.length === 0)) return;
        result[key] = item;
      });
      return result;
    }
    return input;
  }

  function buildCodingData() {
    const advanced = value("codingMode") === "advanced";
    const data = {
      task: "coding_loop",
      mode: value("codingMode"),
      cat: categoryValue("codingCategory"),
      guard: buildGuard("coding_loop", value("codingCategory"), document.getElementById("evidenceGuard").checked),
      name: value("loopName"),
      role: value("agentRole"),
      goal: value("codingGoal"),
      done: lines("definitionOfDone"),
      ctx: value("startingContext"),
      scope: {
        repository: value("repositoryScope"),
        include: lines("includedPaths"),
        exclude: lines("excludedPaths")
      },
      tasks: lines("taskQueue"),
      iter: {
        steps: lines("iterationWorkflow"),
        max_iter: numberValue("maxIterations")
      },
      exec: {
        allowed_cmds: lines("allowedCommands"),
        checks: lines("validationCommands"),
        avoid: lines("codingMustAvoid")
      },
      approval: { human_approval: choice("humanApproval") },
      stop: lines("stopConditions"),
      report: {
        per_iteration: value("iterationReport"),
        final: value("finalReportRequirements")
      }
    };

    if (advanced) {
      Object.assign(data.scope, {
        location: value("repositoryLocation"),
        workdir: value("workingDirectory"),
        base_branch: value("baseBranch"),
        work_branch: value("workBranch"),
        branch_strategy: choice("branchStrategy"),
        runtime: value("runtimeLanguage"),
        os: value("operatingSystem"),
        setup_cmds: lines("environmentSetupCommands"),
        env_names: lines("environmentVariableNames"),
        network: choice("networkAccess"),
        allowed_hosts: lines("allowedNetworkHosts"),
        package_policy: choice("packageInstallationPolicy"),
        allowed_packages: lines("allowedPackages")
      });
      data.plan = {
        priority: value("priorityOrder"),
        select: value("taskSelectionRule"),
        requirement: choice("planningRequirement"),
        max_active: numberValue("maxActiveTasks"),
        dependencies: value("dependencyHandling"),
        unknowns: choice("unknownsPolicy")
      };
      Object.assign(data.exec, {
        autonomy: choice("autonomyLevel"),
        allowed_ops: lines("allowedOperations"),
        forbidden_ops: lines("forbiddenOperations"),
        blocked_cmds: lines("blockedCommands"),
        file_create: choice("fileCreationPolicy"),
        file_delete: choice("fileDeletionPolicy"),
        dependency_changes: value("dependencyChangePolicy"),
        config_changes: value("configurationChangePolicy"),
        secrets: value("secretsPolicy"),
        destructive_actions: value("destructiveActionPolicy")
      });
      data.gates = {
        build: value("buildCommand"),
        unit: value("unitTestCommand"),
        integration: value("integrationTestCommand"),
        lint: value("lintCommand"),
        typecheck: value("typeCheckCommand"),
        security: value("securityScanCommand"),
        format: value("formattingCheckCommand"),
        coverage: value("coverageCommand"),
        min_coverage: numberValue("minimumCoverage"),
        acceptance: lines("acceptanceChecks"),
        order: lines("gateOrder"),
        on_failure: choice("gateFailureBehavior"),
        baseline_failure: value("baselineFailurePolicy")
      };
      data.limits = {
        max_failed: numberValue("maxFailedIterations"),
        retries: numberValue("commandRetryLimit"),
        max_files: numberValue("maxChangedFiles"),
        max_diff_lines: numberValue("maxDiffLines"),
        time: { value: numberValue("timeBudgetValue"), unit: choice("timeBudgetUnit") },
        tokens: numberValue("tokenBudget"),
        cost: { amount: numberValue("costBudget"), currency: choice("costCurrency") },
        on_exceeded: value("budgetExceededBehavior")
      };
      data.git = {
        commit: choice("commitPolicy"),
        message_pattern: value("commitMessagePattern"),
        push: choice("pushPolicy"),
        pull_request: choice("pullRequestPolicy"),
        amend: value("amendCommits"),
        rebase: choice("rebasePolicy"),
        generated_files: value("generatedFilesPolicy"),
        lockfiles: value("lockfilePolicy")
      };
      Object.assign(data.approval, {
        policy: value("approvalPolicy"),
        risk_triggers: lines("riskTriggers"),
        protected_paths: lines("protectedPaths"),
        protected_operations: lines("protectedOperations"),
        request: value("approvalRequestRequirements"),
        timeout: value("approvalTimeoutBehavior")
      });
      data.recovery = {
        checkpoint: choice("checkpointAfterIteration"),
        checkpoint_contents: lines("checkpointContents"),
        rollback: value("rollbackPolicy"),
        failure_analysis: value("failureAnalysisRequirement"),
        attempts: numberValue("recoveryAttempts"),
        unrecoverable: value("unrecoverableFailureBehavior"),
        resume: value("resumeInstructions")
      };
      Object.assign(data.report, {
        changed_files: choice("reportChangedFiles"),
        commands: choice("reportCommandsRun"),
        validation: choice("reportValidationResults"),
        remaining_risks: choice("reportRemainingRisks"),
        unfinished_tasks: choice("reportUnfinishedTasks"),
        final_diff_review: value("finalDiffReview") === "yes" ? "review the full diff without printing it" : choice("finalDiffReview"),
        status: choice("completionStatus")
      });
    }
    return pruneEmpty(data);
  }

  function getFormData() {
    const type = elements.promptType.value;
    if (type === "coding") return buildCodingData();
    if (type === "image") {
      const imageShared = {
        cat: categoryValue("imageCategory"),
        extra: { text: lines("imgTextToRender"), background: choice("imgBackground"), variations: value("imgVariations"), change: lines("imgWhatToChange"), keep: lines("imgWhatToKeep") },
        ref: attachedFiles.imgReferenceFile ? `attached image "${attachedFiles.imgReferenceFile.name}"` : ""
      };
      if (value("imageMode") === "basic") return pruneEmpty({ task: "image", mode: "basic", ...imageShared, subj: value("imgBasicSubject"), style: value("imgBasicStyle"), scene: value("imgBasicScene"), visual: { lighting: value("imgBasicLighting") }, comp: { description: value("imgBasicComposition") } });
      return pruneEmpty({ task: "image", mode: "high", ...imageShared, subj: { name: value("imgHqSubject"), type: value("imgSubjectType"), details: value("imgSubjectDetails"), action: value("imgSubjectAction") }, scene: { description: value("imgHqScene"), location: value("imgLocation"), environment: value("imgEnvironment"), time: value("imgTimeOfDay"), weather: value("imgWeather") }, style: { description: value("imgHqStyle"), genre: value("imgGenre"), inspiration: value("imgInspiration"), realism: value("imgRealism"), mood: value("imgMood") }, visual: { lighting: value("imgLighting"), palette: value("imgColourPalette"), contrast: value("imgContrast"), textures: value("imgTextures") }, cam: { angle: value("imgAngle"), lens: value("imgLens"), dof: value("imgDepthOfField"), focus: value("imgFocus") }, comp: { description: value("imgHqComposition"), framing: value("imgFraming"), rule: choice("imgRule"), motion: value("imgMotion") }, out: { resolution: value("imgResolution"), ratio: value("imgAspectRatio"), quality: value("imgQuality") }, constraints: { negative: value("imgNegativePrompt"), avoid: lines("imgAvoid") } });
    }
    if (type === "video") {
      const videoShared = {
        cat: categoryValue("videoCategory"),
        sound: { audio: choice("vidAudioOption"), dialogue: lines("vidDialogue"), ambient: value("vidAmbientSound"), text: value("vidOnScreenText") },
        start: attachedFiles.vidStartFrameFile ? `attached image "${attachedFiles.vidStartFrameFile.name}"` : ""
      };
      if (value("videoMode") === "basic") return pruneEmpty({ task: "video", mode: "basic", ...videoShared, subj: value("vidBasicSubject"), style: value("vidBasicStyle"), scene: value("vidBasicScene"), duration: numberValue("vidBasicDuration"), cam: value("vidBasicCamera") });
      return pruneEmpty({ task: "video", mode: "cinematic", ...videoShared, subj: { name: value("vidSubject"), type: value("vidType"), details: value("vidDetails"), action: value("vidAction") }, scene: { description: value("vidScene"), location: value("vidLocation"), environment: value("vidEnvironment"), time: value("vidTimeOfDay"), weather: value("vidWeather") }, seq: { shot: value("vidShot"), action: value("vidSequenceAction"), duration: numberValue("vidSequenceDuration") }, cam: { movement: value("vidMovement"), angle: value("vidAngle"), lens: value("vidLens"), stabilization: value("vidStabilization") }, style: { genre: value("vidGenre"), mood: value("vidMood"), realism: value("vidRealism"), reference: value("vidReference") }, visual: { lighting: value("vidLighting"), grading: value("vidColorGrading"), effects: value("vidEffects") }, audio: { music: value("vidMusic"), sfx: value("vidSfx"), voiceover: value("vidVoiceover") }, out: { duration: numberValue("vidOutputDuration"), resolution: value("vidResolution"), fps: numberValue("vidFps"), ratio: value("vidAspectRatio") }, constraints: { negative: value("vidNegativePrompt"), avoid: lines("vidAvoid") } });
    }
    if (type === "ppt") {
      const slideCount = numberValue("pptSlideCount");
      const src = attachedFiles.pptSourceFile
        ? `attached ${attachedFiles.pptSourceFile.label} file "${attachedFiles.pptSourceFile.name}"; use it as the only source`
        : "";
      return pruneEmpty({
        task: "ppt",
        role: value("pptRole"),
        aud: value("pptAudience"),
        obj: value("pptObjective"),
        ctx: value("pptContext"),
        inc: lines("pptMustInclude"),
        avoid: lines("pptMustAvoid"),
        deliv: choice("pptDeliverable"),
        slides: slideCount > 0 ? slideCount : undefined,
        per: pptPerSlide(),
        notes: checked("pptSpeakerNotes"),
        src,
        guard: buildGuard("ppt", "", true),
        steps: PPT_STEP_TEMPLATE,
        reply: ["no preamble, restated task, or closing summary"]
      });
    }

    return pruneEmpty({
      task: "text",
      cat: categoryValue("category"),
      role: value("role"),
      aud: value("targetAudience"),
      obj: value("objective"),
      ctx: value("context"),
      inc: lines("mustInclude"),
      avoid: lines("mustAvoid"),
      guard: buildGuard("text", value("category"), elements.antiHallucinationGuard.checked),
      steps: elements.stepLocking.checked
        ? (TEXT_STEP_TEMPLATES[value("category")] || TEXT_STEP_TEMPLATES.Other)
        : [],
      reply: buildReply()
    });
  }

  // Models follow word caps far better than token counts, and a pasted prompt cannot set max_tokens.
  function buildReply() {
    const words = numberValue("replyLength");
    return [
      words ? `max ${words} words` : "",
      elements.stepLocking.checked ? "don't narrate the steps" : "",
      "no preamble, restated task, or closing summary"
    ].filter(Boolean);
  }

  function getOutputType() {
    if (elements.outputJson.checked) return "json";
    return elements.outputMarkdown.checked ? "markdown" : "plain";
  }

  function readableLabel(key) {
    const labels = { cat: "Category", aud: "Target audience", obj: "Objective", ctx: "Context", inc: "Must include", val: "Validation", steps: "Steps", subj: "Subject", cam: "Camera", comp: "Composition", out: "Output", seq: "Sequence", dof: "Depth of field", sfx: "SFX", iter: "Iteration", exec: "Execution", gates: "Quality gates", max_iter: "Maximum iterations", allowed_cmds: "Allowed commands", setup_cmds: "Setup commands", checks: "Validation commands", avoid: "Must avoid", min_coverage: "Minimum coverage", max_failed: "Maximum failed iterations", max_files: "Maximum changed files", max_diff_lines: "Maximum diff lines", on_failure: "On failure", on_exceeded: "On budget exceeded", env_names: "Environment variable names", workdir: "Working directory", os: "Operating system", fps: "FPS" };
    return labels[key] || key.replace(/_/g, " ").replace(/\b\w/g, character => character.toUpperCase());
  }

  function isEmptyValue(item) {
    return item === "" || item === undefined || item === null || (Array.isArray(item) && !item.length);
  }

  function inlineText(item) {
    return String(item).replace(/\r?\n/g, " ");
  }

  // Nested lists join with the given separator; nested pairs such as { value: 2, unit: "Hours" } read as "2 Hours".
  function nestedText(item, separator) {
    if (Array.isArray(item)) return item.map(inlineText).join(separator);
    if (item && typeof item === "object") return Object.values(item).filter(entry => !isEmptyValue(entry)).map(inlineText).join(" ");
    return inlineText(item);
  }

  function addMarkdownValue(output, label, item, labels) {
    if (isEmptyValue(item)) return;
    if (Array.isArray(item)) {
      output.push(`## ${label}`);
      item.forEach(entry => output.push(`- ${inlineText(entry)}`));
      return;
    }
    if (typeof item === "object") {
      addMarkdownSection(output, label, item, labels);
      return;
    }
    output.push(`- **${label}:** ${inlineText(item)}`);
  }

  // Lists inside a section nest under their own bullet so later entries stay in the section.
  function addMarkdownSection(output, label, values, labels) {
    const entries = Object.entries(values || {}).filter(([, item]) => !isEmptyValue(item));
    if (!entries.length) return;
    output.push(`## ${label}`);
    entries.forEach(([key, item]) => {
      const itemLabel = labels?.[key] || readableLabel(key);
      if (Array.isArray(item)) {
        output.push(`- **${itemLabel}:**`);
        item.forEach(entry => output.push(`  - ${inlineText(entry)}`));
      } else {
        output.push(`- **${itemLabel}:** ${nestedText(item)}`);
      }
    });
  }

  function addPlainValue(output, label, item, labels) {
    if (isEmptyValue(item)) return;
    if (typeof item === "object" && !Array.isArray(item)) {
      addPlainSection(output, label, item, labels);
      return;
    }
    output.push(`${label}: ${nestedText(item, "; ")}`);
  }

  // One line per section; an entry named like its section (Subject > Subject) prints its value alone.
  function addPlainSection(output, label, values, labels) {
    const parts = Object.entries(values || {}).filter(([, item]) => !isEmptyValue(item)).map(([key, item]) => {
      const itemLabel = labels?.[key] || readableLabel(key);
      const text = nestedText(item, ", ");
      return itemLabel === label ? text : `${itemLabel.toLowerCase()}: ${text}`;
    });
    if (parts.length) output.push(`${label}: ${parts.join("; ")}`);
  }

  const IMAGE_HQ_SECTIONS = [
    ["Subject", "subj", { name: "Subject", type: "Type", details: "Details", action: "Action" }],
    ["Scene", "scene", { description: "Scene", location: "Location", environment: "Environment", time: "Time of day", weather: "Weather" }],
    ["Style", "style", { description: "Style", genre: "Genre", inspiration: "Inspiration", realism: "Realism", mood: "Mood" }],
    ["Visual", "visual", { lighting: "Lighting", palette: "Colour palette", contrast: "Contrast", textures: "Textures" }],
    ["Camera", "cam", { angle: "Angle", lens: "Lens", dof: "Depth of field", focus: "Focus" }],
    ["Composition", "comp", { description: "Composition", framing: "Framing", rule: "Rule", motion: "Motion" }],
    ["Output", "out", { resolution: "Resolution", ratio: "Aspect ratio", quality: "Quality" }],
    ["Constraints", "constraints", { negative: "Negative prompt", avoid: "Avoid" }]
  ];

  const VIDEO_BASIC_FIELDS = [["Subject", "subj"], ["Style", "style"], ["Scene", "scene"], ["Duration (seconds)", "duration"], ["Camera", "cam"]];

  const VIDEO_CINEMATIC_SECTIONS = [
    ["Subject", "subj", { name: "Subject", type: "Type", details: "Details", action: "Action" }],
    ["Scene", "scene", { description: "Scene", location: "Location", environment: "Environment", time: "Time of day", weather: "Weather" }],
    ["Sequence", "seq", { shot: "Shot", action: "Action", duration: "Duration (seconds)" }],
    ["Camera", "cam", { movement: "Movement", angle: "Angle", lens: "Lens", stabilization: "Stabilization" }],
    ["Style", "style", { genre: "Genre", mood: "Mood", realism: "Realism", reference: "Reference" }],
    ["Visual", "visual", { lighting: "Lighting", grading: "Colour grading", effects: "Effects" }],
    ["Audio", "audio", { music: "Music", sfx: "SFX", voiceover: "Voiceover" }],
    ["Output", "out", { duration: "Duration (seconds)", resolution: "Resolution", fps: "FPS", ratio: "Aspect ratio" }],
    ["Constraints", "constraints", { negative: "Negative prompt", avoid: "Avoid" }]
  ];

  const CODING_FIELDS = [
    ["Category", "cat"],
    ["Name", "name"],
    ["Role", "role"],
    ["Goal", "goal"],
    ["Context", "ctx"],
    ["Guard", "guard"],
    ["Definition of Done", "done"],
    ["Scope", "scope", { repository: "Repository scope", include: "Included paths", exclude: "Excluded paths", location: "Repository location", workdir: "Working directory", base_branch: "Base branch", work_branch: "Work branch", branch_strategy: "Branch strategy", runtime: "Runtime", os: "Operating system", setup_cmds: "Setup commands", env_names: "Environment variable names", network: "Network access", allowed_hosts: "Allowed hosts", package_policy: "Package policy", allowed_packages: "Allowed packages" }],
    ["Tasks", "tasks"],
    ["Iteration", "iter", { steps: "Steps", max_iter: "Maximum iterations" }],
    ["Planning", "plan", { priority: "Priority order", select: "Task selection", requirement: "Requirement", max_active: "Maximum active tasks", dependencies: "Dependency handling", unknowns: "Unknowns" }],
    ["Execution", "exec", { allowed_cmds: "Allowed commands", checks: "Validation commands", avoid: "Must avoid", autonomy: "Autonomy", allowed_ops: "Allowed operations", forbidden_ops: "Forbidden operations", blocked_cmds: "Blocked commands", file_create: "File creation", file_delete: "File deletion", dependency_changes: "Dependency changes", config_changes: "Configuration changes", secrets: "Secrets policy", destructive_actions: "Destructive actions" }],
    ["Quality Gates", "gates"],
    ["Limits", "limits"],
    ["Git", "git"],
    ["Approval", "approval"],
    ["Stop Conditions", "stop"],
    ["Recovery", "recovery"],
    ["Reporting", "report"]
  ];

  function renderTextMarkdown(data) {
    const output = ["# Text Request"];
    [["Category", data.cat], ["Role", data.role], ["Target Audience", data.aud], ["Objective", data.obj], ["Context", data.ctx]].forEach(([label, item]) => addMarkdownValue(output, label, item));
    addMarkdownValue(output, "Must Include", data.inc);
    addMarkdownValue(output, "Must Avoid", data.avoid);
    addMarkdownValue(output, "Guard", data.guard);
    addMarkdownValue(output, "Steps", data.steps);
    addMarkdownValue(output, "Reply", data.reply);
    return output.join("\n");
  }

  function renderTextPlain(data) {
    const output = [];
    [["Category", data.cat], ["Role", data.role], ["Audience", data.aud], ["Task", data.obj], ["Context", data.ctx], ["Include", data.inc], ["Avoid", data.avoid], ["Rules", data.guard], ["Steps", data.steps], ["Reply", data.reply]].forEach(([label, item]) => addPlainValue(output, label, item));
    return output.join("\n");
  }

  const IMAGE_EXTRA_LABELS = { text: "Text to render", background: "Background", variations: "Variations", change: "What to change", keep: "What to keep unchanged" };
  const VIDEO_SOUND_LABELS = { audio: "Audio", dialogue: "Dialogue", ambient: "Ambient sound", text: "On-screen text" };

  function renderImageMarkdown(data) {
    const output = ["# Image Generation"];
    addMarkdownValue(output, "Category", data.cat);
    if (data.mode === "basic") {
      [["Subject", data.subj], ["Style", data.style], ["Scene", data.scene]].forEach(([label, item]) => addMarkdownValue(output, label, item));
      addMarkdownSection(output, "Visual", data.visual, { lighting: "Lighting" });
      addMarkdownSection(output, "Composition", data.comp, { description: "Description" });
    } else {
      IMAGE_HQ_SECTIONS.forEach(([label, key, labels]) => addMarkdownSection(output, label, data[key], labels));
    }
    addMarkdownSection(output, "Additional", data.extra, IMAGE_EXTRA_LABELS);
    addMarkdownValue(output, "Reference", data.ref);
    return output.join("\n");
  }

  function renderImagePlain(data) {
    const output = ["Image generation"];
    addPlainValue(output, "Category", data.cat);
    if (data.mode === "basic") {
      [["Subject", data.subj], ["Style", data.style], ["Scene", data.scene], ["Lighting", data.visual?.lighting], ["Composition", data.comp?.description]].forEach(([label, item]) => addPlainValue(output, label, item));
    } else {
      IMAGE_HQ_SECTIONS.forEach(([label, key, labels]) => addPlainSection(output, label, data[key], labels));
    }
    addPlainSection(output, "Additional", data.extra, IMAGE_EXTRA_LABELS);
    addPlainValue(output, "Reference", data.ref);
    return output.join("\n");
  }

  function renderVideoMarkdown(data) {
    const output = ["# Video Generation"];
    addMarkdownValue(output, "Category", data.cat);
    if (data.mode === "basic") {
      VIDEO_BASIC_FIELDS.forEach(([label, key]) => addMarkdownValue(output, label, data[key]));
    } else {
      VIDEO_CINEMATIC_SECTIONS.forEach(([label, key, labels]) => addMarkdownSection(output, label, data[key], labels));
    }
    addMarkdownSection(output, "Audio and Text", data.sound, VIDEO_SOUND_LABELS);
    addMarkdownValue(output, "Start Frame", data.start);
    return output.join("\n");
  }

  function renderVideoPlain(data) {
    const output = ["Video generation"];
    addPlainValue(output, "Category", data.cat);
    if (data.mode === "basic") {
      VIDEO_BASIC_FIELDS.forEach(([label, key]) => addPlainValue(output, label, data[key]));
    } else {
      VIDEO_CINEMATIC_SECTIONS.forEach(([label, key, labels]) => addPlainSection(output, label, data[key], labels));
    }
    addPlainSection(output, "Audio and Text", data.sound, VIDEO_SOUND_LABELS);
    addPlainValue(output, "Start Frame", data.start);
    return output.join("\n");
  }

  function renderCodingLoopMarkdown(data) {
    const output = ["# Coding Loop"];
    CODING_FIELDS.forEach(([label, key, labels]) => addMarkdownValue(output, label, data[key], labels));
    return output.join("\n");
  }

  function renderCodingLoopPlain(data) {
    const output = ["Coding loop"];
    CODING_FIELDS.forEach(([label, key, labels]) => addPlainValue(output, label, data[key], labels));
    return output.join("\n");
  }

  function pptPerSlideText(per) {
    return per ? `up to ${per.max} ${per.unit}` : undefined;
  }

  function pptNotesText(data) {
    return data.notes ? "include detailed speaker notes for each slide" : "no speaker notes";
  }

  function renderPptMarkdown(data) {
    const output = ["# Presentation/Pitch Deck"];
    [["Role", data.role], ["Target Audience", data.aud], ["Objective", data.obj], ["Context", data.ctx]].forEach(([label, item]) => addMarkdownValue(output, label, item));
    addMarkdownValue(output, "Must Include", data.inc);
    addMarkdownValue(output, "Must Avoid", data.avoid);
    addMarkdownValue(output, "Deliverable", data.deliv);
    addMarkdownValue(output, "Slides", data.slides);
    addMarkdownValue(output, "Per Slide", pptPerSlideText(data.per));
    addMarkdownValue(output, "Speaker Notes", pptNotesText(data));
    addMarkdownValue(output, "Source", data.src);
    addMarkdownValue(output, "Guard", data.guard);
    addMarkdownValue(output, "Steps", data.steps);
    addMarkdownValue(output, "Reply", data.reply);
    return output.join("\n");
  }

  function renderPptPlain(data) {
    const output = ["Presentation/Pitch Deck"];
    [["Role", data.role], ["Audience", data.aud], ["Objective", data.obj], ["Context", data.ctx], ["Include", data.inc], ["Avoid", data.avoid], ["Deliverable", data.deliv]].forEach(([label, item]) => addPlainValue(output, label, item));
    addPlainValue(output, "Slides", data.slides);
    addPlainValue(output, "Per Slide", pptPerSlideText(data.per));
    addPlainValue(output, "Notes", pptNotesText(data));
    addPlainValue(output, "Source", data.src);
    [["Rules", data.guard], ["Steps", data.steps], ["Reply", data.reply]].forEach(([label, item]) => addPlainValue(output, label, item));
    return output.join("\n");
  }

  const RENDERERS = {
    plain: { text: renderTextPlain, image: renderImagePlain, video: renderVideoPlain, coding_loop: renderCodingLoopPlain, ppt: renderPptPlain },
    markdown: { text: renderTextMarkdown, image: renderImageMarkdown, video: renderVideoMarkdown, coding_loop: renderCodingLoopMarkdown, ppt: renderPptMarkdown }
  };

  function minifiedJson(data) {
    return JSON.stringify(data);
  }

  // The form mode picks the renderer layout; it is not an instruction, so the model never sees it.
  function promptData(data) {
    const request = { ...data };
    delete request.mode;
    return request;
  }

  function serializePrompt(data) {
    const type = getOutputType();
    if (type === "json") return minifiedJson(promptData(data));
    return RENDERERS[type][data.task](data);
  }

  const IMAGE_NOTE = "Generate the image now; return only the image, without rewriting the prompt or describing the result.";
  const VIDEO_NOTE = "Generate the video now; return only the video, without rewriting the prompt or describing the result.";

  // One line per provider, aimed at the padding that provider tends to add for that task.
  const PROVIDER_NOTES = {
    text: {
      chatgpt: "No follow-up offers or questions unless required input is missing.",
      claude: "Give one best answer rather than several alternatives unless asked.",
      gemini: "No key-takeaways section or suggested next steps.",
      grok: "Plain tone; no jokes or asides."
    },
    ppt: {
      chatgpt: "No follow-up offers or questions unless required input is missing.",
      claude: "Give one best answer rather than several alternatives unless asked.",
      gemini: "No key-takeaways section or suggested next steps.",
      grok: "Plain tone; no jokes or asides.",
      copilot: "Generate the presentation outline now without embellishment."
    },
    image: { chatgpt: IMAGE_NOTE, gemini: IMAGE_NOTE, grok: IMAGE_NOTE },
    video: { gemini: VIDEO_NOTE, grok: VIDEO_NOTE },
    coding_loop: {
      chatgpt: "Run this bounded loop within its constraints; keep progress updates to one line.",
      claude: "Run this bounded loop within its constraints; make small, reversible changes.",
      gemini: "Run this bounded loop within its constraints; keep plans and walkthroughs brief.",
      grok: "Run this bounded loop within its constraints; never claim tools or access you lack."
    }
  };

  function providerPrompt(provider, data) {
    const note = PROVIDER_NOTES[data.task]?.[provider];
    if (provider === "generic" || !note) return serializePrompt(data);
    if (getOutputType() === "json") return minifiedJson({ instruction: note, request: promptData(data) });
    return `${note}\n${serializePrompt(data)}`;
  }

  function closeGuardTooltips(exceptButton = null) {
    document.querySelectorAll(".tooltip-icon").forEach(button => {
      if (button === exceptButton) return;
      const tooltip = document.getElementById(button.getAttribute("aria-controls"));
      if (tooltip) tooltip.hidden = true;
      button.setAttribute("aria-expanded", "false");
    });
  }

  function toggleGuardTooltip(button) {
    const tooltip = document.getElementById(button.getAttribute("aria-controls"));
    if (!tooltip) return;
    const shouldOpen = tooltip.hidden;
    closeGuardTooltips(shouldOpen ? button : null);
    tooltip.hidden = !shouldOpen;
    button.setAttribute("aria-expanded", String(shouldOpen));
  }

  const STATIC_FIELD_TIPS = {
    category: "Choose a category to receive relevant in-field examples without changing your entries.",
    role: "State the expertise or perspective the model should use.",
    targetAudience: "Name the intended reader, user, or decision maker.",
    objective: "Describe the exact result you want produced.",
    context: "Include facts, constraints, and starting conditions that affect the answer.",
    mustInclude: "Add one required item per line.",
    mustAvoid: "Add one restriction or exclusion per line.",
    replyLength: "Caps the reply in words, which models follow more reliably than token counts. Every option also asks for no preamble or closing summary.",
    imageMode: "Choose Basic for a short brief or High Quality for detailed visual controls.",
    imageCategory: "Choose a category to receive relevant in-field examples without changing your entries.",
    imgTextToRender: "One text block per line; only use this when the image should contain readable text.",
    imgWhatToChange: "List only what should change, one item per line.",
    imgWhatToKeep: "List only what should stay the same, one item per line.",
    videoMode: "Choose Basic for a short brief or Cinematic for sequence-level controls.",
    videoCategory: "Choose a category to receive relevant in-field examples without changing your entries.",
    vidDialogue: "One \"Speaker: line\" per line.",
    vidBasicDuration: "Provide a duration greater than zero seconds.",
    vidSequenceDuration: "Provide the sequence duration in seconds, greater than zero.",
    vidOutputDuration: "Provide the intended final duration in seconds, greater than zero.",
    vidFps: "Enter a whole frame rate between 1 and 240.",
    antiHallucinationGuard: "Prevents unsupported facts or sources, identifies unknowns, and labels assumptions. It cannot guarantee factual accuracy.",
    stepLocking: "When on, adds category-specific steps and asks the model to follow them without narrating them."
  };

  function addStaticFieldAssistance() {
    const controls = document.querySelectorAll("#textFields input, #textFields textarea, #textFields select, #imageFields input, #imageFields textarea, #imageFields select, #videoFields input, #videoFields textarea, #videoFields select");
    controls.forEach(control => {
      if (!control.id || document.getElementById(`${control.id}-error`)) return;
      const target = control.closest(".guard-row")?.querySelector(".guard-copy") || control.closest("label");
      if (!target) return;
      const tip = document.createElement("small");
      tip.id = `${control.id}-tip`;
      tip.className = "field-hint";
      const defaultTip = control.type === "number" ? "Enter a valid numeric value within the shown limits." : control.tagName === "TEXTAREA" ? "Keep entries concise; use one item per line when appropriate." : control.tagName === "SELECT" ? "Choose a value; leave optional settings as Not specified to omit them." : "Provide concise, specific information for this prompt field.";
      tip.textContent = STATIC_FIELD_TIPS[control.id] || defaultTip;
      const error = document.createElement("small");
      error.id = `${control.id}-error`;
      error.className = "field-error";
      error.setAttribute("aria-live", "polite");
      control.setAttribute("aria-describedby", [control.getAttribute("aria-describedby"), tip.id, error.id].filter(Boolean).join(" "));
      target.append(tip, error);
    });
    const outputFieldset = document.querySelector(".output-format-choice");
    if (outputFieldset && !document.getElementById("outputType-error")) {
      const error = document.createElement("small");
      error.id = "outputType-error";
      error.className = "field-error";
      error.setAttribute("aria-live", "polite");
      outputFieldset.appendChild(error);
      [elements.outputPlain, elements.outputMarkdown, elements.outputJson].forEach(control => control.setAttribute("aria-describedby", `outputTypeHint ${error.id}`));
    }
  }

  function handleOutputChoiceChange() {
    scheduleOutputRefresh();
  }

  function setError(control, message) {
    control.setAttribute("aria-invalid", String(Boolean(message)));
    const error = document.getElementById(`${control.id}-error`);
    if (error) error.textContent = message;
  }

  function validateControl(control) {
    if (control.type === "file") return "";
    if (control.type === "checkbox") return "";
    if (control.id === "pptCustomWords" && value("pptWordsPerSlide") !== "custom_words") return "";
    if (control.id === "pptCustomWords" && value("pptWordsPerSlide") === "custom_words") {
      const n = Number(control.value);
      if (!Number.isInteger(n) || n < 10 || n > 150) return "Enter a whole number from 10 to 150.";
      return "";
    }
    const text = control.value.trim();
    if (!text) {
      if (control.dataset.requiredPositive === "true") return "Enter a duration greater than 0.";
      if (control.id === "allowedNetworkHosts" && value("networkAccess") === "allowed_hosts_only") return "List the approved hosts, one per line, or change Network Access.";
      if (control.id === "allowedPackages" && value("packageInstallationPolicy") === "allowed_list_only") return "List the approved packages, one per line, or change Package Installation Policy.";
      if (control.id === "timeBudgetValue" && value("timeBudgetUnit")) return "Enter a time budget value.";
      if (control.id === "costBudget" && value("costCurrency")) return "Enter a cost budget amount.";
      return "";
    }
    if (control.id === "timeBudgetValue" && !value("timeBudgetUnit")) return "Choose a unit for the time budget.";
    if (control.id === "timeBudgetUnit" && !value("timeBudgetValue")) return "Enter a time budget value.";
    if (control.id === "costBudget" && !value("costCurrency")) return "Choose a currency for the cost budget.";
    if (control.id === "costCurrency" && value("costBudget") === "") return "Enter a cost budget amount.";
    const maxLength = control.tagName === "TEXTAREA" ? 5000 : 500;
    if (text.length > maxLength) return `Use no more than ${maxLength} characters.`;
    const entries = text.split(/\r?\n/).map(entry => entry.trim()).filter(Boolean);
    if (control.dataset.list === "true" && entries.length > 50) return "Use no more than 50 non-empty entries.";
    if (control.dataset.command === "true" && entries.some(entry => entry.length > 200)) return "Keep each command to 200 characters or fewer.";
    if (control.id === "environmentVariableNames" && /(?:^|\s)(?:[A-Z][A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)\s*[=:]|(?:api[_-]?key|token|secret|password)\s*[=:])|(?:^|\s)[A-Za-z_][A-Za-z0-9_]*\s*=\s*\S+/i.test(text)) return "List variable names only; remove any apparent secret value.";
    if (control.dataset.command === "true" && /\brm\s+-rf\b|\bdel\s+\/[fq]\b|remove-item\b.*\b-recurse\b|git\s+reset\s+--hard|\bdrop\s+database\b|\btruncate\b/i.test(text)) return "Potentially destructive command detected. Remove it or obtain explicit approval outside this prompt.";
    if (control.type === "number") {
      const numeric = Number(text);
      if (!Number.isFinite(numeric)) return "Enter a valid number.";
      if (control.step === "1" && !Number.isInteger(numeric)) return "Enter a whole number.";
      if (control.min !== "" && numeric < Number(control.min)) return `Enter ${control.min} or more.`;
      if (control.max !== "" && numeric > Number(control.max)) return `Enter ${control.max} or less.`;
    }
    return "";
  }

  function validateActiveForm({ focus = true } = {}) {
    const active = document.getElementById(`${elements.promptType.value}Fields`);
    const controls = Array.from(active.querySelectorAll("input, textarea, select")).filter(control => !control.closest("[hidden]"));
    let firstInvalid = null;
    controls.forEach(control => {
      const message = validateControl(control);
      setError(control, message);
      if (message && !firstInvalid) firstInvalid = control;
    });
    if (firstInvalid) {
      elements.status.textContent = "Resolve the highlighted field before generating or copying.";
      if (focus) firstInvalid.focus();
      return false;
    }
    elements.status.textContent = "";
    return true;
  }

  function showToast(message, isError = false) {
    window.clearTimeout(toastTimer);
    elements.copyToast.textContent = message;
    elements.copyToast.classList.toggle("error", isError);
    elements.copyToast.classList.add("visible");
    toastTimer = window.setTimeout(() => elements.copyToast.classList.remove("visible"), 1800);
  }

  function clipboardFallback(text) {
    const helper = document.createElement("textarea");
    helper.className = "clipboard-helper";
    helper.value = text;
    helper.setAttribute("readonly", "");
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand("copy");
    helper.remove();
    return copied;
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else if (!clipboardFallback(text)) throw new Error("Clipboard fallback failed");
      showToast("Copied to clipboard");
    } catch (error) {
      showToast("Copy failed. Select and copy the generated payload manually.", true);
    }
  }

  // Rough English average of four characters per token; the cards label every figure as an estimate.
  function estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  // Word caps convert at roughly 4 tokens per 3 words.
  function replyBudget(data) {
    if (data.task === "ppt") {
      if (!data.slides || !data.per || data.per.unit !== "words") return "n/a";
      return String(Math.ceil((data.slides * data.per.max * 4) / 3));
    }
    if (data.task !== "text") return "n/a";
    const words = numberValue("replyLength");
    return words ? String(Math.ceil((words * 4) / 3)) : "No limit";
  }

  function updateTokenMetrics(genericOutput, providerText, data) {
    const genericTokens = estimateTokens(genericOutput);
    const providerTokens = estimateTokens(providerText);
    const overhead = Math.max(0, providerTokens - genericTokens);
    const ratio = genericTokens ? providerTokens / genericTokens : 0;
    const increase = genericTokens ? ((providerTokens - genericTokens) / genericTokens) * 100 : 0;
    elements.genericTokens.textContent = String(genericTokens);
    elements.selectedProviderTokens.textContent = String(providerTokens);
    elements.providerAdapterOverhead.textContent = String(overhead);
    elements.providerRatio.textContent = `${ratio.toFixed(2)}x`;
    elements.providerIncrease.textContent = `${Math.max(0, increase).toFixed(0)}%`;
    elements.replyBudget.textContent = replyBudget(data);
  }

  const OUTPUT_DESCRIPTIONS = {
    plain: "Plain-text prompt ready for provider routing",
    markdown: "Concise Markdown prompt ready for provider routing",
    json: "Minified JSON prompt ready for provider routing"
  };

  function generateOutput({ scroll = true } = {}) {
    if (!validateActiveForm({ focus: scroll })) return false;
    const data = getFormData();
    const serialized = serializePrompt(data);
    const providerText = providerPrompt(selectedProvider, data);
    elements.output.textContent = serialized;
    elements.outputDescription.textContent = OUTPUT_DESCRIPTIONS[getOutputType()];
    elements.generatedPayloadSection.hidden = false;
    updateTokenMetrics(serialized, providerText, data);
    hasGeneratedOutput = true;
    if (scroll) elements.generatedPayloadSection.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }

  function hideGeneratedOutput() {
    window.clearTimeout(refreshTimer);
    elements.generatedPayloadSection.hidden = true;
    elements.output.textContent = "";
    elements.outputDescription.textContent = "Provider-ready prompt";
    [elements.genericTokens, elements.selectedProviderTokens, elements.providerAdapterOverhead].forEach(node => { node.textContent = "0"; });
    elements.providerRatio.textContent = "0.00x";
    elements.providerIncrease.textContent = "0%";
    elements.replyBudget.textContent = "0";
  }

  function copyForProvider(provider) {
    if (!hasGeneratedOutput || elements.generatedPayloadSection.hidden) {
      showToast("Generate a prompt before copying.", true);
      return;
    }
    if (!validateActiveForm()) return;
    selectedProvider = provider;
    const data = getFormData();
    const canonical = serializePrompt(data);
    const providerText = providerPrompt(provider, data);
    updateTokenMetrics(canonical, providerText, data);
    copyText(providerText);
  }

  function clearAll() {
    window.clearTimeout(refreshTimer);
    document.getElementById("prompt-form").reset();
    workflowManaged = true;
    hasGeneratedOutput = false;
    selectedProvider = "chatgpt";
    document.querySelectorAll("[aria-invalid='true']").forEach(control => setError(control, ""));
    document.querySelectorAll(".coding-details[open]").forEach(detail => { detail.open = false; });
    closeGuardTooltips();
    elements.guardState.textContent = "On";
    elements.evidenceGuard.checked = true;
    elements.evidenceGuardState.textContent = "On";
    elements.stepLockState.textContent = "On";
    elements.status.textContent = "";
    hideGeneratedOutput();
    elements.copyToast.classList.remove("visible", "error");
    applyTextCategoryPlaceholders();
    applyCodingCategoryGuidance();
    updateModeVisibility();
    Object.keys(attachedFiles).forEach(key => { attachedFiles[key] = null; });
    renderFileChip("pptSourceFile-chip", "pptSourceFile", "pptSourceFile");
    renderFileChip("imgReferenceFile-chip", "imgReferenceFile", "imgReferenceFile");
    renderFileChip("vidStartFrameFile-chip", "vidStartFrameFile", "vidStartFrameFile");
    applyImageCategoryPlaceholders();
    applyVideoCategoryPlaceholders();
    updatePptWordsVisibility();
    updatePptSlideCountTip();
    switchTab("text");
  }

  function scheduleOutputRefresh() {
    if (!hasGeneratedOutput) return;
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      if (validateActiveForm({ focus: false })) generateOutput({ scroll: false });
    }, 225);
  }

  // A task type or mode change replaces the schema, so the visible payload belongs to the
  // previous form. Regenerate it when the new form is valid, otherwise hide it outright.
  function refreshAfterTaskChange() {
    if (!hasGeneratedOutput) return;
    if (!validateActiveForm({ focus: false })) {
      hideGeneratedOutput();
      return;
    }
    scheduleOutputRefresh();
  }

  function activateTab(type) {
    switchTab(type);
    refreshAfterTaskChange();
  }

  function initializeExistingLimits() {
    document.querySelectorAll("input[type='text']").forEach(input => { if (!input.maxLength || input.maxLength < 0) input.maxLength = 500; });
    document.querySelectorAll("textarea").forEach(textarea => { if (!textarea.maxLength || textarea.maxLength < 0) textarea.maxLength = 5000; });
  }

  function cacheElements() {
    ["promptType", "category", "antiHallucinationGuard", "stepLocking", "guardState", "stepLockState", "evidenceGuard", "evidenceGuardState", "outputPlain", "outputMarkdown", "outputJson", "status", "generatedPayloadSection", "output", "outputDescription", "genericTokens", "selectedProviderTokens", "providerAdapterOverhead", "providerRatio", "providerIncrease", "replyBudget", "copyChatGptBtn", "copyClaudeBtn", "copyGeminiBtn", "copyGrokBtn", "copyCopilotBtn", "copyGenericBtn", "clearBtn", "copyToast", "codingFieldsMount", "pptFieldsMount"].forEach(id => {
      elements[id] = document.getElementById(id);
    });
  }

  function bindEvents() {
    const allTabButtons = Array.from(document.querySelectorAll(".tab-btn"));
    allTabButtons.forEach(button => button.addEventListener("click", () => activateTab(button.dataset.promptType)));
    document.querySelector(".prompt-tabs").addEventListener("keydown", event => {
      const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (!step) return;
      const tabButtons = allTabButtons.filter(button => !button.hidden);
      const current = tabButtons.indexOf(document.activeElement);
      if (current === -1) return;
      event.preventDefault();
      const next = tabButtons[(current + step + tabButtons.length) % tabButtons.length];
      activateTab(next.dataset.promptType);
      next.focus();
    });
    elements.category.addEventListener("change", () => window.setTimeout(() => { applyTextCategoryPlaceholders(); scheduleOutputRefresh(); }, 0));
    document.getElementById("imageMode").addEventListener("change", () => { updateModeVisibility(); refreshAfterTaskChange(); });
    document.getElementById("videoMode").addEventListener("change", () => { updateModeVisibility(); refreshAfterTaskChange(); });
    document.getElementById("imageCategory").addEventListener("change", () => window.setTimeout(() => { applyImageCategoryPlaceholders(); scheduleOutputRefresh(); }, 0));
    document.getElementById("videoCategory").addEventListener("change", () => window.setTimeout(() => { applyVideoCategoryPlaceholders(); scheduleOutputRefresh(); }, 0));
    setupFileInput("imgReferenceFile", IMAGE_REFERENCE_EXTENSIONS, "imgReferenceFile", "imgReferenceFile-chip");
    setupFileInput("vidStartFrameFile", VIDEO_START_FRAME_EXTENSIONS, "vidStartFrameFile", "vidStartFrameFile-chip");
    document.getElementById("codingMode").addEventListener("change", () => { updateModeVisibility(); refreshAfterTaskChange(); });
    document.getElementById("codingCategory").addEventListener("change", () => window.setTimeout(() => { applyCodingCategoryGuidance(); scheduleOutputRefresh(); }, 0));
    document.getElementById("iterationWorkflow").addEventListener("input", () => { workflowManaged = false; });
    document.getElementById("prompt-form").addEventListener("submit", event => {
      event.preventDefault();
      generateOutput();
    });
    elements.antiHallucinationGuard.addEventListener("change", () => { elements.guardState.textContent = elements.antiHallucinationGuard.checked ? "On" : "Off"; scheduleOutputRefresh(); });
    elements.stepLocking.addEventListener("change", () => { elements.stepLockState.textContent = elements.stepLocking.checked ? "On" : "Off"; scheduleOutputRefresh(); });
    elements.evidenceGuard.addEventListener("change", () => { elements.evidenceGuardState.textContent = elements.evidenceGuard.checked ? "On" : "Off"; scheduleOutputRefresh(); });
    document.querySelectorAll(".tooltip-icon").forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();
        toggleGuardTooltip(button);
      });
    });
    document.addEventListener("click", event => {
      if (!(event.target instanceof Element) || !event.target.closest(".guard-copy")) closeGuardTooltips();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeGuardTooltips();
    });
    elements.outputPlain.addEventListener("change", handleOutputChoiceChange);
    elements.outputMarkdown.addEventListener("change", handleOutputChoiceChange);
    elements.outputJson.addEventListener("change", handleOutputChoiceChange);
    elements.copyChatGptBtn.addEventListener("click", () => copyForProvider("chatgpt"));
    elements.copyClaudeBtn.addEventListener("click", () => copyForProvider("claude"));
    elements.copyGeminiBtn.addEventListener("click", () => copyForProvider("gemini"));
    elements.copyGrokBtn.addEventListener("click", () => copyForProvider("grok"));
    elements.copyCopilotBtn.addEventListener("click", () => copyForProvider("copilot"));
    elements.copyGenericBtn.addEventListener("click", () => copyForProvider("generic"));
    elements.clearBtn.addEventListener("click", clearAll);
    document.getElementById("prompt-form").addEventListener("input", event => {
      if (event.target.matches("input, textarea, select") && event.target.type !== "file") {
        setError(event.target, "");
        scheduleOutputRefresh();
      }
    });
    document.getElementById("prompt-form").addEventListener("change", event => {
      if (event.target.matches("input, textarea, select") && event.target.type !== "file") {
        setError(event.target, "");
        scheduleOutputRefresh();
      }
    });
  }

  function initialize() {
    cacheElements();
    renderCodingFields();
    renderPptFields();
    cacheElements();
    initializeExistingLimits();
    addStaticFieldAssistance();
    captureDefaultPlaceholders();
    bindEvents();
    applyTextCategoryPlaceholders();
    applyCodingCategoryGuidance();
    applyImageCategoryPlaceholders();
    applyVideoCategoryPlaceholders();
    updateModeVisibility();
    switchTab("text");
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();
