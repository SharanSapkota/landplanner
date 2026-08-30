# CLAUDE.md

This file gives Claude (and Claude Code) the full context needed to work on the Landplanr codebase correctly. Read this before making architectural decisions, adding tables, or building new features.

---

## 1. What this project is

Landplanr solves a trust/information gap in US land development permitting.

Homeowners and developers often do not know what a construction project legally requires until they pay a consultant to determine the requirements. Consultants, meanwhile, waste hours of unpaid time explaining requirements to prospects who often disappear afterward.

**The fix:** consultants upload their knowledge — county regulations, past project experience, and client documents — into Landplanr. An AI layer using **RAG (retrieval-augmented generation)** makes that knowledge searchable and answers questions grounded only in what was actually uploaded, with citations back to the source.

---

## 2. Current phase — what we are building right now

**Phase 1 scope is intentionally narrow. Do not build beyond this without explicit instruction.**

### Phase 1 includes

* One county with real content: **Kitsap County, WA** is the test jurisdiction, and remains the only jurisdiction with actual documents, projects, and chat activity in Phase 1.
* Consultant-facing only — **no client-facing app yet**.
* Consultant login via email/password.
* Document upload using the four document scopes defined below.
* Ongoing chat with an AI grounded in uploaded documents.
* Admin-only jurisdiction management (creating new jurisdiction records) — see §3 and §14.4. This is a deliberate, narrow expansion of scope beyond the original single-jurisdiction MVP: it lets an admin register a new county so it *exists* in the system, not stand up a second county's actual content or workflows.

### Definition of done for Phase 1

A consultant can:

1. Log in using native authentication.
2. Upload their county knowledge.
3. Have the uploaded documents processed and indexed.
4. Start a real back-and-forth conversation with the knowledge base.
5. Receive accurate answers grounded in uploaded documents.
6. See citations pointing back to the source chunks/documents.

---

## 3. Explicitly deferred — do not implement unless asked

The following are intentionally outside Phase 1:

* Client-facing intake flow.
* Magic links.
* Scope reports sent to homeowners.
* Marketplace.
* Consultant-client matching.
* Commissions.
* Automated document review/promotion workflow.

  * This is handled manually by a human admin for now.
* Billing tiers beyond a single flat subscription.
* Cross-project search.

  * Chat is scoped to one project or one jurisdiction.
  * It must not search across many projects combined.

**Jurisdiction management — narrowed, not fully deferred.** Admins can now create new jurisdiction records (`POST /jurisdictions`, admin-only — see §14.4 and decisions.md for why this was approved as an explicit, narrow expansion of the original single-jurisdiction MVP). This is jurisdiction *bookkeeping* only. The following remain deferred and must not be built without explicit instruction:

* Cross-jurisdiction search.

  * Chat and retrieval stay scoped to one jurisdiction at a time (§9), same as before — creating more jurisdiction rows does not change this.
* Per-jurisdiction onboarding workflows (guided setup, seeding a new jurisdiction's rulebook, etc.) — a newly created jurisdiction starts empty and stays empty until documents are uploaded to it manually, the same as any other jurisdiction.
* Jurisdiction-specific terminology handling (e.g. adapting prompts, docType vocabulary, or UI copy per county's local terminology) — the system currently treats every jurisdiction identically.

Do not introduce infrastructure, database tables, endpoints, UI, or abstractions for these deferred features unless explicitly instructed.

---

# 4. Core domain concepts

Use this exact vocabulary in code, database fields, comments, APIs, and documentation.

Do **not** rename or conflate these concepts.

| Term               | Meaning                                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Jurisdiction**   | A US county, occasionally a city. Rules do not transfer between jurisdictions. Every document and chunk is tagged with one jurisdiction.                                             |
| **Organization**   | A consulting firm. This is the billing and tenant boundary.                                                                                                                          |
| **Project**        | One specific client engagement, tied to one address. A project belongs to one organization and one jurisdiction. Projects can be shared with specific users through `ProjectMember`. |
| **Document scope** | Which "shelf" a document belongs to: `rulebook`, `firm_experience`, `project`, or `public_precedent`.                                                                                |
| **Trust level**    | How much a document's content should be trusted: `official` > `verified` > `unverified`.                                                                                             |
| **Chunk**          | A document split into smaller pieces, ideally at natural section breaks. Target approximately 500–1500 tokens per chunk. Each chunk is independently embedded and searchable.        |
| **Embedding**      | A vector representation of text used for similarity search through PostgreSQL + pgvector.                                                                                            |

### Document scopes

The four document scopes have deliberately different meanings.

#### `rulebook`

Official county law and regulations.

* Shared across all projects in the jurisdiction.
* Platform-wide official knowledge.
* Usually has `organizationId = null`.
* Highest authority.

#### `firm_experience`

An organization's accumulated project history and practical experience.

* Private to the organization.
* Jurisdiction-wide.
* Not tied to one specific project.
* Visible to users within the organization.
* **Not the same as `rulebook`.**

#### `project`

Documents specific to one client engagement.

* Tied to a specific project.
* Access controlled through project membership.
* Examples include client submissions, project-specific correspondence, plans, and reviewer letters.

#### `public_precedent`

Documents obtained from publicly available city/county records.

Examples include:

* Other firms' past projects.
* Permit applications.
* Approved plans.
* Publicly available project records.

These are publicly available but have **not necessarily been independently verified by the consulting firm**.

### Critical distinction

Never treat `firm_experience` and `rulebook` as interchangeable.

Both can be jurisdiction-wide, but:

* `rulebook` = official law.
* `firm_experience` = private organizational knowledge.

Retrieval must preserve this distinction.

---

# 5. Trust levels

Documents have one of three trust levels:

```text
official > verified > unverified
```

### `official`

Real law or official regulatory material.

Highest authority.

### `verified`

Information uploaded by the consultant and checked/confirmed by a human.

### `unverified`

Uploaded information that has not yet been checked.

### Trust weighting during answer generation

When synthesizing answers:

1. **`rulebook`**

   * Most authoritative.
   * Represents official law/regulations.

2. **`firm_experience`**

   * High-trust practical knowledge.
   * Represents the organization's accumulated experience.

3. **`project`**

   * Ground truth for facts specific to the current engagement.

4. **`public_precedent`**

   * Informative but unverified.
   * Findings based on it should be explicitly described as:

     > based on public records, not independently verified

The system should never silently present public precedent as confirmed project-specific truth.

---

# 6. Tech stack

Do not introduce alternative technologies without discussion.

| Layer             | Technology                                               |
| ----------------- | -------------------------------------------------------- |
| Frontend          | Next.js + React + Tailwind CSS                           |
| Backend/API       | NestJS + Node.js + TypeScript                            |
| ORM               | Prisma                                                   |
| Database          | PostgreSQL + `pgvector` extension                        |
| File storage      | Cloudflare R2, using its S3-compatible API               |
| Background jobs   | Redis + BullMQ                                           |
| Authentication    | Native Auth using Passport.js, `@nestjs/jwt`, and bcrypt |
| Embeddings        | OpenAI `text-embedding-3-small` via plain HTTP calls     |
| Answer generation | Claude API via Anthropic Node SDK                        |
| Hosting           | Railway                                                  |

### Architectural constraints

Everything runs on **Node.js/TypeScript** end to end.

Do not introduce:

* Python.
* A second programming language.
* A separate vector database.
* An alternative ORM.
* An alternative background-job system.
* An alternative authentication system.

PostgreSQL + pgvector is the vector database.

---

# 7. Database schema

The following schema is the source of truth and must remain synchronized with `schema.prisma`.

```prisma
model Organization {
  id        String     @id @default(uuid())
  name      String
  users     User[]
  documents Document[]
  projects  Project[]
  createdAt DateTime   @default(now())
}

model User {
  id                 String          @id @default(uuid())
  organization       Organization    @relation(fields: [organizationId], references: [id])
  organizationId     String
  email              String          @unique
  password           String          // Hashed with bcrypt (min 10-12 rounds)
  fullName           String?
  role               String          @default("consultant") // 'consultant' | 'admin'
  documentsUploaded  Document[]      @relation("UploadedBy")
  projectsCreated    Project[]       @relation("CreatedBy")
  projectMemberships ProjectMember[]
  chatSessions       ChatSession[]
  createdAt          DateTime        @default(now())
}

// Jurisdiction = which county's rules apply
model Jurisdiction {
  id           String          @id @default(uuid())
  name         String          // "Kitsap County"
  state        String          // "WA"
  slug         String          @unique // "kitsap-county-wa"
  documents    Document[]
  chunks       DocumentChunk[]
  projects     Project[]
  chatSessions ChatSession[]
}

model Project {
  id             String          @id @default(uuid())
  organization   Organization    @relation(fields: [organizationId], references: [id])
  organizationId String
  jurisdiction   Jurisdiction    @relation(fields: [jurisdictionId], references: [id])
  jurisdictionId String
  createdBy      User            @relation("CreatedBy", fields: [createdById], references: [id])
  createdById    String
  name           String          // "14782 NW Newberry Hill Rd — Short Plat"
  address        String?
  projectType    String?         // 'short_plat' | 'adu' | 'new_sfr' | 'commercial' | etc.
  status         String          @default("active") // 'active' | 'archived'
  members        ProjectMember[]
  documents      Document[]
  chatSessions   ChatSession[]
  createdAt      DateTime        @default(now())
}

model ProjectMember {
  id        String   @id @default(uuid())
  project   Project  @relation(fields: [projectId], references: [id])
  projectId String
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  addedAt   DateTime @default(now())

  @@unique([projectId, userId])
}

model Document {
  id               String        @id @default(uuid())
  scope            String        // 'rulebook' | 'firm_experience' | 'project' | 'public_precedent'
  organization     Organization? @relation(fields: [organizationId], references: [id])
  organizationId   String?       // null for platform-wide official rulebook docs and public_precedent docs
  jurisdiction     Jurisdiction  @relation(fields: [jurisdictionId], references: [id])
  jurisdictionId   String
  project          Project?      @relation(fields: [projectId], references: [id])
  projectId        String?       // set only when scope = 'project'
  uploadedBy       User          @relation("UploadedBy", fields: [uploadedById], references: [id])
  uploadedById     String
  fileName         String
  storagePath      String
  docType          String        // 'official_code' | 'reviewer_letter' | 'internal_note' | 'client_submission' | etc.
  trustLevel       String        @default("unverified") // 'official' | 'verified' | 'unverified'
  sharedWithAll    Boolean       @default(false)
  processingStatus String        @default("pending") // 'pending' | 'processing' | 'ready' | 'failed'
  chunks           DocumentChunk[]
  createdAt        DateTime      @default(now())
}

model DocumentChunk {
  id                 String       @id @default(uuid())
  document           Document     @relation(fields: [documentId], references: [id])
  documentId         String
  jurisdiction       Jurisdiction @relation(fields: [jurisdictionId], references: [id])
  jurisdictionId     String       // denormalized for fast filtering without a join
  sectionTitle       String?
  content            String
  // embedding vector(1536) — added via raw SQL migration, NOT natively typed by Prisma
  consultantNote     String?
  isFlaggedImportant Boolean      @default(false)
  chunkOrder         Int
  createdAt          DateTime     @default(now())
}

model ChatSession {
  id             String          @id @default(uuid())
  user           User            @relation(fields: [userId], references: [id])
  userId         String
  jurisdiction   Jurisdiction    @relation(fields: [jurisdictionId], references: [id])
  jurisdictionId String
  project        Project?        @relation(fields: [projectId], references: [id])
  projectId      String?         // null = general chat scoped to the whole jurisdiction, not one project
  title          String?
  messages       ChatMessage[]
  createdAt      DateTime        @default(now())
}

model ChatMessage {
  id            String      @id @default(uuid())
  session       ChatSession @relation(fields: [sessionId], references: [id])
  sessionId     String
  role          String      // 'user' | 'assistant'
  content       String
  citedChunkIds String[]
  createdAt     DateTime    @default(now())
}
```

---

# 8. pgvector setup

Prisma does not natively type the vector column.

After the first:

```bash
prisma migrate dev
```

run the following manually:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "DocumentChunk"
ADD COLUMN embedding vector(1536);

CREATE INDEX ON "DocumentChunk"
USING ivfflat (embedding vector_cosine_ops);
```

### Important

The `embedding` column is **not managed directly by Prisma**.

All reads/writes involving `embedding` must use:

* `$executeRaw`
* `$queryRaw`

Do not attempt to represent the vector column as a normal Prisma field.

---

# 9. Retrieval logic

This is one of the most important architectural rules in the application.

Any query against `DocumentChunk` used to answer a chat question must apply the following **four-way scope filter**.

```text
(scope = 'rulebook' AND jurisdictionId = :jurisdictionId)
OR
(scope = 'firm_experience' AND organizationId = :organizationId AND jurisdictionId = :jurisdictionId)
OR
(scope = 'project' AND projectId = :projectId)
OR
(scope = 'public_precedent' AND jurisdictionId = :jurisdictionId)
```

### If there is no project

If:

```text
ChatSession.projectId = null
```

then the `project` clause must be omitted.

The query becomes:

```text
(scope = 'rulebook' AND jurisdictionId = :jurisdictionId)
OR
(scope = 'firm_experience' AND organizationId = :organizationId AND jurisdictionId = :jurisdictionId)
OR
(scope = 'public_precedent' AND jurisdictionId = :jurisdictionId)
```

### Required behavior

`rulebook` and `public_precedent` always apply whenever a jurisdiction is in scope.

`firm_experience` always applies to the current organization whenever a jurisdiction is in scope.

`project` only applies when a specific project is selected.

### Never simplify this into a single flat filter

Do not replace the four-way logic with something like:

```text
jurisdictionId = :jurisdictionId
```

or:

```text
organizationId = :organizationId
```

That would violate the data-isolation and domain rules.

---

# 10. Retrieval trust behavior

Retrieval is not merely a vector similarity operation.

The retrieved chunks must retain their:

* document scope,
* trust level,
* jurisdiction,
* organization,
* project relationship,
* document identity,
* chunk identity.

The answer-generation layer must use these attributes when deciding how to phrase the answer.

### Authority hierarchy

The system should generally reason about sources in this order:

```text
rulebook
    ↓
firm_experience
    ↓
project
    ↓
public_precedent
```

However, project documents are authoritative for **facts about the specific engagement**, while `rulebook` is authoritative for **legal/regulatory requirements**.

Do not flatten these concepts into a single "confidence score."

### Public precedent wording

When an answer depends on `public_precedent`, clearly indicate that the information comes from public records and has not been independently verified.

---

# 11. Multi-tenancy and security rules

These rules are **non-negotiable**.

---

## 11.1 Authentication

Authentication is local/JWT-based.

Passwords must:

* Be hashed using bcrypt.
* Use a minimum of 10 salt rounds.
* Never be stored in plaintext.
* Never be logged.
* Never be returned through an API response.

Use:

```text
Passport.js
@nestjs/jwt
bcrypt
```

for the authentication implementation.

---

## 11.2 Organization isolation

Every query involving organization-owned data must be scoped by:

```text
organizationId
```

Never return data from another organization.

Exceptions are explicitly limited to:

1. Documents where:

   ```text
   sharedWithAll = true
   ```
2. Platform-wide `rulebook` documents where:

   ```text
   organizationId = null
   ```

Do not assume that because two users belong to the same jurisdiction they can see one another's organization data.

---

## 11.3 Project access

Being a member of an organization does **not** automatically grant access to every project in that organization.

Project-level access requires a corresponding:

```text
ProjectMember
```

row.

A user can access a project only if they:

* created it, or
* were explicitly added as a `ProjectMember`.

Project access must be checked before returning:

* project details,
* project documents,
* project chat sessions,
* project chat messages,
* project-scoped chunks.

---

## 11.4 Shared general knowledge

`rulebook` and `firm_experience` documents are not gated by individual project membership.

Any user who belongs to the organization can access:

* organization-appropriate `firm_experience`,
* jurisdiction-appropriate `rulebook`.

This happens immediately once they belong to the organization, subject to the normal organization/jurisdiction rules.

Only `project`-scoped documents require `ProjectMember` access.

---

## 11.5 Invitations

New consultants are **invited**, never self-enrolled into an existing organization.

Do not build an open signup flow where a user can:

1. enter a company name,
2. find an organization,
3. join that organization.

Instead:

1. An existing admin sends an invitation.
2. The system creates a secure registration token.
3. The invitation is sent by email.
4. The invited consultant uses the token to complete registration.
5. They set their password.
6. Their new account is associated with the intended organization.

---

## 11.6 Roles

New users default to:

```text
role = "consultant"
```

Possible roles:

```text
consultant
admin
```

Only an existing admin can:

* grant admin rights,
* send consultant invitations.

Do not allow consultants to elevate themselves.

---

# 12. Build order

Do not skip ahead.

Each step must be fully working before beginning the next step.

---

## Step 1 — Scaffold NestJS

Build:

* NestJS application.
* PostgreSQL connection.
* Prisma integration.
* Base application bootstrap.
* Health-check endpoint.

---

## Step 2 — Authentication

Build the `auth` module.

Required functionality:

* Login using email/password.
* Password validation.
* bcrypt password hashing.
* JWT issuance.
* Passport JWT strategy.
* `JwtAuthGuard`.
* Authentication decorators.
* Role guard.

---

## Step 3 — Organizations and users

Build:

* `organizations` module.
* `users` module.
* Organization creation.
* User management.
* Invitation system.
* Admin/consultant roles.

---

## Step 4 — Jurisdictions

Build the `jurisdictions` module.

Seed exactly one initial jurisdiction:

```text
Kitsap County
WA
kitsap-county-wa
```

---

## Step 5 — Projects

Build:

* Project creation.
* Project listing.
* Project updates.
* Project sharing.
* Project membership management.
* Project access control.

Projects must belong to:

* one organization,
* one jurisdiction.

---

## Step 6 — Documents

Build the `documents` module.

Support all four document scopes:

```text
rulebook
firm_experience
project
public_precedent
```

The upload flow should:

1. Authenticate the user.
2. Validate organization/jurisdiction/project access.
3. Upload the file to Cloudflare R2.
4. Create the `Document` database record.
5. Set:

   ```text
   processingStatus = "pending"
   ```
6. Queue ingestion.

At this stage, the document does not need to be searchable until ingestion completes.

---

## Step 7 — Ingestion pipeline

Build the BullMQ ingestion pipeline.

Required flow:

```text
pending
   ↓
processing
   ↓
text extraction
   ↓
section-aware chunking
   ↓
embedding generation
   ↓
DocumentChunk insertion
   ↓
ready
```

On failure:

```text
failed
```

The pipeline should:

1. Retrieve the file from R2.
2. Extract text.
3. Split it into meaningful sections/chunks.
4. Target approximately 500–1500 tokens per chunk.
5. Generate embeddings using:

   ```text
   text-embedding-3-small
   ```
6. Store embeddings in pgvector.
7. Create `DocumentChunk` records.
8. Mark the document as ready.

---

## Step 8 — Chat

Build the `chat` module.

The chat flow must be:

```text
User message
    ↓
Validate session access
    ↓
Determine organization/jurisdiction/project scope
    ↓
Generate query embedding
    ↓
Run four-way retrieval filter
    ↓
Retrieve relevant chunks
    ↓
Apply source/trust context
    ↓
Call Claude
    ↓
Generate grounded answer
    ↓
Save ChatMessage
    ↓
Return answer + citations
```

The answer must be grounded in the retrieved documents.

The system should not invent unsupported regulatory requirements.

---

# 13. Complete folder structure

The repository should follow this structure.

Do not create files for later steps before the current build step is working.

```text
landplanr/
│
├── .env                          # actual secrets (gitignored)
├── .env.example
├── .gitignore
├── README.md
├── CLAUDE.md
├── PROGRESS.md
├── DECISIONS.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── .eslintrc.js
├── .prettierrc
│
├── prisma/
│   ├── schema.prisma             # full schema
│   ├── migrations/
│   │   └── (auto-generated per `prisma migrate dev`)
│   └── seed.ts                   # seeds Kitsap County jurisdiction row
│
├── src/
│   ├── main.ts                   # app bootstrap, Swagger setup
│   ├── app.module.ts             # root module, imports every feature module below
│   ├── app.controller.ts         # health check endpoint
│   ├── app.service.ts
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts    # POST /auth/login, POST /auth/register-invite
│   │   ├── auth.service.ts       # validates user passwords & signs JWTs
│   │   ├── jwt.strategy.ts       # Passport JWT strategy
│   │   ├── jwt-auth.guard.ts     # default guard protecting private routes
│   │   ├── roles.guard.ts        # checks 'admin' vs 'consultant'
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── accept-invite.dto.ts
│   │
│   ├── organizations/
│   │   ├── organizations.module.ts
│   │   ├── organizations.controller.ts
│   │   ├── organizations.service.ts
│   │   └── dto/
│   │       ├── create-organization.dto.ts
│   │       └── update-organization.dto.ts
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── invites.service.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       ├── invite-user.dto.ts
│   │       └── update-user-role.dto.ts
│   │
│   ├── jurisdictions/
│   │   ├── jurisdictions.module.ts
│   │   ├── jurisdictions.controller.ts
│   │   ├── jurisdictions.service.ts
│   │   └── dto/
│   │       └── create-jurisdiction.dto.ts
│   │
│   ├── projects/
│   │   ├── projects.module.ts
│   │   ├── projects.controller.ts
│   │   ├── projects.service.ts
│   │   ├── project-members.service.ts
│   │   └── dto/
│   │       ├── create-project.dto.ts
│   │       ├── update-project.dto.ts
│   │       └── add-project-member.dto.ts
│   │
│   ├── documents/
│   │   ├── documents.module.ts
│   │   ├── documents.controller.ts
│   │   ├── documents.service.ts
│   │   ├── storage.service.ts
│   │   └── dto/
│   │       ├── upload-document.dto.ts
│   │       └── update-document-trust.dto.ts
│   │
│   ├── ingestion/
│   │   ├── ingestion.module.ts
│   │   ├── ingestion.processor.ts
│   │   ├── ingestion.queue.ts
│   │   ├── chunking.service.ts
│   │   ├── embedding.service.ts
│   │   └── pdf-parser.service.ts
│   │
│   ├── chunks/
│   │   ├── chunks.module.ts
│   │   ├── chunks.controller.ts
│   │   ├── chunks.service.ts
│   │   └── vector-search.service.ts
│   │
│   ├── chat/
│   │   ├── chat.module.ts
│   │   ├── chat.controller.ts
│   │   ├── chat.service.ts
│   │   ├── claude.service.ts
│   │   ├── retrieval.service.ts
│   │   └── dto/
│   │       ├── create-chat-session.dto.ts
│   │       └── send-message.dto.ts
│   │
│   ├── common/
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   ├── guards/
│   │   │   └── org-scope.guard.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── types/
│   │       └── document-scope.enum.ts
│   │
│   └── prisma/
│       ├── prisma.module.ts
│       └── prisma.service.ts
│
├── test/
│   ├── app.e2e-spec.ts
│   ├── jest-e2e.json
│   └── (module-specific e2e tests as they're built)
│
└── scripts/
    └── seed-kitsap.ts
```

---

# 14. Module-specific architectural requirements

## 14.1 `auth`

The auth module owns:

* Login.
* Password validation.
* JWT issuance.
* JWT validation.
* Invite acceptance.
* Authentication guards.
* Role guards.

JWT payloads should contain enough information to establish the authenticated user identity and organization context, but never sensitive information such as passwords.

---

## 14.2 `organizations`

The organization module owns:

* Organization creation.
* Organization-level settings.
* Organization membership relationships.

All organization operations must enforce authenticated access.

---

## 14.3 `users`

The users module owns:

* User records.
* User management.
* Invitations.
* Role updates.

Consultants must not be able to grant themselves admin access.

---

## 14.4 `jurisdictions`

The jurisdiction module represents the geographic regulatory boundary.

A document belongs to exactly one jurisdiction.

A project belongs to exactly one jurisdiction.

A chat session belongs to exactly one jurisdiction.

Do not allow regulatory information to silently cross jurisdiction boundaries.

### Creating jurisdictions

`POST /jurisdictions` (admin-only, `@Roles('admin')` — same pattern as the other admin-gated routes) creates a new jurisdiction record: `name`, `state`, `slug`. This is a deliberate, narrow expansion beyond Phase 1's original single-jurisdiction MVP (§3) — approved explicitly, not assumed.

A newly created jurisdiction starts with zero documents and is not useful until a consultant uploads content to it — the same manual-upload model as Kitsap County. Creating the row does **not** stand up:

* a second county's actual rulebook/content,
* cross-jurisdiction search (§9's per-jurisdiction scoping is unchanged),
* any per-jurisdiction onboarding flow,
* jurisdiction-specific terminology or prompt handling.

`GET /jurisdictions` lists every jurisdiction (not just Kitsap) and includes a `documentCount` per jurisdiction, so it's visually obvious which jurisdictions are empty.

---

## 14.5 `projects`

The projects module owns:

* Project creation.
* Project updates.
* Project listing.
* Project membership.
* Project access checks.

Project membership is explicit.

Do not infer project access merely from organization membership.

---

## 14.6 `documents`

The documents module owns:

* Upload metadata.
* R2 storage.
* Scope validation.
* Trust-level updates.
* Processing state.

All four scopes must be supported:

```text
rulebook
firm_experience
project
public_precedent
```

The module must validate that the metadata is internally consistent.

For example:

### `project` document

Must have:

```text
projectId != null
```

and the project must belong to the expected organization and jurisdiction.

### `rulebook`

Should represent platform-wide official jurisdiction knowledge.

### `firm_experience`

Must be associated with an organization.

### `public_precedent`

Represents public jurisdiction-level knowledge and should not be incorrectly treated as private firm experience.

---

# 15. Ingestion architecture

The ingestion system uses:

```text
Redis
+
BullMQ
```

Documents begin in:

```text
processingStatus = "pending"
```

A queue worker processes them asynchronously.

### Required ingestion stages

```text
R2 file
   ↓
PDF/text extraction
   ↓
section detection
   ↓
chunk generation
   ↓
embedding generation
   ↓
pgvector insertion
   ↓
DocumentChunk metadata insertion
   ↓
processingStatus = "ready"
```

### Failure handling

If any stage fails:

```text
processingStatus = "failed"
```

The implementation should preserve enough error information in logs to diagnose the failure without exposing secrets or sensitive document content unnecessarily.

---

# 16. Chunking requirements

Chunks should be created at natural semantic boundaries whenever possible.

Target:

```text
500–1500 tokens
```

Avoid blindly splitting every N characters.

Prefer boundaries such as:

* headings,
* sections,
* subsections,
* paragraphs,
* regulatory provisions.

Each chunk should preserve:

* document ID,
* jurisdiction ID,
* section title when available,
* chunk order,
* content,
* embedding,
* consultant note when present,
* important flag when present.

---

# 17. Embedding requirements

Use:

```text
OpenAI text-embedding-3-small
```

Embedding dimensionality:

```text
1536
```

The embedding API should be called using plain HTTP.

Do not introduce a separate embedding framework or vector database.

The generated vector is stored in:

```text
DocumentChunk.embedding
```

through raw SQL because Prisma cannot natively type the pgvector column.

---

# 18. Vector search requirements

Vector search belongs in:

```text
src/chunks/vector-search.service.ts
```

or the retrieval layer through that service.

The search must combine:

1. Vector similarity.
2. Jurisdiction filtering.
3. Organization filtering where appropriate.
4. Project filtering where appropriate.
5. Document scope filtering.

The vector similarity query must never search all chunks globally and filter access afterward.

**Security filtering must happen as part of retrieval.**

Do not retrieve unauthorized chunks and rely on application code to hide them later.

---

# 19. Chat architecture

Chat is deliberately separated into multiple responsibilities.

### `chat.service.ts`

Orchestrates the complete request:

```text
receive message
→ validate session
→ retrieve chunks
→ call Claude
→ save assistant response
```

### `retrieval.service.ts`

Owns the four-way retrieval logic.

This is deliberately isolated because the scope logic is complex and must be independently testable.

### `claude.service.ts`

Wraps the Anthropic SDK.

It should be responsible for communicating with Claude rather than embedding Anthropic-specific code throughout the chat service.

---

# 20. Chat session scope

A `ChatSession` belongs to:

* one user,
* one jurisdiction,
* optionally one project.

### General jurisdiction chat

If:

```text
projectId = null
```

the chat is scoped to the entire jurisdiction for that user's organization.

Retrieval includes:

* `rulebook`,
* organization-specific `firm_experience`,
* `public_precedent`.

It does **not** include arbitrary project documents.

### Project chat

If:

```text
projectId != null
```

the chat includes:

* `rulebook` for the jurisdiction,
* organization-specific `firm_experience` for the jurisdiction,
* project documents for the selected project,
* `public_precedent` for the jurisdiction.

Project access still requires `ProjectMember` authorization.

---

# 21. Citation requirements

Answers generated by Claude must retain references to the source chunks used to construct the answer.

Every assistant `ChatMessage` must populate:

```text
citedChunkIds
```

with the IDs of the chunks used as citations.

The frontend can later use these IDs to display:

* source document,
* section,
* relevant text,
* trust level,
* scope.

Do not generate fake citations.

Every citation must correspond to a real retrieved `DocumentChunk`.

---

# 22. Grounding requirements

The AI must answer based on retrieved documents.

If the uploaded knowledge does not contain enough information to confidently answer a question, the system should say so rather than fabricate a requirement.

The model should distinguish between:

* official rules,
* organizational experience,
* project-specific facts,
* public precedent.

It should not present a consultant's historical experience as law.

It should not present public precedent as verified current requirements.

---

# 23. Organization scope guard

The repository includes:

```text
src/common/guards/org-scope.guard.ts
```

This guard is intended to enforce organization scoping broadly.

Use it as a central security mechanism rather than duplicating identical organization checks throughout every controller.

However, controllers and services must still enforce domain-specific authorization where necessary, especially:

* project membership,
* admin-only operations,
* jurisdiction constraints.

A guard must not be treated as a substitute for all authorization logic.

---

# 24. API conventions

Private routes should be protected by the JWT authentication mechanism.

Expected authentication endpoints include:

```text
POST /auth/login
POST /auth/register-invite
```

Expected project/chat endpoints include patterns such as:

```text
POST /chat/sessions
POST /chat/sessions/:id/messages
```

The exact endpoint surface can evolve during implementation, but it must respect the architectural boundaries defined in this document.

---

# 25. Validation

Use NestJS validation consistently.

DTOs should validate:

* required fields,
* string lengths,
* enums,
* UUIDs,
* email addresses,
* scope values,
* project/jurisdiction relationships where appropriate.

Do not trust client-provided:

```text
organizationId
```

as an authorization mechanism.

The authenticated user context must determine the organization they belong to.

Likewise, a submitted `projectId` must be verified against actual project membership and organization/jurisdiction relationships.

---

# 26. Error handling

Use:

```text
src/common/filters/http-exception.filter.ts
```

for consistent HTTP error behavior.

Do not expose:

* passwords,
* JWT secrets,
* database credentials,
* R2 credentials,
* OpenAI credentials,
* Anthropic credentials,
* Redis credentials,
* internal stack traces in production responses.

Errors should be useful to developers through server-side logs while remaining safe for clients.

---

# 27. Logging

Use:

```text
src/common/interceptors/logging.interceptor.ts
```

for request-level logging.

Never log:

* passwords,
* password hashes,
* JWT secrets,
* API keys,
* authentication tokens,
* sensitive document contents.

Be careful with uploaded file metadata and user information.

---

# 28. Environment variables

Actual secrets belong in:

```text
.env
```

and `.env` must be gitignored.

Provide non-secret examples in:

```text
.env.example
```

Expected configuration categories include:

```text
DATABASE_URL
JWT_SECRET
R2 credentials/configuration
REDIS configuration
OPENAI configuration
ANTHROPIC configuration
```

Do not commit real credentials.

Do not hardcode secrets into TypeScript files.

---

# 29. Seed data

The initial jurisdiction is:

```text
name: Kitsap County
state: WA
slug: kitsap-county-wa
```

There should be one seed path for this jurisdiction.

Relevant files:

```text
prisma/seed.ts
scripts/seed-kitsap.ts
```

Do not seed additional jurisdictions via `prisma/seed.ts`/`scripts/seed-kitsap.ts` during Phase 1 unless explicitly instructed — this is about the seed scripts specifically. An admin creating a jurisdiction record through the app itself (`POST /jurisdictions`, §14.4) is a separate, already-approved capability; it just shouldn't be duplicated into the seed path.

---

# 30. Testing requirements

Testing should prioritize security-sensitive and architecture-sensitive behavior.

At minimum, tests should cover:

### Authentication

* Valid login.
* Invalid password.
* Unknown user.
* Password hashing.
* JWT authentication.
* Protected routes.

### Organization isolation

* User cannot access another organization's data.
* Organization-owned documents cannot leak across tenants.
* Organization-specific `firm_experience` does not leak.

### Project access

* Project creator can access their project.
* Explicit project member can access the project.
* Non-member from the same organization cannot access it.
* User from another organization cannot access it.

### Document scopes

* Valid scope accepted.
* Invalid scope rejected.
* Project documents require a valid project.
* Project must belong to the correct organization/jurisdiction.
* `firm_experience` is organization-specific.
* `rulebook` is jurisdiction-wide.
* `public_precedent` is jurisdiction-wide.

### Retrieval

Test all four branches:

```text
rulebook
firm_experience
project
public_precedent
```

Also test the no-project case.

### Retrieval isolation

Verify that:

* another organization's `firm_experience` is excluded,
* another project's documents are excluded,
* another jurisdiction's documents are excluded,
* unauthorized project chunks are never returned.

### Chat

* Session authorization.
* Correct retrieval scope.
* Citation persistence.
* Assistant response persistence.
* No-project jurisdiction chat behavior.
* Project chat behavior.

---

# 31. Important implementation principles

## Principle 1 — Security before convenience

Never make authorization dependent on frontend behavior.

Every sensitive operation must be authorized server-side.

---

## Principle 2 — Organization boundaries are mandatory

Every organization-owned query must be scoped by the authenticated user's organization.

Do not trust IDs supplied by the client.

---

## Principle 3 — Project membership is explicit

Organization membership is not project membership.

Always verify `ProjectMember` for project-level access.

---

## Principle 4 — Jurisdiction boundaries matter

Rules do not automatically transfer between counties.

Every document and chunk belongs to exactly one jurisdiction.

Retrieval must enforce this.

---

## Principle 5 — Scope is not trust

Do not confuse:

```text
rulebook
firm_experience
project
public_precedent
```

with:

```text
official
verified
unverified
```

They represent different concepts.

A document can have both:

```text
scope
trustLevel
```

and both properties matter.

---

## Principle 6 — Public precedent is not verified knowledge

Public records can be useful without being independently verified.

Do not silently promote public precedent to official or verified status.

---

## Principle 7 — Retrieval must enforce access

Do not:

```text
retrieve everything
→ filter unauthorized chunks afterward
```

Instead:

```text
apply authorization-aware filters
→ perform vector search
→ return only authorized candidates
```

---

## Principle 8 — Do not overbuild Phase 1

The following are not current priorities:

* Client UI.
* Marketplace.
* Billing complexity.
* Cross-jurisdiction search, per-jurisdiction onboarding, jurisdiction-specific terminology (§3) — admin jurisdiction *creation* itself is now allowed, see §14.4.
* Automated public-record scraping.
* Automated document promotion.
* Cross-project search.
* Magic-link workflows.

Keep Phase 1 narrow and functional.

---

# 32. Open decisions

These decisions are intentionally unresolved.

**Flag them to the human. Do not assume an answer.**

---

## 32.1 Public precedent source

Which public city/county sources should `public_precedent` documents actually come from?

Also determine whether ingestion is:

### Manual

A consultant downloads and uploads documents just like any other document.

### Automated

A scraper or API retrieves public records directly.

**Current safe assumption: manual ingestion.**

Do not build automated scraping/API ingestion without explicit approval.

---

## 32.2 Firm experience lifecycle

Is `firm_experience`:

* actively curated by consultants, or
* automatically populated by the system as projects close?

**Do not assume automatic population.**

Manual curation is the safer assumption until explicitly decided.

---

## 32.3 `sharedWithAll` behavior

Should:

```text
sharedWithAll
```

default to:

* visible platform-wide, or
* opt-in per upload?

Do not make a product decision without confirmation.

---

## 32.4 Invited consultant access

Should invited consultants see:

```text
rulebook
+
firm_experience
```

immediately after joining the organization?

**Current assumption: yes.**

This means joining an organization grants access to its shared general knowledge, subject to the normal organization and jurisdiction rules.

---

## 32.5 Future client magic links

For a future client-facing phase:

Should magic links:

* expire, or
* remain valid indefinitely once a session is completed?

This is deferred and should not be implemented in Phase 1.

---

# 33. Architecture decision: monorepo timing

Phase 1 remains a **single NestJS application** for the backend.

Do not convert the repository into a Turborepo during the Phase 1 backend build.

Once Next.js frontend work begins, the intended structure is:

```text
apps/
├── api/
└── web/

packages/
├── database/
└── shared-types/
```

This should be done only when frontend work begins, according to the existing architecture decision.

---

# 34. Phase 1 success criteria

Phase 1 is complete when the following end-to-end scenario works:

```text
Consultant
    ↓
Logs in with email/password
    ↓
Receives valid JWT
    ↓
Accesses their organization
    ↓
Accesses Kitsap County
    ↓
Creates/selects a project
    ↓
Uploads knowledge documents
    ↓
Documents are stored in R2
    ↓
Documents enter "pending"
    ↓
BullMQ processes documents
    ↓
Text is extracted
    ↓
Text is chunked
    ↓
Embeddings are generated
    ↓
DocumentChunks are stored
    ↓
pgvector becomes searchable
    ↓
Document becomes "ready"
    ↓
Consultant opens chat
    ↓
Consultant asks a question
    ↓
Retrieval applies the four-way scope filter
    ↓
Relevant authorized chunks are retrieved
    ↓
Claude receives grounded context
    ↓
Claude generates an answer
    ↓
Answer includes valid citations
    ↓
ChatMessage is persisted
```

The complete system must preserve:

* organization isolation,
* project membership authorization,
* jurisdiction boundaries,
* document scope distinctions,
* trust levels,
* source citations,
* grounded generation.

---

# 35. Final rules for Claude / Claude Code

Before making architectural changes, adding database tables, or implementing new functionality, check this file first.

### Always

* Follow the Phase 1 scope.
* Use the exact domain vocabulary.
* Preserve organization isolation.
* Enforce project membership.
* Preserve jurisdiction boundaries.
* Keep the four document scopes distinct.
* Keep scope and trust level conceptually separate.
* Use PostgreSQL + pgvector.
* Use Prisma for normal database operations.
* Use raw SQL for the vector column.
* Use Redis + BullMQ for ingestion.
* Use Cloudflare R2 for file storage.
* Use OpenAI `text-embedding-3-small` for embeddings.
* Use Claude for answer generation.
* Use native JWT authentication.
* Hash passwords with bcrypt.
* Keep the backend in NestJS/TypeScript.
* Write tests for security-sensitive behavior.
* Keep retrieval logic isolated and testable.
* Cite retrieved chunks in assistant messages.

### Never

* Add a second programming language.
* Add a second vector database.
* Introduce an alternative authentication architecture without discussion.
* Search across organizations.
* Give project access solely because a user belongs to the organization.
* Search across projects in a general jurisdiction chat.
* Treat `firm_experience` as `rulebook`.
* Treat `public_precedent` as verified law.
* Retrieve unauthorized chunks and filter them only after retrieval.
* Store plaintext passwords.
* Log passwords or secrets.
* Introduce deferred Phase 2 functionality without explicit instruction.
* Build cross-jurisdiction search, per-jurisdiction onboarding workflows, or jurisdiction-specific terminology handling during Phase 1 (§3) — creating jurisdiction records itself is allowed (§14.4), populating them with real content/workflows is not.
* Build automated public-record scraping without an explicit decision.
* Build client-facing magic links during Phase 1.
* Build marketplace, billing tiers, or consultant-client matching during Phase 1.

---

# 36. Source-of-truth hierarchy

When making implementation decisions, use this priority order:

1. **This `CLAUDE.md`**
2. **`schema.prisma`**
3. **`PROGRESS.md`**
4. **`DECISIONS.md`**
5. Existing working code
6. New implementation preferences

If existing code conflicts with the architectural rules in this document, flag the conflict rather than silently changing the architecture.

If an open decision is encountered, flag it to the human instead of inventing a product decision.

---

# 37. The central product principle

Landplanr is not a generic chatbot.

It is a **jurisdiction-aware, organization-isolated knowledge system for land-development permitting**, where answers must be grounded in the consultant's uploaded knowledge and clearly distinguish:

```text
official law
        ↓
organizational experience
        ↓
project-specific facts
        ↓
public precedent
```

The core promise of Phase 1 is:

> A consultant can upload what they know and reliably have a conversation with that knowledge, with answers grounded in the actual source material.

Every architectural and implementation decision should protect that promise.
