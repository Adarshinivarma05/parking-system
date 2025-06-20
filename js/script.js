const SESSION_DURATION = 5 * 60 * 1000; // 5 minutes session expiry
const totalSlots = 10;

const loginCaptchaId = 'loginCaptchaContainer';
const regCaptchaId = 'regCaptchaContainer';

// Utility: Show page and generate captchas on login/register pages
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');

  if (id === 'loginPage') {
    generateCaptcha(loginCaptchaId);
    document.getElementById('loginCaptchaInput').value = '';
  }
  if (id === 'registerPage') {
    generateCaptcha(regCaptchaId);
    document.getElementById('regCaptchaInput').value = '';
  }
  if (id === 'bookingPage') {
    if (!isSessionValid()) {
      alert('Please login first or session expired!');
      showPage('loginPage');
      return;
    }
  }
}

// Generate captcha and store it
function generateCaptcha(containerId) {
  const captcha = Math.random().toString(36).substring(2, 8).toUpperCase();
  localStorage.setItem(containerId + '_captcha', captcha);
  document.getElementById(containerId).innerText = `Captcha: ${captcha}`;
}

// Register user (store in localStorage)
function register() {
  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  const inputCaptcha = document.getElementById('regCaptchaInput').value.trim().toUpperCase();
  const storedCaptcha = localStorage.getItem(regCaptchaId + '_captcha');

  if (!username || !email || !password) {
    alert('Please fill all fields');
    return;
  }
  if (inputCaptcha !== storedCaptcha) {
    alert('Incorrect captcha!');
    generateCaptcha(regCaptchaId);
    return;
  }

  // Check if user already exists
  if (localStorage.getItem('user_' + username)) {
    alert('Username already exists! Please login or choose another.');
    return;
  }

  const userData = { username, email, password };
  localStorage.setItem('user_' + username, JSON.stringify(userData));

  alert('Registration successful! Please login.');
  showPage('loginPage');
}

// Login user and start session
function login() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const inputCaptcha = document.getElementById('loginCaptchaInput').value.trim().toUpperCase();
  const storedCaptcha = localStorage.getItem(loginCaptchaId + '_captcha');

  if (!username || !password) {
    alert('Please enter username and password');
    return;
  }
  if (inputCaptcha !== storedCaptcha) {
    alert('Invalid captcha');
    generateCaptcha(loginCaptchaId);
    return;
  }

  const userStr = localStorage.getItem('user_' + username);
  if (!userStr) {
    alert('User does not exist. Please register.');
    return;
  }

  const user = JSON.parse(userStr);
  if (user.password !== password) {
    alert('Incorrect password');
    return;
  }

  // Set session
  const now = Date.now();
  localStorage.setItem('loggedInUser', username);
  localStorage.setItem('sessionStart', now);

  alert(`Welcome, ${username}!`);
  showPage('bookingPage');
  resetBookingInputs();
}

// Logout user (not hooked to UI but can be added)
function logout() {
  localStorage.removeItem('loggedInUser');
  localStorage.removeItem('sessionStart');
  alert('Logged out!');
  showPage('loginPage');
}

// Check session validity
function isSessionValid() {
  const sessionStart = localStorage.getItem('sessionStart');
  if (!sessionStart) return false;
  return (Date.now() - sessionStart) < SESSION_DURATION;
}

// Auto logout after session expiry
setInterval(() => {
  if (!isSessionValid() && localStorage.getItem('loggedInUser')) {
    alert('Session expired. Please login again.');
    logout();
  }
}, 60000);

// Populate time slots dropdown 24 hours format, eg: 9 AM - 10 AM, ... 8 AM - 9 AM next day
const timeSlotDropdown = document.getElementById('timeSlot');
const timeSlots = [];
for (let i = 9; i < 33; i++) { // 9 to 32 to cover 9AM today to 8AM next day (24 slots)
  const startHour = i % 24;
  const endHour = (i + 1) % 24;
  timeSlots.push(`${formatTime(startHour)} - ${formatTime(endHour)}`);
}
timeSlots.forEach(slot => {
  const opt = document.createElement('option');
  opt.value = slot;
  opt.textContent = slot;
  timeSlotDropdown.appendChild(opt);
});
function formatTime(h) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12} ${ampm}`;
}

// Booking storage key helper
function getBookingKey(date, slot) {
  return `bookings_${date}_${slot}`;
}

// Get bookings array for given date and slot
function getBookings(date, slot) {
  return JSON.parse(localStorage.getItem(getBookingKey(date, slot))) || Array(totalSlots).fill(null);
}

// Save bookings array
function saveBookings(date, slot, bookings) {
  localStorage.setItem(getBookingKey(date, slot), JSON.stringify(bookings));
}

const slotsContainer = document.getElementById('slots');

function renderSlots() {
  const date = document.getElementById('bookingDate').value;
  const slot = timeSlotDropdown.value;

  if (!date) {
    alert('Please select a date');
    return;
  }

  // Prevent booking past dates
  const today = new Date();
  const selectedDate = new Date(date + "T00:00:00");
  selectedDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  if (selectedDate < today) {
    alert('Cannot book for past dates!');
    return;
  }

  slotsContainer.innerHTML = '';

  const bookings = getBookings(date, slot);

  for (let i = 0; i < totalSlots; i++) {
    const div = document.createElement('div');
    const bookedUser = bookings[i];

    div.className = bookedUser ? 'slot booked' : 'slot available';
    div.textContent = bookedUser ? `Slot ${i + 1}\n${bookedUser}` : `Slot ${i + 1}`;

    if (!bookedUser) {
      div.onclick = () => {
        const currentUser = localStorage.getItem('loggedInUser');
        if (!currentUser) {
          alert('Please login to book slots!');
          showPage('loginPage');
          return;
        }
        if (confirm(`Book Slot ${i + 1}?`)) {
          bookings[i] = currentUser;
          saveBookings(date, slot, bookings);
          renderSlots();
          showPage('thankYouPage');
          setTimeout(() => showPage('bookingPage'), 3000);
        }
      };
    }
    slotsContainer.appendChild(div);
  }
}

// Admin panel functions
function showAllBookings() {
  if (!isSessionValid()) {
    alert('Please login first!');
    showPage('loginPage');
    return;
  }
  const output = document.getElementById('allBookings');
  output.innerHTML = '';

  let hasBookings = false;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key.startsWith('bookings_')) continue;

    const bookings = JSON.parse(localStorage.getItem(key));
    const rows = bookings
      .map((user, idx) => {
        if (!user) return null;
        return `<li>Slot ${idx + 1}: ${user} 
                  <button onclick="cancelBooking('${key}', ${idx})">Cancel</button>
                </li>`;
      })
      .filter(Boolean)
      .join('');

    if (rows) {
      hasBookings = true;
      output.innerHTML += `<div><strong>${key.replace('bookings_', '').replace('_', ' | ')}</strong><ul>${rows}</ul></div>`;
    }
  }

  if (!hasBookings) output.innerHTML = '<p>No bookings found.</p>';
}

function cancelBooking(key, idx) {
  if (!confirm('Cancel this booking?')) return;
  const bookings = JSON.parse(localStorage.getItem(key));
  bookings[idx] = null;
  localStorage.setItem(key, JSON.stringify(bookings));
  showAllBookings();
}

// Reset booking inputs on page load or after booking
function resetBookingInputs() {
  document.getElementById('bookingDate').value = '';
  timeSlotDropdown.selectedIndex = 0;
  slotsContainer.innerHTML = '';
}

// Initialize with login page and generate captchas
showPage('loginPage');
