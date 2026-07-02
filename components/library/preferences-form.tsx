"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getUserPreferences, saveUserPreferences } from "@/lib/local-state";
import type { UserPreferences } from "@/lib/types";

const interestOptions = ["monuments", "history", "architecture", "churches", "museums", "viewpoints", "public art", "markets", "cafes", "scenic", "quiet", "waterfront", "nature"];
const accessibilityOptions = ["avoid stairs", "wide sidewalks", "step-free stops", "benches nearby", "low traffic crossings"];
const locationOptions: Array<{ label: string; value: UserPreferences["locationPermissionStatus"] }> = [
  { label: "Ask when needed", value: "unknown" },
  { label: "Use Montreal as default", value: "manual" },
  { label: "Location available", value: "granted" },
  { label: "Location off", value: "denied" }
];

const defaultPreferenceState: UserPreferences = {
  units: "metric",
  preferredPace: "relaxed",
  interests: ["history", "architecture"],
  preferQuietRoutes: false,
  preferCafes: false,
  preferIndoorRainyDay: false,
  avoidStairs: false,
  accessibilityNeeds: [],
  locationPermissionStatus: "unknown",
  alertPreferences: {
    routeChanges: true,
    accessibility: true,
    weather: false
  }
};

export function PreferencesForm() {
  const [units, setUnits] = useState<UserPreferences["units"]>("metric");
  const [pace, setPace] = useState<UserPreferences["preferredPace"]>("relaxed");
  const [interests, setInterests] = useState<string[]>(["history", "architecture"]);
  const [accessibilityNeeds, setAccessibilityNeeds] = useState<string[]>([]);
  const [preferQuietRoutes, setPreferQuietRoutes] = useState(false);
  const [preferIndoorRainyDay, setPreferIndoorRainyDay] = useState(false);
  const [avoidStairs, setAvoidStairs] = useState(false);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<UserPreferences["locationPermissionStatus"]>("unknown");
  const [alerts, setAlerts] = useState({ routeChanges: true, accessibility: true, weather: false });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const preferences = getUserPreferences();
    setUnits(preferences.units);
    setPace(preferences.preferredPace);
    setInterests(preferences.interests);
    setAccessibilityNeeds(preferences.accessibilityNeeds);
    setPreferQuietRoutes(preferences.preferQuietRoutes);
    setPreferIndoorRainyDay(preferences.preferIndoorRainyDay);
    setAvoidStairs(preferences.avoidStairs);
    setLocationPermissionStatus(preferences.locationPermissionStatus ?? "unknown");
    setAlerts(preferences.alertPreferences ?? alerts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function savePreferences() {
    saveUserPreferences({
      units,
      preferredPace: pace,
      interests,
      preferQuietRoutes,
      preferCafes: interests.includes("cafes"),
      preferIndoorRainyDay,
      avoidStairs,
      accessibilityNeeds,
      locationPermissionStatus,
      alertPreferences: alerts
    });
    setSaved(true);
  }

  function applyPreferenceState(preferences: UserPreferences) {
    setUnits(preferences.units);
    setPace(preferences.preferredPace);
    setInterests(preferences.interests);
    setAccessibilityNeeds(preferences.accessibilityNeeds);
    setPreferQuietRoutes(preferences.preferQuietRoutes);
    setPreferIndoorRainyDay(preferences.preferIndoorRainyDay);
    setAvoidStairs(preferences.avoidStairs);
    setLocationPermissionStatus(preferences.locationPermissionStatus ?? "unknown");
    setAlerts(preferences.alertPreferences ?? defaultPreferenceState.alertPreferences!);
  }

  function resetPreferences() {
    saveUserPreferences(defaultPreferenceState);
    applyPreferenceState(defaultPreferenceState);
    setSaved(true);
  }

  function toggleInterest(interest: string) {
    setSaved(false);
    setInterests((current) => (current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]));
  }

  function toggleAccessibilityNeed(need: string) {
    setSaved(false);
    setAccessibilityNeeds((current) => (current.includes(need) ? current.filter((item) => item !== need) : [...current, need]));
  }

  return (
    <form className="space-y-5 rounded-card border border-outline-variant bg-surface-container-lowest p-5 shadow-card">
      <fieldset>
        <legend className="text-label-md text-on-surface">Units</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {["metric", "imperial"].map((option) => (
            <label className="flex items-center gap-2 rounded-control border border-outline-variant p-3 text-body-md" key={option}>
              <input checked={units === option} name="units" onChange={() => { setUnits(option as UserPreferences["units"]); setSaved(false); }} type="radio" />
              {option === "metric" ? "Kilometers" : "Miles"}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-label-md text-on-surface">Optional walking pace</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {["relaxed", "balanced", "brisk"].map((option) => (
            <label className="flex items-center gap-2 rounded-control border border-outline-variant p-3 text-body-md" key={option}>
              <input checked={pace === option} name="pace" onChange={() => { setPace(option as UserPreferences["preferredPace"]); setSaved(false); }} type="radio" />
              {option[0].toUpperCase() + option.slice(1)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-label-md text-on-surface">Favorite place types and themes</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {interestOptions.map((interest) => (
            <button
              className={`rounded-full px-3 py-2 text-label-sm ${interests.includes(interest) ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}
              key={interest}
              onClick={() => toggleInterest(interest)}
              type="button"
            >
              {interest}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-label-md text-on-surface">Accessibility preferences</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="flex items-center justify-between rounded-control border border-outline-variant p-3 text-body-md">
            Prefer quieter discoveries
            <input checked={preferQuietRoutes} onChange={(event) => { setPreferQuietRoutes(event.target.checked); setSaved(false); }} type="checkbox" />
          </label>
          <label className="flex items-center justify-between rounded-control border border-outline-variant p-3 text-body-md">
            Prefer indoor or rainy-day places
            <input checked={preferIndoorRainyDay} onChange={(event) => { setPreferIndoorRainyDay(event.target.checked); setSaved(false); }} type="checkbox" />
          </label>
          <label className="flex items-center justify-between rounded-control border border-outline-variant p-3 text-body-md">
            Avoid stairs where possible
            <input checked={avoidStairs} onChange={(event) => { setAvoidStairs(event.target.checked); setSaved(false); }} type="checkbox" />
          </label>
          {accessibilityOptions.map((option) => (
            <button
              className={`min-h-11 rounded-control border px-3 py-2 text-left text-body-md ${accessibilityNeeds.includes(option) ? "border-primary bg-primary text-on-primary" : "border-outline-variant bg-surface-container-lowest text-on-surface"}`}
              key={option}
              onClick={() => toggleAccessibilityNeed(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-label-md text-on-surface">Location</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {locationOptions.map((option) => (
            <label className="flex items-center gap-2 rounded-control border border-outline-variant p-3 text-body-md" key={option.value}>
              <input checked={locationPermissionStatus === option.value} name="location" onChange={() => { setLocationPermissionStatus(option.value); setSaved(false); }} type="radio" />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-label-md text-on-surface">Local alert preferences</legend>
        <p className="mt-1 text-label-sm text-on-surface-variant">
          Saved on this device with the rest of your discovery preferences.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {[
            ["routeChanges", "Route or place changes"],
            ["accessibility", "Accessibility updates"],
            ["weather", "Weather reminders"]
          ].map(([key, label]) => (
            <label className="flex items-center justify-between gap-3 rounded-control border border-outline-variant p-3 text-body-md" key={key}>
              {label}
              <input
                checked={alerts[key as keyof typeof alerts]}
                onChange={(event) => {
                  setAlerts((current) => ({ ...current, [key]: event.target.checked }));
                  setSaved(false);
                }}
                type="checkbox"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button onClick={savePreferences} type="button">Save preferences</Button>
        <Button onClick={resetPreferences} type="button" variant="secondary">Reset preferences</Button>
        {saved ? <p className="text-label-md text-primary" role="status">Saved for this browser</p> : null}
      </div>
    </form>
  );
}
