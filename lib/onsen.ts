import type { Place, SessionChoices } from "./types";

export function sessionWantsOnsen(choices: SessionChoices): boolean {
  return choices.moods.includes("onsen");
}

export function isOnsenPlace(place: Place): boolean {
  return place.tags.includes("onsen");
}
