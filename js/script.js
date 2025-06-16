document.addEventListener('DOMContentLoaded', () => {
  const slotsContainer = document.getElementById('slots-container');
  const slots = [
    { id: 1, price: 10 },
    { id: 2, price: 10 },
    { id: 3, price: 10 }
  ];

  slots.forEach(slot => {
    const div = document.createElement('div');
    div.innerHTML = `Slot ${slot.id} - ₹${slot.price}/hour`;
    slotsContainer.appendChild(div);
  });
});
