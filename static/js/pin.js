// Handle PIN inputs logic
export function setupPinInputs() {
  const inputs = document.getElementById("inputs");
  if (!inputs) return;

  // Focus first input on load
  const firstInput = inputs.querySelector('.input');
  if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
  }

  inputs.addEventListener("input", function (e) {
      const target = e.target;
      const val = target.value;

      if (isNaN(val)) {
          target.value = "";
          return;
      }

      if (val !== "") {
          const next = target.nextElementSibling;
          if (next) {
              next.focus();
          }
      }
  });

  inputs.addEventListener("keyup", function (e) {
      const target = e.target;
      const key = e.key.toLowerCase();

      if (key === "backspace" || key === "delete") {
          target.value = "";
          const prev = target.previousElementSibling;
          if (prev) {
              prev.focus();
          }
          return;
      }
  });
}

// Get PIN from inputs
export function getPin() {
  const inputs = document.querySelectorAll('.input');
  let pin = '';
  
  inputs.forEach(input => {
      pin += input.value;
  });
  
  return pin;
}

// Reset PIN inputs
export function resetPin() {
  const inputs = document.querySelectorAll('.input');
  inputs.forEach(input => {
      input.value = '';
  });
  
  // Focus first input
  if (inputs.length > 0) {
      inputs[0].focus();
  }
}