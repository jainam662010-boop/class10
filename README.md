# Class 10 Educational Web Platform

A complete front-end platform for Class 10 students with subject/chapter navigation, YouTube video learning, notes, teacher sections, and an admin panel for content management.

## Features

- Student dashboard (`index.html`) with:
  - Subject list
  - Chapter list per subject
  - Embedded chapter videos (YouTube)
  - Teacher recommendation cards (Physics Wallah, Vedantu, Magnet Brains)
  - Notes section (text + links)
  - Progress tracking (stored in localStorage)
- Admin dashboard (`admin.html`) with:
  - Password-protected login (`1234`)
  - Add/update subject, chapter, teacher info, videos, and notes
  - Save updates to `localStorage` as a simulated `data.json` update

## How to Run Locally

> Use a local server so `fetch("data.json")` works correctly.

1. Open a terminal in this project folder.
2. Run:

```bash
python -m http.server 8000
```

3. Open your browser:
   - Student UI: `http://localhost:8000/index.html`
   - Admin UI: `http://localhost:8000/admin.html`

## Folder Structure

```text
class10/
├── index.html      # Student-facing learning dashboard
├── admin.html      # Admin authentication + content management
├── style.css       # Shared professional responsive styles
├── app.js          # Student-side logic and progress tracking
├── admin.js        # Admin-side login and CRUD-like local updates
├── data.json       # Base platform data (subjects/chapters/videos/teachers/notes)
└── README.md       # Project documentation
```

## Data Model Overview (`data.json`)

Each subject includes multiple chapters. Each chapter contains:
- `teachers`: teacher sections (name, channel, topic, videoId)
- `videos`: chapter videos with `youtubeId`
- `notes`: text or links

## How to Extend This Project

### 1) Build a Mobile App
- Reuse the same JSON schema and APIs with React Native or Flutter.
- Add offline caching for videos/notes metadata.
- Use secure login for student and teacher profiles.

### 2) Add Learning Analytics
- Track daily watch time, chapter completion, and weak topics.
- Create student performance dashboards.
- Export progress reports for parents and teachers.

### 3) Add Moderation & Content Governance
- Introduce role-based admins (editor/reviewer/publisher).
- Add approval workflow before content goes live.
- Maintain an audit log for all content changes.

### 4) Move from localStorage to Real Backend
- Replace localStorage with a REST/GraphQL backend.
- Add persistent authentication and encrypted data storage.
- Store media metadata and notes in a database.

---

You can reset admin edits anytime by clearing browser localStorage for this site.
