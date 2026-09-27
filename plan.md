# Resume Tailoring Workbench --- Implementation Plan

This plan is intentionally staged.

Each stage must be independently testable.

A stage is **not complete** merely because the code compiles. It is
complete only when:

1.  Automated tests for the stage pass.
2.  The explicit manual UI tests at the end of the stage pass.
3.  No unresolved blocker from the stage remains.
4.  Any issue that took substantially longer than expected is documented
    in `findings.md`.

Once all four conditions above are verified for a stage, mark it
complete by:

-   Adding `[COMPLETE]` to the stage's heading (e.g.
    `# Stage 0 --- Project Bootstrap [COMPLETE]`).
-   Adding a `Status: Complete` line directly under that stage's
    `## Completion criteria` section.

Do not mark a stage complete unless every condition above has actually
been verified.

Refer to `specification.md` for architectural and technical decisions.

------------------------------------------------------------------------

# Stage 0 --- Project Bootstrap [COMPLETE]

## Goal

Create the client-side SPA foundation.

## Technical decisions

Follow `specification.md` sections:

-   Technical Stack
-   Application Architecture
-   Design Constraints

Use:

-   React
-   TypeScript
-   Vite
-   Vitest
-   React Testing Library

Do not introduce a backend.

## Work

Create:

``` text
src/
  app/
  components/
  clients/
    llm/
  prompts/
  schemas/
  services/
  state/
  utils/
  styles/
tests/
```

Add basic application shell.

Add a workflow navigation UI:

``` text
Configure
Career Profile
Job Description
Match & Tailor
Resume
Cover Letter
Preview / Export
```

Only the shell is required at this stage.

## Automated tests

-   Application mounts successfully.
-   Workflow navigation renders.
-   Unknown/unsupported workflow state does not crash the application.

## Manual UI test

1.  Start the application.
2.  Open it in Chrome.
3.  Confirm the workflow UI appears.
4.  Navigate between the available workflow steps.
5.  Refresh the page.
6.  Confirm the application still loads.
7.  Confirm there is no backend dependency.

## Completion criteria

All automated tests pass and all manual checks succeed.

Status: Complete

------------------------------------------------------------------------

# Stage 1 --- Schema Foundation [COMPLETE]

## Goal

Define and validate the application's core structured artifacts.

Refer to `specification.md`:

-   Core Domain Artifacts
-   Import/Export
-   Structured data first

## Implement schemas

Create Zod schemas for:

``` text
CareerProfile
JobDescription
WritingStyle
MatchingAnalysis
Resume
ResumeTemplate
CoverLetter
```

Also create:

``` text
ExportEnvelope
```

with:

``` text
schema_version
type
data
```

## Career Profile

Support:

``` text
Company
Role
Dates
Projects
Accomplishments
Technologies
Impact
Scale
Skills
Education
Certifications
Awards
Publications
VolunteerExperience
ProfessionalAffiliations
CustomSections
```

Dates are month/year.

## Resume constraints

Represent constraints such as:

``` text
maximum bullets per role = 6
target bullets per role = 4–6
maximum sentences per bullet = 4
page count preference = no preference by default
```

## Automated tests

Test:

-   Valid Career Profile passes.
-   Invalid Career Profile fails.
-   Valid JD passes.
-   Invalid JD fails.
-   Valid Resume passes.
-   Invalid Resume fails.
-   Correct export envelope passes.
-   Wrong artifact type fails.
-   Unsupported schema version fails.

## Manual UI test

No major UI is required yet.

Use a temporary developer/test view if useful to enter JSON and observe
validation.

Confirm valid JSON is accepted and invalid JSON produces a readable
validation error.

## Completion criteria

All schema tests pass.

Status: Complete

------------------------------------------------------------------------

# Stage 2 --- Session State and Privacy Boundary [COMPLETE]

## Goal

Implement in-memory application state and explicitly prevent persistence
of sensitive data.

Refer to `specification.md`:

-   Local-first / client-only
-   Application State
-   Security and Privacy

## Work

Create application state containing:

``` text
LLM settings
Career Profile
JD
Writing Style
Matching Analysis
Resume
Workflow state
```

Implement LLM settings:

``` text
provider
apiKey
model
```

## Important

Do not connect this state to:

``` text
localStorage
sessionStorage
IndexedDB
cookies
URL parameters
```

Do not persist the API key.

## Automated tests

-   API key exists in application state after entry.
-   API key is not written to localStorage.
-   API key is not written to sessionStorage.
-   API key is not placed in a URL.
-   Clearing session state removes the API key.
-   Sensitive values are not emitted through application logging.

## Manual UI test

1.  Enter an OpenRouter API key.
2.  Enter a model name.
3.  Open Chrome DevTools.
4.  Inspect Local Storage.
5.  Inspect Session Storage.
6.  Inspect cookies.
7.  Confirm the API key is absent.
8.  Refresh the page.
9.  Confirm the key is no longer available.
10. Confirm the privacy notice is visible.

## Completion criteria

Privacy tests pass.

Status: Complete

------------------------------------------------------------------------

# Stage 3 --- File Input and Artifact Import/Export [COMPLETE]

## Goal

Implement client-side file handling.

Refer to `specification.md`:

-   Import/Export
-   Browser APIs

## Work

Implement:

-   JSON export.
-   JSON import.
-   Text file input.
-   Image input.
-   File validation.
-   File size/type validation.

Implement downloads for:

``` text
career-profile.json
job-description.json
resume.json
```

## Automated tests

-   Career Profile JSON downloads correctly.
-   Career Profile JSON imports correctly.
-   JD JSON imports correctly.
-   Resume JSON imports correctly.
-   Invalid JSON is rejected.
-   Wrong artifact type is rejected.
-   Unsupported schema version is rejected.
-   Image files are accepted.
-   Text input is accepted.

## Manual UI test

1.  Enter/create a sample Career Profile.
2.  Download it.
3.  Reload the app.
4.  Import the downloaded JSON.
5.  Confirm the data appears correctly.
6.  Repeat for JD.
7.  Repeat for Resume.
8.  Import invalid JSON and confirm a useful error appears.

## Completion criteria

Import/export round trips successfully.

Status: Complete

------------------------------------------------------------------------

# Stage 4 --- LLM Client Abstraction [COMPLETE]

## Goal

Implement a provider-neutral LLM interface.

Refer to `specification.md`:

-   LLM Provider Abstraction
-   OpenRouter Configuration

## Work

Implement:

``` text
LLMClient
OpenRouterClient
```

The rest of the application must depend only on:

``` ts
LLMClient
```

not OpenRouter-specific implementation details.

Support:

-   Text input.
-   Image input.
-   Model name.
-   Structured output request.
-   API error handling.
-   Authentication error handling.

## Automated tests

Use mocked network requests.

Test:

-   Successful structured response.
-   401/authentication failure.
-   Provider error.
-   Network failure.
-   Invalid structured output.
-   Image request construction.
-   Text request construction.

Do not use a real API key in tests.

## Manual UI test

1.  Enter OpenRouter configuration.
2.  Use the test connection action.
3.  Confirm successful connection with a valid key/model.
4.  Enter an invalid key.
5.  Confirm an authentication error is shown.
6.  Confirm Retry and Update API Key actions work.

## Completion criteria

All provider tests pass.

Status: Complete

------------------------------------------------------------------------

# Stage 5 --- Career Profile Extraction [COMPLETE]

## Goal

Build the first real LLM workflow.

Refer to `specification.md`:

-   Prompt Architecture
-   Career Profile
-   Human in the loop

## Work

Implement:

``` text
Raw text/images
     ↓
extract-career-profile prompt
     ↓
LLMClient
     ↓
Zod validation
     ↓
Career Profile
```

Support:

-   Text.
-   Multiple images.
-   Text + images together.
-   Free-form additional details.
-   Existing Career Profile merge.

## Merge behavior

If an existing Career Profile is supplied:

``` text
Existing Career Profile
+
New raw information
↓
LLM
↓
Merged Career Profile
```

Do not replace the existing profile blindly.

## UI

Provide:

-   Raw text area.
-   Image uploader.
-   Additional details text field.
-   Existing Career Profile import.
-   Generate/update button.
-   Structured Career Profile editor.
-   Add/edit/delete experience.
-   Add/edit/delete projects.
-   Add/edit/delete accomplishments.
-   Add/edit/delete skills and other sections.
-   Download JSON.

## Automated tests

Mock the LLM.

Test:

-   Raw text extraction.
-   Image input.
-   Multiple image input.
-   Text + images.
-   Existing profile merge.
-   Invalid LLM output.
-   Retry after invalid output.
-   Manual editing.
-   Add experience.
-   Delete experience.
-   JSON export.

## Manual UI test

1.  Paste a realistic professional history.
2.  Add one or more screenshots/images.
3.  Add additional details.
4.  Generate Career Profile.
5.  Review the generated structured data.
6.  Edit a company.
7.  Edit a role.
8.  Add an accomplishment manually.
9.  Delete an accomplishment.
10. Download Career Profile JSON.
11. Refresh the browser.
12. Confirm the API key is gone.
13. Import the Career Profile JSON.
14. Confirm it restores correctly.

## Completion criteria

A user can create, inspect, edit, merge, export, and import a Career
Profile.

Status: Complete

------------------------------------------------------------------------

# Stage 6 --- Job Description Extraction [COMPLETE]

## Goal

Create the structured Job Description workflow.

Refer to `specification.md`:

-   Job Description
-   Prompt Architecture
-   Import/Export

## Work

Support:

-   Raw JD text.
-   JD images.
-   Multiple JD images.
-   Text + images.
-   Structured JD import.
-   Structured JD editing.
-   Structured JD export.

## Important

If valid structured JD JSON is imported:

``` text
Do not call the extraction LLM.
```

## Automated tests

-   Raw text extraction.
-   Image extraction.
-   Multiple image extraction.
-   Import skips LLM.
-   Invalid JD JSON rejected.
-   Manual editing works.
-   Export/import round trip works.

## Manual UI test

1.  Paste a JD.
2.  Generate Structured JD.
3.  Review it.
4.  Edit a requirement.
5.  Export it.
6.  Reload.
7.  Import it.
8.  Confirm no extraction call is required.
9.  Confirm the structured JD is available for the next stage.

## Completion criteria

JD extraction/import/edit/export works.

Status: Complete

------------------------------------------------------------------------

# Stage 7 --- Writing Style [COMPLETE]

## Goal

Allow the user to optionally specify the desired writing style.

Refer to `specification.md`:

-   Writing Style
-   Prompt Architecture

## Work

Support:

``` text
Structured style fields
```

and:

``` text
Raw style text
```

Writing Style is optional. The user may leave it blank.

When left blank, do not silently fall back to a generic default tone.
Instead, the resume/cover-letter generation prompts must extrapolate a
reasonable style from:

``` text
Years of experience in the Career Profile
Highest education level in the Career Profile
Free-form self-reference details the user has supplied
```

Keep this stage intentionally simple.

## Automated tests

-   Structured style accepted.
-   Raw text accepted.
-   Empty style triggers extrapolation instructions in the
    generation request instead of a hardcoded default.
-   Style (explicit or extrapolated) is included in resume-generation
    request.

## Manual UI test

1.  Leave writing style blank.
2.  Continue to resume tailoring and confirm generation still proceeds.
3.  Enter raw style guidance.
4.  Save it.
5.  Switch to structured style.
6.  Confirm it can be edited.
7.  Continue to resume tailoring.

## Completion criteria

Writing style, whether explicit or extrapolated, is available to the
resume-generation pipeline.

Status: Complete

------------------------------------------------------------------------

# Stage 8 --- Matching and Tailoring Selection [COMPLETE]

## Goal

Implement the intermediate matching layer.

Refer to `specification.md`:

-   Matching and Selection
-   ATS Tailoring

## Work

Create matching analysis from:

``` text
Career Profile
+
Job Description
```

The analysis should identify:

-   Important JD requirements.
-   Relevant experiences.
-   Important technologies.
-   Equivalent technology opportunities.
-   Missing evidence.
-   Suggested ordering.
-   Suggested skills.

Do not expose unnecessary complexity such as a large taxonomy of match
types.

## Selection modes

### Best Match

AI selects the experiences/accomplishments.

### I'll Select

The user selects experiences.

The UI may show AI recommendations.

## Automated tests

Mock matching output.

Test:

-   Best Match selection.
-   Manual selection.
-   Missing experience.
-   Equivalent technology.
-   Reordering.
-   Important skills.
-   Invalid matching response.

## Manual UI test

Use a JD containing:

``` text
Python
Terraform
AWS
Kubernetes
GitHub Actions
```

Use a Career Profile containing:

``` text
Python
OpenTofu
AWS
Docker
Jenkins
```

Confirm:

1.  Matching identifies relevant experience.
2.  OpenTofu can support Terraform-related tailoring.
3.  Missing experience is not fabricated.
4.  Best Match produces a selection.
5.  Manual mode allows the user to select different experiences.
6.  The user can change the AI recommendation.

## Completion criteria

Both selection modes work.

Status: Complete

------------------------------------------------------------------------

# Stage 9 --- Resume Generation [COMPLETE]

## Goal

Generate the structured resume.

Refer to `specification.md`:

-   Prompt Architecture
-   Resume
-   ATS Tailoring
-   PDF Layout Rules

## Inputs

``` text
Career Profile
Job Description
Matching Analysis
User Selection
Writing Style
Resume constraints
Resume structure
```

## Output

``` text
Structured Resume
```

## Generation rules

The prompt must enforce:

-   Strong JD alignment.
-   ATS terminology where supported.
-   Equivalent technology normalization.
-   Most impactful accomplishments first.
-   Relevant skills prioritized.
-   JD-specific summary.
-   4--6 bullets per role maximum.
-   2--4 sentences maximum per bullet.
-   No fabricated experience.
-   Reasonable rewriting.
-   Conservative-to-aggressive matching within user-selected behavior.
-   All resume sections supported by the schema.
-   If no Writing Style was supplied, infer a reasonable one from the
    Career Profile's years of experience, education level, and any
    free-form self-reference details, and apply it consistently.

## Automated tests

Mock the LLM.

Test:

-   Resume generation.
-   Skill selection.
-   Summary generation.
-   Experience ordering.
-   Bullet count constraint.
-   Sentence-count constraint.
-   Missing experience omission.
-   Equivalent technology handling.
-   Invalid response retry.
-   Resume schema validation.

## Manual UI test

1.  Use a Career Profile.
2.  Use a JD.
3.  Select Best Match.
4.  Generate resume.
5.  Confirm summary changes toward the JD.
6.  Confirm relevant skills rise in importance.
7.  Confirm impactful accomplishments appear first.
8.  Confirm no more than 6 bullets per role.
9.  Confirm missing experience is not fabricated.
10. Change to manual selection.
11. Select different experiences.
12. Generate again.
13. Confirm output changes.

## Completion criteria

A valid structured Resume is generated from a valid Career Profile and
JD.

Status: Complete

------------------------------------------------------------------------

# Stage 10 --- Resume Editor [COMPLETE]

## Goal

Give the user complete control over the generated Resume.

Refer to `specification.md`:

-   Human in the loop
-   Resume

## Work

Allow editing of:

-   Header.
-   Summary.
-   Skills.
-   Experience.
-   Bullets.
-   Education.
-   Certifications.
-   Projects.
-   Awards.
-   Publications.
-   Volunteer experience.
-   Professional affiliations.
-   Custom sections.

Allow:

-   Reordering.
-   Add.
-   Edit.
-   Delete.

## Important

Editing the Resume does not modify the Career Profile.

## Automated tests

-   Every major section can be edited.
-   Items can be added.
-   Items can be deleted.
-   Items can be reordered.
-   Edited data passes schema validation.
-   Resume JSON exports the edited version.

## Manual UI test

1.  Generate a resume.
2.  Change the summary.
3.  Rewrite a bullet.
4.  Remove a bullet.
5.  Add a bullet.
6.  Reorder bullets.
7.  Change skills.
8.  Export Resume JSON.
9.  Import Resume JSON.
10. Confirm all edits remain.

## Completion criteria

User can fully control the generated Resume.

Status: Complete

------------------------------------------------------------------------

# Stage 11 --- Resume Template and Live Preview [COMPLETE]

## Goal

Implement the visual resume based on the supplied screenshots.

Refer to `specification.md`:

-   PDF Resume Template
-   PDF Layout Rules

## Work

Translate the supplied screenshots into an explicit template
specification.

Implement:

``` text
ResumeDocument
ResumeHeader
ResumeSummary
ResumeSkills
ResumeExperience
ResumeEducation
ResumeAdditionalSections
```

Use one template.

Implement live preview.

The preview should use the same structured Resume data used for PDF
generation.

## Automated tests

Test:

-   All sections render.
-   Links render.
-   Empty sections are omitted.
-   Multiple roles render correctly.
-   Long bullets wrap.
-   Long company names wrap.
-   Multiple pages render.
-   Page break rules work.

## Manual UI test

1.  Generate a resume containing all major sections.
2.  Compare the preview to the supplied reference screenshots.
3.  Test a short resume.
4.  Test a long resume.
5.  Test long bullets.
6.  Test long technology lists.
7.  Test long company names.
8.  Test a role near the end of a page.
9.  Confirm headings are not stranded at the bottom.
10. Confirm readable whitespace is preserved.

## Completion criteria

Preview visually matches the intended template closely enough for the
first implementation.

Status: Complete

------------------------------------------------------------------------

# Stage 12 --- Client-Side PDF Export [COMPLETE]

## Goal

Generate the final PDF entirely in the browser.

Refer to `specification.md`:

-   PDF
-   PDF Layout Rules
-   Contact Information

## Work

Implement:

``` text
Resume
  ↓
React PDF renderer
  ↓
Blob
  ↓
Browser download
```

Support:

-   Clickable links.
-   Page breaks.
-   Multiple pages.
-   User-selected page preference.
-   Margins.
-   Typography.
-   Bullet wrapping.
-   Intentional whitespace.

## Automated tests

Test:

-   PDF generation returns a valid Blob.
-   PDF export does not require a network request.
-   Links are represented in the PDF.
-   Long resumes create multiple pages.
-   Empty sections do not create unnecessary output.

## Manual UI test

1.  Generate a one-page resume.
2.  Export PDF.
3.  Open PDF.
4.  Click email link.
5.  Click GitHub.
6.  Click LinkedIn.
7.  Test a two-page resume.
8.  Test a long resume.
9.  Test a short resume.
10. Confirm the PDF is generated without an application backend.

## Completion criteria

PDF export works entirely client-side.

Status: Complete

------------------------------------------------------------------------

# Stage 13 --- Page Count and Layout Optimization [COMPLETE]

## Goal

Handle the user's page-count preference without damaging readability.

Refer to `specification.md`:

-   Page count
-   PDF Layout Rules

## Supported options

``` text
No preference
1 page
2 pages
3 pages
...
```

Default:

``` text
No preference
```

## Work

Implement layout heuristics.

Examples:

-   Keep role heading with first bullet.
-   Avoid splitting tightly related content where practical.
-   Use whitespace intentionally.
-   Adjust section spacing where appropriate.
-   Allow natural page breaks.
-   Do not reduce typography to unreasonable levels simply to fit a
    page.

## Automated tests

-   Page preference is represented correctly.
-   No-preference mode does not artificially compress content.
-   Long content produces readable multiple pages.
-   Page break heuristics behave consistently.

## Manual UI test

Create:

1.  Very short resume.
2.  Normal resume.
3.  Very long resume.

Test:

``` text
No preference
1 page
2 pages
```

Confirm the output remains readable.

## Completion criteria

Page-count behavior is predictable and readable.

Status: Complete

------------------------------------------------------------------------

# Stage 14 --- Complete Import/Resume-Only Workflow [COMPLETE]

## Goal

Validate the important shortcut workflows.

Refer to `specification.md`:

-   Import/Export
-   Resume JSON

## Workflow A

``` text
Career Profile JSON
+
JD JSON
↓
Matching
↓
Resume
↓
PDF
```

## Workflow B

``` text
Resume JSON
↓
Edit
↓
Preview
↓
PDF
```

Workflow B must not require an LLM.

## Automated tests

-   Career Profile import bypasses extraction.
-   JD import bypasses extraction.
-   Resume import bypasses all LLM generation.
-   Resume import → PDF works without network.
-   Invalid files are rejected.

## Manual UI test

### Career Profile shortcut

1.  Import an existing Career Profile.
2.  Confirm extraction is skipped.
3.  Import JD.
4.  Generate resume.

### Resume shortcut

1.  Import Resume JSON.
2.  Confirm no LLM configuration is required.
3.  Edit the resume.
4.  Preview it.
5.  Export PDF.
6.  Disconnect the network if practical.
7.  Confirm PDF generation still works.

## Completion criteria

The reusable artifact workflows work end-to-end.

Status: Complete

------------------------------------------------------------------------

# Stage 14.5 --- Cover Letter Generation and Export [COMPLETE]

## Goal

Generate an optional, concise Cover Letter that complements the tailored
Resume, using the same resolved writing style.

Refer to `specification.md`:

-   Prompt Architecture
-   Writing Style
-   Cover Letter

## Inputs

``` text
Career Profile
Job Description
Matching Analysis
Writing Style (optional)
Resume (for consistency)
```

## Writing style resolution

If Writing Style is supplied:

``` text
Use it directly.
```

If Writing Style is not supplied:

``` text
Extrapolate a reasonable writing style from:
  - Years of experience in the Career Profile.
  - Highest education level.
  - Any free-form self-reference details the user provided.
```

The resolved style must be applied consistently to both the Resume and
the Cover Letter.

## Length constraint

The Cover Letter must be short.

``` text
Target: 3–4 short paragraphs
Hard rule: must never approach a full page
```

A full page is explicitly too long. The prompt must enforce an
approximate word/character ceiling.

## Output

``` text
CoverLetter
```

Structured fields:

``` text
Recipient (optional: hiring manager name, company)
Salutation
Body paragraphs
Closing
Sender contact (reused from Resume contact)
```

## UI

Provide:

-   "Generate Cover Letter" action, available once a Resume exists.
-   Cover Letter text editor.
-   Regenerate action.
-   Download as JSON.
-   Download as PDF, offered alongside the Resume PDF download at the
    end of the workflow.

## Automated tests

Mock the LLM.

Test:

-   Generation using a supplied Writing Style.
-   Generation with no Writing Style (style is extrapolated).
-   Length constraint is enforced (short output, not full-page).
-   Language matches the resolved writing style used for the Resume.
-   Invalid LLM output is rejected and retried.
-   Manual editing works.
-   JSON export/import works.
-   PDF export works without a network request.

## Manual UI test

1.  Generate a Resume without specifying a Writing Style.
2.  Generate a Cover Letter.
3.  Confirm its tone is reasonable given the Career Profile's
    experience level and education.
4.  Confirm the Cover Letter is short (well under a full page).
5.  Provide an explicit Writing Style.
6.  Regenerate the Cover Letter.
7.  Confirm the tone changes to match the specified style, and matches
    the style used in the Resume.
8.  Edit the Cover Letter text directly.
9.  Download the Cover Letter as PDF.
10. Confirm it opens correctly and contains only a short amount of
    content.

## Completion criteria

A user can optionally generate, edit, and download a concise Cover
Letter whose language matches the Resume's writing style, with or
without explicit Writing Style input.

Status: Complete

------------------------------------------------------------------------

# Stage 15 --- Error Handling and Recovery [COMPLETE]

## Goal

Make the application resilient to common failures.

Refer to `specification.md`:

-   Error Handling
-   Security and Privacy

## Cases

Handle:

-   Invalid API key.
-   Invalid model.
-   Provider outage.
-   Network failure.
-   Invalid structured response.
-   Invalid import file.
-   Unsupported schema version.
-   PDF generation failure.
-   Empty user input.
-   Unsupported image type.

## Automated tests

Each failure produces:

-   Useful message.
-   Retry option where applicable.
-   Recovery action where applicable.
-   No secret leakage.

## Manual UI test

Intentionally trigger:

1.  Invalid API key.
2.  Invalid model.
3.  Invalid JSON.
4.  Invalid schema.
5.  Empty input.
6.  Failed generation.

Confirm each failure has a clear recovery path.

## Completion criteria

Failures are understandable and recoverable.

Status: Complete

------------------------------------------------------------------------

# Stage 16 --- Accessibility and UX Pass [COMPLETE]

## Goal

Apply the best practical accessibility decisions.

Refer to `specification.md`:

-   Accessibility

## Work

Check:

-   Keyboard navigation.
-   Focus management.
-   Labels.
-   Form errors.
-   File inputs.
-   Buttons.
-   Headings.
-   Dialogs.
-   Loading states.
-   Progress states.
-   Screen-reader announcements where useful.
-   Color contrast.

## Automated tests

Use React Testing Library and accessibility tooling where appropriate.

Test:

-   Inputs have accessible names.
-   Buttons have accessible names.
-   Errors are associated with controls.
-   Modal/dialog controls are keyboard accessible.

## Manual UI test

Perform the entire workflow using:

-   Keyboard only.
-   Chrome accessibility inspection tools.

Confirm the application remains usable.

## Completion criteria

No known major accessibility issue remains.

Status: Complete

------------------------------------------------------------------------

# Stage 17 --- Security / Privacy Verification [COMPLETE]

## Goal

Perform a final privacy-focused audit.

Refer to `specification.md`:

-   Local-first / client-only
-   Security and Privacy

## Verify

Search the codebase for:

``` text
localStorage
sessionStorage
document.cookie
indexedDB
apiKey
```

Confirm API keys are not accidentally persisted.

Check network requests.

Confirm:

-   LLM calls go directly from browser to provider.
-   No application backend exists.
-   No resume data is sent anywhere except the selected LLM provider
    when an LLM operation occurs.
-   PDF generation does not call a server.
-   API key is not included in downloaded artifacts.

## Manual UI test

Use Chrome DevTools:

-   Application → Storage.
-   Network tab.
-   Sources/search.

Confirm the expected privacy model.

## Completion criteria

Privacy model matches `specification.md`.

Status: Complete

------------------------------------------------------------------------

# Stage 18 --- Final End-to-End Acceptance Test

## Goal

Run the entire application as a user.

## Test Case 1 --- New Career Profile

``` text
Raw text
+
Images
+
Additional details
↓
Career Profile
↓
Edit
↓
Export
```

Expected:

-   Valid structured Career Profile.
-   All information preserved.
-   User edits work.

## Test Case 2 --- New JD

``` text
JD image/text
↓
Structured JD
↓
Edit
↓
Export
```

Expected:

-   Valid structured JD.

## Test Case 3 --- Best Match Resume

``` text
Career Profile
+
JD
+
Writing Style
+
Best Match
↓
Resume
↓
Edit
↓
Preview
↓
PDF
```

Expected:

-   Strong JD alignment.
-   Relevant skills prioritized.
-   Impactful experiences first.
-   No unsupported experience.
-   Equivalent technologies can be used appropriately.
-   PDF matches the intended template.

## Test Case 4 --- Manual Selection

``` text
Career Profile
+
JD
+
I'll Select
↓
User selects experiences
↓
Resume
```

Expected:

-   Only selected experiences influence tailoring as intended.

## Test Case 5 --- Career Profile Import

``` text
CareerProfile.json
+
JD
↓
Skip extraction
↓
Resume
```

Expected:

-   No Career Profile LLM call.

## Test Case 6 --- JD Import

``` text
Career Profile
+
JobDescription.json
↓
Skip JD extraction
↓
Resume
```

Expected:

-   No JD extraction call.

## Test Case 7 --- Resume Import

``` text
Resume.json
↓
Edit
↓
Preview
↓
PDF
```

Expected:

-   No LLM required.
-   No backend required.

## Test Case 8 --- Privacy

``` text
Enter API key
↓
Use LLM
↓
Inspect browser storage
```

Expected:

-   API key absent from browser storage.
-   API key absent from exported artifacts.
-   No application backend.

## Test Case 9 --- Cover Letter

``` text
Resume
+
No explicit Writing Style
↓
Extrapolated style (experience + education + self-reference details)
↓
Cover Letter
```

Expected:

-   Tone is reasonable given years of experience and education level.
-   Language matches the same resolved style used for the Resume.
-   Length is short; well under a full page.
-   Downloads correctly as JSON and PDF.

## Final completion criteria

The project is considered complete when:

-   All automated tests pass.
-   All stage manual tests pass.
-   All nine end-to-end acceptance cases pass.
-   No known critical privacy/security issue exists.
-   No unresolved major PDF layout issue exists.
-   `findings.md` contains any significant implementation lessons
    discovered during development.

------------------------------------------------------------------------

# Findings Process

`findings.md` is a living engineering document.

Whenever an issue takes substantially longer than expected to diagnose
or fix, add an entry.

Use:

``` markdown
## Finding: <short title>

### Stage
Stage N — <stage name>

### Issue

What happened?

### Expected

What was expected?

### Root Cause

Why did it happen?

### Fix

What was changed?

### Why It Took Longer Than Expected

What made the issue difficult to diagnose?

### How We Could Have Avoided It

What test, design decision, documentation, or earlier validation would have prevented the wasted time?

### Lesson

What should we remember for future stages?
```

Do not add trivial bugs to `findings.md`.

Examples of issues worth documenting:

-   A PDF library behaves unexpectedly with page breaks.
-   An LLM provider's structured output behaves differently than
    expected.
-   Browser CORS behavior blocks a seemingly valid client-side
    integration.
-   A schema decision causes significant downstream rework.
-   An image input format creates an unexpected provider limitation.
-   A state-management decision causes difficult workflow
    synchronization.

The purpose of `findings.md` is to improve the engineering process, not
to become a general bug tracker.
