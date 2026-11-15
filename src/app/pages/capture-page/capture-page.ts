import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { LucideAngularModule, PlusIcon, TrashIcon } from 'lucide-angular';
import { List, ListItem } from 'omm-ui';
import { SolarLogEntry } from '../../model/app.model';
import { EnergyService } from '../../services/energy.service';

@Component({
  selector: 'energy-capture-page',
  imports: [ReactiveFormsModule, TranslatePipe, LucideAngularModule, List, ListItem, DecimalPipe],
  templateUrl: './capture-page.html',
  styleUrl: './capture-page.scss',
  host: { class: 'energy-list' },
})
export class CapturePage {
  #energy = inject(EnergyService);

  readonly addIcon = PlusIcon;
  readonly deleteIcon = TrashIcon;

  readonly entries = this.#energy.solarLogs;
  readonly editing = signal<SolarLogEntry | null>(null);
  readonly busy = signal(false);

  // selected entries for the summary panel — by default summarise all
  readonly selection = signal<SolarLogEntry[]>([]);
  readonly summary = computed(() => {
    const items = this.selection().length ? this.selection() : this.entries();
    if (!items.length) return null;
    const sum = items.reduce(
      (acc, e) => {
        acc.generated += e.generatedByPV;
        acc.consumed += e.consumedByAppliances;
        acc.fedToGrid += e.fedToGrid;
        acc.coverageWeighted += e.consuptionCoverageByPV;
        return acc;
      },
      { generated: 0, consumed: 0, fedToGrid: 0, coverageWeighted: 0 },
    );
    const coverage = Math.round(sum.coverageWeighted / items.length);
    return {
      generated: Math.round(sum.generated),
      consumed: Math.round(sum.consumed),
      fedToGrid: Math.round(sum.fedToGrid),
      coverage,
    };
  });

  dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly form = new FormGroup({
    year: new FormControl<number | null>(new Date().getFullYear(), [Validators.required]),
    month: new FormControl<number | null>(new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]),
    generatedByPV: new FormControl<number | null>(null, Validators.required),
    consumedByAppliances: new FormControl<number | null>(null, Validators.required),
    fedToGrid: new FormControl<number | null>(null, Validators.required),
    consuptionCoverageByPV: new FormControl<number | null>(null, [Validators.required, Validators.min(0), Validators.max(100)]),
  });

  add() {
    this.editing.set(null);
    this.form.reset({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      generatedByPV: null,
      consumedByAppliances: null,
      fedToGrid: null,
      consuptionCoverageByPV: null,
    });
    this.dialog().nativeElement.showModal();
  }

  edit(entry: SolarLogEntry) {
    this.editing.set(entry);
    this.form.setValue({
      year: entry.year,
      month: entry.month,
      generatedByPV: entry.generatedByPV,
      consumedByAppliances: entry.consumedByAppliances,
      fedToGrid: entry.fedToGrid,
      consuptionCoverageByPV: entry.consuptionCoverageByPV,
    });
    this.dialog().nativeElement.showModal();
  }

  cancel() {
    this.dialog().nativeElement.close();
  }

  async submit() {
    if (this.form.invalid) return;
    this.busy.set(true);
    try {
      const v = this.form.value;
      await this.#energy.saveSolarLog({
        year: v.year!,
        month: v.month!,
        generatedByPV: v.generatedByPV!,
        consumedByAppliances: v.consumedByAppliances!,
        fedToGrid: v.fedToGrid!,
        consuptionCoverageByPV: v.consuptionCoverageByPV!,
      });
      this.dialog().nativeElement.close();
    } finally {
      this.busy.set(false);
    }
  }

  async remove(entry: SolarLogEntry, event: Event) {
    event.stopPropagation();
    await this.#energy.deleteSolarLog(entry.year, entry.month);
  }

  onSelectionChange(items: readonly SolarLogEntry[]) {
    this.selection.set([...items]);
  }
}
