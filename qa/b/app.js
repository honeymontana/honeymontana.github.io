const root = document.documentElement;
const themeToggle = document.querySelector(".theme-toggle");
const themeMeta = document.querySelector('meta[name="theme-color"]');

function syncThemeUI() {
  const isDark = root.classList.contains("dark");
  themeToggle?.setAttribute(
    "aria-label",
    isDark ? "Включить светлую тему" : "Включить тёмную тему",
  );
  themeMeta?.setAttribute("content", isDark ? "#0f0d0e" : "#f7f7f7");
}

themeToggle?.addEventListener("click", () => {
  root.classList.toggle("dark");
  const theme = root.classList.contains("dark") ? "dark" : "light";

  try {
    localStorage.setItem("honey-aqa-theme", theme);
  } catch {
    // Theme switching still works if storage is blocked.
  }

  syncThemeUI();

  if (window.umami && typeof window.umami.track === "function") {
    window.umami.track("qa_theme_toggle", {
      test: "qa_landing_01",
      variant: "b",
      placement: "header",
      theme,
    });
  }
});

syncThemeUI();

const reviewsTrack = document.querySelector(".reviews-track");
const previousReview = document.querySelector(".review-arrow--prev");
const nextReview = document.querySelector(".review-arrow--next");
const reviewCounter = document.querySelector("[data-review-counter]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function reviewStep() {
  const firstCard = reviewsTrack?.querySelector(".review-card");
  if (!firstCard) return 420;
  const trackStyles = getComputedStyle(reviewsTrack);
  const gap = Number.parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;
  return firstCard.getBoundingClientRect().width + gap;
}

function updateReviewCounter() {
  if (!reviewsTrack || !reviewCounter) return;
  const total = reviewsTrack.querySelectorAll(".review-card").length;
  const current = Math.min(
    total,
    Math.max(1, Math.round(reviewsTrack.scrollLeft / reviewStep()) + 1),
  );
  reviewCounter.textContent = `${current} / ${total}`;
  const maxScroll = Math.max(0, reviewsTrack.scrollWidth - reviewsTrack.clientWidth);
  if (previousReview) previousReview.disabled = reviewsTrack.scrollLeft <= 2;
  if (nextReview) nextReview.disabled = reviewsTrack.scrollLeft >= maxScroll - 2;
}

previousReview?.addEventListener("click", () => {
  reviewsTrack?.scrollBy({
    left: -reviewStep(),
    behavior: reducedMotion.matches ? "auto" : "smooth",
  });
});

nextReview?.addEventListener("click", () => {
  reviewsTrack?.scrollBy({
    left: reviewStep(),
    behavior: reducedMotion.matches ? "auto" : "smooth",
  });
});

let reviewFrame;
reviewsTrack?.addEventListener(
  "scroll",
  () => {
    cancelAnimationFrame(reviewFrame);
    reviewFrame = requestAnimationFrame(updateReviewCounter);
  },
  { passive: true },
);

window.addEventListener("resize", updateReviewCounter);
updateReviewCounter();

const campaignParameters = [...new URLSearchParams(window.location.search)].filter(([key]) =>
  key.toLowerCase().startsWith("utm_"),
);

if (campaignParameters.length > 0) {
  document.querySelectorAll("a[data-forward-utm]").forEach((link) => {
    const destination = new URL(link.href);
    campaignParameters.forEach(([key, value]) => {
      destination.searchParams.set(key.toLowerCase(), value);
    });
    link.href = destination.toString();
  });
}

const finalCourseButton = document.querySelector("[data-course-cta-final]");

if (finalCourseButton && "IntersectionObserver" in window) {
  const ctaObserver = new IntersectionObserver(
    (entries, observer) => {
      const isVisible = entries.some(
        (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.75,
      );
      if (!isVisible) return;
      if (window.umami && typeof window.umami.track === "function") {
        window.umami.track("qa_course_cta_seen", {
          test: "qa_landing_01",
          variant: "b",
          placement: "final",
        });
      }
      observer.disconnect();
    },
    { threshold: 0.75 },
  );

  ctaObserver.observe(finalCourseButton);
}
