"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_TEXT =
  "दिल्ली के मालवीय नगर स्थित एक 5 मंजिला होटल में बुधवार को सुबह भीषण आग लगने से 21 लोगों की मौत हो गई। इस घटना को लेकर पुलिस ने केस दर्ज कर लिया है। दिल्ली पुलिस के साथ एमसीडी भी जांच में जुट गई है।";

function getInitialTiming({ text, speed, fontSize, canvasWidth }) {
  const speedValue = Math.max(Number(speed) || 60, 1);
  const pixelsPerSecond = speedValue * 8;
  const size = Number(fontSize) || 42;
  const outputWidth = Number(canvasWidth) || 1920;
  const estimatedTextWidth = (text?.length || 120) * size * 0.72 + 72;
  const startOffset = outputWidth;
  const distance = estimatedTextWidth + startOffset;

  return {
    duration: Math.max(4, distance / pixelsPerSecond),
    travelDistance: distance
  };
}

export default function Ticker({
  text = DEFAULT_TEXT,
  speed = 28,
  fontSize = 42,
  height = 108,
  bottom = 64,
  canvasWidth = 1920,
  canvasHeight = 1080,
  stripColor = "#f7f7f7",
  fontColor = "#111820",
  fontFamily = "Arial",
  loopCount = 1,
  animate = true
}) {
  const safeText = text?.trim() || DEFAULT_TEXT;
  const initialTiming = getInitialTiming({
    text: safeText,
    speed,
    fontSize,
    canvasWidth
  });
  const trackRef = useRef(null);
  const [duration, setDuration] = useState(initialTiming.duration);
  const [travelDistance, setTravelDistance] = useState(
    initialTiming.travelDistance
  );
  const [viewportWidth, setViewportWidth] = useState(Number(canvasWidth) || 1920);
  const [isFinished, setIsFinished] = useState(false);
  const bottomPx = Number(bottom) || 64;
  const outputWidth = Number(canvasWidth) || 1920;
  const outputHeight = Number(canvasHeight) || 1080;
  const startOffset = animate ? viewportWidth : outputWidth;
  const bottomPercent = `${(bottomPx / outputHeight) * 100}%`;
  const heightPercent = `${((Number(height) || 108) / outputHeight) * 100}%`;
  const bottomViewport = `${(bottomPx / outputHeight) * 100}vh`;
  const heightViewport = `${((Number(height) || 108) / outputHeight) * 100}vh`;
  const fontSizeViewport = `${((Number(fontSize) || 42) / outputHeight) * 100}vh`;
  const loops = Math.max(Math.floor(Number(loopCount) || 1), 1);

  useEffect(() => {
    setIsFinished(false);
  }, [safeText, speed, fontSize, fontFamily, canvasWidth, canvasHeight, loopCount]);

  useEffect(() => {
    if (!animate) {
      setViewportWidth(outputWidth);
      return;
    }

    function syncViewport() {
      const currentWidth = window.innerWidth || outputWidth;
      setViewportWidth(currentWidth);
    }

    syncViewport();
    window.addEventListener("resize", syncViewport);

    return () => {
      window.removeEventListener("resize", syncViewport);
    };
  }, [animate, outputWidth]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const speedValue = Math.max(Number(speed) || 60, 1);
    const pixelsPerSecond = speedValue * 8;
    const firstCopy = track.querySelector(".ticker-copy");
    const copyWidth = firstCopy?.scrollWidth || firstCopy?.offsetWidth || 0;
    const actualWidth = animate && typeof window !== "undefined"
      ? (window.innerWidth || outputWidth)
      : outputWidth;
    const textWidth = copyWidth > 0 ? copyWidth + 72 : (track.scrollWidth || actualWidth);
    const distance = textWidth + actualWidth + 100;
    setTravelDistance(distance);
    setDuration(Math.max(4, distance / pixelsPerSecond));
  }, [safeText, speed, fontSize, fontFamily, outputWidth, viewportWidth, animate]);

  const animationKey = [
    safeText,
    `speed-${speed}`,
    fontSize,
    fontFamily,
    viewportWidth,
    Math.round(duration * 100),
    Math.round(travelDistance)
  ].join("|");

  return (
    <div
      className="ticker-stage"
      style={{
        "--ticker-duration": `${duration}s`,
        "--ticker-size": `${Number(fontSize) || 42}px`,
        "--ticker-size-preview": `${((Number(fontSize) || 42) / outputHeight) * 100}cqh`,
        "--ticker-size-live": fontSizeViewport,
        "--ticker-height": `${Number(height) || 108}px`,
        "--ticker-height-preview": heightPercent,
        "--ticker-height-live": heightViewport,
        "--ticker-canvas-width": animate ? "100vw" : `${outputWidth}px`,
        "--ticker-canvas-height": `${outputHeight}px`,
        "--ticker-bottom": `${bottomPx}px`,
        "--ticker-bottom-preview": bottomPercent,
        "--ticker-bottom-live": bottomViewport,
        "--ticker-strip-color": stripColor,
        "--ticker-font-color": fontColor,
        "--ticker-font-family": fontFamily,
        "--ticker-travel": `${travelDistance}px`,
        "--ticker-start": `${startOffset}px`,
        "--ticker-iterations": loops
      }}
    >
      <div className="ticker-window" aria-label="Scrolling news ticker">
        <div
          className={`ticker-track${animate ? "" : " is-static"}${isFinished ? " is-finished" : ""}`}
          key={animationKey}
          ref={trackRef}
          onAnimationEnd={() => {
            if (animate) {
              setIsFinished(true);
            }
          }}
        >
          <span className="ticker-copy">{safeText}</span>
        </div>
      </div>
    </div>
  );
}
