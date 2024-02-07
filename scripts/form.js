//Form example:
const form = document.querySelector("form");
const feedback_output = document.getElementById("feedback-output");
form.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevents the default form submission behavior
    feedback_output.textContent = "Thank you for submitting."
})