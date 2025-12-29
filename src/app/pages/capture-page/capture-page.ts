import {
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  viewChild,
} from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  IRowNode,
  RowNode,
  type CellDoubleClickedEvent,
  type ColDef,
  type RowSelectionOptions,
  type SelectionChangedEvent,
} from 'ag-grid-community';
import { AppService } from '../../services/app.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CaptureReportEntry, SolarLogEntry } from '../../model/app.model';

@Component({
  selector: 'app-capture-page',
  imports: [AgGridAngular, ReactiveFormsModule],
  templateUrl: './capture-page.html',
  styleUrl: './capture-page.scss',
})
export class CapturePage {
  #appService = inject(AppService);

  rowDataDialog = viewChild.required<ElementRef<HTMLDialogElement>>('row');
  firstInput = viewChild.required<ElementRef<HTMLDialogElement>>('first');

  rowData: SolarLogEntry[] = [];
  databaseAvailable = this.#appService.databaseAvailable;

  #rdEffect = effect(() => {
    const rd = this.#appService.solarLogs();
    this.rowData = rd || [];
  });

  colDefs: ColDef[] = [
    { field: 'year', editable: true, cellEditor: 'agNumberCellEditor' },
    { field: 'month', editable: true, cellEditor: 'agNumberCellEditor' },
    { field: 'generatedByPV', editable: true, cellEditor: 'agNumberCellEditor' },
    { field: 'consumedByAppliances', editable: true, cellEditor: 'agNumberCellEditor' },
    { field: 'fedToGrid', editable: true, cellEditor: 'agNumberCellEditor' },
    { field: 'consuptionCoverageByPV', editable: true, cellEditor: 'agNumberCellEditor' },
  ];

  rowSelection: RowSelectionOptions = {
    mode: 'multiRow',
    enableClickSelection: true,
  };

  rowDataForm = new FormGroup({
    _idx: new FormControl<number | null>(null),
    year: new FormControl<number | null>(null, Validators.required),
    month: new FormControl<number | null>(null, Validators.required),
    generatedByPV: new FormControl<number | null>(null, Validators.required),
    consumedByAppliances: new FormControl<number | null>(null, Validators.required),
    fedToGrid: new FormControl<number | null>(null, Validators.required),
    consuptionCoverageByPV: new FormControl<number | null>(null, Validators.required),
  });

  details?: {
    consumption: CaptureReportEntry;
    production: CaptureReportEntry;
  };

  @HostListener('window:keydown.+', ['$event'])
  handleKeyDown(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    this.add();
  }

  add() {
    this.rowDataForm.reset();
    this.rowDataDialog().nativeElement.showModal();
  }

  // rowSubmit() {
  //   this.#appService.updateSolarLogs([...this.rowData, this.rowDataForm.value as SolarLogEntry]);
  //   this.rowDataForm.reset();
  //   this.firstInput().nativeElement.focus();
  // }

  rowSubmit() {
    const row = this.rowDataForm.value;
    let rd = [...this.rowData];

    // if an _idx is set update
    const idx = row._idx;
    if (idx !== null && idx !== undefined) {
      delete row._idx;
      rd[idx] = row as SolarLogEntry;
      this.#appService.updateSolarLogs(rd);
      // close the modal
      this.rowDataDialog().nativeElement.close();
    } else {
      rd = [...this.rowData, row as SolarLogEntry];
      this.#appService.updateSolarLogs(rd);
      this.rowDataForm.reset();
      this.firstInput().nativeElement.focus();
    }
  }

  onCellDoubleClicked(e: CellDoubleClickedEvent) {
    console.log(e.node);
    this.rowDataForm.patchValue({
      ...e.data,
      _idx: e.node.rowIndex,
    });
    this.rowDataDialog().nativeElement.showModal();
  }

  onSelectionChanged(e: SelectionChangedEvent) {
    this.calculateDetails(e.selectedNodes || []);
  }

  calculateDetails(nodes: IRowNode<SolarLogEntry>[]) {
    const selectedEntries: SolarLogEntry[] = nodes.filter((n) => !!n.data).map((n) => n.data!);

    const sum: Partial<SolarLogEntry> = {
      generatedByPV: 0,
      consumedByAppliances: 0,
      fedToGrid: 0,
      consuptionCoverageByPV: 0,
    };

    selectedEntries.forEach((e) => {
      sum.generatedByPV! += e.generatedByPV;
      sum.consumedByAppliances! += e.consumedByAppliances;
      sum.fedToGrid! += e.fedToGrid;
      sum.consuptionCoverageByPV! += e.consuptionCoverageByPV;
    });

    const avg: Partial<SolarLogEntry> = {
      generatedByPV: sum.generatedByPV! / selectedEntries.length,
      consumedByAppliances: sum.consumedByAppliances! / selectedEntries.length,
      fedToGrid: sum.fedToGrid! / selectedEntries.length,
      consuptionCoverageByPV: sum.consuptionCoverageByPV! / selectedEntries.length,
    };

    const pv = Math.round(avg.consuptionCoverageByPV!);
    const consumption: CaptureReportEntry = {
      total: Math.round(sum.consumedByAppliances!),
      pv,
      grid: 100 - pv,
    };

    const grid = Math.round((100 / sum.generatedByPV!) * sum.fedToGrid!);
    const production: CaptureReportEntry = {
      total: sum.generatedByPV!,
      pv: 100 - grid,
      grid,
    };

    this.details = { consumption, production };
  }
}
