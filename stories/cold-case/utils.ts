import {
  BIOLOGY_CITY_POPULATION,
  BIOLOGY_MARKER_SHARE,
} from "./constants";

export function matchingPool(markers: number): number {
  return BIOLOGY_CITY_POPULATION * Math.pow(BIOLOGY_MARKER_SHARE, markers);
}
