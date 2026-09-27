# Resume Tailoring Workbench --- Technical Specification

## 1. Purpose

This application is a **client-side-only resume tailoring workbench**.

The application accepts:

-   Job descriptions as raw text and/or images.
-   Professional/career information as raw text and/or images.
-   Additional free-form professional details typed by the user.
-   Previously exported structured Career Profile JSON.
-   Previously exported structured Job Description JSON.
-   Previously exported structured Resume JSON.
-   A writing style supplied as structured data or raw text (optional;
    if omitted, the application extrapolates a style from the Career
    Profile's experience/education and any self-provided details).
-   An OpenRouter API key and user-selected model name.

It produces:

1.  A reusable structured **Career Profile** containing everything the
    user has provided/inferred about their professional experience.
2.  A reusable structured **Job Description**.
3.  A **matching/tailoring analysis** between the Career Profile and Job
    Description.
4.  A structured **Resume** tailored to the selected Job Description.
5.  A client-generated **PDF** using a single resume visual template.
6.  An optional, concise structured **Cover Letter** whose language
    matches the resolved writing style, downloadable as JSON and PDF.

The application has **no application backend**. LLM calls go directly
from the browser to the selected provider.

The application is intentionally designed so additional LLM providers
can be introduced later without changing the rest of the application.

------------------------------------------------------------------------

## 2. Product Principles

### 2.1 Local-first / client-only

No application server, application database, or server-side PDF
generation.

The browser owns the session state.

The OpenRouter API key:

-   Is held only in in-memory application state.
-   MUST NOT be written to `localStorage`.
-   MUST NOT be written to `sessionStorage`.
-   MUST NOT be written to IndexedDB.
-   MUST NOT be written to browser cookies.
-   MUST NOT be embedded in generated files.
-   MUST NOT appear in application logs.
-   MUST NOT appear in analytics events.
-   MUST NOT be placed in URL parameters or hashes.

Closing or refreshing the browser/tab may remove the API key. The user
can re-enter it.

The UI should explicitly tell the user that professional information and
uploaded content is sent directly to the selected LLM provider when an
LLM operation is executed.

### 2.2 Structured data first

LLM outputs are not treated as free-form application data.

The workflow is:

``` text
Raw input
  ↓
LLM
  ↓
Structured JSON
  ↓
Schema validation
  ↓
Application state
  ↓
Human review/edit
  ↓
Next stage
```

Invalid structured output must never silently enter the application
state.

### 2.3 Human in the loop

The LLM is allowed to infer loosely and rewrite wording to improve job
alignment.

The user remains the final authority and can edit:

-   Career Profile.
-   Job Description.
-   Matching selections.
-   Writing style.
-   Generated Resume.

The application must never make generated content difficult to override.

### 2.4 Preserve the full career history

The Career Profile is a **career knowledge base**, not a resume.

It should preserve substantially more information than any individual
resume.

A resume is a projection of the Career Profile for a particular Job
Description.

### 2.5 No unsupported experience by default

If the Career Profile contains no evidence of a JD requirement, the
requirement should not be fabricated into the resume.

Related/equivalent technologies may be normalized where reasonable. For
example:

``` text
OpenTofu → Terraform
```

if the user's experience supports the equivalence.

The user can always override the generated content.

------------------------------------------------------------------------

# 3. Technical Stack

## 3.1 Frontend

Recommended:

-   React
-   TypeScript
-   Vite
-   React Router only if multiple URL-addressable views become useful
-   CSS Modules or a small application-level CSS system
-   No Next.js initially because the application has no server-side
    requirement.

The application is a SPA.

Chrome is the supported browser for the initial release.

## 3.2 Validation

Use **Zod** for runtime schema validation.

TypeScript types should be derived from Zod schemas where practical.

Example:

``` ts
const CareerProfileSchema = z.object({
  schemaVersion: z.string(),
  type: z.literal("career-profile"),
  data: ...
});

type CareerProfile = z.infer<typeof CareerProfileSchema>;
```

LLM responses must be validated before being accepted.

Imported JSON must also be validated.

## 3.3 Testing

Use:

-   Vitest for unit/integration tests.
-   React Testing Library for component/workflow tests.
-   Playwright for browser-level UI tests where useful.

Tests should cover both normal flows and failure states.

## 3.4 PDF

PDF generation must be entirely client-side.

Recommended initial approach:

-   `@react-pdf/renderer`

Use the same structured `Resume` data for both:

``` text
Resume JSON
   ↓
React PDF components
   ↓
PDF
```

The preview should use the same rendering model where practical.

The PDF renderer must support:

-   Page breaks.
-   Clickable hyperlinks.
-   Margins.
-   Font sizes.
-   Paragraph spacing.
-   Bullet wrapping.
-   Avoiding awkward orphaned content where possible.
-   Multiple pages.
-   Intentional whitespace.
-   A fixed resume template.

Do not use an LLM to produce PDF markup.

The Cover Letter, when generated, uses a separate, simple single-page
text layout (not the multi-section resume template) built with the same
PDF renderer.

## 3.5 Browser APIs

Use browser APIs for:

-   File upload.
-   Image reading.
-   JSON download.
-   JSON import.
-   In-memory object URLs where required.
-   Clipboard functionality if later useful.

Uploaded raw images should not be retained after their associated
extraction stage unless explicitly required by the current UI state.

------------------------------------------------------------------------

# 4. Application Architecture

Recommended structure:

``` text
src/
├── app/
│   ├── App.tsx
│   ├── routes.tsx
│   └── providers/
│
├── components/
│   ├── common/
│   ├── inputs/
│   ├── career-profile/
│   ├── job-description/
│   ├── matching/
│   ├── resume/
│   ├── cover-letter/
│   ├── settings/
│   └── pdf/
│
├── clients/
│   └── llm/
│       ├── LLMClient.ts
│       ├── types.ts
│       └── openrouter/
│           ├── OpenRouterClient.ts
│           └── types.ts
│
├── prompts/
│   ├── extract-career-profile.ts
│   ├── generate-resume.ts
│   └── generate-cover-letter.ts
│
├── schemas/
│   ├── careerProfile.ts
│   ├── jobDescription.ts
│   ├── matching.ts
│   ├── writingStyle.ts
│   ├── resume.ts
│   ├── resumeTemplate.ts
│   ├── coverLetter.ts
│   └── common.ts
│
├── services/
│   ├── career-profile/
│   ├── job-description/
│   ├── matching/
│   ├── resume/
│   ├── cover-letter/
│   ├── import-export/
│   └── pdf/
│
├── state/
│   ├── AppState.ts
│   ├── AppProvider.tsx
│   └── reducers/
│
├── utils/
│   ├── files.ts
│   ├── downloads.ts
│   ├── errors.ts
│   └── ids.ts
│
├── styles/
│
└── main.tsx

tests/
├── unit/
├── integration/
└── e2e/
```

The exact directory names can be adjusted during implementation, but the
architectural boundaries should remain.

------------------------------------------------------------------------

# 5. LLM Provider Abstraction

## 5.1 Goal

The rest of the application must not know that OpenRouter is being used.

Do not write code such as:

``` ts
openRouter.generate(...)
```

inside resume or career-profile services.

Instead:

``` ts
llmClient.generateStructured(...)
```

The provider is selected at the application boundary.

## 5.2 Provider interface

Conceptual interface:

``` ts
export interface LLMClient {
  generateStructured<T>(request: StructuredGenerationRequest): Promise<T>;
}
```

Supporting types should include:

``` ts
type LLMContent =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image";
      dataUrl: string;
      mimeType: string;
    };

interface StructuredGenerationRequest {
  model: string;
  systemPrompt: string;
  userContent: LLMContent[];
  schema: unknown;
  temperature?: number;
}
```

The interface should be provider-neutral.

The OpenRouter implementation is responsible for translating this
request into the provider's API format.

## 5.3 Future providers

Future providers might include:

``` text
clients/
└── llm/
    ├── LLMClient.ts
    ├── openrouter/
    │   └── OpenRouterClient.ts
    ├── kie/
    │   └── KieClient.ts
    └── ...
```

Adding a provider should not require modifying:

-   Career Profile services.
-   Job Description services.
-   Matching services.
-   Resume generation services.
-   PDF rendering.

Only provider selection/configuration and the provider implementation
should change.

------------------------------------------------------------------------

# 6. OpenRouter Configuration

The initial UI should provide:

``` text
LLM Provider
[ OpenRouter ]

API Key
[ ************** ] [Show/Hide]

Model
[ user enters model name ]

[ Test Connection ]
```

The user is responsible for entering a model that supports the required
modality.

The application does not need to maintain its own model catalogue
initially.

The API key is stored in React/application memory only.

Recommended state:

``` ts
interface LLMSettings {
  provider: "openrouter";
  apiKey: string;
  model: string;
}
```

This state MUST never be passed to persistence helpers.

------------------------------------------------------------------------

# 7. Application State

The application should maintain a single in-memory session state.

Conceptually:

``` ts
interface AppState {
  llm: LLMSettings;
  careerProfile?: CareerProfile;
  jobDescription?: JobDescription;
  writingStyle?: WritingStyle;
  matching?: MatchingAnalysis;
  resume?: Resume;
  workflow: WorkflowState;
}
```

Do not persist the complete application state automatically.

Explicit user exports are the persistence mechanism.

A page refresh may reset the session.

------------------------------------------------------------------------

# 8. Core Domain Artifacts

## 8.1 Career Profile

The Career Profile contains all known professional information.

Conceptual structure:

``` text
CareerProfile
├── Personal
├── ProfessionalSummarySource
├── Experience[]
│   ├── Company
│   ├── Role
│   ├── StartDate
│   ├── EndDate
│   ├── Projects[]
│   │   ├── Name
│   │   ├── Description
│   │   ├── Accomplishments[]
│   │   │   ├── Description
│   │   │   ├── Technologies[]
│   │   │   ├── Impact
│   │   │   ├── Scale
│   │   │   └── ...
│   │   └── Technologies[]
│   └── ...
├── Skills[]
├── Education[]
├── Certifications[]
├── Awards[]
├── Publications[]
├── Projects[]
├── VolunteerExperience[]
├── ProfessionalAffiliations[]
└── CustomSections[]
```

Multiple roles at the same company are supported in the underlying
model, but the tailoring logic should prefer the latest role when
selecting between overlapping representations unless older role history
is relevant.

Employment dates use month/year.

Example:

``` text
Mar 2021
Jan 2023
```

## 8.2 Job Description

Conceptual structure:

``` text
JobDescription
├── Metadata
│   ├── Company
│   ├── Title
│   └── Location
├── Summary
├── Responsibilities[]
├── Requirements[]
├── PreferredQualifications[]
├── Technologies[]
├── LeadershipExpectations[]
├── DomainSignals[]
└── OtherSignals[]
```

The structured JD is editable and exportable/importable.

## 8.3 Writing Style

Writing style is **optional** and can originate from:

-   Structured fields.
-   Raw text.
-   Later, potentially a sample resume/document.

If no writing style is supplied, the application must extrapolate a
reasonable style rather than silently applying an arbitrary generic
tone. The extrapolation should consider:

-   Years of experience present in the Career Profile.
-   Highest education level present in the Career Profile.
-   Any free-form self-reference details the user has supplied (e.g.
    additional details entered during Career Profile extraction).

The resolved writing style (explicit or extrapolated) is an input to
both Resume generation and Cover Letter generation, and must be applied
consistently across both artifacts.

## 8.4 Matching Analysis

The matching stage identifies:

-   Important JD requirements.
-   Relevant Career Profile experiences.
-   Important technologies.
-   Transferable/equivalent technology opportunities.
-   Missing experience.
-   Suggested resume emphasis.
-   Suggested ordering.
-   Suggested skills to emphasize.

It does not need a complicated taxonomy such as
exact/partial/transferable/no-evidence in the user-facing UI.

The model should use the information internally to make good tailoring
decisions.

## 8.5 Resume

The Resume is independent of the Career Profile.

Conceptual structure:

``` text
Resume
├── Contact
├── ProfileSummary
├── Skills
├── Experience[]
│   ├── Company
│   ├── Role
│   ├── Location
│   ├── Dates
│   └── Bullets[]
├── Education[]
├── Certifications[]
├── Projects[]
├── Awards[]
├── Publications[]
├── VolunteerExperience[]
├── ProfessionalAffiliations[]
└── CustomSections[]
```

The generated Resume can be edited directly.

The Resume JSON is exportable/importable.

Importing a valid Resume JSON should allow the user to bypass all
earlier LLM stages and proceed directly to review/PDF generation.

## 8.6 Cover Letter

The Cover Letter is an optional companion artifact to the Resume.

Conceptual structure:

``` text
CoverLetter
├── Recipient (optional)
│   ├── HiringManagerName
│   └── Company
├── Salutation
├── BodyParagraphs[]
├── Closing
└── SenderContact
```

Constraints:

-   Must be short. A full page is considered too long.
-   Target approximately 3--4 short paragraphs.
-   Language must match the resolved writing style (explicit or
    extrapolated) used for the Resume.

The Cover Letter is editable and exportable/importable, and can be
downloaded as a PDF alongside the Resume PDF.

------------------------------------------------------------------------

# 9. Prompt Architecture

There are three primary application prompts initially.

``` text
src/prompts/
├── extract-career-profile.ts
├── generate-resume.ts
└── generate-cover-letter.ts
```

## 9.1 Prompt 1 --- Career Profile Extraction

Input:

``` text
Raw professional text
+
Images
+
Optional existing Career Profile
```

Output:

``` text
CareerProfile
```

If an existing Career Profile is supplied, the operation is a
merge/update rather than replacement.

The model is allowed to infer loosely.

The user must be able to inspect and edit the resulting structure.

## 9.2 Prompt 2 --- Resume Generation

Input:

``` text
Structured Job Description
+
Career Profile
+
Matching/selection information
+
Writing Style
+
Resume structure/template rules
```

Output:

``` text
Resume
```

The prompt should instruct the model to:

-   Tailor strongly toward the JD.
-   Preserve factual grounding in the supplied Career Profile.
-   Normalize equivalent technologies where reasonable.
-   Reorder accomplishments by relevance and impact.
-   Select impactful skills.
-   Generate a JD-specific profile summary.
-   Rewrite accomplishments where appropriate.
-   Avoid unsupported experience when no evidence exists.
-   Keep the output within resume constraints.
-   Produce no more than 4--6 bullets per role.
-   Keep bullets to approximately 2--4 sentences maximum.
-   Prefer concise, high-impact wording.
-   Optimize terminology for ATS compatibility without keyword stuffing.

The application should inject the resolved writing style (explicit or
extrapolated) into this prompt. If no explicit Writing Style was
supplied, the prompt must instruct the model to infer a reasonable tone
from the Career Profile's years of experience, education level, and any
free-form self-reference details provided by the user.

## 9.3 Prompt 3 --- Cover Letter Generation

Input:

``` text
Structured Job Description
+
Career Profile
+
Matching/selection information
+
Resolved Writing Style (explicit or extrapolated)
+
Resume (for tonal/content consistency)
```

Output:

``` text
CoverLetter
```

The prompt should instruct the model to:

-   Keep the letter short; a full page is too long. Target roughly
    3--4 short paragraphs.
-   Match the resolved writing style used for the Resume.
-   Reference the most relevant, high-impact qualifications rather than
    repeating the entire Resume.
-   Avoid unsupported experience.
-   When no explicit Writing Style is supplied, infer a reasonable tone
    from the Career Profile's years of experience, education level, and
    any free-form self-reference details provided by the user.

------------------------------------------------------------------------

# 10. Matching and Selection

The user chooses one of two modes:

``` text
○ Best Match
○ I'll Select
```

### Best Match

The system selects the most relevant and impactful experiences
automatically.

### I'll Select

The user sees relevant Career Profile experiences and chooses which ones
should be considered.

The UI may show AI recommendations, but the user has final control.

The matching stage should prioritize:

1.  Relevance to the JD.
2.  Impact.
3.  Recency.
4.  Evidence of required technologies/skills.
5.  Leadership/ownership where relevant.
6.  Breadth and depth where useful.

The most impactful relevant accomplishments should generally appear
earlier in a role.

------------------------------------------------------------------------

# 11. ATS Tailoring

The generated resume should use JD terminology where supported by the
Career Profile.

Examples:

``` text
JD: GitHub Actions
Profile: GitHub Actions
→ use GitHub Actions

JD: Terraform
Profile: OpenTofu
→ Terraform may be used when the model determines the experience is equivalent
```

The application should not fabricate experience solely to satisfy an ATS
keyword.

The matching/generation prompt is responsible for selecting useful
terminology.

------------------------------------------------------------------------

# 12. Workflow

The primary workflow is:

``` text
1. Configure LLM
2. Career Profile
3. Job Description
4. Writing Style (optional)
5. Match & Tailor
6. Generate Resume
7. Review/Edit Resume
8. Generate Cover Letter (optional)
9. Preview
10. Export PDF (Resume, and Cover Letter if generated)
```

The UI should display explicit workflow progress.

Each completed stage should be represented in application state.

The user should be able to return to earlier stages and make changes.

Changing upstream data may require downstream artifacts to be
regenerated.

------------------------------------------------------------------------

# 13. Import/Export

Supported JSON artifacts:

``` text
career-profile.json
job-description.json
resume.json
cover-letter.json
```

Each exported artifact must contain:

``` json
{
  "schema_version": "1.0",
  "type": "career-profile",
  "data": {}
}
```

Possible types:

``` text
career-profile
job-description
resume
cover-letter
```

Imported files must:

1.  Parse JSON.
2.  Validate `type`.
3.  Validate `schema_version`.
4.  Validate the data against the corresponding Zod schema.
5.  Reject invalid input with a clear UI error.

Importing Career Profile JSON skips Career Profile extraction.

Importing Job Description JSON skips JD extraction.

Importing Resume JSON skips the LLM workflow and allows direct
editing/preview/PDF export.

Cover Letter JSON follows the same envelope rules and can likewise be
imported to skip Cover Letter generation.

------------------------------------------------------------------------

# 14. PDF Resume Template

The supplied screenshots define the intended visual direction.

The initial implementation uses one fixed template.

The template should include:

-   Centered contact/header area.
-   Profile Summary section.
-   Skills/technical information section.
-   Professional Experience section.
-   Additional resume sections as applicable.
-   Strong section headings.
-   Compact but readable typography.
-   Table-like presentation where required.
-   Bold emphasis where appropriate.
-   Clickable contact/profile links.

The exact fonts, dimensions, spacing, and visual rules should be
extracted into an explicit template specification during implementation
rather than being scattered across React components.

Example:

``` text
resume/
├── ResumeDocument.tsx
├── ResumeHeader.tsx
├── ResumeSummary.tsx
├── ResumeSkills.tsx
├── ResumeExperience.tsx
├── ResumeEducation.tsx
└── template.ts
```

------------------------------------------------------------------------

# 15. PDF Layout Rules

The renderer should attempt to:

-   Avoid splitting a role heading from its first bullet.
-   Avoid leaving a heading at the bottom of a page.
-   Keep related bullets together where possible.
-   Avoid excessive blank space.
-   Use controlled whitespace when necessary.
-   Prefer natural page breaks.
-   Respect the requested page count when the user specifies one.
-   Never destroy readability merely to hit an exact page count.

Page-count preference:

``` text
No preference  ← default
1 page
2 pages
3 pages
...
```

If a page target cannot reasonably be met without damaging readability,
preserve readability.

------------------------------------------------------------------------

# 16. Contact Information

The initial workflow should collect:

-   Name
-   Location
-   Email
-   Phone
-   Website
-   GitHub
-   LinkedIn
-   Other user-provided links

Links should remain clickable in the generated PDF.

------------------------------------------------------------------------

# 17. Error Handling

LLM failures should be explicit.

Examples:

``` text
OpenRouter authentication failed
→ Update API Key / Retry

Model request failed
→ Retry

Invalid structured response
→ Retry

Imported JSON is invalid
→ Show validation error

Unsupported schema version
→ Show supported versions

PDF generation failed
→ Retry / inspect resume
```

Do not expose raw provider secrets.

Do not log API keys.

------------------------------------------------------------------------

# 18. Security and Privacy

The application should display a clear privacy notice:

> Your information is processed in this browser session. When you use an
> LLM feature, the relevant information is sent directly from your
> browser to the selected LLM provider. Your OpenRouter API key is kept
> only in memory and is not stored in browser storage, cookies, or
> application servers.

The application has no application backend.

Avoid third-party analytics in the MVP unless they can be demonstrated
not to capture resume/career data or secrets.

------------------------------------------------------------------------

# 19. Accessibility

Use accessible HTML and controls:

-   Labels for every input.
-   Keyboard-accessible controls.
-   Visible focus states.
-   Semantic headings.
-   Accessible error messages.
-   Appropriate ARIA only where native semantics are insufficient.
-   Sufficient contrast.
-   Buttons with descriptive names.
-   File upload controls with clear descriptions.
-   Do not rely solely on color to communicate state.

Chrome is the only supported browser initially, but the application
should not intentionally use inaccessible patterns.

------------------------------------------------------------------------

# 20. Design Constraints

Do not introduce:

-   Backend APIs.
-   Database.
-   Authentication system.
-   Server-side PDF rendering.
-   Automatic local persistence of sensitive data.
-   Multiple job/project management in the initial application.
-   Multiple resume templates in the initial application.
-   DOCX generation.

A user who wants to work on multiple jobs can use separate browser
tabs/windows.

------------------------------------------------------------------------

# 21. Non-Goals for MVP

Out of scope:

-   DOCX export.
-   Backend persistence.
-   User accounts.
-   Multi-job workspace.
-   Automatic model catalogue.
-   Cross-browser optimization beyond Chrome.
-   Multiple visual resume templates.
-   Server-side processing.
-   Analytics requiring career-data collection.

------------------------------------------------------------------------

# 22. Deployment

The application is a static, client-only build with no server-side
component, so it can be hosted on any static file host. The initial
target is **GitHub Pages** (a project page, not a user/organization
root page).

Requirements this introduces:

-   `vite.config.ts` must set `base` to the repository's Pages path
    (e.g. `/experience-points/`) so every built asset URL resolves
    correctly when the site is served from a subpath rather than the
    domain root.
-   The build output (`dist/`) must include a `.nojekyll` file so
    GitHub Pages does not run its default Jekyll processing step over
    the build output (Jekyll ignores files/folders starting with `_`,
    which Vite's own output does not currently produce, but this is
    cheap, standard insurance against future tooling/plugins that do).
    This is provided by committing an empty `public/.nojekyll` file,
    which Vite copies into every build automatically.
-   Publishing must be a single local `npm run` command, not a CI/CD
    pipeline definition, consistent with this project's preference for
    npm-script-driven tooling over `.github/workflows` — see
    `package.json`'s `deploy` script (`test` -> `build` ->
    `gh-pages -d dist`, using the `gh-pages` package to push the built
    output to a `gh-pages` branch).
-   No SPA client-side-routing fallback (e.g. a `404.html`
    redirect trick) is required, since the application uses in-memory
    workflow-step state rather than URL-based routing.
-   No custom domain (`CNAME`) is required for the default
    `<owner>.github.io/<repo>/` URL.
-   Deployment does not change the privacy model in any way: the
    published site is still fully static, LLM calls still go directly
    from the visitor's browser to the selected provider, and no
    application backend is introduced by hosting the built assets on
    GitHub Pages.
