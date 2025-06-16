document.addEventListener('DOMContentLoaded', () => {
  const slots = ['Slot 1', 'Slot 2', 'Slot 3', 'Slot 4', 'Slot 5'];
  const slotSelect = document.getElementById('slot');
  const slotsList = document.getElementById('slotsList');

  if (slotSelect) {
    slots.forEach(slot => {
      const option = document.createElement('option');
      option.value = slot;
      option.textContent = slot;
      slotSelect.appendChild(option);
    });

    document.getElementById('bookingForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const selectedSlot = slotSelect.value;
      localStorage.setItem('bookedSlot', selectedSlot);
      window.location.href = 'confirm.html';
    });
  }

  if (slotsList) {
    slots.forEach(slot => {
      const li = document.createElement('li');
      li.textContent = slot;
      slotsList.appendChild(li);
    });
  }
});
