import { Injectable } from '@angular/core';
import {
  CaptureReport,
  CaptureReportEntry,
  MeterReadingEntry,
  MeterReport,
  SolarLogEntry,
} from '../model/app.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  generateSolarReport(entries: SolarLogEntry[]): CaptureReport {
    const sum: Partial<SolarLogEntry> = {
      generatedByPV: 0,
      consumedByAppliances: 0,
      fedToGrid: 0,
      consuptionCoverageByPV: 0,
    };

    entries.forEach((e) => {
      sum.generatedByPV! += e.generatedByPV;
      sum.consumedByAppliances! += e.consumedByAppliances;
      sum.fedToGrid! += e.fedToGrid;
      sum.consuptionCoverageByPV! += e.consuptionCoverageByPV;
    });

    const count = entries.length || 1;
    const avg: Partial<SolarLogEntry> = {
      generatedByPV: sum.generatedByPV! / count,
      consumedByAppliances: sum.consumedByAppliances! / count,
      fedToGrid: sum.fedToGrid! / count,
      consuptionCoverageByPV: sum.consuptionCoverageByPV! / count,
    };

    const pv = Math.round(avg.consuptionCoverageByPV!);
    const consumption: CaptureReportEntry = {
      total: Math.round(sum.consumedByAppliances!),
      pv,
      grid: 100 - pv,
    };

    const grid = sum.generatedByPV
      ? Math.round((100 / sum.generatedByPV!) * sum.fedToGrid!)
      : 0;
    const production: CaptureReportEntry = {
      total: sum.generatedByPV!,
      pv: 100 - grid,
      grid,
    };

    return { consumption, production };
  }

  generateMeterReport(entries: MeterReadingEntry[]): MeterReport {
    const mm = this.#minMax(entries);
    if (!mm.min || !mm.max) {
      return { fromGrid: 0, wp: 0, wpOwn: 0, wpNeighbour: 0, own: 0, neighbour: 0 };
    }
    const fromGrid = mm.max.mainConsumed - mm.min.mainConsumed;
    const own = mm.max.own - mm.min.own;
    const neighbour = mm.max.neighbour - mm.min.neighbour;

    const wp = fromGrid - own - neighbour;
    const wpNeighbour = Math.round((wp / 6) * 2);

    return {
      wp,
      neighbour,
      own,
      fromGrid,
      wpNeighbour,
      wpOwn: wp - wpNeighbour,
    };
  }

  #minMax(entries: MeterReadingEntry[]): {
    min: MeterReadingEntry | null;
    max: MeterReadingEntry | null;
  } {
    return entries.reduce<{ min: MeterReadingEntry | null; max: MeterReadingEntry | null }>(
      (acc, p) => {
        if (acc.min === null || p.mainConsumed < acc.min.mainConsumed) acc.min = p;
        if (acc.max === null || p.mainConsumed > acc.max.mainConsumed) acc.max = p;
        return acc;
      },
      { min: null, max: null },
    );
  }
}
