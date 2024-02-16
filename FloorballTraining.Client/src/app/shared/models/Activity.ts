import { AgeGroup } from "./agegroup";
import { Place } from "./place";
import { Tag } from "./tag";

export interface Activity {
  id: number;
  name: string;
  description: string;
  personsMin: number;
  personsMax: number;
  durationMin: number;
  durationMax: number;
  intensity: number;
  difficulty: number;
  placeWidth: number;
  placeLength: number;
  environment: string;

  tags: Tag[];
  places: Place[];
  ageGroups: AgeGroup[];
}

