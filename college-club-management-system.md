# College Club Management System
### Problem Statement: PS-28 | Feature Specification Document

---

## Overview

A platform to manage college club members, events, registrations, and participation. The system supports a four-tier role hierarchy and enables transparent financial management, AI-assisted event promotion, and detailed analytics.

---

## 1. Authentication & Role-Based Access Control

Four-tier role hierarchy:

**College Admin → Faculty Coordinator → Club President / Vice President → Member**

- One Admin per college
- A Faculty Coordinator can be assigned to multiple clubs
- President/VP have club-level management authority
- Members have read/register/task access only
- **Public users** (non-members) can view events marked as public and register via a lightweight guest registration form

---

## 2. College Admin Features

- Approve or reject club creation/deletion requests with reason
- View all clubs under the college with their status (active / inactive / pending)
- **Admin Dashboard** showing:
  - Total clubs, members, and upcoming events across the college
  - Event analytics — frequency, attendance rates, most active clubs
  - Club activity heatmap
- Manage college-level announcements
- View and export college-wide reports

---

## 3. Faculty Coordinator Features

- Assigned to one or multiple clubs
- **Event Approval Workflow** — receives event creation requests from President/VP
- Approve or reject events with remarks
- View all events (past, upcoming, pending) for assigned clubs
- Monitor club activity, member participation, and prize pool transactions
- Receives auto-generated event summary report once an event concludes

---

## 4. Club Management

- Any member can submit a **Club Creation Request** with:
  - Club name, description, and category
  - Proposed President
  - Proposed Faculty Coordinator
- Admin approves or rejects the request
- **Club Deletion Request** raised by the President → sent to Admin for approval
- Each club has a dedicated **Prize Pool / Fund** and a **Sponsor Database**

---

## 5. Club Roles & Positions

- Every club must have exactly one **President** and one **Vice President** (compulsory)
- President/VP can create custom roles (e.g., Treasurer, Event Head, PR Manager)
- Only President and VP can:
  - Add or remove members
  - Assign or reassign roles
  - Submit event creation requests
  - Manage prize pool transactions
  - Manage the sponsor database

---

## 6. Member Management

- Members can be part of **multiple clubs** simultaneously
- President/VP add members via college email or student ID
- Member receives an invite and joins upon acceptance
- **Work Assignment** by President/VP includes:
  - Task title and description
  - Deadline
  - Priority levels — High / Medium / Low
  - Status tracking — To Do / In Progress / Done
- Members view all assigned tasks on their personal dashboard across all clubs

---

## 7. Event Management

### 7.1 Creation & Approval

- President/VP create an event with title, date, venue, capacity, description, and budget requirement
- Event request goes to **Faculty Coordinator for approval**
- Coordinator approves or rejects with remarks
- Upon approval, President/VP can **mark the event as public** — only then does it appear on the public-facing event page with necessary details (title, date, venue, description)

---

### 7.2 Registration — Two Separate Tracks

| | Club Member Registration | Guest / Non-member Registration |
|---|---|---|
| **Who** | Existing club members | Any outside student or public user |
| **Details Captured** | Linked to member profile | Name, email, phone, college/institution |
| **History** | Added to participation history | Maintained in separate guest list |
| **Waitlist** | Yes | Yes |
| **Confirmation** | In-app notification | Email confirmation |

- President/VP can view both lists independently and together
- Waitlist management for both tracks when capacity is full

---

### 7.3 Promotion

**Template-Based Poster Generator**
- Select from poster templates (formal, vibrant, minimal, etc.)
- Fill in event details — name, date, venue, theme, club logo, tagline, colors
- System composes and renders the final poster
- Downloadable as image or PDF for sharing

**Sponsor Outreach Message Drafter**
- Auto-drafts professional outreach emails/messages using:
  - Event details and expected footfall
  - Audience profile and sponsorship tiers
- Customizable before sending
- Linked to the club's Sponsor Database

---

### 7.4 During & Post Event

- President/VP or designated member marks attendance separately for members and guests
- **Photo Gallery** — upload event photos post-event
- All registered participants (members and guests via link) can browse and download photos
- **Auto-generated Event Summary Report** triggered once event is marked as concluded:
  - Total registrations (member + guest) vs. actual attendance
  - Task completion summary
  - Budget used vs. allocated
  - Sponsor contributions received
  - Key highlights and participation stats
  - Exportable as PDF
  - Auto-sent to Faculty Coordinator and Admin

---

## 8. Prize Pool & Financial Transparency

- Every club has an associated **Prize Pool / Fund balance**
- Every transaction is logged with:
  - Amount (credit / debit)
  - Date and time
  - Purpose / description
  - Authorized by (President/VP name)
  - Associated event (if applicable)
  - Sponsor name (if credit is from a sponsor)
- Full transaction history visible to President, VP, Faculty Coordinator, and Admin
- Budget allocation per event tracked separately
- Alerts when fund balance falls below a defined threshold

---

## 9. Sponsor Database

- Each club maintains its own sponsor database
- Each sponsor entry contains:
  - Sponsor name, organization, contact person, email, phone
  - Sponsorship history — which events sponsored, amounts contributed
  - Current status — Prospect / Contacted / Confirmed / Declined
  - Notes and follow-up reminders
- When drafting outreach messages, pull sponsor details directly from the database
- Track responses — mark as Replied / Negotiating / Confirmed / Declined
- Contributions automatically reflected as credits in the Prize Pool

---

## 10. Notifications

| Recipient | Trigger |
|---|---|
| College Admin | New club creation / deletion request |
| Faculty Coordinator | New event approval request |
| Member | Added to a club, assigned a role, or given a task |
| Member | Task deadline reminder |
| Registered participants | Event reminder (members via app, guests via email) |
| Club members | Photo upload notification |
| President / VP | Low fund balance alert |
| All relevant parties | Approval / rejection notifications |

---

## 11. Reports & Exports

| Report | Generated By | Available To |
|---|---|---|
| Event Summary Report | Auto (post-event) | President/VP, Coordinator, Admin |
| College-wide Activity Report | Manual | Admin |
| Club-specific Report | Manual | President/VP, Coordinator |
| Financial Transaction Report | Manual | President/VP, Coordinator, Admin |
| Sponsor Contribution Report | Manual | President/VP, Coordinator |
| Member Participation History | Manual | President/VP, Admin |

All reports are exportable as **PDF or CSV**.

---

## Role & Permission Summary

| Feature | Admin | Coordinator | President/VP | Member | Guest |
|---|:---:|:---:|:---:|:---:|:---:|
| Approve club requests | ✅ | ❌ | ❌ | ❌ | ❌ |
| Approve events | ❌ | ✅ | ❌ | ❌ | ❌ |
| Create events | ❌ | ❌ | ✅ | ❌ | ❌ |
| Add/remove members | ❌ | ❌ | ✅ | ❌ | ❌ |
| Assign tasks | ❌ | ❌ | ✅ | ❌ | ❌ |
| Register for events | ❌ | ❌ | ✅ | ✅ | ✅ |
| View public events | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage prize pool | ❌ | ❌ | ✅ | ❌ | ❌ |
| View financials | ✅ | ✅ | ✅ | ❌ | ❌ |
| Download event photos | ❌ | ❌ | ✅ | ✅ | ✅* |

*Guests receive a download link via email after event concludes.

---

*Document Version: 1.0 | PS-28 — College Club Management System*
