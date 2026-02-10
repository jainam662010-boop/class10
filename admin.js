// Storage key and authentication constants for admin simulation.
const DATA_STORAGE_KEY = "class10Data";
const ADMIN_SESSION_KEY = "class10AdminSession";
const ADMIN_PASSWORD = "1234";

// DOM references for login and dashboard controls.
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const contentForm = document.getElementById("contentForm");
const saveMessage = document.getElementById("saveMessage");
const adminSummary = document.getElementById("adminSummary");
const logoutBtn = document.getElementById("logoutBtn");

let platformData = { subjects: [] };

initializeAdmin();

// Admin app bootstrap: load data and restore prior login session.
async function initializeAdmin() {
  platformData = await loadData();

  if (localStorage.getItem(ADMIN_SESSION_KEY) === "true") {
    showDashboard();
  }

  renderSummary();
}

// Load data from localStorage if available, else use default data.json.
async function loadData() {
  const saved = localStorage.getItem(DATA_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      console.warn("Corrupt local admin data. Falling back to data.json");
    }
  }

  const response = await fetch("data.json");
  return response.json();
}

// Login handler validates password and unlocks admin controls.
loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const password = document.getElementById("adminPassword").value.trim();

  if (password === ADMIN_PASSWORD) {
    localStorage.setItem(ADMIN_SESSION_KEY, "true");
    loginMessage.textContent = "Login successful.";
    showDashboard();
  } else {
    loginMessage.textContent = "Incorrect password. Please try again.";
  }
});

// Content form upserts subject/chapter and appends teacher/video/notes entries.
contentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const subjectName = document.getElementById("subjectName").value.trim();
  const chapterTitle = document.getElementById("chapterTitle").value.trim();
  const chapterOverview = document.getElementById("chapterOverview").value.trim();
  const teacherName = document.getElementById("teacherName").value.trim();
  const teacherChannel = document.getElementById("teacherChannel").value.trim();
  const teacherTopic = document.getElementById("teacherTopic").value.trim();
  const teacherVideoId = document.getElementById("teacherVideoId").value.trim();
  const videoTitle = document.getElementById("videoTitle").value.trim();
  const videoId = document.getElementById("videoId").value.trim();
  const videoDuration = document.getElementById("videoDuration").value.trim();
  const notesType = document.getElementById("notesType").value;
  const notesContent = document.getElementById("notesContent").value.trim();

  const subjectId = slugify(subjectName);
  const chapterId = slugify(chapterTitle);

  let subject = platformData.subjects.find((item) => item.id === subjectId);

  if (!subject) {
    subject = {
      id: subjectId,
      name: subjectName,
      description: `${subjectName} content created from admin panel.`,
      chapters: []
    };
    platformData.subjects.push(subject);
  }

  let chapter = subject.chapters.find((item) => item.id === chapterId);

  if (!chapter) {
    chapter = {
      id: chapterId,
      title: chapterTitle,
      overview: chapterOverview,
      teachers: [],
      videos: [],
      notes: []
    };
    subject.chapters.push(chapter);
  } else {
    chapter.overview = chapterOverview;
  }

  // Avoid exact duplicate teacher entries while still allowing updates.
  if (!chapter.teachers.some((teacher) => teacher.name === teacherName && teacher.videoId === teacherVideoId)) {
    chapter.teachers.push({
      name: teacherName,
      channel: teacherChannel,
      topic: teacherTopic,
      videoId: teacherVideoId
    });
  }

  if (!chapter.videos.some((video) => video.youtubeId === videoId)) {
    chapter.videos.push({
      title: videoTitle,
      youtubeId: videoId,
      duration: videoDuration
    });
  }

  if (!chapter.notes.some((note) => note.type === notesType && note.content === notesContent)) {
    chapter.notes.push({
      type: notesType,
      content: notesContent
    });
  }

  localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(platformData));
  contentForm.reset();
  saveMessage.textContent = "Changes saved in localStorage (simulated data.json update).";
  renderSummary();
});

// Clears session without touching stored content data.
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  hideDashboard();
});

// Build a compact subject/chapter summary for admins.
function renderSummary() {
  adminSummary.innerHTML = "";

  platformData.subjects.forEach((subject) => {
    const subjectItem = document.createElement("li");
    subjectItem.innerHTML = `<strong>${subject.name}</strong> (${subject.chapters.length} chapters)`;

    const nestedList = document.createElement("ul");
    nestedList.className = "notes-list";

    subject.chapters.forEach((chapter) => {
      const chapterItem = document.createElement("li");
      chapterItem.textContent = `${chapter.title} — ${chapter.videos.length} video(s), ${chapter.notes.length} note(s)`;
      nestedList.appendChild(chapterItem);
    });

    subjectItem.appendChild(nestedList);
    adminSummary.appendChild(subjectItem);
  });
}

// Simple helper to create ids from titles.
function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Display login and hide dashboard when unauthenticated.
function hideDashboard() {
  dashboardSection.classList.add("hidden");
  loginSection.classList.remove("hidden");
  loginMessage.textContent = "Logged out successfully.";
}

// Display dashboard and hide login after successful auth.
function showDashboard() {
  loginSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");
}
