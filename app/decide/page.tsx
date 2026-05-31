"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StepShell from "@/components/wizard/StepShell";
import FamilyStep from "@/components/wizard/FamilyStep";
import MoodStep from "@/components/wizard/MoodStep";
import ConstraintsStep from "@/components/wizard/ConstraintsStep";
import WeatherStep from "@/components/wizard/WeatherStep";
import {
  DEFAULT_FAMILY,
  NAGOYA_DEFAULT,
  loadFamily,
  loadHome,
  loadLastSession,
  saveFamily,
  saveLastSession,
} from "@/lib/storage";
import type {
  Budget,
  Duration,
  FamilyProfile,
  HomeBase,
  Mood,
  SessionChoices,
  Transport,
  TravelTimeRange,
  WeatherSnapshot,
} from "@/lib/types";
import { DEFAULT_TRAVEL_TIME_RANGE, normalizeTravelTimeRange } from "@/lib/types";

const TOTAL_STEPS = 4;

export default function DecidePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [family, setFamily] = useState<FamilyProfile>(DEFAULT_FAMILY);
  const [home, setHome] = useState<HomeBase>(NAGOYA_DEFAULT);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [duration, setDuration] = useState<Duration>("half");
  const [budget, setBudget] = useState<Budget>("low");
  const [transport, setTransport] = useState<Transport>("car");
  const [travelTimeRange, setTravelTimeRange] = useState<TravelTimeRange>(
    DEFAULT_TRAVEL_TIME_RANGE,
  );
  const [preferIndoor, setPreferIndoor] = useState(false);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);

  useEffect(() => {
    setFamily(loadFamily());
    setHome(loadHome());
    const last = loadLastSession<{ choices?: SessionChoices }>();
    if (last?.choices?.travelTimeRange) {
      setTravelTimeRange(normalizeTravelTimeRange(last.choices.travelTimeRange));
    }
    if (last?.choices?.transport) {
      setTransport(last.choices.transport);
    }
  }, []);

  const familyValid = family.members.length > 0;
  const moodsValid = moods.length > 0;

  const nextDisabled = useMemo(() => {
    if (step === 1) return !familyValid;
    if (step === 2) return !moodsValid;
    return false;
  }, [step, familyValid, moodsValid]);

  function goNext() {
    if (step < TOTAL_STEPS) {
      if (step === 1) saveFamily(family);
      setStep(step + 1);
      return;
    }
    const session: SessionChoices = {
      family,
      moods,
      duration,
      budget,
      transport,
      travelTimeRange: normalizeTravelTimeRange(travelTimeRange),
      preferIndoor,
    };
    saveLastSession({ choices: session, weather });
    router.push("/results");
  }

  function goBack() {
    if (step > 1) setStep(step - 1);
  }

  return (
    <>
      {step === 1 && (
        <StepShell
          step={1}
          total={TOTAL_STEPS}
          title="今日は誰と？"
          subtitle="人数を増減してください（前回の構成を読み込んでいます）"
          onNext={goNext}
          nextDisabled={nextDisabled}
        >
          <FamilyStep family={family} onChange={setFamily} />
        </StepShell>
      )}

      {step === 2 && (
        <StepShell
          step={2}
          total={TOTAL_STEPS}
          title="どんな気分？"
          subtitle="複数選べます（最低1つ）"
          onBack={goBack}
          onNext={goNext}
          nextDisabled={nextDisabled}
        >
          <MoodStep selected={moods} onChange={setMoods} />
        </StepShell>
      )}

      {step === 3 && (
        <StepShell
          step={3}
          total={TOTAL_STEPS}
          title="時間と予算"
          subtitle="今日の制約をサクッと"
          onBack={goBack}
          onNext={goNext}
        >
          <ConstraintsStep
            duration={duration}
            budget={budget}
            transport={transport}
            travelTimeRange={travelTimeRange}
            onChange={(next) => {
              if (next.duration) setDuration(next.duration);
              if (next.budget) setBudget(next.budget);
              if (next.transport) setTransport(next.transport);
              if (next.travelTimeRange) setTravelTimeRange(next.travelTimeRange);
            }}
          />
        </StepShell>
      )}

      {step === 4 && (
        <StepShell
          step={4}
          total={TOTAL_STEPS}
          title="今日の天気は？"
          subtitle="自動で取得しています"
          onBack={goBack}
          onNext={goNext}
          nextLabel="行き先を提案してもらう"
        >
          <WeatherStep
            home={home}
            preferIndoor={preferIndoor}
            onChange={({ preferIndoor: p, weather: w }) => {
              setPreferIndoor(p);
              setWeather(w);
            }}
          />
        </StepShell>
      )}
    </>
  );
}
