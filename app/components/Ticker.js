"use client";

const DEFAULT_TEXT =
  "दिल्ली के मालवीय नगर स्थित एक 5 मंजिला होटल में बुधवार को सुबह भीषण आग लगने से 21 लोगों की मौत हो गई। इस घटना को लेकर पुलिस ने केस दर्ज कर लिया है। दिल्ली पुलिस के साथ एमसीडी भी जांच में जुट गई है।";

export default function Ticker({
  text = DEFAULT_TEXT,
  speed = 28,
  fontSize = 42,
  height = 92
}) {
  const safeText = text?.trim() || DEFAULT_TEXT;

  return (
    <div
      className="ticker-stage"
      style={{
        "--ticker-duration": `${Number(speed) || 28}s`,
        "--ticker-size": `${Number(fontSize) || 42}px`,
        "--ticker-height": `${Number(height) || 92}px`
      }}
    >
      <div className="ticker-window" aria-label="Scrolling news ticker">
        <div className="ticker-track">
          <span className="ticker-copy">{safeText}</span>
          <span className="ticker-copy" aria-hidden="true">
            {safeText}
          </span>
        </div>
      </div>
    </div>
  );
}
