"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_VANTA_BIRDS_CONFIG,
  type VantaBirdsConfig,
} from "@/lib/vanta-config";
import { VantaBirds } from "@/components/vanta/VantaBirds";
import { upsertSettingAction } from "@/lib/admin/actions";
import type { SiteSettingRow } from "@/lib/cms/types";

export function VantaSettingsCard({
  existingSetting,
  isAdmin,
}: {
  existingSetting?: SiteSettingRow | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  // Initialize from site_settings row if present, or use defaults
  const initialConfig: VantaBirdsConfig = existingSetting?.value && typeof existingSetting.value === "object"
    ? { ...DEFAULT_VANTA_BIRDS_CONFIG, ...(existingSetting.value as Partial<VantaBirdsConfig>) }
    : DEFAULT_VANTA_BIRDS_CONFIG;

  const [config, setConfig] = useState<VantaBirdsConfig>(initialConfig);

  const updateField = <K extends keyof VantaBirdsConfig>(key: K, val: VantaBirdsConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await upsertSettingAction({
        key: "vanta.birds_config",
        value: config,
        value_kind: "json",
        description: "Vanta.js BIRDS civic animation parameters (colors, speed, flock size)",
      });

      if (!res.ok) {
        setFeedback({ tone: "err", text: `Failed to save animation settings: ${res.code}` });
      } else {
        setFeedback({ tone: "ok", text: "Vanta BIRDS configuration saved successfully." });
        router.refresh();
      }
    });
  };

  const handleReset = () => {
    setConfig(DEFAULT_VANTA_BIRDS_CONFIG);
  };

  return (
    <div className="rounded-xl border hairline bg-paper p-6 shadow-xs space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b hairline pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-navy">
              Vanta.js BIRDS Animation Engine
            </h3>
            <span className="rounded-full bg-icy-100 px-2.5 py-0.5 font-mono text-[10px] text-navy font-semibold">
              Three.js r121
            </span>
          </div>
          <p className="mt-1 text-xs text-navy/60">
            Configure dynamic flocking simulation used selectively across civic surfaces.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-navy cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => updateField("enabled", e.target.checked)}
              className="h-4 w-4 rounded border-navy text-navy focus:ring-navy"
            />
            Animation Enabled
          </label>
        </div>
      </div>

      {feedback ? (
        <p
          className={`border p-3 text-xs ${
            feedback.tone === "ok" ? "border-navy/20 bg-icy-100 text-navy" : "border-berry/30 bg-berry/5 text-berry"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Controls form */}
        <div className="lg:col-span-7 space-y-5">
          {/* Colors */}
          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-wider text-navy/50 mb-3">
              Flock Palette & Contrast
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <label className="grid gap-1 text-xs">
                <span className="text-navy font-medium">Primary Bird Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.color1}
                    onChange={(e) => updateField("color1", e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border hairline"
                  />
                  <input
                    value={config.color1}
                    onChange={(e) => updateField("color1", e.target.value)}
                    className="w-24 rounded border hairline px-2 py-1 font-mono text-xs text-navy"
                  />
                </div>
              </label>

              <label className="grid gap-1 text-xs">
                <span className="text-navy font-medium">Wing Accent Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.color2}
                    onChange={(e) => updateField("color2", e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border hairline"
                  />
                  <input
                    value={config.color2}
                    onChange={(e) => updateField("color2", e.target.value)}
                    className="w-24 rounded border hairline px-2 py-1 font-mono text-xs text-navy"
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Simulation parameters */}
          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-wider text-navy/50 mb-3">
              Boid Flocking Dynamics
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-navy">Bird Size</span>
                  <span className="font-mono text-navy/60">{config.birdSize}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={config.birdSize}
                  onChange={(e) => updateField("birdSize", parseFloat(e.target.value))}
                  className="accent-navy"
                />
              </label>

              <label className="grid gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-navy">Wing Span</span>
                  <span className="font-mono text-navy/60">{config.wingSpan}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  step="0.5"
                  value={config.wingSpan}
                  onChange={(e) => updateField("wingSpan", parseFloat(e.target.value))}
                  className="accent-navy"
                />
              </label>

              <label className="grid gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-navy">Flight Speed Limit</span>
                  <span className="font-mono text-navy/60">{config.speedLimit}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="14"
                  step="0.5"
                  value={config.speedLimit}
                  onChange={(e) => updateField("speedLimit", parseFloat(e.target.value))}
                  className="accent-navy"
                />
              </label>

              <label className="grid gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-navy">Flock Density (Quantity)</span>
                  <span className="font-mono text-navy/60">{config.quantity}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={config.quantity}
                  onChange={(e) => updateField("quantity", parseFloat(e.target.value))}
                  className="accent-navy"
                />
              </label>

              <label className="grid gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-navy">Separation</span>
                  <span className="font-mono text-navy/60">{config.separation}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="1"
                  value={config.separation}
                  onChange={(e) => updateField("separation", parseFloat(e.target.value))}
                  className="accent-navy"
                />
              </label>

              <label className="grid gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-navy">Cohesion</span>
                  <span className="font-mono text-navy/60">{config.cohesion}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="1"
                  value={config.cohesion}
                  onChange={(e) => updateField("cohesion", parseFloat(e.target.value))}
                  className="accent-navy"
                />
              </label>
            </div>
          </div>

          {isAdmin ? (
            <div className="flex items-center gap-3 pt-3 border-t hairline">
              <button
                type="button"
                disabled={pending}
                onClick={handleSave}
                className="rounded-full bg-navy px-5 py-2 text-xs font-semibold text-paper shadow-xs hover:bg-navy-600 disabled:opacity-50"
              >
                {pending ? "Saving..." : "Save Animation Settings"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border hairline px-4 py-2 text-xs font-medium text-navy/70 hover:bg-icy-50"
              >
                Reset to Reference Config
              </button>
            </div>
          ) : null}
        </div>

        {/* Live Preview Pane */}
        <div className="lg:col-span-5 flex flex-col">
          <h4 className="font-mono text-[10px] uppercase tracking-wider text-navy/50 mb-2">
            Live Interactive Preview
          </h4>
          <div className="relative aspect-video w-full flex-1 overflow-hidden rounded-xl border hairline bg-navy-900 shadow-inner">
            <VantaBirds
              config={{
                ...config,
                backgroundAlpha: 1.0,
                backgroundColor: "#070d19",
              }}
              className="absolute inset-0"
            />
            {/* Contrast check preview overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-4 pointer-events-none bg-gradient-to-t from-navy-900/90 via-transparent">
              <p className="font-mono text-[9px] uppercase tracking-wider text-icy/70">Text Contrast Check</p>
              <p className="font-display text-sm font-semibold text-paper">CitizenShift · Nonpartisan</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-navy/50">
            Preview mirrors the live flock algorithm with pointer controls and responsive bounding.
          </p>
        </div>
      </div>
    </div>
  );
}

