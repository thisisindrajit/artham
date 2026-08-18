import {
  ECONOMICS_DEMAND_INTERCEPT,
  ECONOMICS_DEMAND_SLOPE,
  ECONOMICS_SUPPLY_INTERCEPT,
  ECONOMICS_SUPPLY_SLOPE,
} from "./constants";

export function familiesLooking(rent: number): number {
  return ECONOMICS_DEMAND_INTERCEPT - ECONOMICS_DEMAND_SLOPE * rent;
}

export function homesOffered(rent: number): number {
  return ECONOMICS_SUPPLY_INTERCEPT + ECONOMICS_SUPPLY_SLOPE * rent;
}

export function clearingRent(
  demandBoost = 0,
  newHomes = 0,
): number {
  return (
    (ECONOMICS_DEMAND_INTERCEPT +
      demandBoost -
      ECONOMICS_SUPPLY_INTERCEPT -
      newHomes) /
    (ECONOMICS_DEMAND_SLOPE + ECONOMICS_SUPPLY_SLOPE)
  );
}
