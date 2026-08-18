import "./styles.css";
import { mountLoadCurve } from "./loadcurve.js";

mountLoadCurve(document.getElementById("loadcurve"));

/* Sections energize as they come into view: the node lights and current
   starts running that segment of the conductor. */
const sections = document.querySelectorAll(".section");
if ("IntersectionObserver" in window) {
  const live = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => e.target.classList.toggle("is-live", e.isIntersecting));
    },
    { rootMargin: "-12% 0px -30% 0px" }
  );
  sections.forEach((s) => live.observe(s));

  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          reveal.unobserve(e.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
  );
  document.querySelectorAll(".reveal").forEach((el) => reveal.observe(el));
} else {
  sections.forEach((s) => s.classList.add("is-live"));
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
}

/* Year in the footer, so it never goes stale. */
document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});
