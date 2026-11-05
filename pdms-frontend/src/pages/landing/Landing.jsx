import { useEffect, useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_104036_bd6924f6-3c8e-417e-8465-6d03c8c2e9e6.mp4";
const POSTER_SRC =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/82e7eb75-c65f-490a-99b5-f3d1cad54200.webp";

function Arrow() {
  return (
    <svg className="lp-arw" viewBox="0 0 12 10" fill="none" aria-hidden="true">
      <path
        d="M0.8 5h10M7.1 1.4 10.9 5l-3.8 3.6"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Landing() {
  const rootRef = useRef(null);
  const videoA = useRef(null);
  const videoB = useRef(null);

  /* The hero is a locked full-viewport scene; lock scroll only while mounted */
  useLayoutEffect(() => {
    const html = document.documentElement;
    html.classList.add("lp-lock");
    return () => html.classList.remove("lp-lock");
  }, []);

  /* A) ENTRANCE — arms before first paint, runs once, then detaches */
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let started = false;
    let cancelled = false;
    let bootT;
    let safeT;

    root.classList.add("lp-anim");

    const clean = () => {
      clearTimeout(safeT);
      root.removeEventListener("animationend", onEnd, true);
      root.classList.remove("lp-anim", "lp-go");
    };
    const onEnd = (e) => {
      // the single CTA is last on the timeline
      if (e.animationName === "lpPillIn" && e.target.classList.contains("lp-primary")) clean();
    };
    const start = () => {
      if (started || cancelled) return;
      started = true;
      clearTimeout(bootT);
      root.addEventListener("animationend", onEnd, true);
      safeT = setTimeout(clean, 2600);
      root.classList.add("lp-go");
    };

    bootT = setTimeout(start, 900); // ceiling
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start, start);
    else start();

    return () => {
      cancelled = true;
      clearTimeout(bootT);
      clean();
    };
  }, []);

  /* B) BACKGROUND VIDEO — cross-fade two copies at the loop point */
  useEffect(() => {
    const A = videoA.current;
    const B = videoB.current;
    if (!A || !B) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      A.removeAttribute("autoplay");
      A.pause();
      B.pause();
      try {
        A.currentTime = 0;
      } catch {
        /* hold whichever frame is showing */
      }
      return;
    }

    const FADE = 0.9;
    let cur = A;
    let nxt = B;
    let swapping = false;
    let timer;

    const play = (v) => {
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    };
    play(A);

    const tick = () => {
      if (swapping || !cur.duration) return;
      if (cur.duration - cur.currentTime > FADE) return;
      swapping = true;
      const out = cur;
      nxt.currentTime = 0;
      play(nxt);
      nxt.classList.add("is-active");
      out.classList.remove("is-active");
      cur = nxt;
      nxt = out;
      timer = setTimeout(() => {
        out.pause();
        out.currentTime = 0;
        swapping = false;
      }, FADE * 1000 + 100);
    };

    A.addEventListener("timeupdate", tick);
    B.addEventListener("timeupdate", tick);
    return () => {
      clearTimeout(timer);
      A.removeEventListener("timeupdate", tick);
      B.removeEventListener("timeupdate", tick);
    };
  }, []);

  return (
    <main className="lp" ref={rootRef}>
      <div
        className="lp-bg"
        role="img"
        aria-label="Stylised globe of Earth rendered as a yellow and red dot matrix against a starfield, slowly rotating"
      >
        <video
          ref={videoA}
          className="lp-video is-active"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-hidden="true"
          poster={POSTER_SRC}
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
        <video
          ref={videoB}
          className="lp-video"
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-hidden="true"
          poster={POSTER_SRC}
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
      </div>

      <header className="lp-nav">
        <div className="lp-logo">
          <img src="/NORO.png" alt="NORO — Delivery made easy" />
        </div>

      </header>

      <div className="lp-inner">
        <h1 className="lp-h1">
          <span className="lp-ln">
            <span className="lp-lni">Send anything</span>
          </span>
          <span className="lp-ln">
            <span className="lp-lni">around here</span>
          </span>
        </h1>
        <p className="lp-sub">
          From everyday essentials to parcels, send it across Nagercoil and Kanyakumari,
          <br />
          with doorstep pickup, clear fares and live delivery updates,
          <br />
          all within our local service area.
        </p>
        <div className="lp-ctas">
          <Link className="lp-btn lp-btn-lg lp-primary" to="/customer/register">
            Get Started
            <Arrow />
          </Link>
        </div>
      </div>
    </main>
  );
}

export default Landing;
