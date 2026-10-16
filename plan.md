# Dezprox Website & Admin Management System
## Project Overview, Architecture, Decisions and Implementation Roadmap

**Prepared for:** Dezprox Founders  
**Project:** Public Website and Internal Admin Management System  
**Status:** Public website exists; database foundation has been established; integration and admin development are the next stages.

---

# 1. Project Overview

The objective is to complete the existing Dezprox website and establish a separate internal management system that allows the founders to manage website enquiries, booking requests and other business-related submissions.

The project consists of two independent applications:

1. **Dezprox Public Website** — the official company website accessible to everyone.
2. **Dezprox Admin Management System** — a private application used by authorized founders to manage information submitted through the public website.

Both applications will use the same database, allowing information submitted on the website to become available in the admin system without manual data transfer.

The public website and admin system will have separate codebases and deployments. This keeps their responsibilities independent while allowing them to work together.

## Main objectives

- Complete and maintain the existing public website.
- Connect public enquiry forms to a database.
- Centralize website enquiries and booking requests.
- Give founders a private place to review and manage submissions.
- Keep public visitors separate from internal administration.
- Establish a foundation that can support additional internal features later.

# 2. Final Architecture

## Project A: Dezprox Public Website

**Planned production URL:** `https://dezprox.com`

This is the official website for clients, prospective customers, students, partners and other visitors.

Its purpose is to present Dezprox, explain its services and products, display projects, communicate pricing information and allow interested people to contact the company.

### Responsibilities

- Homepage and company introduction.
- About page.
- Services and product information.
- Pricing information.
- Projects and portfolio.
- Book a Call form.
- Contact and other enquiry forms where required.
- Public-facing website content and navigation.

### Access policy

The website remains open to everyone.

Visitors do not need an account, password or login session to browse the website or submit an enquiry.

There will be no general login page on the public website as part of this project. This avoids confusing prospective clients or other visitors into thinking they need an account to use the website.

## Project B: Dezprox Admin Management System

**Planned URL:** `https://admin.dezprox.com`

This will be a separate application for the founders and other explicitly authorized internal users, if access is expanded later.

It will not be part of the public website's navigation or general visitor experience.

### Responsibilities

- Founder login and access control.
- View and manage booking requests.
- View and manage contact enquiries.
- View and manage service enquiries.
- Review cookie-consent records.
- Display useful management summaries.
- Support future internal management features as approved.

### Access policy

Only authenticated users with an authorized, active founder profile will be able to access protected administration features.

An account on the public website is not required because the public website does not provide public account registration. Admin access will be managed separately through the internal system.

The admin URL is not the security mechanism by itself. Proper login verification and access restrictions must protect the underlying information.

# 3. How Both Applications Work Together

Both applications will connect to one shared database.

The database will be the central source of truth for website submissions and the founder accounts authorized to access private records.

### Example: Booking a call

1. A prospective client visits `dezprox.com`.
2. They open the Book a Call page and submit their details.
3. The public website validates the information and securely submits it to the database.
4. The booking request is saved.
5. A founder opens `admin.dezprox.com` and signs in.
6. The founder sees the submitted booking in the admin system.
7. The founder reviews the request and updates its status as appropriate.

The same general process will apply to contact and service enquiries.

This removes the need to manually transfer every website submission into a separate tracking system.

### Shared database principle

The applications share information, but they do not share the same access permissions.

- Public visitors can submit permitted information through the website.
- Founders can access private management records after authorization.
- Public visitors cannot browse private enquiries or founder records.
- Internal notes and administrative information remain private.

# 4. Why We Chose Two Separate Applications

The founders discussed whether the admin panel should be developed inside the existing website or as an independent application.

The final decision is to keep them separate.

### Reasons for this decision

**Clear separation of responsibilities**

The public website focuses on presenting the business and attracting enquiries. The admin system focuses on internal operations and managing those enquiries.

**Independent development**

The public website can be updated without requiring the admin application to be rebuilt as part of the same project.

**Independent deployment**

Each application can be deployed and maintained separately. Changes to one application do not automatically require a deployment of the other.

**Better organization**

Admin-specific functionality will not accumulate inside the public website's codebase.

**Room for future growth**

The admin system can gradually support additional internal workflows without requiring a redesign of the public website.

**Clearer user experience**

Prospective clients and website visitors interact with the public website. Founders use a dedicated internal application.

This separation is an organizational and operational benefit. Both applications will still require appropriate security, testing and maintenance.

# 5. Current Website Status

The public Dezprox website already exists. The objective is to continue developing the current website rather than rebuilding it from scratch.

The existing project uses Next.js and React, with TypeScript and Tailwind CSS for the application and styling.

The previously inspected website contains these routes:

| Page | Purpose |
|---|---|
| Home | Introduces Dezprox and its work |
| About | Company information |
| Services | Services offered by Dezprox |
| Pricing | Pricing information |
| Products | Product overview |
| Product details | Individual product information |
| Projects | Project portfolio |
| Project details | Individual project information |
| Book a Call | Booking interface |

The existing website includes design elements, animations and page layouts that should be preserved unless the founders explicitly approve a change.

### What still needs attention

The earlier code audit found that the Book a Call page contained a mock booking experience, including a hardcoded calendar and time slots. It did not yet have a complete, verified database submission flow.

Other enquiry forms also need to be inspected individually before integration.

The goal is not to redesign these pages. The goal is to make the existing public experience work correctly and reliably.

The current live website should also be checked before production changes, because the code in the repository and the deployed website may not always be identical.

# 6. Database Foundation Already Established

A Supabase project named `dezprox-website` has been created.

The initial database migration was successfully applied, and the founder bootstrap operation completed successfully.

The database foundation includes five principal record types.

### 1. Founder profiles

Identifies users who are permitted to access the admin system.

It records their role and whether their account is active.

### 2. Booking requests

Stores information related to requests for calls or meetings.

The schema supports booking details, status management, internal notes and confirmation-related information.

### 3. Contact enquiries

Stores general enquiries received from the public website.

It supports contact details, message information, status tracking and internal follow-up notes.

### 4. Service enquiries

Stores information from people interested in Dezprox services.

The schema supports service category, company details, budget tier, project description, timeline and assignment information.

### 5. Cookie-consent records

Stores records of visitor cookie preferences, including consent categories and a consent version.

These records are intended to support consent management and administration. The existing schema alone does not mean a cookie-consent interface or tracking integration is already implemented.

### Founder account

The initial founder profile was verified successfully:

- Email: `admin@dezprox.com`
- Role: `super_admin`
- Account active: Yes

This account is the initial authorized founder identity for the future admin system.

The database schema and initial founder setup have been completed. However, the end-to-end website integration, admin login and production security testing are not yet confirmed as complete.

# 7. How the Public Website Will Submit Information

The public website will remain accessible without login, but form submissions must be handled securely.

The intended flow is:

**Visitor → Public form → Validation → Secure submission → Shared database**

The website will accept the information needed for the relevant enquiry and send it to the database through an appropriately secured submission mechanism.

For example, a visitor should be able to submit a booking request without having a founder account.

However, public visitors must not be able to choose administrative statuses, write internal notes, assign enquiries to founders or modify private records.

The system must restrict what visitors can submit and what database operations they are permitted to perform.

The public website will not contain privileged database credentials.

### Important distinction

The public website does not need a separate standalone backend project to support form submissions. It can use server-side functionality within its existing application.

The architectural decision is to separate the public website from the admin application, not to prohibit all backend functionality in the public website.

# 8. Admin System: Planned Functional Scope

The initial admin system will focus on useful, practical founder operations rather than becoming an oversized management platform immediately.

### A. Founder authentication

- Login for authorized founders.
- Server-side verification of the founder's identity and authorization.
- Access restricted to active, approved founder accounts.
- Secure logout.
- No public registration.

### B. Booking management

Founders will be able to review booking requests and manage their statuses.

The database supports statuses such as pending, confirmed, rescheduled, cancelled and completed.

The initial workflow will support manual review and confirmation. Automated calendar scheduling and booking notifications are not part of the initial scope.

### C. Contact enquiry management

Founders will be able to view incoming contact enquiries, track their progress and record internal follow-up notes.

### D. Service enquiry management

Founders will be able to review potential service opportunities, examine project information and use the available status and assignment fields to organize follow-up.

### E. Cookie-consent administration

Founders will be able to review stored consent records for administrative purposes.

This feature depends on implementing the public consent interface and the correct consent-record submission flow.

### F. Dashboard summaries

The admin dashboard can later display useful summaries, such as incoming enquiries and pending booking requests.

The exact dashboard metrics and presentation should be finalized during the admin implementation stage.

# 9. Security and Access Management

Security applies to both applications, even though they have separate codebases.

The existing database foundation includes row-level security policies and permission controls. These must be preserved and verified as the applications are connected.

### Public website

- No login required to browse public pages.
- No access to private founder records.
- Restricted form submission permissions.
- Server-side validation of submitted information.
- No exposure of privileged database credentials.

### Admin application

- Login required for protected pages.
- Founder profile checked against the authenticated account.
- Inactive or unauthorized accounts denied access.
- Private records protected by database permissions.
- Internal notes and administrative data not exposed to public visitors.

### Deployment security

Each application will have its own deployment configuration and environment variables.

The admin application must not depend solely on hiding buttons or pages in the browser. Authorization must be enforced by trusted server-side logic and the database.

A separate domain improves clarity, but it does not replace these security measures.

# 10. Implementation Roadmap

The project will proceed in controlled stages. Each stage should be reviewed before moving to the next major implementation step.

## Phase 1 — Complete the public website integration

**Objective:** Make the existing website's enquiry flows work correctly.

Tasks:
- Audit the existing forms and their fields.
- Preserve the existing frontend design.
- Connect the Book a Call form to the database.
- Verify that booking records are saved correctly.
- Connect the contact enquiry form.
- Connect the service enquiry flow.
- Implement appropriate validation and abuse protection.
- Review cookie-consent requirements and implement the necessary flow.
- Test success, failure and duplicate-submission scenarios.

The exact order of form integration will be confirmed after reviewing the current code.

## Phase 2 — Establish the separate admin application

**Objective:** Create an independent project for founder management.

Tasks:
- Create a separate repository.
- Set up the application and independent deployment configuration.
- Connect it to the existing Supabase project.
- Implement founder authentication.
- Verify founder authorization.
- Build the protected admin shell and initial dashboard.
- Test access restrictions.

The public website will not contain the admin login or dashboard.

## Phase 3 — Implement management modules

**Objective:** Allow founders to manage the information collected by the public website.

Tasks:
- Booking management.
- Contact enquiry management.
- Service enquiry management.
- Cookie-consent record management.
- Dashboard summaries and basic filtering.
- Status updates and internal notes where supported by the schema.

## Phase 4 — Verification and deployment

**Objective:** Confirm that both applications work reliably together.

Tasks:
- Test public form submissions.
- Confirm submitted records appear in the admin system.
- Test authorized and unauthorized access.
- Verify database permissions and row-level security.
- Test logout and expired sessions.
- Verify both applications can be deployed independently.
- Test production domains and environment configuration.
- Confirm error handling and backup/recovery expectations.

Email notifications, calendar integration and additional automation can be considered later, after the core submission and management workflows are stable.

# 11. Decisions Already Concluded

The following decisions form the agreed direction of the project.

1. The existing public website will be preserved and completed.
2. The public website will remain accessible without login.
3. The admin system will be a separate application and repository.
4. The planned admin domain is `admin.dezprox.com`.
5. Both applications will use the same existing Supabase project.
6. The public website will submit permitted information securely.
7. The admin system will manage the records stored in the shared database.
8. Only authorized, active founder accounts will access protected admin features.
9. The database migration and initial founder account will be reused.
10. The website will not be rebuilt solely to introduce the admin system.
11. The admin system will be implemented after the public website's database integration is completed and verified.
12. Implementation will proceed one stage at a time, with review before moving forward.

# 12. Current Status vs. Planned Work

| Component | Current understanding |
|---|---|
| Public website frontend | Existing and under continued development |
| Supabase project | Created |
| Initial database schema | Applied successfully |
| Initial founder profile | Created and verified |
| Public form database integration | Still needs implementation and verification |
| Admin repository | Not yet established |
| Admin login | Not yet confirmed as implemented |
| Admin dashboard | Planned |
| Booking and enquiry management | Planned |
| Cookie-consent interface and integration | Requires inspection and implementation |
| Production security verification | Outstanding |
| Independent deployments | Planned |

This status distinguishes completed foundation work from features that are still planned. It should be updated as implementation and testing progress.

# 13. Out of Scope for the Initial Delivery

To keep the project focused, the following are not part of the initial implementation unless separately approved:

- Rebuilding the public website from scratch.
- Adding a general public login or registration system.
- Turning the website into a content management platform.
- Replacing the existing pricing calculator.
- Building a complete CRM or accounting system.
- Automated calendar booking and scheduling.
- Email notifications before the basic workflows are verified.
- Advanced analytics and automated reporting.
- Additional employee or client portals.
- Large-scale redesigns unrelated to the required functionality.

Additional capabilities can be evaluated after the core website and admin workflows are working correctly.

# 14. Expected Outcome

When the agreed work is complete:

- Visitors will be able to browse `dezprox.com` without signing in.
- Interested people will be able to submit booking and enquiry forms.
- Their submissions will be stored in the shared database.
- Founders will use `admin.dezprox.com` to sign in and manage those submissions.
- Unauthorized users will not be able to access private administrative information.
- The public website and admin application will be independently maintainable and deployable.
- Future internal features can be added without mixing them into the public website.

The result will be a clear separation between the public-facing business website and the internal management application, supported by one shared and appropriately secured data source.

---

## Final Summary for the Founders

**We are building two independent applications, not one combined website with an admin panel.**

The first application is the public Dezprox website, which presents the company and collects enquiries. The second is a private founder management system that reviews and manages those enquiries.

Both applications will use the same database so information can move between them without manual duplication. The database foundation and initial founder account are already established. The next priority is to complete and securely connect the public website's forms, then build the separate admin application and verify the complete workflow.

This approach keeps the public website simple for visitors, gives founders a dedicated management environment and provides a foundation for future growth.