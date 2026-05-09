import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const config = {
  gap: 0.08,
  speed: 0.3,
  arcRadius: 500,
};

const spotlightItems = [
  { name: "Silent Arc", img: "/scroll-images/S-0.jpg" },
  { name: "Bloom24", img: "/scroll-images/S-1.jpg" },
  { name: "Glass Fade", img: "/scroll-images/S-2.jpg" },
  { name: "Echo 9", img: "/scroll-images/S-3.jpg" },
  { name: "Velvet Loop", img: "/scroll-images/S-4.jpg" },
  { name: "Field Two", img: "/scroll-images/S-5.jpg" },
  { name: "Pale Thread", img: "/scroll-images/S-6.jpg" },
  { name: "Stillroom", img: "/scroll-images/S-7.jpg" },
  { name: "Ghostline", img: "/scroll-images/S-8.jpg" },
  { name: "Mono 73", img: "/scroll-images/S-9.jpg" },
];

const App = () => {
  const mainRef = useRef(null);
  const titlesContainerRef = useRef(null);
  const titlesRef = useRef([]);
  const imagesRef = useRef([]);

  useGSAP(() => {
    // Initialize Lenis
    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    window.currentActiveIndex = 0;

    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    const arcStartX = containerWidth - 300;
    const arcStartY = -200;
    const arcEndY = containerHeight + 200;
    const arcControlPointX = arcStartX - config.arcRadius;
    const arcControlPointY = containerHeight / 2;

    function getBezierPosition(t) {
      const x = (1 - t) * (1 - t) * arcStartX + 2 * (1 - t) * t * arcControlPointX + t * t * arcStartX;
      const y = (1 - t) * (1 - t) * arcStartY + 2 * (1 - t) * t * arcControlPointY + t * t * arcEndY;
      return { x, y };
    }

    function getImgProgressState(index, overallProgress) {
      const startTime = index * config.gap;
      const endTime = startTime + config.speed;
      if (overallProgress < startTime) return -1;
      if (overallProgress > endTime) return 2;
      return (overallProgress - startTime) / config.speed;
    }

    // Set initial states
    gsap.set(imagesRef.current, { opacity: 0 });
    gsap.set(".spotlight-header", { opacity: 0 });

    ScrollTrigger.create({
      trigger: ".spotlight",
      start: "top top",
      end: `+=${window.innerHeight * 10}px`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;

        if (progress <= 0.2) {
          const animationProgress = progress / 0.2;
          const moveDistance = window.innerWidth * 0.6;
          const introTextElements = document.querySelectorAll(".spotlight-intro-text");

          gsap.set(introTextElements[0], { x: -animationProgress * moveDistance, opacity: 1 });
          gsap.set(introTextElements[1], { x: animationProgress * moveDistance, opacity: 1 });
          gsap.set(".spotlight-bg-img", { scale: animationProgress });
          gsap.set(".spotlight-bg-img img", { scale: 1.5 - animationProgress * 0.5 });

          imagesRef.current.forEach(img => gsap.set(img, { opacity: 0 }));
          const spotlightHeader = document.querySelector(".spotlight-header");
          if (spotlightHeader) spotlightHeader.style.opacity = "0";
          gsap.set(".spotlight-titles-container", { "--before-opacity": "0", "--after-opacity": "0" });

        } else if (progress > 0.2 && progress <= 0.25) {
          gsap.set(".spotlight-bg-img", { scale: 1 });
          gsap.set(".spotlight-bg-img img", { scale: 1 });
          const introTextElements = document.querySelectorAll(".spotlight-intro-text");
          gsap.set(introTextElements, { opacity: 0 });
          imagesRef.current.forEach(img => gsap.set(img, { opacity: 0 }));
          const spotlightHeader = document.querySelector(".spotlight-header");
          if (spotlightHeader) spotlightHeader.style.opacity = "1";
          gsap.set(".spotlight-titles-container", { "--before-opacity": "1", "--after-opacity": "1" });

        } else if (progress > 0.25 && progress <= 0.95) {
          const switchProgress = (progress - 0.25) / 0.7;
          const viewportHeight = window.innerHeight;
          const titlesContainerHeight = titlesContainerRef.current.scrollHeight;
          const startPosition = viewportHeight;
          const targetPosition = -titlesContainerHeight;
          const totalDistance = startPosition - targetPosition;
          const currentY = startPosition - switchProgress * totalDistance;

          gsap.set(".spotlight-titles", { y: currentY, opacity: 1 });

          imagesRef.current.forEach((img, index) => {
            const imgP = getImgProgressState(index, switchProgress);
            if (imgP < 0 || imgP > 1) {
              gsap.set(img, { opacity: 0 });
            } else {
              const pos = getBezierPosition(imgP);
              gsap.set(img, { x: pos.x - 100, y: pos.y - 75, opacity: 1, rotation: (imgP - 0.5) * 30 });
            }
          });

          const viewportMiddle = viewportHeight / 2;
          let closestIndex = 0;
          let closestDistance = Infinity;

          titlesRef.current.forEach((title, index) => {
            if (!title) return;
            const titleRect = title.getBoundingClientRect();
            const titleCenter = titleRect.top + titleRect.height / 2;
            const distanceFromCenter = Math.abs(titleCenter - viewportMiddle);
            if (distanceFromCenter < closestDistance) {
              closestDistance = distanceFromCenter;
              closestIndex = index;
            }
          });

          if (closestIndex !== window.currentActiveIndex) {
            if (titlesRef.current[window.currentActiveIndex]) titlesRef.current[window.currentActiveIndex].style.opacity = "0.25";
            if (titlesRef.current[closestIndex]) titlesRef.current[closestIndex].style.opacity = "1";
            const bgImg = document.querySelector(".spotlight-bg-img img");
            if (bgImg) bgImg.src = spotlightItems[closestIndex].img;
            window.currentActiveIndex = closestIndex;
          }
        } else if (progress > 0.95) {
          const outroProgress = (progress - 0.95) / 0.05;
          const reverseProgress = Math.max(0, 1 - outroProgress);
          const moveDistance = window.innerWidth * 0.6;
          const introTextElements = document.querySelectorAll(".spotlight-intro-text");

          gsap.set(introTextElements[0], { x: -reverseProgress * moveDistance, opacity: 1 });
          gsap.set(introTextElements[1], { x: reverseProgress * moveDistance, opacity: 1 });

          gsap.set(".spotlight-bg-img", { scale: reverseProgress });
          gsap.set(".spotlight-bg-img img", { scale: 1.5 - reverseProgress * 0.5 });

          imagesRef.current.forEach(img => gsap.set(img, { opacity: 0 }));
          const spotlightHeader = document.querySelector(".spotlight-header");
          if (spotlightHeader) spotlightHeader.style.opacity = "0";
          gsap.set(".spotlight-titles-container", { "--before-opacity": "0", "--after-opacity": "0" });
          gsap.set(".spotlight-titles", { opacity: reverseProgress });
        }
      }
    });

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, { scope: mainRef });

  return (
    <div ref={mainRef}>


      <section id='section2' className='spotlight'>
        <div className="spotlight-intro-text-wrapper">
          <div className="spotlight-intro-text">
            <p>A journey of</p>
          </div>
          <div className="spotlight-intro-text">
            <p>transformation</p>
          </div>
        </div>

        <div className='spotlight-bg-img'>
          <img src="/scroll-images/S-0.jpg" alt="" />
        </div>

        <div className='spotlight-titles-container'>
          <div ref={titlesContainerRef} className="spotlight-titles">
            {spotlightItems.map((item, index) => (
              <h1 key={index} ref={el => titlesRef.current[index] = el}>{item.name}</h1>
            ))}
          </div>
        </div>

        <div className="spotlight-images">
          {spotlightItems.map((item, index) => (
            <div key={index} ref={el => imagesRef.current[index] = el} className="spotlight-img">
              <img src={item.img} alt="" />
            </div>
          ))}
        </div>

        <div className="spotlight-header">
          <p>Discover</p>
        </div>
      </section>

      {/* <section id='section3' className="outro">
        <div className='content'>
          <h1>The journey continues...</h1>
        </div>
      </section> */}
    </div>
  );
};

export default App;