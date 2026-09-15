# ERD — Sadiconstruction (v1 free-tier)

> Logical entity-relationship diagram. Column detail and persist-vs-compute rules: [`DATA-MODEL.md`](DATA-MODEL.md). Glossary: [`CONTEXT.md`](../CONTEXT.md).

## Design stance

- **Single-organization internal app** on Supabase Free (not multi-tenant SaaS orgs).
- Persist **network inputs**; treat Computed Metrics as derived (optional cache columns allowed).
- **Adjacency list** for Schedule Node hierarchy (`parent_id`).
- Documents: **Storage object + metadata row** (never bytea in Postgres).
- CPM runs **client-side**; DB does not need to execute graph algorithms.

## Entity-relationship (Mermaid)

```mermaid
erDiagram
  STAFF_MEMBER ||--o{ ACCESS_REQUEST : reviews
  STAFF_MEMBER ||--o{ PROJECT : creates
  STAFF_MEMBER ||--o{ PROJECT_PERSONNEL : assigned
  STAFF_MEMBER ||--o{ DOCUMENT : uploads
  STAFF_MEMBER ||--o{ REPORT_MESSAGE : receives

  PROJECT ||--|| PROJECT_CALENDAR : has
  PROJECT ||--o| BOQ : has_approved
  PROJECT ||--o{ PROJECT_PERSONNEL : staffing
  PROJECT ||--o{ DOCUMENT : files
  PROJECT ||--o{ CONTRACTOR_PROJECT : engages
  PROJECT ||--o{ SCHEDULE_NODE : network
  PROJECT ||--o{ REPORT_MESSAGE : about

  BOQ ||--|{ BOQ_PHASE : sections
  BOQ_PHASE ||--o{ BOQ_LINE : items
  BOQ_PHASE ||--|| SCHEDULE_NODE : phase_root

  SCHEDULE_NODE ||--o{ SCHEDULE_NODE : parent_of
  SCHEDULE_NODE ||--o{ DEPENDENCY : as_successor
  SCHEDULE_NODE ||--o{ DEPENDENCY : as_predecessor

  CONTRACTOR ||--o{ CONTRACTOR_PROJECT : history
  CONTRACTOR ||--o{ CONTRACTOR_CERT : certs

  STAFF_MEMBER {
    uuid id PK
    text email
    text full_name
    text role
    boolean is_active
  }

  ACCESS_REQUEST {
    uuid id PK
    text email
    text full_name
    text status
  }

  PROJECT {
    uuid id PK
    text code UK
    text name
    text stage
    numeric expenditure
    date start_date
    date target_end_date
  }

  PROJECT_CALENDAR {
    uuid id PK
    uuid project_id FK
    jsonb working_week
    jsonb exceptions
  }

  BOQ {
    uuid id PK
    uuid project_id FK
    text status
    timestamptz approved_at
  }

  BOQ_PHASE {
    uuid id PK
    uuid boq_id FK
    text code
    text name
    text color_token
    int sort_order
  }

  BOQ_LINE {
    uuid id PK
    uuid phase_id FK
    text item_code
    text description
    text unit
    numeric quantity
    numeric rate
    numeric amount
  }

  SCHEDULE_NODE {
    uuid id PK
    uuid project_id FK
    uuid parent_id FK
    uuid boq_phase_id FK
    text node_kind
    text name
    numeric duration_days
    boolean is_loe
    int sort_order
  }

  DEPENDENCY {
    uuid id PK
    uuid project_id FK
    uuid predecessor_id FK
    uuid successor_id FK
    text dep_type
    numeric lag_days
  }

  DOCUMENT {
    uuid id PK
    uuid project_id FK
    text title
    text storage_path
    text content_type
    bigint byte_size
  }

  PROJECT_PERSONNEL {
    uuid id PK
    uuid project_id FK
    uuid staff_id FK
    text title
    date start_date
  }

  CONTRACTOR {
    uuid id PK
    text name
  }

  CONTRACTOR_CERT {
    uuid id PK
    uuid contractor_id FK
    text name
    date expires_on
  }

  CONTRACTOR_PROJECT {
    uuid id PK
    uuid contractor_id FK
    uuid project_id FK
    text involvement
  }

  REPORT_MESSAGE {
    uuid id PK
    uuid project_id FK
    text kind
    text subject
    text body
    boolean is_read
  }
```

## Cardinality notes

| Relationship | Rule |
|--------------|------|
| Project → Project Calendar | Exactly one in v1 |
| Project → BOQ | Zero or one **approved** BOQ for Scheduling seed (drafts optional later) |
| BOQ Phase → Phase Root | Exactly one Schedule Node with `node_kind = phase_root` |
| Schedule Node → parent | Null only for Phase Roots; children stay under same Project |
| Dependency | Directed; unique `(predecessor_id, successor_id, dep_type)` recommended |
| Nested Summary / Leaf | `boq_phase_id` inherited from Phase Root lineage (denormalized for RLS/color) |

## Out of ERD v1

- Multi-calendar per activity  
- Resource assignments / leveling  
- Baseline snapshot tables (stub in DATA-MODEL as later)  
- Multi-organization tenancy  

## Related

[`DATA-MODEL.md`](DATA-MODEL.md) · [`adr/0001-client-side-cpm-on-free-tier.md`](adr/0001-client-side-cpm-on-free-tier.md) · [`adr/0002-single-org-internal-auth.md`](adr/0002-single-org-internal-auth.md)
