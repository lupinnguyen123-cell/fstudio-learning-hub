# Information Architecture

[← Mục lục](./README.md)

## Mục lục

- [Sitemap](#sitemap)
- [Navigation model](#navigation-model)
- [IA rules](#ia-rules)
- [Tài liệu liên quan](#tài-liệu-liên-quan)

## Sitemap

```mermaid
flowchart TD
  ROOT["F.Studio Learning Hub"] --> SHARED["Shared"]
  ROOT --> EMP["Employee"]
  ROOT --> TR["Trainer"]
  ROOT --> SM["Store Manager"]
  ROOT --> SA["Super Admin"]

  SHARED --> LOGIN["Login / Session"]
  SHARED --> NOTI["Notifications"]
  SHARED --> HELP["Help & policies"]

  EMP --> EH["Home"]
  EMP --> EC["Courses"]
  EC --> ECD["Course detail"]
  ECD --> EL["Lesson"]
  EL --> EQ["Quiz"]
  EQ --> ER["Result"]
  ER --> CERT["Certificate"]
  EMP --> EJ["Learning Journey"]
  EJ --> EP["Progress"]
  EJ --> HIST["History"]
  EMP --> PROFILE["Profile"]
  EMP --> SAVED["Bookmarks & Favorites"]

  TR --> TD["Dashboard"]
  TR --> TC["Courses"]
  TC --> EDIT["Course Editor"]
  EDIT --> MOD["Modules"]
  MOD --> LES["Lessons"]
  LES --> BLOCK["Block Editor"]
  EDIT --> QUIZ["Quiz Builder"]
  EDIT --> PREVIEW["Preview"]
  EDIT --> REVIEW["Review & Publish"]
  TR --> TA["Analytics"]
  TR --> MEDIA["Media Library"]
  TR --> TSET["Content Settings"]

  SM --> SMD["Store Dashboard"]
  SM --> TEAM["Employees"]
  TEAM --> TEAMPROG["Employee Progress"]
  SM --> REMIND["Reminder Queue"]
  SM --> SMA["Store Analytics"]

  SA --> SAD["System Dashboard"]
  SA --> BR["Brands"]
  BR --> REG["Regions"]
  REG --> STO["Stores"]
  SA --> ORG["Departments & Users"]
  SA --> IAM["Roles & Permissions"]
  SA --> TAX["Taxonomy"]
  SA --> ASG["Assignments"]
  SA --> AUDIT["Audit Logs"]
  SA --> SYS["System Settings"]
```

## Navigation model

| Role | Primary navigation | Contextual navigation |
| --- | --- | --- |
| Employee | Home, Courses, Journey, Profile | Lesson outline, quiz questions |
| Trainer | Dashboard, Courses, Analytics, Media | Editor outline, inspector, publish actions |
| Store Manager | Dashboard, Employees, Reminders, Analytics | Employee/course drill-down |
| Super Admin | Organization, Access, Assignments, Audit, Settings | Brand/region/store hierarchy |

## IA rules

- Một URL đại diện một resource hoặc task có thể bookmark.
- Editor state không trộn vào global navigation.
- Store Manager không thấy CMS actions.
- Super Admin configuration tách khỏi Trainer content operations.
- Search toàn cục trả kết quả theo quyền và scope.
- Mobile ưu tiên 4 destinations; actions thứ cấp nằm trong menu tài khoản.

## Tài liệu liên quan

[User Flows](./03-user-flows.md) · [Permission Matrix](./06-permission-matrix.md) · [CMS Blueprint](./07-cms-blueprint.md)
