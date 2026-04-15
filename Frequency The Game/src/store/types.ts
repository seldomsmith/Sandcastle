export interface GridSquare {
  x: number;
  y: number;
  population: number;
  allPurposeRatio: number;
  commuterRatio: number;
  serviceCapacity: number;
  catchmentMultiplier: number;
}

export interface GridState {
  cells: GridSquare[];
  width: number;
  height: number;
  generation: number; // increments on every mutation so useEffect can detect changes
}
