const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

menuToggle?.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "मेन्यू बंद करें" : "मेन्यू खोलें");
});

mainNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

document.getElementById("year").textContent = new Date().getFullYear();

function prepareShare(form, feedbackId, heading, endpoint, categoryField) {
  const feedback = document.getElementById(feedbackId);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const payload = {
      [categoryField]: String(data.get(categoryField) || "").trim(),
      location: String(data.get("location") || "").trim(),
      consent: form.elements.namedItem("consent")?.checked === true
    };
    if (endpoint === "/api/requests") {
      payload.details = String(data.get("details") || "").trim();
      payload.priority = String(data.get("priority") || "normal");
    }

    const apiBase = String(window.SHIVASHA_API_BASE_URL || "").trim().replace(/\/$/, "");
    if (apiBase) {
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) submitButton.disabled = true;
      feedback.textContent = "आपका अनुरोध सुरक्षित रूप से भेजा जा रहा है…";
      try {
        const response = await fetch(apiBase + endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "अनुरोध भेजा नहीं जा सका।");
        feedback.textContent = result.message || "आपका अनुरोध दर्ज हो गया।";
        form.reset();
      } catch (error) {
        feedback.textContent = error.message || "सर्वर से संपर्क नहीं हो सका। कृपया बाद में प्रयास करें।";
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
      return;
    }

    const lines = [heading];
    for (const [key, value] of data.entries()) {
      if (key !== "consent" && String(value).trim()) lines.push(`${key}: ${String(value).trim()}`);
    }
    const message = lines.join("\n");
    try {
      if (navigator.share) {
        await navigator.share({ title: "Shivasha Seva", text: message });
        feedback.textContent = "शेयर विकल्प खुल गया। कृपया संदेश भेजने से पहले प्राप्तकर्ता की पुष्टि करें।";
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
        feedback.textContent = "संदेश कॉपी हो गया। अब इसे भरोसेमंद स्थानीय सहायता समूह के साथ साझा करें।";
      } else {
        feedback.textContent = message;
      }
    } catch (error) {
      if (error.name !== "AbortError") feedback.textContent = "संदेश तैयार नहीं हो सका। कृपया दोबारा प्रयास करें।";
    }
  });
}

const requestForm = document.getElementById("requestForm");
const volunteerForm = document.getElementById("volunteerForm");
if (requestForm) prepareShare(requestForm, "requestFeedback", "Shivasha Seva — सहायता अनुरोध", "/api/requests", "type");
if (volunteerForm) prepareShare(volunteerForm, "volunteerFeedback", "Shivasha Seva — स्वयंसेवक जुड़ाव", "/api/volunteers", "interest");
