# Route Registry

## Purpose

This document lists the currently available routes in the application.

The route registry is a living inventory of URLs, page components, layouts, and access requirements. Unlike the Routes spec, this document is expected to change as new pages are added or removed.

---

## Public Routes

### `/`

**Page:** `HomePage`  
**Layout:** `PublicLayout`  
**Access:** Anyone  
**Purpose:** Landing page or redirect hub

---

### `/login`

**Page:** `LoginPage`  
**Layout:** `PublicLayout`  
**Access:** Logged-out users  
**Purpose:** User authentication

---

## Authenticated Routes

### `/dashboard`

**Page:** `DashboardPage`  
**Layout:** `AppLayout`  
**Access:** Logged-in users  
**Purpose:** Main user dashboard

---

### `/characters/create`

**Page:** `CharacterCreatePage`  
**Layout:** `AppLayout`  
**Access:** Logged-in users  
**Purpose:** Create a new character

---

### `/characters/:characterId`

**Page:** `CharacterDetailPage`  
**Layout:** `AppLayout`  
**Access:** Character owner, staff, or admin  
**Purpose:** View character details

---

### `/characters/:characterId/edit`

**Page:** `CharacterEditPage`  
**Layout:** `AppLayout`  
**Access:** Character owner, staff, or admin  
**Purpose:** Edit character details

---

## Staff Routes

### `/staff/players`

**Page:** `StaffPlayerListPage`  
**Layout:** `AppLayout`  
**Access:** Staff or admin  
**Purpose:** View and manage players

---

### `/staff/characters`

**Page:** `StaffCharacterListPage`  
**Layout:** `AppLayout`  
**Access:** Staff or admin  
**Purpose:** View and manage characters

---

### `/staff`

**Page:** `StaffDashboardPage`  
**Layout:** `AppLayout`  
**Access:** Staff or admin  
**Purpose:** Staff dashboard

---

## Admin Routes

### `/admin`

**Page:** `AdminDashboardPage`  
**Layout:** `AppLayout`  
**Access:** Admin  
**Purpose:** Admin dashboard

---

### `/admin/skills`

**Page:** `SkillManagementPage`  
**Layout:** `AppLayout`  
**Access:** Admin  
**Purpose:** Manage skills

---

### `/admin/items`

**Page:** `ItemManagementPage`  
**Layout:** `AppLayout`  
**Access:** Admin  
**Purpose:** Manage item templates