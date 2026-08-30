# CLAUDE.md

This file gives Claude (and Claude Code) the full context needed to work on the Landplanr codebase correctly. Read this before making architectural decisions, adding tables, or building new features.

## 1. What this project is

Landplanr solves a trust/information gap in US land development permitting. Homeowners/developers don't know what a construction project legally requires until they pay a consultant to find out. Consultants waste hours of unpaid time explaining requirements to prospects who often disappear afterward.

**The fix**: consultants upload their knowledge (county regulations, past project experience, client documents) into Landplanr. An AI layer (RAG — retrieval-augmented generation) makes it searchable and answers questions grounded only in what was actually uploaded, with citations back to the source.

## 2. Current phase — what we are building right now

**Phase 1 scope is intentionally narrow. Do not build beyond this without explicit instruction:**

- One county only (Kitsap County, WA is the test jurisdiction)
- Consultant-facing only — **no client-facing app yet**
- Core features: consultant login, document upload (three scopes — see below), and ongoing chat with an AI grounded in uploaded documents

**Definition of done for Phase 1**: a consultant logs in, uploads their county's knowledge, and can have a real back-and-forth conversation with it, getting accurate, cited answers.

### Explicitly deferred — do not implement unless asked
- Client-facing intake flow, magic links, scope reports sent to homeowners
- Multiple jurisdictions/counties active at once
- Marketplace / consultant-client matching / commissions
- Automated document review/promotion workflow (this is done manually by a human admin for now)
- Billing tiers beyond a single flat subscription
- Cross-project search ("search across all my projects") — chat is scoped to one project or one jurisdiction, not both combined across many projects

## 3. Core domain concepts (use this exact vocabulary in code and comments)

| Term | Meaning |
|---|---|
| **Jurisdiction** | A US county (occasionally city). Rules do not transfer between jurisdictions — every document and chunk is tagged with one. |
| **Organization** | A consulting firm. The billing/tenant boundary. |
| **Project** | One specific client engagement, tied to one address, belongs to one organization and one jurisdiction. Can be shared with specific users via `ProjectMember`. |
| **Document scope** | Which "shelf" a document sits on: `rulebook` (official county law, shared across all projects in that jurisdiction), `firm_experience` (an organization's own accumulated project history in that jurisdiction, private to that org, not tied to one project), `project` (specific to one client engagement), or `public_precedent` (documents from public city/county records — other firms' past projects, permit applications, approved plans — publicly available but not personally verified by this firm). |
| **Trust level** | How much to trust a document's content: `official` (real law) > `verified` (checked and confirmed by a human) > `unverified` (uploaded, not yet checked). |
| **Chunk** | A document split into smaller pieces, ideally at natural section breaks (500–1500 tokens), each independently embedded and searchable. |
| **Embedding** | A vector representation of text used for similarity search (via pgvector). |

**Never rename or conflate these concepts.** E.g. `firm_experience` documents are NOT the same as `rulebook` documents even though both are jurisdiction-wide and not tied to a project — one is official law, the other is private organizational knowledge, and retrieval must query them as distinct groups.

## 4. Tech stack (do not introduce alternatives without discussion)

| Layer | Tool |
|---|---|
| Frontend | Next.js (React) + Tailwind CSS |
| Backend/API | NestJS (Node.js, TypeScript) |
| ORM | Prisma |
| Database | PostgreSQL with the `pgvector` extension — one database, no separate vector DB |
| File storage | Cloudflare R2 (S3-compatible API) |
| Background jobs | Redis + BullMQ |
| Auth |
| Embeddings | OpenAI `text-embedding-3-small` (plain HTTP calls) |
| Answer generation | Claude API (Anthropic Node SDK) |
| Hosting | Railway |

Everything runs on Node/TypeScript end to end. Do not introduce Python or a second language into this stack.

## 5. Database schema (source of truth — keep in sync with `schema.prisma`)

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
  password
  email              String          @unique
  fullName           String?
  role               String          @default("consultant") // 'consultant' | 'admin'
  documentsUploaded  Document[]      @relation("UploadedBy")
  projectsCreated    Project[]       @relation("CreatedBy")
  projectMemberships ProjectMember[]
  chatSessions       ChatSession[]
  createdAt          DateTime        @default(now())
}

<!-- Jurisdiction = which county's rules apply -->
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
  id             String        @id @default(uuid())
  user           User          @relation(fields: [userId], references: [id])
  userId         String
  jurisdiction   Jurisdiction  @relation(fields: [jurisdictionId], references: [id])
  jurisdictionId String
  project        Project?      @relation(fields: [projectId], references: [id])
  projectId      String?       // null = general chat scoped to the whole jurisdiction, not one project
  title          String?
  messages       ChatMessage[]
  createdAt      DateTime      @default(now())
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

**pgvector setup** (run manually after first `prisma migrate dev`, not managed by Prisma):
```sql
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE "DocumentChunk" ADD COLUMN embedding vector(1536);
CREATE INDEX ON "DocumentChunk" USING ivfflat (embedding vector_cosine_ops);
```
Writes/reads to the `embedding` column must use `$executeRaw`/`$queryRaw` — Prisma cannot type-check this column.

## 6. Retrieval logic — critical, do not simplify

Any query against `DocumentChunk` for an answer must filter by the **combination** of three conditions (not a single flat filter):

```
(scope = 'rulebook' AND jurisdictionId = :jurisdictionId)
OR
(scope = 'firm_experience' AND organizationId = :organizationId AND jurisdictionId = :jurisdictionId)
OR
(scope = 'project' AND projectId = :projectId)
OR
(scope = 'public_precedent' AND jurisdictionId = :jurisdictionId)
```

If `ChatSession.projectId` is null, drop the `project` clause (general jurisdiction-level chat, no single project in scope). `public_precedent` and `rulebook` clauses always apply whenever a jurisdiction is in scope, regardless of whether a project is selected.

**Trust weighting note:** when synthesizing an answer, `rulebook` chunks should be treated as most authoritative, `firm_experience` as high-trust practical knowledge, `public_precedent` as informative but unverified (flag findings from this scope as "based on public records, not independently verified"), and `project` chunks as ground truth for that specific engagement's facts.

## 7. Multi-tenancy / security rules — non-negotiable

- **Every query must be scoped by `organizationId`** for anything org-owned. Never return data across organizations except explicitly `sharedWithAll = true` documents or platform-wide `rulebook` documents with `organizationId = null`.
- **Project-level access requires a `ProjectMember` row.** A user belonging to an organization does NOT automatically see every project in that org — only ones they created or were explicitly added to.
- **Shared general knowledge (`rulebook`, `firm_experience`) has no per-project gate** — any user in the organization sees it immediately once they're a member of that org. Only `project`-scoped documents are locked behind `ProjectMember`.
- **New consultants are invited, never self-enrolled into an existing org.** Invites are handled (email-targeted invite links sent by an existing admin). Do not build open "enter your company name to join" signup flows.
- New users default to `role: "consultant"`. Only an existing `admin` can grant `admin` rights or send invites.

## 8. Build order (do not skip ahead — each step should be fully working before the next)

1. Scaffold NestJS app, connect Postgres via Prisma
2. `organizations` + `users` modules
3. `jurisdictions` module — seed one row: Kitsap County
4. `projects` module — create/list/share projects within an org
5. `documents` module — upload endpoint for all three scopes (rulebook / firm_experience / project), landing in R2 with `processingStatus: pending`
6. Ingestion pipeline (BullMQ) — extract text, chunk by section, generate embeddings, populate `DocumentChunk`, flip status to `ready`
7. `chat` module — retrieval across the three-way scope filter above, then Claude call with citations

## 9. Complete folder structure

This is the full repo layout. Build modules top to bottom, matching the Phase 1 build order in `PROGRESS.md` — don't create files for a later step before the current one is working.

```
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
│   ├── schema.prisma             # full schema (Organization, User, Project, Document, etc.)
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
│   │  
│   │   ├── roles.guard.ts        # checks 'admin' vs 'consultant'
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   └── auth.controller.ts    
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
│   │   ├── project-members.service.ts   # ProjectMember add/remove/list
│   │   └── dto/
│   │       ├── create-project.dto.ts
│   │       ├── update-project.dto.ts
│   │       └── add-project-member.dto.ts
│   │
│   ├── documents/
│   │   ├── documents.module.ts
│   │   ├── documents.controller.ts       # upload endpoint, handles all 4 scopes
│   │   ├── documents.service.ts
│   │   ├── storage.service.ts            # R2 upload/download wrapper
│   │   └── dto/
│   │       ├── upload-document.dto.ts
│   │       └── update-document-trust.dto.ts
│   │
│   ├── ingestion/
│   │   ├── ingestion.module.ts
│   │   ├── ingestion.processor.ts        # BullMQ worker, picks up 'pending' docs
│   │   ├── ingestion.queue.ts            # queue definition/producer
│   │   ├── chunking.service.ts           # PDF text extraction + section-based chunking
│   │   ├── embedding.service.ts          # calls OpenAI embeddings API
│   │   └── pdf-parser.service.ts
│   │
│   ├── chunks/
│   │   ├── chunks.module.ts
│   │   ├── chunks.controller.ts          # debug/inspection endpoints
│   │   ├── chunks.service.ts
│   │   └── vector-search.service.ts      # raw SQL queries against pgvector
│   │
│   ├── chat/
│   │   ├── chat.module.ts
│   │   ├── chat.controller.ts            # POST /chat/sessions, POST /chat/sessions/:id/messages
│   │   ├── chat.service.ts               # orchestrates: search chunks -> call Claude -> save message
│   │   ├── claude.service.ts             # Anthropic SDK wrapper
│   │   ├── retrieval.service.ts          # the 4-way scope filter query (see §6)
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
│   │   │   └── org-scope.guard.ts        # enforces organizationId scoping on every request (see §7)
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── types/
│   │       └── document-scope.enum.ts    # 'rulebook' | 'firm_experience' | 'project' | 'public_precedent'
│   │
│   └── prisma/
│       ├── prisma.module.ts
│       └── prisma.service.ts             # injectable PrismaClient wrapper
│
├── test/
│   ├── app.e2e-spec.ts
│   ├── jest-e2e.json
│   └── (module-specific e2e tests as they're built)
│
└── scripts/
    └── seed-kitsap.ts                    # one-off script to seed the initial jurisdiction
```

**Notes:**
- `common/guards/org-scope.guard.ts` is where the multi-tenancy rule from §7 gets enforced in code — apply it broadly rather than having every controller re-implement the check.
- `chat/retrieval.service.ts` is deliberately separate from `chat.service.ts` — the four-way scope filter (§6) is complex enough to deserve its own isolated, testable unit rather than being buried inside orchestration logic.
- Repo stays a single NestJS app for all of Phase 1. Converts to a Turborepo monorepo (`apps/api`, `apps/web`, `packages/database`, `packages/shared-types`) only once the Next.js frontend work begins — see `DECISIONS.md`.

## 10. Open decisions (flag these to the human, don't assume an answer)

- Which public city/county sources will `public_precedent` documents actually come from, and is ingestion manual (a consultant downloads and uploads them, same as any other document) or automated (a scraper/API pulls them directly)? Manual is the safe assumption until confirmed otherwise.
- Is `firm_experience` actively curated by consultants, or auto-populated by the system as projects close?
- Should `sharedWithAll` documents default to visible platform-wide, or opt-in per upload?
- Should invited consultants see `rulebook` + `firm_experience` immediately on joining (current assumption: yes), or should that also require explicit granting?
- Should client-facing magic links (future phase) expire, or remain valid indefinitely once a session is completed?