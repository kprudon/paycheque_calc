(function () {
  "use strict";

  var OT_THRESHOLD = 80;
  var OT_MULTIPLIER = 1.5;

  var form = document.getElementById("pay-form");
  var hoursInput = document.getElementById("hours");
  var wageInput = document.getElementById("wage");
  var rateInput = document.getElementById("rate");
  var errorBox = document.getElementById("form-error");
  var resultsSection = document.getElementById("results");
  var resetBtn = document.getElementById("reset-btn");

  var out = {
    regularHours: document.getElementById("out-regular-hours"),
    overtimeHours: document.getElementById("out-overtime-hours"),
    regularPay: document.getElementById("out-regular-pay"),
    overtimePay: document.getElementById("out-overtime-pay"),
    grossPay: document.getElementById("out-gross-pay"),
    deductions: document.getElementById("out-deductions"),
    takeHome: document.getElementById("out-take-home"),
  };

  function formatCurrency(amount) {
    return "$" + amount.toFixed(2);
  }

  function formatHours(hours) {
    return hours.toFixed(2) + " hrs";
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
    resultsSection.hidden = true;
  }

  function clearError() {
    errorBox.hidden = true;
    errorBox.textContent = "";
  }

  // Core pay calculation. Exposed on window so it can be unit-tested
  // from the console or a test script without touching the DOM.
  function calculatePay(hours, wage, ratePercent) {
    var regularHours = Math.min(hours, OT_THRESHOLD);
    var overtimeHours = Math.max(hours - OT_THRESHOLD, 0);

    var regularPay = regularHours * wage;
    var overtimePay = overtimeHours * wage * OT_MULTIPLIER;
    var grossPay = regularPay + overtimePay;

    var deductions = grossPay * (ratePercent / 100);
    var takeHome = grossPay - deductions;

    return {
      regularHours: regularHours,
      overtimeHours: overtimeHours,
      regularPay: regularPay,
      overtimePay: overtimePay,
      grossPay: grossPay,
      deductions: deductions,
      takeHome: takeHome,
    };
  }

  function readAndValidateInputs() {
    var hoursRaw = hoursInput.value.trim();
    var wageRaw = wageInput.value.trim();
    var rateRaw = rateInput.value.trim();

    if (hoursRaw === "" || wageRaw === "" || rateRaw === "") {
      return { error: "Please fill in all three fields." };
    }

    var hours = parseFloat(hoursRaw);
    var wage = parseFloat(wageRaw);
    var rate = parseFloat(rateRaw);

    if (isNaN(hours) || isNaN(wage) || isNaN(rate)) {
      return { error: "Please enter valid numbers." };
    }

    if (hours < 0 || wage < 0 || rate < 0) {
      return { error: "Hours, wage, and rate can't be negative." };
    }

    if (rate > 100) {
      return { error: "Tax / deduction rate can't be more than 100%." };
    }

    return { hours: hours, wage: wage, rate: rate };
  }

  function render(result) {
    out.regularHours.textContent = formatHours(result.regularHours);
    out.overtimeHours.textContent = formatHours(result.overtimeHours);
    out.regularPay.textContent = formatCurrency(result.regularPay);
    out.overtimePay.textContent = formatCurrency(result.overtimePay);
    out.grossPay.textContent = formatCurrency(result.grossPay);
    out.deductions.textContent = "-" + formatCurrency(result.deductions);
    out.takeHome.textContent = formatCurrency(result.takeHome);
    resultsSection.hidden = false;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var input = readAndValidateInputs();
    if (input.error) {
      showError(input.error);
      return;
    }

    clearError();
    var result = calculatePay(input.hours, input.wage, input.rate);
    render(result);
  });

  resetBtn.addEventListener("click", function () {
    form.reset();
    clearError();
    resultsSection.hidden = true;
    hoursInput.focus();
  });

  // Register the service worker so the app works offline once installed.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-worker.js").catch(function () {
        // Offline support is a bonus, not a requirement — fail silently.
      });
    });
  }

  // Expose for testing.
  window.calculatePay = calculatePay;
})();
