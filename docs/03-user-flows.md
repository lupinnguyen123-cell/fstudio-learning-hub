# User Flows

[← Mục lục](./README.md)

## Mục lục

- [Employee](#employee)
- [Trainer](#trainer)
- [Store Manager](#store-manager)
- [Super Admin](#super-admin)
- [Session and authorization](#session-and-authorization)
- [Tài liệu liên quan](#tài-liệu-liên-quan)

## Employee

```mermaid
flowchart LR
  A["Login"] --> B["Home"]
  B --> C["Course"]
  C --> D["Lesson"]
  D --> E{"Required lessons complete?"}
  E -- No --> D
  E -- Yes --> F["Quiz"]
  F --> G["Result"]
  G --> H{"Passed?"}
  H -- No --> I["Related lesson"]
  I --> F
  H -- Yes --> J["Certificate"]
  J --> K["Learning Journey"]
```

Exception flows: expired assignment remains visible but flagged; revoked course becomes read-only history; interrupted quiz resumes draft unless course version changed.

## Trainer

```mermaid
flowchart LR
  A["Dashboard"] --> B["Create Course"]
  B --> C["Create Module"]
  C --> D["Create Lesson"]
  D --> E["Compose Blocks"]
  E --> F["Build Quiz"]
  F --> G["Preview"]
  G --> H{"Readiness valid?"}
  H -- No --> E
  H -- Yes --> I["Request Review"]
  I --> J{"Approved?"}
  J -- Changes requested --> E
  J -- Yes --> K["Publish / Schedule"]
  K --> L["Analytics"]
```

## Store Manager

```mermaid
flowchart LR
  A["Dashboard"] --> B["Theo dõi nhân viên"]
  B --> C["Tiến độ"]
  C --> D{"At risk?"}
  D -- No --> E["Monitor"]
  D -- Yes --> F["Nhắc học"]
  F --> G["Employee receives notification"]
  G --> E
```

Manager không sửa progress, submit quiz thay nhân viên hoặc xem dữ liệu ngoài store scope.

## Super Admin

```mermaid
flowchart LR
  A["Brand"] --> B["Region"]
  B --> C["Store"]
  C --> D["Department & membership"]
  D --> E["Assignment"]
  E --> F["Analytics"]
  F --> G["Audit"]
```

## Session and authorization

```mermaid
flowchart TD
  REQ["Open protected route"] --> AUTH{"Valid session?"}
  AUTH -- No --> LOGIN["Login"]
  AUTH -- Yes --> PERM{"Permission + scope?"}
  PERM -- No --> DENY["403 / safe fallback"]
  PERM -- Yes --> PAGE["Render authorized resource"]
  LOGIN --> RETURN["Return to intended route"]
  RETURN --> PERM
```

## Tài liệu liên quan

[API Blueprint](./08-api-blueprint.md) · [Permission Matrix](./06-permission-matrix.md) · [CMS Blueprint](./07-cms-blueprint.md)
