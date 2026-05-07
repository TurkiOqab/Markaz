import { useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AlertsBell } from "./AlertsBell";
import { BackgroundShape } from "./BackgroundShape";
import { NavRail } from "./NavRail";

export function AppLayout() {
  // Slide-in animation runs only once, on the first render after navigation
  // from the login transition. After that, internal navigation should not
  // re-trigger the slide.
  const location = useLocation();
  const animatedOnce = useRef(false);
  const shouldAnimateIn =
    (location.state as { animateIn?: boolean } | null)?.animateIn === true &&
    !animatedOnce.current;
  if (shouldAnimateIn) animatedOnce.current = true;

  return (
    // NOTE: keep this wrapper free of `transform` / `will-change-transform`.
    // CSS spec: a transformed ancestor becomes the containing block for any
    // descendant `position: fixed`, which would re-anchor the NavRail and
    // AlertsBell to this wrapper instead of the viewport — they'd then scroll
    // with the page. The slide-in animation lives on <main> only.
    // `isolate` creates a stacking context so the shape's z-index: -1 stays
    // behind all sibling content (NavRail, main, cards, etc.) without
    // disappearing behind the body background.
    <div className="relative isolate min-h-screen">
      {/* Brand silhouette — fixed to the viewport so it stays in place while
          the user scrolls. zIndex: -1 keeps it strictly behind every other
          element in this stacking context (positioned and static alike). */}
      <BackgroundShape
        className="fixed -bottom-56 -right-56 h-[1200px] w-[1200px]"
        color="#103e1f"
        opacity={0.22}
        zIndex={-1}
      />
      <NavRail />
      <AlertsBell />
      <main
        className={`mx-auto min-h-screen w-full max-w-[1600px] overflow-x-hidden px-4 py-5 pe-[88px] sm:px-5 sm:pe-[104px] md:px-6 md:py-6 md:pe-[136px] lg:pe-[176px] xl:pe-[200px] ${shouldAnimateIn ? "animate-app-slide-in will-change-transform" : ""}`}
      >
        <Outlet />
      </main>
    </div>
  );
}
