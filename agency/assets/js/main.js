/* Wildcard — creative studio template. Small, dependency-free enhancements. */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

    // Header border on scroll
    var header = document.querySelector(".site-header");
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 10); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Mobile menu
    var toggle = document.querySelector(".menu-toggle"), links = document.getElementById("nav-links");
    var setMenu = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.querySelector("span").textContent = open ? "Close" : "Menu";
      links.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", function () { setMenu(toggle.getAttribute("aria-expanded") !== "true"); });
    links.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && links.classList.contains("open")) { setMenu(false); toggle.focus(); } });
    window.addEventListener("resize", function () { if (window.innerWidth > 860) setMenu(false); });

    // Scroll reveal
    var items = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in-view"); io.unobserve(en.target); } });
      }, { threshold: 0.1 });
      items.forEach(function (el) { io.observe(el); });
    } else {
      items.forEach(function (el) { el.classList.add("in-view"); });
    }

    // Work filters
    var filterBtns = document.querySelectorAll("[data-filter]");
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var f = btn.dataset.filter;
        filterBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        document.querySelectorAll("#work-list .case").forEach(function (c) {
          c.hidden = !(f === "all" || c.dataset.cat === f);
          c.classList.add("in-view");
        });
      });
    });

    // Showreel button (demo)
    var play = document.querySelector(".reel .play");
    if (play) play.addEventListener("click", function () { play.textContent = "Add your video"; });

    // Formspree submissions (contact + newsletter)
    var setFormStatus = function (el, message, isError) {
      if (!el) return;
      el.textContent = message || "";
      el.classList.toggle("is-error", Boolean(message && isError));
      if (el.classList.contains("form-status")) el.classList.toggle("show", Boolean(message));
    };

    var readFormspreeError = function (data, fallback) {
      if (data && Array.isArray(data.errors) && data.errors.length) {
        var messages = data.errors.map(function (error) { return error && error.message; }).filter(Boolean);
        if (messages.length) return messages.join(" ");
      }
      return fallback;
    };

    var bindFormspree = function (form, options) {
      if (!window.fetch || !window.FormData) return;
      form.noValidate = true;

      var submit = form.querySelector('button[type="submit"]');
      var original = submit ? submit.innerHTML : "";
      var sending = false;

      form.addEventListener("submit", function (e) {
        if (sending) { e.preventDefault(); return; }

        if (!options.validate()) {
          e.preventDefault();
          setFormStatus(options.status, options.invalidMessage, true);
          return;
        }

        e.preventDefault();
        sending = true;
        setFormStatus(options.status, "", false);
        if (submit) {
          submit.disabled = true;
          submit.setAttribute("aria-busy", "true");
          submit.innerHTML = options.sendingMessage;
        }

        fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" }
        }).then(function (response) {
          return response.json().catch(function () { return {}; }).then(function (data) {
            if (!response.ok) throw new Error(readFormspreeError(data, options.errorMessage));
            return data;
          });
        }).then(function () {
          setFormStatus(options.status, options.successMessage, false);
          form.reset();
          if (options.clearErrors) options.clearErrors();
        }, function (error) {
          var message = error && error.message ? error.message : options.errorMessage;
          setFormStatus(options.status, message, true);
        }).then(function () {
          sending = false;
          if (submit) {
            submit.disabled = false;
            submit.removeAttribute("aria-busy");
            submit.innerHTML = original;
          }
        });
      });
    };

    var contact = document.getElementById("contact-form");
    if (contact) {
      var contactStatus = contact.querySelector(".form-status");
      bindFormspree(contact, {
        status: contactStatus,
        invalidMessage: "Please check the highlighted fields below.",
        sendingMessage: "Sending…",
        successMessage: "Thanks, your enquiry has been sent. We'll reply within one working day.",
        errorMessage: "Sorry, your message couldn't be sent. Please try again, or email amine.el.assaly.24@gmail.com.",
        validate: function () {
          var valid = true, firstInvalid = null;

          contact.querySelectorAll(".error").forEach(function (error) { error.textContent = ""; });
          contact.querySelectorAll("[aria-invalid]").forEach(function (field) { field.removeAttribute("aria-invalid"); });

          contact.querySelectorAll("input[required]:not([type=radio]), textarea[required]").forEach(function (field) {
            var fieldValid = field.checkValidity();
            if (fieldValid && field.type !== "email" && field.value.trim() === "") fieldValid = false;
            if (!fieldValid) {
              var error = field.parentElement.querySelector(".error");
              if (error) error.textContent = field.type === "email" && field.value.trim() ? "Please enter a valid email address." : "This field is required.";
              field.setAttribute("aria-invalid", "true");
              valid = false;
              firstInvalid = firstInvalid || field;
            }
          });

          var budget = contact.querySelector('input[name="budget"]:checked');
          if (!budget) {
            var requiredBudget = contact.querySelector('input[name="budget"][required]');
            var budgetFieldset = requiredBudget ? requiredBudget.closest("fieldset") : null;
            var budgetError = budgetFieldset ? budgetFieldset.querySelector(".error") : null;
            if (budgetError) budgetError.textContent = "Please choose a budget range.";
            if (firstInvalid === null && requiredBudget) firstInvalid = requiredBudget;
            valid = false;
          }

          if (firstInvalid) firstInvalid.focus();
          return valid;
        },
        clearErrors: function () {
          contact.querySelectorAll(".error").forEach(function (error) { error.textContent = ""; });
          contact.querySelectorAll("[aria-invalid]").forEach(function (field) { field.removeAttribute("aria-invalid"); });
        }
      });
    }

    document.querySelectorAll("form.newsletter").forEach(function (form) {
      var status = form.parentElement ? form.parentElement.querySelector(".form-msg") : null;
      var input = form.querySelector('input[type="email"]');
      bindFormspree(form, {
        status: status,
        invalidMessage: "Please enter a valid email address.",
        sendingMessage: "Subscribing…",
        successMessage: "Thanks! You're subscribed.",
        errorMessage: "Sorry, we couldn't save your subscription. Please try again.",
        validate: function () {
          var valid = Boolean(input && input.checkValidity() && input.value.trim() !== "");
          if (input) {
            input.setAttribute("aria-invalid", String(!valid));
            if (!valid) input.focus();
          }
          return valid;
        },
        clearErrors: function () {
          if (input) input.removeAttribute("aria-invalid");
        }
      });
    });

    // Studio clocks
    var clocks = document.querySelectorAll("time[data-tz]");
    var tick = function () {
      clocks.forEach(function (t) {
        try { t.textContent = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: t.dataset.tz }); } catch (err) { /* keep static */ }
      });
    };
    if (clocks.length) { tick(); setInterval(tick, 30000); }
  });
})();

