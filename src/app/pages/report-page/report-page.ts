import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { EnergyReport, EnergyReportSummary } from '../../model/app.model';
import { EnergyService } from '../../services/energy.service';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'energy-report-page',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './report-page.html',
  styleUrl: './report-page.scss',
})
export class ReportPage {
  #energy = inject(EnergyService);
  #report = inject(ReportService);

  reportElement = viewChild<ElementRef<HTMLElement>>('reportContainer');

  meterData = this.#energy.meterReadings;
  solarData = this.#energy.solarLogs;

  hasData = computed(() => this.solarData().length > 0 || this.meterData().length > 0);

  report = signal<EnergyReport | null>(null);

  reportForm = new FormGroup({
    meterFrom: new FormControl<string>('', Validators.required),
    meterTo: new FormControl<string>('', Validators.required),
    solarFrom: new FormControl<string>('', Validators.required),
    solarTo: new FormControl<string>('', Validators.required),
    priceGrid: new FormControl<number>(27.8, Validators.required),
    pricePV: new FormControl<number>(20, Validators.required),
  });

  generateReport() {
    if (this.reportForm.invalid) return;

    const idxStart = this.solarData().findIndex(
      (s) => `${s.year}-${s.month}` === this.reportForm.value.solarFrom,
    );
    const idxEnd = this.solarData().findIndex(
      (s) => `${s.year}-${s.month}` === this.reportForm.value.solarTo,
    );
    const start = Math.min(idxStart, idxEnd);
    const end = Math.max(idxStart, idxEnd);
    const solarEntries = this.solarData().slice(start, end + 1);

    const sReport = this.#report.generateSolarReport(solarEntries);
    const mReport = this.#report.generateMeterReport(
      this.meterData().filter((m) =>
        [this.reportForm.value.meterFrom, this.reportForm.value.meterTo].includes(m.date),
      ),
    );

    const pvPercentage = sReport.consumption.pv;
    const gridTotalNeighbour = mReport.neighbour + mReport.wpNeighbour;
    const gridTotalOwn = mReport.own + mReport.wpOwn;
    const gridWP = mReport.wp;

    const pvTotalWP = Math.round((gridWP * pvPercentage) / 100);
    const pvTotalOwn = Math.round((gridTotalOwn * pvPercentage) / 100);
    const pvTotalNeighbour = Math.round((gridTotalNeighbour * pvPercentage) / 100);

    this.report.set({
      totalConsumption: sReport.consumption.total,
      pvPercentage,
      gridConsumption: mReport.fromGrid,
      gridWP,
      gridOwn: mReport.own,
      gridNeighbour: mReport.neighbour,
      gridOwnWP: mReport.wpOwn,
      gridNeighbourWP: mReport.wpNeighbour,
      gridTotalNeighbour,
      gridTotalOwn,
      pvTotalWP,
      pvTotalOwn,
      pvTotalNeighbour,
      ownSummary: this.#summarize(mReport.own, mReport.wpOwn, pvPercentage),
      neighbourSummary: this.#summarize(mReport.neighbour, mReport.wpNeighbour, pvPercentage),
      priceGrid: this.reportForm.value.priceGrid! / 100,
      pricePV: this.reportForm.value.pricePV! / 100,
    });
  }

  async downloadPdf() {
    const re = this.reportElement();
    if (!re) return;
    const el = re.nativeElement;

    // Loaded on demand: together they are most of the bundle, and only PDF export uses them.
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let y = 0;
      while (heightLeft > 0) {
        pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        if (heightLeft > 0) {
          pdf.addPage();
          y -= pageHeight;
        }
      }
    }

    pdf.save('report.pdf');
  }

  round(v: number) {
    return Number(v.toFixed(2));
  }

  #summarize(grid: number, partWP: number, pvPercentage: number): EnergyReportSummary {
    return {
      whg: {
        grid,
        pv: Math.round(this.#getPvValue(grid, pvPercentage)),
      },
      wp: {
        grid: partWP,
        pv: Math.round(this.#getPvValue(partWP, pvPercentage)),
      },
      total: {
        grid: grid + partWP,
        pv: Math.round(this.#getPvValue(partWP + grid, pvPercentage)),
      },
    };
  }

  #getPvValue(value: number, pvPercentage: number): number {
    const valuePercentage = 100 - pvPercentage;
    if (valuePercentage <= 0) return 0;
    const whole = value / (valuePercentage / 100);
    return whole - value;
  }
}
