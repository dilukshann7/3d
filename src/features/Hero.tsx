import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import "./Hero.css";

function horizontalLoop(
  items: Element[],
  config: { repeat?: number; paddingRight?: number; speed?: number } = {},
) {
  const tl = gsap.timeline({
    repeat: config.repeat,
    defaults: { ease: "none" },
  });
  const length = items.length;
  const startX = (items[0] as HTMLElement).offsetLeft;
  const widths: number[] = [];
  const xPercents: number[] = [];
  const pixelsPerSecond = (config.speed || 1) * 100;

  gsap.set(items, {
    xPercent: (i, el) => {
      const w = (widths[i] = parseFloat(
        gsap.getProperty(el, "width", "px") as string,
      ));
      xPercents[i] =
        (parseFloat(gsap.getProperty(el, "x", "px") as string) / w) * 100 +
        (gsap.getProperty(el, "xPercent") as number);
      return xPercents[i];
    },
  });

  gsap.set(items, { x: 0 });

  const lastItem = items[length - 1] as HTMLElement;
  const totalWidth =
    lastItem.offsetLeft +
    (xPercents[length - 1] / 100) * widths[length - 1] -
    startX +
    lastItem.offsetWidth * (gsap.getProperty(lastItem, "scaleX") as number) +
    (config.paddingRight || 0);

  for (let i = 0; i < length; i++) {
    const item = items[i] as HTMLElement;
    const curX = (xPercents[i] / 100) * widths[i];
    const distanceToStart = item.offsetLeft + curX - startX;
    const distanceToLoop =
      distanceToStart +
      widths[i] * (gsap.getProperty(item, "scaleX") as number);

    tl.to(
      item,
      {
        xPercent: ((curX - distanceToLoop) / widths[i]) * 100,
        duration: distanceToLoop / pixelsPerSecond,
      },
      0,
    ).fromTo(
      item,
      { xPercent: ((curX - distanceToLoop + totalWidth) / widths[i]) * 100 },
      {
        xPercent: xPercents[i],
        duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
        immediateRender: false,
      },
      distanceToLoop / pixelsPerSecond,
    );
  }

  tl.progress(1, true).progress(0, true);
  return tl;
}

function setupMarqueeAnimation() {
  const marqueeItems = gsap.utils.toArray<Element>(".marquee h1");
  if (marqueeItems.length > 0) {
    horizontalLoop(marqueeItems, { repeat: -1, paddingRight: 30 });
  }
}

function animateContentIn(
  titleChars: NodeListOf<Element>,
  description: Element | null,
) {
  gsap.to(titleChars, { x: "0%", duration: 0.75, ease: "power4.out" });
  if (description) {
    gsap.to(description, {
      x: 0,
      opacity: 1,
      duration: 0.75,
      delay: 0.1,
      ease: "power4.out",
    });
  }
}

function animateContentOut(
  titleChars: NodeListOf<Element>,
  description: Element | null,
) {
  gsap.to(titleChars, { x: "100%", duration: 0.5, ease: "power4.out" });
  if (description) {
    gsap.to(description, {
      x: "40px",
      opacity: 0,
      duration: 0.5,
      ease: "power4.out",
    });
  }
}

export type CardData = {
  title: string;
  description: string;
  img: string;
  isIntro?: boolean;
  modelId?: string;
};

const CARDS: CardData[] = [
  {
    title: "Abris Sur Mesure",
    description:
      "A sleek, telescopic glass pool enclosure featuring a retractable charcoal aluminum frame for year-round swimming protection.",
    img: "/card-img-1-low.jpg",
    isIntro: true,
    modelId: "abris",
  },
  {
    title: "Moon Deck",
    description:
      "Innovative sliding deck cover with wooden lounge chairs, designed to maximize patio space and protect pools.",
    img: "/card-img-2-low.jpg",
  },
  {
    title: "Antares",
    description:
      "Modern tilt-up pool enclosure with a white aluminum frame, providing easy access and stylish weather protection.",
    img: "/card-img-3-low.jpg",
  },
  {
    title: "Helios",
    description:
      "Contemporary hot tub setup featuring a central wood-paneled spa flanked by two symmetrical, glass-enclosed seating areas.",
    img: "/card-img-4-low.jpg",
    modelId: "helios",
  },
  {
    title: "Draco",
    description:
      "A modern, rotatable dome spa enclosure with a sleek black frame, providing a panoramic, wind-shielded hot tub experience.",
    img: "/card-img-5-low.jpg",
    modelId: "draco",
  },
  {
    title: "Andromeda",
    description:
      "Elegant telescopic glass sunroom featuring a charcoal frame, designed to create a versatile outdoor dining space.",
    img: "/card-img-6-low.jpg",
    modelId: "andromeda",
  },
  {
    title: "Borealis",
    description:
      "Ultra-low profile telescopic pool enclosure with a minimalist gray frame, offering sleek, flat-surface protection and safety.",
    img: "/card-img-7-low.jpg",
    modelId: "borealis",
  },
];

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(SplitText, ScrollTrigger);

    // Lenis smooth scroll
    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    const container = containerRef.current;
    if (!container) return;

    const cards = gsap.utils.toArray<HTMLElement>(".card", container);
    const introCard = cards[0];

    // Split titles
    const titles = gsap.utils.toArray<HTMLElement>(".card-title h1", container);
    titles.forEach((title) => {
      const split = new SplitText(title, {
        type: "chars",
        charsClass: "char",
        tag: "div",
      });
      split.chars.forEach((char) => {
        char.innerHTML = `<span>${char.textContent}</span>`;
      });
    });

    // Intro card image setup
    const cardImgWrapper = introCard.querySelector<HTMLElement>(".card-img");
    const cardImg = introCard.querySelector<HTMLElement>(".card-img img");
    if (cardImgWrapper)
      gsap.set(cardImgWrapper, { scale: 0.5, borderRadius: "400px" });
    if (cardImg) gsap.set(cardImg, { scale: 1.5 });

    const marquee = introCard.querySelector<HTMLElement>(
      ".card-marquee .marquee",
    );
    const titleChars = introCard.querySelectorAll<HTMLElement>(".char span");
    const description =
      introCard.querySelector<HTMLElement>(".card-description");

    // Track revealed state outside DOM to avoid stale property access
    let introRevealed = false;

    // Intro card scroll animation
    ScrollTrigger.create({
      trigger: introCard,
      start: "top top",
      end: "+=300vh",
      onUpdate: (self) => {
        const progress = self.progress;
        const imgScale = 0.5 + progress * 0.5;
        const borderRadius = 400 - progress * 375;
        const innerImgScale = 1.5 - progress * 0.5;

        if (cardImgWrapper)
          gsap.set(cardImgWrapper, {
            scale: imgScale,
            borderRadius: `${borderRadius}px`,
          });
        if (cardImg) gsap.set(cardImg, { scale: innerImgScale });

        if (marquee) {
          if (imgScale >= 0.5 && imgScale <= 0.75) {
            gsap.set(marquee, { opacity: 1 - (imgScale - 0.5) / 0.25 });
          } else if (imgScale < 0.5) {
            gsap.set(marquee, { opacity: 1 });
          } else {
            gsap.set(marquee, { opacity: 0 });
          }
        }

        if (progress >= 1 && !introRevealed) {
          introRevealed = true;
          animateContentIn(titleChars, description);
        }
        if (progress < 1 && introRevealed) {
          introRevealed = false;
          animateContentOut(titleChars, description);
        }
      },
    });

    // Pin each card
    cards.forEach((card, index) => {
      const isLastCard = index === cards.length - 1;
      ScrollTrigger.create({
        trigger: card,
        start: "top top",
        end: isLastCard ? "+=100vh" : "top top",
        endTrigger: isLastCard ? undefined : cards[cards.length - 1],
        pin: true,
        pinSpacing: isLastCard,
      });
    });

    // Scale + fade out preceding cards
    cards.forEach((card, index) => {
      if (index < cards.length - 1) {
        const cardWrapper = card.querySelector<HTMLElement>(".card-wrapper");
        ScrollTrigger.create({
          trigger: cards[index + 1],
          start: "top bottom",
          end: "top top",
          onUpdate: (self) => {
            if (cardWrapper) {
              gsap.set(cardWrapper, {
                scale: 1 - self.progress * 0.25,
                opacity: 1 - self.progress,
              });
            }
          },
        });
      }
    });

    // Image scale-in as card enters
    cards.forEach((card, index) => {
      if (index > 0) {
        const img = card.querySelector<HTMLElement>(".card-img img");
        const imgContainer = card.querySelector<HTMLElement>(".card-img");
        ScrollTrigger.create({
          trigger: card,
          start: "top bottom",
          end: "top top",
          onUpdate: (self) => {
            if (img) gsap.set(img, { scale: 2 - self.progress });
            if (imgContainer)
              gsap.set(imgContainer, {
                borderRadius: `${150 - self.progress * 125}px`,
              });
          },
        });
      }
    });

    // Animate content in/out per card
    cards.forEach((card, index) => {
      if (index === 0) return;
      const cardDescription =
        card.querySelector<HTMLElement>(".card-description");
      const cardTitleChars = card.querySelectorAll<HTMLElement>(".char span");
      ScrollTrigger.create({
        trigger: card,
        start: "top top",
        onEnter: () => animateContentIn(cardTitleChars, cardDescription),
        onLeaveBack: () => animateContentOut(cardTitleChars, cardDescription),
      });
    });

    setupMarqueeAnimation();

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      lenis.destroy();
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, []);

  return (
    <div ref={containerRef}>
      <section className="intro">
        <h1>We design spaces that don&apos;t just exist.</h1>
      </section>

      <section className="cards">
        {CARDS.map((card) => (
          <div className="card" key={card.title}>
            {card.isIntro && (
              <div className="card-marquee">
                <div className="marquee">
                  <h1>Design Beyond Boundaries</h1>
                  <h1>Built for Tomorrow</h1>
                  <h1>Real Impact</h1>
                  <h1>Digital Visions</h1>
                </div>
              </div>
            )}
            <div className="card-wrapper">
              <div className="card-content">
                <div className="card-title">
                  <h1>{card.title}</h1>
                </div>
                <div className="card-description">
                  <p>{card.description}</p>
                  {card.modelId ? (
                    <Link
                      className="card-btn"
                      to="/viewer/$modelId"
                      params={{ modelId: card.modelId }}
                      target="_blank"
                    >
                      Explore Design
                    </Link>
                  ) : (
                    <button className="card-btn">Explore Design</button>
                  )}
                </div>
              </div>
              <div className="card-img">
                <img src={card.img} alt={card.title} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="outro">
        <h1>Architecture reimagined for the virtual age.</h1>
      </section>
    </div>
  );
}
