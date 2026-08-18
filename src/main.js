import "./styles.css";
import { mountNetLoad } from "./netload.js";

mountNetLoad(document.getElementById("netload"));

/* Current runs the conductor of whichever section you are reading. This is
   the one motion kept: it is the diagram doing what the diagram depicts,
   not a fade-in. */
const sections = document.querySelectorAll(".section");
if ("IntersectionObserver" in window) {
  const live = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => e.target.classList.toggle("is-live", e.isIntersecting));
    },
    { rootMargin: "-12% 0px -30% 0px" }
  );
  sections.forEach((s) => live.observe(s));
} else {
  sections.forEach((s) => s.classList.add("is-live"));
}

document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});
