export interface SolarLogEntry {
  year: number;
  month: number;
  // overall generated energy by PV in kWh
  generatedByPV: number;
  // overall consuption of the month in kWh
  consumedByAppliances: number;
  // energy fed to the grid in kWh
  fedToGrid: number;
  // percentage of the overall energy consuption that was covered by the PV
  consuptionCoverageByPV: number;
}

export interface MeterReadingEntry {
  date: Date;
  // current value for consumption
  mainConsumed: number;
  // current value for fed into grid
  mainFedToGrid: number;
  // current value of the sub-meter for our own flat
  own: number;
  // current value of the sub-meter for neighbour flat
  neighbour: number;
}

export interface AppDB {
  solarLogs: SolarLogEntry[];
  meterReadings: MeterReadingEntry[];
}



export interface CaptureReportEntry {
  total: number;
  pv: number;
  grid: number;
}

export interface MeterReportEntry {
  fromGrid: number;
  wp: number;
  wpOwn: number;
  wpNeighbour: number;
  own: number;
  neighbour: number;
}


