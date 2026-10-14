# ER Diagram

Paste the block below into https://mermaid.live (or draw.io / dbdiagram.io) and use the
**Share / Copy link** option to get the shareable link required by the submission form.

```mermaid
erDiagram
    RESOURCE_CATEGORIES ||--o{ RESOURCES : "classifies"
    RESOURCES ||--o{ RESERVATIONS : "is booked in"
    USERS ||--o{ RESERVATIONS : "makes"

    RESOURCE_CATEGORIES {
        int id PK
        varchar name UK
    }
    RESOURCES {
        int id PK
        int category_id FK
        varchar name UK
        text description
        varchar location
        int capacity
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }
    USERS {
        int id PK
        varchar name
        varchar email UK
        varchar team
        timestamptz created_at
    }
    RESERVATIONS {
        int id PK
        int resource_id FK
        int user_id FK
        varchar title
        text notes
        timestamptz start_time
        timestamptz end_time
        varchar status "confirmed | cancelled"
        timestamptz created_at
        timestamptz cancelled_at
    }
```

Key constraint on `reservations`: `EXCLUDE USING gist (resource_id WITH =, tstzrange(start_time, end_time, '[)') WITH &&) WHERE (status = 'confirmed')`
— the database rejects overlapping confirmed bookings of the same resource.
