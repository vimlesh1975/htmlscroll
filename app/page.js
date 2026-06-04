"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Ticker from "./components/Ticker";

const DEFAULT_TEXT =
  "दिल्ली के मालवीय नगर स्थित एक 5 मंजिला होटल में बुधवार को सुबह भीषण आग लगने से 21 लोगों की मौत हो गई। इस घटना को लेकर पुलिस ने केस दर्ज कर लिया है। दिल्ली पुलिस के साथ एमसीडी भी जांच में जुट गई है।";

const CHANNELS = ["1", "2", "3"];
const STORAGE_KEY = "casparcg-scroll-scheduler-settings";

const DEFAULT_CHANNEL_SETTINGS = {
  text: DEFAULT_TEXT,
  layer: "20",
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
  selectedChannels: ["1"],
  activeChannel: "1",
  channelSettings: {
    "1": DEFAULT_CHANNEL_SETTINGS,
    "2": DEFAULT_CHANNEL_SETTINGS,
    "3": DEFAULT_CHANNEL_SETTINGS
  }
};

function normalizeChannelSettings(settings = {}) {
  return CHANNELS.reduce((acc, channel) => {
    acc[channel] = {
      ...DEFAULT_CHANNEL_SETTINGS,
      ...(settings[channel] || {})
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
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [status, setStatus] = useState("Ready.");
  const [cycleState, setCycleState] = useState("idle");
  const [busy, setBusy] = useState(false);
  const cycleTimerRef = useRef(null);
  const cycleActiveRef = useRef(false);

  const activeSettings = channelSettings[activeChannel];

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const legacyChannelSettings = {
        "1": {
          text: saved.text,
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
        selectedChannels,
        activeChannel,
        channelSettings
      })
    );
  }, [
    host,
    port,
    timerMinutes,
    selectedChannels,
    activeChannel,
    channelSettings,
    settingsLoaded
  ]);

  useEffect(() => {
    return () => {
      clearCycleTimer();
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

  function buildTickerUrl(settings) {
    if (typeof window === "undefined") return "";
    const url = new URL("/ticker", window.location.origin);
    url.hostname = host || "127.0.0.1";
    url.searchParams.set("text", settings.text);
    url.searchParams.set("speed", settings.speed);
    url.searchParams.set("fontSize", settings.fontSize);
    url.searchParams.set("height", settings.height);
    url.searchParams.set("bottom", settings.bottom);
    url.searchParams.set("stripColor", settings.stripColor);
    url.searchParams.set("fontColor", settings.fontColor);
    url.searchParams.set("fontFamily", settings.fontFamily);
    return url.toString();
  }

  const tickerUrl = useMemo(
    () => buildTickerUrl(activeSettings),
    [host, activeSettings]
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

  async function sendCommands(action, channelsToUse, settingsByChannel) {
    const results = await Promise.all(
      channelsToUse.map(async (channel) => {
        const settings = settingsByChannel[channel];
        const response = await fetch("/api/caspar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            host,
            port,
            channel,
            layer: settings.layer,
            url: buildTickerUrl(settings)
          })
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

  function clearCycleTimer() {
    cycleActiveRef.current = false;
    if (cycleTimerRef.current) {
      window.clearTimeout(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }
    setCycleState("idle");
  }

  async function sendToCaspar(action) {
    setBusy(true);
    setStatus(`Sending command to CH ${selectedChannels.join(", ")}...`);

    try {
      const channelsSnapshot = [...selectedChannels];
      const settingsSnapshot = JSON.parse(JSON.stringify(channelSettings));

      if (action === "clear") {
        clearCycleTimer();
      }

      const results = await sendCommands(
        action,
        channelsSnapshot,
        settingsSnapshot
      );

      if (action === "play") {
        clearCycleTimer();
        const minutes = Math.max(Number(timerMinutes) || 1, 0.1);
        const intervalMs = minutes * 60 * 1000;
        cycleActiveRef.current = true;
        setCycleState("playing");

        const schedulePlay = () => {
          cycleTimerRef.current = window.setTimeout(async () => {
            if (!cycleActiveRef.current) return;
            try {
              const playResults = await sendCommands(
                "play",
                channelsSnapshot,
                settingsSnapshot
              );
              setStatus(
                `${playResults.join("\n")}\nPlaying for ${minutes} minute(s), then stop again.`
              );
              setCycleState("playing");
              scheduleStop();
            } catch (error) {
              cycleActiveRef.current = false;
              cycleTimerRef.current = null;
              setCycleState("idle");
              setStatus(
                error instanceof Error ? error.message : "Cycle play failed."
              );
            }
          }, intervalMs);
        };

        const scheduleStop = () => {
          cycleTimerRef.current = window.setTimeout(async () => {
            if (!cycleActiveRef.current) return;
            try {
              const stopResults = await sendCommands(
                "clear",
                channelsSnapshot,
                settingsSnapshot
              );
              setStatus(
                `${stopResults.join("\n")}\nStopped for ${minutes} minute(s), then play again.`
              );
              setCycleState("waiting");
              schedulePlay();
            } catch (error) {
              cycleActiveRef.current = false;
              cycleTimerRef.current = null;
              setCycleState("idle");
              setStatus(
                error instanceof Error ? error.message : "Cycle stop failed."
              );
            }
          }, intervalMs);
        };

        scheduleStop();

        setStatus(
          `${results.join("\n")}\nCycle started: play ${minutes} minute(s), stop ${minutes} minute(s), repeat.`
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
            label="Global timer"
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
              ? `Timer active: playing for ${timerMinutes} min`
              : cycleState === "waiting"
                ? `Timer active: stopped for ${timerMinutes} min`
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

          <label className="field">
            <span className="label">Ticker text for CH{activeChannel}</span>
            <textarea
              className="textarea"
              value={activeSettings.text}
              onChange={(event) => updateActiveChannel("text", event.target.value)}
            />
          </label>

          <div className="field-row">
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
            <NumberControl
              label="Speed"
              value={activeSettings.speed}
              onChange={(value) => updateActiveChannel("speed", value)}
              min="10"
              max="84"
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
              Copy CH{activeChannel} URL
            </button>
          </div>

          <div className="status">{status}</div>
        </div>
      </section>

      <section className="preview-panel">
        <div className="preview-frame">
          <Ticker
            text={activeSettings.text}
            speed={activeSettings.speed}
            fontSize={activeSettings.fontSize}
            height={activeSettings.height}
            bottom={activeSettings.bottom}
            stripColor={activeSettings.stripColor}
            fontColor={activeSettings.fontColor}
            fontFamily={activeSettings.fontFamily}
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
