import { Component, effect, ElementRef, HostListener, inject, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { AppService } from '../../services/app.service';
import { MeterReadingEntry, MeterReportEntry } from '../../model/app.model';
import {
  CellDoubleClickedEvent,
  ColDef,
  IRowNode,
  RowSelectionOptions,
  SelectionChangedEvent,
} from 'ag-grid-community';

@Component({
  selector: 'app-meter-page',
  imports: [AgGridAngular, ReactiveFormsModule],
  templateUrl: './meter-page.html',
  styleUrl: './meter-page.scss',
})
export class MeterPage {
  #appService = inject(AppService);

  rowDataDialog = viewChild.required<ElementRef<HTMLDialogElement>>('row');
  firstInput = viewChild.required<ElementRef<HTMLDialogElement>>('first');

  rowData: MeterReadingEntry[] = [];
  databaseAvailable = this.#appService.databaseAvailable;

  #rdEffect = effect(() => {
    const rd = this.#appService.meterReadings();
    this.rowData = rd || [];
  });

  colDefs: ColDef[] = [
    { field: 'date', editable: true, cellEditor: 'agDateCellEditor' },
    { field: 'mainConsumed', editable: true, cellEditor: 'agNumberCellEditor' },
    { field: 'mainFedToGrid', editable: true, cellEditor: 'agNumberCellEditor' },
    { field: 'own', editable: true, cellEditor: 'agNumberCellEditor' },
    { field: 'neighbour', editable: true, cellEditor: 'agNumberCellEditor' },
  ];

  rowSelection: RowSelectionOptions = {
    mode: 'multiRow',
    enableClickSelection: true,
  };

  rowDataForm = new FormGroup({
    _idx: new FormControl<number | null>(null),
    date: new FormControl<Date | null>(null, Validators.required),
    mainConsumed: new FormControl<number | null>(null, Validators.required),
    mainFedToGrid: new FormControl<number | null>(null, Validators.required),
    own: new FormControl<number | null>(null, Validators.required),
    neighbour: new FormControl<number | null>(null, Validators.required),
  });

  details?: MeterReportEntry;

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

  rowSubmit() {
    const row = this.rowDataForm.value;
    let rd = [...this.rowData];

    // if an _idx is set update
    const idx = row._idx;
    if (idx !== null && idx !== undefined) {
      delete row._idx;
      rd[idx] = row as MeterReadingEntry;
      this.#appService.updateMeterReadings(rd);
      // close the modal
      this.rowDataDialog().nativeElement.close();
    } else {
      rd = [...this.rowData, row as MeterReadingEntry];
      this.#appService.updateMeterReadings(rd);
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

  calculateDetails(nodes: IRowNode<MeterReadingEntry>[]) {
    const selectedEntries: MeterReadingEntry[] = nodes.filter((n) => !!n.data).map((n) => n.data!);
    // const sum: MeterReportEntry = {
    //   fromGrid: 0,
    //   wp: 0,
    //   wpOwn: 0,
    //   wpNeighbour: 0,
    //   own: 0,
    //   neighbour: 0,
    // };

    const mm = this.minMax(selectedEntries);

    const fromGrid = mm.max!.mainConsumed - mm.min!.mainConsumed;
    const own = mm.max!.own - mm.min!.own;
    const neighbour = mm.max!.neighbour - mm.min!.neighbour;

    // selectedEntries.forEach((e) => {
    //   const wp = e.mainConsumed - e.own - e.neighbour;
    //   sum.wp += wp;
    //   sum.own += e.own;
    //   sum.neighbour += e.neighbour;
    // });

    const wp = fromGrid - own - neighbour;
    const wpNeighbour = Math.round((wp / 6) * 2);

    this.details = {
      wp,
      neighbour,
      own,
      fromGrid,
      wpNeighbour,
      wpOwn: wp - wpNeighbour,
    };
  }

  minMax(entries: MeterReadingEntry[]): {
    min: MeterReadingEntry | null;
    max: MeterReadingEntry | null;
  } {
    return entries.reduce(
      (
        acc: { min: MeterReadingEntry | null; max: MeterReadingEntry | null },
        p: MeterReadingEntry
      ) => {
        if (acc.min === null || p.mainConsumed < acc.min.mainConsumed) acc.min = p;
        if (acc.max === null || p.mainConsumed > acc.max.mainConsumed) acc.max = p;
        return acc;
      },
      { min: null, max: null }
    );
  }
}
