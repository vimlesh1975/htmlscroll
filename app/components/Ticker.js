"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_TEXT =
  "दिल्ली के मालवीय नगर स्थित एक 5 मंजिला होटल में बुधवार को सुबह भीषण आग लगने से 21 लोगों की मौत हो गई। इस घटना को लेकर पुलिस ने केस दर्ज कर लिया है। दिल्ली पुलिस के साथ एमसीडी भी जांच में जुट गई है।";

export default function Ticker({
  text = DEFAULT_TEXT,
  speed = 28,
  fontSize = 42,
  height = 108,
  bottom = 64,
  stripColor = "#f7f7f7",
  fontColor = "#111820",
  fontFamily = "Arial",
  animate = true
}) {
  const safeText = text?.trim() || DEFAULT_TEXT;
  const trackRef = useRef(null);
  const [duration, setDuration] = useState(28);
  const [travelDistance, setTravelDistance] = useState(3840);
  const bottomPx = Number(bottom) || 64;
  const bottomPercent = `${(bottomPx / 1080) * 100}%`;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const pixelsPerSecond = Math.max(Number(speed) || 60, 10);
    const width = track.scrollWidth || track.offsetWidth || 1920;
    const distance = width + 1920;
    setTravelDistance(distance);
    setDuration(Math.max(4, distance / pixelsPerSecond));
  }, [safeText, speed, fontSize, fontFamily]);

  return (
    <div
      className="ticker-stage"
      style={{
        "--ticker-duration": `${duration}s`,
        "--ticker-size": `${Number(fontSize) || 42}px`,
        "--ticker-height": `${Number(height) || 108}px`,
        "--ticker-bottom": `${bottomPx}px`,
        "--ticker-bottom-preview": bottomPercent,
        "--ticker-strip-color": stripColor,
        "--ticker-font-color": fontColor,
        "--ticker-font-family": fontFamily,
        "--ticker-travel": `${travelDistance}px`
      }}
    >
      <div className="ticker-window" aria-label="Scrolling news ticker">
        <div
          className={`ticker-track${animate ? "" : " is-static"}`}
          ref={trackRef}
        >
          <span className="ticker-copy">{safeText}</span>
          <span className="ticker-copy" aria-hidden="true">
            {safeText}
          </span>
        </div>
      </div>
    </div>
  );
}
