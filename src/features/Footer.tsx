import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Footer.css";
import Copy from "../components/Copy";

gsap.registerPlugin(ScrollTrigger);

const Footer: React.FC = () => {
  const footerRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: footerRef.current,
        start: "top bottom",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          const yValue = -35 * (1 - self.progress);
          gsap.set(containerRef.current, { y: `${yValue}%` });
        },
      });
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer className="site-footer" ref={footerRef}>
      <div className="footer-wrapper" ref={containerRef}>
        <div className="footer-inner">
          <div className="footer-row">
            <div className="footer-col">
              <Copy>
                <h2>
                  Bringing imagination to <br />
                  life with 3D
                </h2>
              </Copy>
            </div>
          </div>

          <div className="footer-row">
            <Copy><p>3D Pool Enclosures</p></Copy>
            <Copy><p>Built by NoxHD</p></Copy>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
