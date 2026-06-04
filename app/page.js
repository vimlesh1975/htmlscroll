"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Ticker from "./components/Ticker";

const DEFAULT_TEXT =
  "दिल्ली के मालवीय नगर स्थित एक 5 मंजिला होटल में बुधवार को सुबह भीषण आग लगने से 21 लोगों की मौत हो गई। इस घटना को लेकर पुलिस ने केस दर्ज कर लिया है। दिल्ली पुलिस के साथ एमसीडी भी जांच में जुट गई है।";

const CHANNELS = ["1", "2", "3"];
const STORAGE_KEY = "casparcg-scroll-scheduler-settings";
const CHANNEL_FORMATS = {
  HD: { label: "HD 1920x1080", width: "1920", height: "1080" },
  SD: { label: "SD 720x576", width: "720", height: "576" }
};

const DEFAULT_CHANNEL_SETTINGS = {
  layer: "20",
  format: "HD",
  speed: "60",
  fontSize: "42",
  height: "108",
  bottom: "64",
  stripColor: "#f7f7f7",
  fontColor: "#111820",
  fontFamily: "Arial"
};

const DEFAULT_SETTINGS = {
  host: "127.0.0.1",
  port: "5250",
  timerMinutes: "1",
  contentRows: [{ id: 1, selected: true, text: DEFAULT_TEXT }],
  selectedChannels: ["1"],
  activeChannel: "1",
  channelSettings: {
    "1": DEFAULT_CHANNEL_SETTINGS,
    "2": DEFAULT_CHANNEL_SETTINGS,
    "3": DEFAULT_CHANNEL_SETTINGS
  }
};

function getChannelDimensions(format) {
  return CHANNEL_FORMATS[format] || CHANNEL_FORMATS.HD;
}

function inferChannelFormat(settings = {}) {
  if (CHANNEL_FORMATS[settings.format]) return settings.format;
  const width = Number(settings.canvasWidth);
  const height = Number(settings.canvasHeight);
  return width <= 720 || height <= 576 ? "SD" : "HD";
}

function normalizeChannelSettings(settings = {}) {
  return CHANNELS.reduce((acc, channel) => {
    const channelSettings = settings[channel] || {};
    const { canvasWidth, canvasHeight, ...storedSettings } = channelSettings;
    acc[channel] = {
      ...DEFAULT_CHANNEL_SETTINGS,
      ...storedSettings,
      format: inferChannelFormat(channelSettings)
    };
    return acc;
  }, {});
}

function NumberControl({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix
}) {
  return (
    <label className="field numeric-field">
      <span className="label">
        {label}
        <strong>
          {value}
          {suffix}
        </strong>
      </span>
      <input
        className="input"
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export default function Home() {
  const [host, setHost] = useState(DEFAULT_SETTINGS.host);
  const [port, setPort] = useState(DEFAULT_SETTINGS.port);
  const [timerMinutes, setTimerMinutes] = useState(
    DEFAULT_SETTINGS.timerMinutes
  );
  const [contentRows, setContentRows] = useState(DEFAULT_SETTINGS.contentRows);
  const [selectedChannels, setSelectedChannels] = useState(
    DEFAULT_SETTINGS.selectedChannels
  );
  const [activeChannel, setActiveChannel] = useState(
    DEFAULT_SETTINGS.activeChannel
  );
  const [channelSettings, setChannelSettings] = useState(
    DEFAULT_SETTINGS.channelSettings
  );
  const [fontOptions, setFontOptions] = useState([
    DEFAULT_CHANNEL_SETTINGS.fontFamily
  ]);
  const [origin, setOrigin] = useState("");
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [status, setStatus] = useState("Ready.");
  const [cycleState, setCycleState] = useState("idle");
  const [busy, setBusy] = useState(false);
  const cycleDelayTimerRef = useRef(null);
  const channelStopTimersRef = useRef([]);
  const cycleActiveRef = useRef(false);
  const cycleChannelsRef = useRef(DEFAULT_SETTINGS.selectedChannels);
  const cycleSettingsRef = useRef(DEFAULT_SETTINGS.channelSettings);
  const cycleContentRef = useRef(DEFAULT_SETTINGS.content);

  const activeSettings = channelSettings[activeChannel];
  const activeDimensions = getChannelDimensions(activeSettings.format);
  const content = useMemo(
    () =>
      contentRows
        .filter((row) => row.selected && row.text.trim())
        .map((row) => row.text.trim())
        .join(" "),
    [contentRows]
  );

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const legacyText = saved.content || saved.text || DEFAULT_TEXT;
      const legacyChannelSettings = {
        "1": {
          layer: saved.layer,
          speed: saved.speed,
          fontSize: saved.fontSize,
          height: saved.height,
          bottom: saved.bottom,
          stripColor: saved.stripColor,
          fontColor: saved.fontColor,
          fontFamily: saved.fontFamily
        }
      };

      setHost(saved.host || DEFAULT_SETTINGS.host);
      setPort(saved.port || DEFAULT_SETTINGS.port);
      setTimerMinutes(saved.timerMinutes || DEFAULT_SETTINGS.timerMinutes);
      setContentRows(
        Array.isArray(saved.contentRows) && saved.contentRows.length > 0
          ? saved.contentRows
          : [{ id: 1, selected: true, text: legacyText }]
      );
      setSelectedChannels(
        Array.isArray(saved.selectedChannels) && saved.selectedChannels.length > 0
          ? saved.selectedChannels
          : Array.isArray(saved.channels) && saved.channels.length > 0
            ? saved.channels
            : DEFAULT_SETTINGS.selectedChannels
      );
      setActiveChannel(saved.activeChannel || DEFAULT_SETTINGS.activeChannel);
      setChannelSettings(
        normalizeChannelSettings(
          saved.channelSettings ? saved.channelSettings : legacyChannelSettings
        )
      );
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setSettingsLoaded(true);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadFonts() {
      try {
        const response = await fetch("/api/fonts");
        const data = await response.json();
        if (!ignore && Array.isArray(data.fonts) && data.fonts.length > 0) {
          setFontOptions(data.fonts);
        }
      } catch {
        if (!ignore) {
          setFontOptions(["Arial", "Mangal", "Noto Sans Devanagari"]);
        }
      }
    }

    loadFonts();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        host,
        port,
        timerMinutes,
        contentRows,
        selectedChannels,
        activeChannel,
        channelSettings
      })
    );
  }, [
    host,
    port,
    timerMinutes,
    contentRows,
    selectedChannels,
    activeChannel,
    channelSettings,
    settingsLoaded
  ]);

  useEffect(() => {
    return () => {
      clearCycleTimers();
    };
  }, []);

  const visibleFontOptions = useMemo(() => {
    return fontOptions.includes(activeSettings.fontFamily)
      ? fontOptions
      : [activeSettings.fontFamily, ...fontOptions];
  }, [activeSettings.fontFamily, fontOptions]);

  function updateActiveChannel(field, value) {
    setChannelSettings((current) => ({
      ...current,
      [activeChannel]: {
        ...current[activeChannel],
        [field]: value
      }
    }));
  }

  function updateContentRow(id, patch) {
    setContentRows((current) => {
      if (patch.selected) {
        return current.map((row) => ({
          ...row,
          selected: row.id === id
        }));
      }
      if (Object.hasOwn(patch, "selected")) {
        return current;
      }
      return current.map((row) => (row.id === id ? { ...row, ...patch } : row));
    });
  }

  function addContentRow() {
    setContentRows((current) => [
      ...current,
      {
        id: Date.now(),
        selected: current.every((row) => !row.selected),
        text: ""
      }
    ]);
  }

  function removeContentRow(id) {
    setContentRows((current) => {
      const removedWasSelected = current.find((row) => row.id === id)?.selected;
      const next = current.filter((row) => row.id !== id);
      if (next.length === 0) return DEFAULT_SETTINGS.contentRows;
      if (!removedWasSelected) return next;
      return next.map((row, index) => ({ ...row, selected: index === 0 }));
    });
  }

  function buildTickerUrl(settings, text = content) {
    if (!origin) return "";
    const dimensions = getChannelDimensions(settings.format);
    const url = new URL("/ticker", origin);
    url.hostname = host || "127.0.0.1";
    url.searchParams.set("text", text);
    url.searchParams.set("speed", settings.speed);
    url.searchParams.set("fontSize", settings.fontSize);
    url.searchParams.set("height", settings.height);
    url.searchParams.set("bottom", settings.bottom);
    url.searchParams.set("canvasWidth", dimensions.width);
    url.searchParams.set("canvasHeight", dimensions.height);
    url.searchParams.set("stripColor", settings.stripColor);
    url.searchParams.set("fontColor", settings.fontColor);
    url.searchParams.set("fontFamily", settings.fontFamily);
    url.searchParams.set("loopCount", "1");
    url.searchParams.set(
      "v",
      [
        settings.speed,
        text?.length || 0,
        settings.fontSize,
        settings.height,
        settings.bottom,
        settings.format,
        dimensions.width,
        dimensions.height,
        "1"
      ].join("-")
    );
    return url.toString();
  }

  const tickerUrl = useMemo(
    () => buildTickerUrl(activeSettings),
    [origin, host, activeSettings, content]
  );

  function toggleChannel(channel) {
    setSelectedChannels((current) => {
      if (current.includes(channel)) {
        const next = current.filter((item) => item !== channel);
        return next.length > 0 ? next : current;
      }
      return [...current, channel].sort();
    });
  }

  async function sendCommands(
    action,
    channelsToUse,
    settingsByChannel,
    text = content
  ) {
    const results = await Promise.all(
      channelsToUse.map(async (channel) => {
        const settings = settingsByChannel[channel];
        const payload = {
          action,
          host,
          port,
          channel,
          layer: settings.layer
        };

        if (action !== "clear") {
          payload.url = buildTickerUrl(settings, text);
        }

        const response = await fetch("/api/caspar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || `CH ${channel} command failed.`);
        }
        return data.command;
      })
    );
    return results;
  }

  function getPlayDurationMs(settings, text = content) {
    const dimensions = getChannelDimensions(settings.format);
    const speedValue = Math.max(Number(settings.speed) || 60, 1);
    const pixelsPerSecond = speedValue * 8;
    const fontSize = Number(settings.fontSize) || 42;
    const canvasWidth = Number(dimensions.width) || 1920;
    const estimatedTextWidth = (text?.length || 120) * fontSize * 0.72 + 72;
    const startOffset = canvasWidth;
    const distance = estimatedTextWidth + startOffset;
    const secondsPerLoop = Math.max(4, distance / pixelsPerSecond);
    return secondsPerLoop * 1000;
  }

  function clearCycleTimers() {
    cycleActiveRef.current = false;
    if (cycleDelayTimerRef.current) {
      window.clearTimeout(cycleDelayTimerRef.current);
      cycleDelayTimerRef.current = null;
    }
    channelStopTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    channelStopTimersRef.current = [];
    setCycleState("idle");
  }

  async function sendToCaspar(action) {
    setBusy(true);
    setStatus(`Sending command to CH ${selectedChannels.join(", ")}...`);

    try {
      const channelsSnapshot = [...selectedChannels];
      const settingsSnapshot = JSON.parse(JSON.stringify(channelSettings));
      const contentSnapshot = content;

      clearCycleTimers();

      const results = await sendCommands(
        action,
        channelsSnapshot,
        settingsSnapshot,
        contentSnapshot
      );

      if (action === "play") {
        const waitMinutes = Math.max(Number(timerMinutes) || 1, 0.1);
        const waitMs = waitMinutes * 60 * 1000;
        cycleActiveRef.current = true;
        cycleChannelsRef.current = channelsSnapshot;
        cycleSettingsRef.current = settingsSnapshot;
        cycleContentRef.current = contentSnapshot;
        setCycleState("playing");

        const schedulePlay = () => {
          cycleDelayTimerRef.current = window.setTimeout(async () => {
            if (!cycleActiveRef.current) return;
            cycleDelayTimerRef.current = null;
            try {
              const playResults = await sendCommands(
                "play",
                cycleChannelsRef.current,
                cycleSettingsRef.current,
                cycleContentRef.current
              );
              setStatus(
                `${playResults.join("\n")}\nPlaying 1 loop, each channel stops independently.`
              );
              setCycleState("playing");
              scheduleChannelStops();
            } catch (error) {
              clearCycleTimers();
              setCycleState("idle");
              setStatus(
                error instanceof Error ? error.message : "Cycle play failed."
              );
            }
          }, waitMs);
        };

        const scheduleChannelStops = () => {
          const pendingChannels = new Set(cycleChannelsRef.current);
          channelStopTimersRef.current.forEach((timer) =>
            window.clearTimeout(timer)
          );
          channelStopTimersRef.current = cycleChannelsRef.current.map(
            (channel) => {
              const playDurationMs = getPlayDurationMs(
                cycleSettingsRef.current[channel],
                cycleContentRef.current
              );

              return window.setTimeout(async () => {
                if (!cycleActiveRef.current) return;
                try {
                  const stopResults = await sendCommands(
                    "clear",
                    [channel],
                    cycleSettingsRef.current,
                    cycleContentRef.current
                  );
                  pendingChannels.delete(channel);

                  if (pendingChannels.size > 0) {
                    setStatus(
                      `${stopResults.join("\n")}\nWaiting for CH ${[
                        ...pendingChannels
                      ].join(", ")} to finish.`
                    );
                    return;
                  }

                  channelStopTimersRef.current = [];
                  setStatus(
                    `${stopResults.join("\n")}\nAll selected channels stopped. Restarting after ${waitMinutes} minute(s).`
                  );
                  setCycleState("waiting");
                  schedulePlay();
                } catch (error) {
                  clearCycleTimers();
                  setStatus(
                    error instanceof Error ? error.message : "Cycle stop failed."
                  );
                }
              }, playDurationMs);
            }
          );
        };

        scheduleChannelStops();

        setStatus(
          `${results.join("\n")}\nCycle started: play 1 loop, stop each channel at loop finish, wait ${waitMinutes} minute(s), repeat.`
        );
      } else {
        setStatus(`${results.join("\n")}\nCycle stopped.`);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Command failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="control-shell">
      <section className="control-panel">
        <h1 className="title">CasparCG Scroll Scheduler</h1>
        <p className="subtitle">
          Select channels to play, choose one channel to edit, then send each
          channel with its own settings.
        </p>

        <div className="form">
          <div className="actions top-actions">
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
              Copy CH{activeChannel} URL
            </button>
          </div>

          <div className="field">
            <span className="label">
              Global content
              <button className="mini-button" type="button" onClick={addContentRow}>
                Add
              </button>
            </span>
            <div className="content-grid" role="grid">
              <div className="content-grid-head" role="row">
                <span>Use</span>
                <span>Text</span>
                <span />
              </div>
              {contentRows.map((row) => (
                <div className="content-grid-row" role="row" key={row.id}>
                  <input
                    aria-label="Use row"
                    type="checkbox"
                    checked={row.selected}
                    onChange={(event) =>
                      updateContentRow(row.id, {
                        selected: event.target.checked
                      })
                    }
                  />
                  <input
                    className="input"
                    value={row.text}
                    onChange={(event) =>
                      updateContentRow(row.id, { text: event.target.value })
                    }
                  />
                  <button
                    className="icon-button"
                    type="button"
                    aria-label="Remove row"
                    onClick={() => removeContentRow(row.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

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
                type="number"
                value={port}
                onChange={(event) => setPort(event.target.value)}
              />
            </label>
          </div>

          <NumberControl
            label="Restart delay"
            value={timerMinutes}
            onChange={setTimerMinutes}
            min="0.1"
            max="240"
            step="0.1"
            suffix=" min"
          />

          <div className={`timer-badge ${cycleState}`}>
            <span className="timer-dot" />
            {cycleState === "playing"
              ? "Timer active: playing 1 loop"
              : cycleState === "waiting"
                ? `Timer active: waiting ${timerMinutes} min`
                : "Timer inactive"}
          </div>

          <div className="channel-layout">
            <fieldset className="field channel-field">
              <legend className="label">Send to</legend>
              <div className="checkbox-row">
                {CHANNELS.map((channel) => (
                  <label className="check-option" key={channel}>
                    <input
                      type="checkbox"
                      checked={selectedChannels.includes(channel)}
                      onChange={() => toggleChannel(channel)}
                    />
                    CH{channel}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="field">
              <span className="label">Edit channel</span>
              <div className="edit-channel-row">
                {CHANNELS.map((channel) => (
                  <button
                    className={`channel-tab${
                      activeChannel === channel ? " is-active" : ""
                    }`}
                    key={channel}
                    type="button"
                    onClick={() => setActiveChannel(channel)}
                  >
                    CH{channel}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="field-row">
            <label className="field">
              <span className="label">Font family</span>
              <select
                className="input"
                value={activeSettings.fontFamily}
                onChange={(event) =>
                  updateActiveChannel("fontFamily", event.target.value)
                }
              >
                {visibleFontOptions.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="control-grid">
            <label className="field">
              <span className="label">Layer</span>
              <input
                className="input"
                type="number"
                min="1"
                value={activeSettings.layer}
                onChange={(event) =>
                  updateActiveChannel("layer", event.target.value)
                }
              />
            </label>
            <label className="field">
              <span className="label">Channel format</span>
              <select
                className="input"
                value={activeSettings.format}
                onChange={(event) =>
                  updateActiveChannel("format", event.target.value)
                }
              >
                {Object.entries(CHANNEL_FORMATS).map(([format, details]) => (
                  <option key={format} value={format}>
                    {details.label}
                  </option>
                ))}
              </select>
            </label>
            <NumberControl
              label="Speed"
              value={activeSettings.speed}
              onChange={(value) => updateActiveChannel("speed", value)}
              min="1"
              max="100"
              suffix=""
            />
            <NumberControl
              label="Font size"
              value={activeSettings.fontSize}
              onChange={(value) => updateActiveChannel("fontSize", value)}
              min="20"
              max="90"
              suffix="px"
            />
            <NumberControl
              label="Vertical position"
              value={activeSettings.bottom}
              onChange={(value) => updateActiveChannel("bottom", value)}
              min="0"
              max="300"
              suffix="px"
            />
            <NumberControl
              label="Strip height"
              value={activeSettings.height}
              onChange={(value) => updateActiveChannel("height", value)}
              min="60"
              max="180"
              suffix="px"
            />
          </div>

          <div className="field-row">
            <label className="field color-field">
              <span className="label">Strip color</span>
              <input
                className="color-input"
                type="color"
                value={activeSettings.stripColor}
                onChange={(event) =>
                  updateActiveChannel("stripColor", event.target.value)
                }
              />
            </label>
            <label className="field color-field">
              <span className="label">Font color</span>
              <input
                className="color-input"
                type="color"
                value={activeSettings.fontColor}
                onChange={(event) =>
                  updateActiveChannel("fontColor", event.target.value)
                }
              />
            </label>
          </div>

          <div className="status">{status}</div>
        </div>
      </section>

      <section className="preview-panel">
        <div
          className="preview-frame"
          style={{
            "--preview-aspect": `${activeDimensions.width} / ${activeDimensions.height}`
          }}
        >
          <Ticker
            text={content}
            speed={activeSettings.speed}
            fontSize={activeSettings.fontSize}
            height={activeSettings.height}
            bottom={activeSettings.bottom}
            canvasWidth={activeDimensions.width}
            canvasHeight={activeDimensions.height}
            stripColor={activeSettings.stripColor}
            fontColor={activeSettings.fontColor}
            fontFamily={activeSettings.fontFamily}
            loopCount="1"
            animate={false}
          />
        </div>
        <p className="helper">
          CH{activeChannel} output URL: <code>{tickerUrl || "/ticker"}</code>
        </p>
      </section>
    </main>
  );
}
