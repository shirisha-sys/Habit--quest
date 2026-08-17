 // Central Application State
let state = {
  habits: JSON.parse(localStorage.getItem('habits')) || [],
  filter: 'all' // Options: 'all' | 'active' | 'completed'
};

// DOM Elements
const form = document.getElementById('habit-form');
const input = document.getElementById('habit-input');
const habitList = document.getElementById('habit-list');
const filterButtons = document.getElementById('filter-buttons');

// Helper: Get today's date formatted as YYYY-MM-DD
const getTodayDate = () => new Date().toISOString().split('T')[0];

// Save state to browser's LocalStorage
function saveState() {
  localStorage.setItem('habits', JSON.stringify(state.habits));
}

// Render UI driven by current State
function render() {
  habitList.innerHTML = '';
  const today = getTodayDate();

  // 1. Filter items based on selected filter state
  const filtered = state.habits.filter(h => {
    const isDoneToday = h.lastCompleted === today;
    if (state.filter === 'active') return !isDoneToday;
    if (state.filter === 'completed') return isDoneToday;
    return true;
  });

  // 2. Dynamically create and render DOM elements
  filtered.forEach(habit => {
    const isDoneToday = habit.lastCompleted === today;
    const li = document.createElement('li');
    li.dataset.id = habit.id;

    li.innerHTML = `
      <div>
        <strong>${escapeHTML(habit.title)}</strong>
        <span class="streak-badge">🔥 ${habit.streak} day streak</span>
      </div>
      <div class="actions">
        <button class="check-btn ${isDoneToday ? 'completed' : ''}">
          ${isDoneToday ? 'Done ✓' : 'Mark Done'}
        </button>
        <button class="delete-btn">✕</button>
      </div>
    `;

    habitList.appendChild(li);
  });

  // 3. Update active style on filter buttons
  Array.from(filterButtons.children).forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === state.filter);
  });
}

// Utility: Sanitize input strings against XSS attacks
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// --- LOGIC & EVENT HANDLERS ---

// CREATE: Add new habit
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = input.value.trim();
  if (!title) return;

  state.habits.push({
    id: Date.now().toString(),
    title,
    streak: 0,
    lastCompleted: null
  });

  saveState();
  render();
  input.value = '';
});

// UPDATE & DELETE: Delegated Event Listeners on List
habitList.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  const id = li.dataset.id;
  const habit = state.habits.find(h => h.id === id);

  // DELETE
  if (e.target.classList.contains('delete-btn')) {
    state.habits = state.habits.filter(h => h.id !== id);
    saveState();
    render();
    return;
  }

  // UPDATE: Toggle completion and streak calculation
  if (e.target.classList.contains('check-btn')) {
    const today = getTodayDate();
    if (habit.lastCompleted === today) {
      habit.lastCompleted = null;
      habit.streak = Math.max(0, habit.streak - 1);
    } else {
      habit.lastCompleted = today;
      habit.streak += 1;
    }
    saveState();
    render();
  }
});

// FILTERING: Delegated Event Listener on Filter Buttons
filterButtons.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    state.filter = e.target.dataset.filter;
    render();
  }
});

// Initial Render on Load
render();