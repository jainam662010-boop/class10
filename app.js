// Storage keys for loading content and tracking progress.
const DATA_STORAGE_KEY = "class10Data";
const PROGRESS_STORAGE_KEY = "class10Progress";

// DOM references for student dashboard sections.
const subjectListEl = document.getElementById("subjectList");
const chapterListEl = document.getElementById("chapterList");
const chapterHeadingEl = document.getElementById("chapterHeading");
const contentTitleEl = document.getElementById("contentTitle");
const contentOverviewEl = document.getElementById("contentOverview");
const teacherCardsEl = document.getElementById("teacherCards");
const videoCardsEl = document.getElementById("videoCards");
const notesListEl = document.getElementById("notesList");
const progressBadgeEl = document.getElementById("progressBadge");

let platformData = { subjects: [] };
let currentSubject = null;
let currentChapter = null;

// App bootstrap: load data and render initial state.
initialize();

async function initialize() {
  platformData = await getData();
  renderSubjects();

  if (platformData.subjects.length) {
    selectSubject(platformData.subjects[0].id);
  }
}

// Load data either from admin-saved localStorage or data.json fallback.
async function getData() {
  const localData = localStorage.getItem(DATA_STORAGE_KEY);
  if (localData) {
    try {
      return JSON.parse(localData);
    } catch {
      console.warn("Invalid local data, falling back to data.json");
    }
  }

  const response = await fetch("data.json");
  return response.json();
}

// Render all subject options as interactive buttons.
function renderSubjects() {
  subjectListEl.innerHTML = "";

  platformData.subjects.forEach((subject) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.textContent = subject.name;
    button.classList.toggle("active", currentSubject?.id === subject.id);
    button.addEventListener("click", () => selectSubject(subject.id));
    li.appendChild(button);
    subjectListEl.appendChild(li);
  });
}

// Update chapter list after a subject selection.
function selectSubject(subjectId) {
  currentSubject = platformData.subjects.find((subject) => subject.id === subjectId);

  renderSubjects();
  renderChapters();

  if (currentSubject?.chapters?.length) {
    selectChapter(currentSubject.chapters[0].id);
  } else {
    resetContent("No chapters available for this subject yet.");
  }
}

// Render chapter buttons for current subject.
function renderChapters() {
  chapterHeadingEl.textContent = currentSubject ? `${currentSubject.name} Chapters` : "Chapters";
  chapterListEl.innerHTML = "";

  currentSubject?.chapters?.forEach((chapter) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.textContent = chapter.title;
    button.classList.toggle("active", currentChapter?.id === chapter.id);
    button.addEventListener("click", () => selectChapter(chapter.id));
    li.appendChild(button);
    chapterListEl.appendChild(li);
  });
}

// Render full chapter details including teachers, videos, and notes.
function selectChapter(chapterId) {
  currentChapter = currentSubject?.chapters.find((chapter) => chapter.id === chapterId) || null;
  renderChapters();

  if (!currentChapter) {
    resetContent("Chapter details unavailable.");
    return;
  }

  contentTitleEl.textContent = currentChapter.title;
  contentOverviewEl.textContent = currentChapter.overview;

  renderTeachers();
  renderVideos();
  renderNotes();
  updateProgressBadge();
}

// Display teacher cards with channel and topic highlights.
function renderTeachers() {
  teacherCardsEl.innerHTML = "";

  currentChapter.teachers.forEach((teacher) => {
    const card = document.createElement("article");
    card.className = "teacher-card";
    card.innerHTML = `
      <h4>${teacher.name}</h4>
      <p><strong>Channel:</strong> ${teacher.channel}</p>
      <p><strong>Focus:</strong> ${teacher.topic}</p>
      <p><strong>Video ID:</strong> ${teacher.videoId}</p>
    `;

    teacherCardsEl.appendChild(card);
  });
}

// Render chapter videos with YouTube embeds and watch-state toggles.
function renderVideos() {
  videoCardsEl.innerHTML = "";

  currentChapter.videos.forEach((video, index) => {
    const isWatched = getProgressState(video.youtubeId);

    const card = document.createElement("article");
    card.className = "video-card";
    card.innerHTML = `
      <h4>${video.title}</h4>
      <p><strong>Duration:</strong> ${video.duration}</p>
      <div class="video-frame">
        <iframe
          src="https://www.youtube.com/embed/${video.youtubeId}"
          title="${video.title}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          loading="lazy"
        ></iframe>
      </div>
    `;

    const button = document.createElement("button");
    button.className = "watch-toggle";
    button.textContent = isWatched ? "Marked as Watched" : "Mark as Watched";
    button.addEventListener("click", () => {
      setProgressState(video.youtubeId, !getProgressState(video.youtubeId));
      renderVideos();
      updateProgressBadge();
    });

    if (isWatched) {
      button.style.background = "#2e9b5b";
    }

    card.appendChild(button);
    videoCardsEl.appendChild(card);

    // Ensure unique ids are not required for this collection render.
    card.dataset.videoIndex = String(index);
  });
}

// Render notes as either text entries or clickable links.
function renderNotes() {
  notesListEl.innerHTML = "";

  currentChapter.notes.forEach((note) => {
    const li = document.createElement("li");

    if (note.type === "link") {
      const link = document.createElement("a");
      link.href = note.content;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = note.content;
      li.appendChild(link);
    } else {
      li.textContent = note.content;
    }

    notesListEl.appendChild(li);
  });
}

// Retrieve watched status for a given video id from localStorage.
function getProgressState(videoId) {
  const progressMap = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || "{}");
  return Boolean(progressMap[videoId]);
}

// Save watched status for a video id to localStorage.
function setProgressState(videoId, watched) {
  const progressMap = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || "{}");
  progressMap[videoId] = watched;
  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressMap));
}

// Calculate and display watched percentage for current chapter.
function updateProgressBadge() {
  if (!currentChapter?.videos?.length) {
    progressBadgeEl.textContent = "Progress: 0%";
    return;
  }

  const total = currentChapter.videos.length;
  const watched = currentChapter.videos.filter((video) => getProgressState(video.youtubeId)).length;
  const percent = Math.round((watched / total) * 100);
  progressBadgeEl.textContent = `Progress: ${percent}%`;
}

// Reset content section when no active chapter is available.
function resetContent(message) {
  contentTitleEl.textContent = "No chapter selected";
  contentOverviewEl.textContent = message;
  teacherCardsEl.innerHTML = "";
  videoCardsEl.innerHTML = "";
  notesListEl.innerHTML = "";
  progressBadgeEl.textContent = "Progress: 0%";
}
