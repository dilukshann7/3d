import React, { useEffect } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { SplitText } from "gsap/SplitText";

import "./Landing.css";
import Copy from "../components/Copy";

const Landing: React.FC = () => {
  useEffect(() => {
    gsap.registerPlugin(CustomEase, SplitText);

    CustomEase.create("hop", ".8, 0, .3, 1");

    const splitTextElements = (
      selector: string,
      type: string = "words,chars",
      addFirstChar: boolean = false,
    ) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        const splitText = new SplitText(element, {
          type,
          wordsClass: "word",
          charsClass: "char",
        });

        if (type.includes("chars")) {
          splitText.chars.forEach((char, index) => {
            const originalText = char.textContent || "";
            char.innerHTML = `<span>${originalText}</span>`;

            if (addFirstChar && index <= 1) { // ← changed: 0 → <= 1
              char.classList.add("first-char");
            }
          });
        }
      });
    };

    splitTextElements(".intro-title h1", "words, chars", true);
    splitTextElements(".outro-title h1");
    splitTextElements(".tag p", "words");
    splitTextElements(".landing-container .card h1", "words, chars", true);

    const isMobile = window.innerWidth <= 1000;

    gsap.set(
      [
        ".split-overlay .intro-title .first-char span",
        ".split-overlay .outro-title .char span",
      ],
      { y: "0%" },
    );

    gsap.set(".split-overlay .intro-title .first-char", {
      x: isMobile ? "7.5rem" : "18rem",
      y: isMobile ? "-1rem" : "-2.75rem",
      fontWeight: "900",
      scale: 0.75,
    });

    gsap.set(".split-overlay .outro-title .char", {
      x: isMobile ? "-3rem" : "-8rem",
      fontSize: isMobile ? "6rem" : "8rem",
      fontWeight: "500",
    });

    const tl = gsap.timeline({ defaults: { ease: "hop" } });
    const tags = gsap.utils.toArray(".tag");

    tags.forEach((tag, index) => {
      tl.to(
        (tag as HTMLElement).querySelectorAll("p .word"),
        {
          y: "0%",
          duration: 0.75,
        },
        0.5 + index * 0.1,
      );
    });

    tl.to(
      ".preloader .intro-title .char span",
      {
        y: "0%",
        duration: 0.75,
        stagger: 0.05,
      },
      0.5,
    )
      .to(
        ".preloader .intro-title .char:not(.first-char) span",
        {
          y: "100%",
          duration: 0.75,
          stagger: 0.05,
        },
        2,
      )
      .to(
        ".preloader .outro-title .char span",
        {
          y: "0%",
          duration: 0.75,
          stagger: 0.075,
        },
        2.5,
      )
      .to(
        ".preloader .intro-title .first-char",
        {
          x: isMobile ? "9rem" : "9rem",
          duration: 1,
        },
        3.5,
      )
      .to(
        ".preloader .outro-title .char",
        {
          x: isMobile ? "-3rem" : "-8rem",
          duration: 1,
        },
        3.5,
      )
      .to(
        ".preloader .intro-title .first-char",
        {
          x: isMobile ? "7.5rem" : "5rem",
          y: isMobile ? "-1rem" : "-2.75rem",
          fontWeight: "900",
          scale: 0.75,
          duration: 0.75,
        },
        4.5,
      )
      .to(
        ".preloader .outro-title .char",
        {
          x: isMobile ? "-3rem" : "-8rem",
          fontSize: isMobile ? "6rem" : "8rem",
          fontWeight: "500",
          duration: 0.75,
          onComplete: () => {
            gsap.set(".preloader", {
              clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)",
            });
            gsap.set(".split-overlay", {
              clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)",
            });
          },
        },
        4.5,
      )
      .to(
        ".landing-container",
        {
          clipPath: "polygon(0% 48%, 100% 48%, 100% 52%, 0% 52%)",
          duration: 1,
        },
        5,
      );

    tags.forEach((tag, index) => {
      tl.to(
        (tag as HTMLElement).querySelectorAll("p .word"),
        {
          y: "100%",
          duration: 0.75,
        },
        5.5 + index * 0.1,
      );
    });

    tl.to(
      [".preloader", ".split-overlay"],
      {
        y: (i: number) => (i === 0 ? "-50%" : "50%"),
        duration: 1,
      },
      6,
    )
      .to(
        ".landing-container",
        {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          duration: 1,
        },
        6,
      )
      .to(
        ".landing-container .card",
        {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          duration: 0.75,
        },
        6.25,
      )
      .to(
        ".landing-container .card h1 .char span",
        {
          y: "0%",
          duration: 0.75,
          stagger: 0.05,
        },
        6.5,
      );
  }, []);

  return (
    <div className="landing-wrapper">
      <div className="preloader">
        <div className="intro-title">
          <Copy><h1>3D Pool Enclosures</h1></Copy>
        </div>
        <div className="outro-title">
          <Copy><h1>by NoxHD</h1></Copy>
        </div>
      </div>

      <div className="split-overlay">
        <div className="intro-title">
          <Copy><h1>3D Pool Enclosures</h1></Copy>
        </div>
        <div className="outro-title">
          <Copy><h1>by NoxHD</h1></Copy>
        </div>
      </div>

      {/* Tags Overlay */}
      <div className="tags-overlay">
        <div className="tag tag-1">
          <Copy><p>Architectural</p></Copy>
        </div>
        <div className="tag tag-2">
          <Copy><p>Structural</p></Copy>
        </div>
        <div className="tag tag-3">
          <Copy><p>3D Designing</p></Copy>
        </div>
      </div>

      <div className="landing-container">
        <nav>
          <Copy><p id="logo">3D</p></Copy>
          <Copy><p>Architecture</p></Copy>
        </nav>

        <div className="hero-img">
          <img src="/hero-img.jpg" alt="" />
        </div>

        <div className="card">
          <Copy><h1>3D Pool Enclosures</h1></Copy>
        </div>

        <footer>
          <Copy><p>Scroll Down</p></Copy>
          <Copy><p>Made by NoxHD</p></Copy>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
