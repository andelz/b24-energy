export interface SolarLogEntry {
  year: number;
  month: number;
  /** overall generated energy by PV in kWh */
  generatedByPV: number;
  /** overall consumption of the month in kWh */
  consumedByAppliances: number;
  /** energy fed to the grid in kWh */
  fedToGrid: number;
  /** percentage of overall energy consumption covered by PV */
  consuptionCoverageByPV: number;
}

export interface MeterReadingEntry {
  /** ISO date yyyy-mm-dd */
  date: string;
  /** current main-meter consumption */
  mainConsumed: number;
  /** current main-meter fed-to-grid */
  mainFedToGrid: number;
  /** current value of the sub-meter for own flat */
  own: number;
  /** current value of the sub-meter for neighbour flat */
  neighbour: number;
}

export interface EnergyData {
  version: number;
  solarLogs: SolarLogEntry[];
  meterReadings: MeterReadingEntry[];
}

export interface CaptureReportEntry {
  total: number;
  pv: number;
  grid: number;
}

export interface CaptureReport {
  consumption: CaptureReportEntry;
  production: CaptureReportEntry;
}

export interface MeterReport {
  fromGrid: number;
  wp: number;
  wpOwn: number;
  wpNeighbour: number;
  own: number;
  neighbour: number;
}

export interface EnergyReportRow {
  grid: number;
  pv: number;
}

export interface EnergyReportSummary {
  whg: EnergyReportRow;
  wp: EnergyReportRow;
  total: EnergyReportRow;
}

export interface EnergyReport {
  totalConsumption: number;
  pvPercentage: number;
  gridConsumption: number;
  gridWP: number;
  gridOwn: number;
  gridNeighbour: number;
  gridOwnWP: number;
  gridNeighbourWP: number;
  gridTotalOwn: number;
  gridTotalNeighbour: number;
  pvTotalWP: number;
  pvTotalOwn: number;
  pvTotalNeighbour: number;
  ownSummary: EnergyReportSummary;
  neighbourSummary: EnergyReportSummary;
  /** €/kWh for energy from the grid */
  priceGrid: number;
  /** €/kWh for energy from the PV */
  pricePV: number;
}
