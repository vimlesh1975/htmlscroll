"use client";

import { useMemo, useState } from "react";
import Ticker from "./components/Ticker";

const DEFAULT_TEXT =
  "दिल्ली के मालवीय नगर स्थित एक 5 मंजिला होटल में बुधवार को सुबह भीषण आग लगने से 21 लोगों की मौत हो गई। इस घटना को लेकर पुलिस ने केस दर्ज कर लिया है। दिल्ली पुलिस के साथ एमसीडी भी जांच में जुट गई है।";

export default function Home() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [host, setHost] = useState("127.0.0.1");
  const [port, setPort] = useState("5250");
  const [channel, setChannel] = useState("1");
  const [layer, setLayer] = useState("20");
  const [speed, setSpeed] = useState("28");
  const [fontSize, setFontSize] = useState("42");
  const [height, setHeight] = useState("92");
  const [status, setStatus] = useState("Ready.");
  const [busy, setBusy] = useState(false);

  const tickerUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const url = new URL("/ticker", window.location.origin);
    url.hostname = host || "127.0.0.1";
    url.searchParams.set("text", text);
    url.searchParams.set("speed", speed);
    url.searchParams.set("fontSize", fontSize);
    url.searchParams.set("height", height);
    return url.toString();
  }, [host, text, speed, fontSize, height]);

  async function sendToCaspar(action) {
    setBusy(true);
    setStatus("Sending command to CasparCG...");

    try {
      const response = await fetch("/api/caspar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          host,
          port,
          channel,
          layer,
          url: tickerUrl
        })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "CasparCG command failed.");
      }
      setStatus(`${data.command}\n${data.response || "Command sent."}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Command failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="control-shell">
      <section className="control-panel">
        <h1 className="title">CasparCG Hindi Scroll</h1>
        <p className="subtitle">
          Edit the ticker, preview it, then send the React HTML template to
          CasparCG over AMCP.
        </p>

        <div className="form">
          <label className="field">
            <span className="label">Ticker text</span>
            <textarea
              className="textarea"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span className="label">CasparCG host</span>
              <input
                className="input"
                value={host}
                onChange={(event) => setHost(event.target.value)}
              />
            </label>
            <label className="field">
              <span className="label">AMCP port</span>
              <input
                className="input"
                inputMode="numeric"
                value={port}
                onChange={(event) => setPort(event.target.value)}
              />
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span className="label">Channel</span>
              <input
                className="input"
                inputMode="numeric"
                value={channel}
                onChange={(event) => setChannel(event.target.value)}
              />
            </label>
            <label className="field">
              <span className="label">Layer</span>
              <input
                className="input"
                inputMode="numeric"
                value={layer}
                onChange={(event) => setLayer(event.target.value)}
              />
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span className="label">Scroll duration seconds</span>
              <input
                className="input"
                inputMode="numeric"
                value={speed}
                onChange={(event) => setSpeed(event.target.value)}
              />
            </label>
            <label className="field">
              <span className="label">Font size</span>
              <input
                className="input"
                inputMode="numeric"
                value={fontSize}
                onChange={(event) => setFontSize(event.target.value)}
              />
            </label>
          </div>

          <label className="field">
            <span className="label">Ticker height</span>
            <input
              className="input"
              inputMode="numeric"
              value={height}
              onChange={(event) => setHeight(event.target.value)}
            />
          </label>

          <div className="actions">
            <button
              className="button"
              disabled={busy}
              onClick={() => sendToCaspar("play")}
            >
              Play on CasparCG
            </button>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => sendToCaspar("clear")}
            >
              Stop Layer
            </button>
            <button
              className="button ghost"
              type="button"
              onClick={() => navigator.clipboard?.writeText(tickerUrl)}
            >
              Copy URL
            </button>
          </div>

          <div className="status">{status}</div>
        </div>
      </section>

      <section className="preview-panel">
        <div className="preview-frame">
          <Ticker text={text} speed={speed} fontSize={fontSize} height={height} />
        </div>
        <p className="helper">
          Browser output URL: <code>{tickerUrl || "/ticker"}</code>
        </p>
      </section>
    </main>
  );
}
