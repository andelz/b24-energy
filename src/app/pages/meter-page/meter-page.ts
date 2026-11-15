import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { LucideAngularModule, PlusIcon, TrashIcon } from 'lucide-angular';
import { List, ListItem } from 'omm-ui';
import { MeterReadingEntry } from '../../model/app.model';
import { EnergyService } from '../../services/energy.service';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'energy-meter-page',
  imports: [ReactiveFormsModule, TranslatePipe, LucideAngularModule, List, ListItem, DecimalPipe],
  templateUrl: './meter-page.html',
  styleUrl: './meter-page.scss',
  host: { class: 'energy-list' },
})
export class MeterPage {
  #energy = inject(EnergyService);
  #report = inject(ReportService);

  readonly addIcon = PlusIcon;
  readonly deleteIcon = TrashIcon;

  readonly entries = this.#energy.meterReadings;
  readonly editing = signal<MeterReadingEntry | null>(null);
  readonly busy = signal(false);

  readonly selection = signal<MeterReadingEntry[]>([]);
  readonly summary = computed(() => {
    const items = this.selection().length ? this.selection() : this.entries();
    if (items.length < 2) return null;
    return this.#report.generateMeterReport(items);
  });

  dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly form = new FormGroup({
    date: new FormControl<string>(new Date().toISOString().slice(0, 10), Validators.required),
    mainConsumed: new FormControl<number | null>(null, Validators.required),
    mainFedToGrid: new FormControl<number | null>(null, Validators.required),
    own: new FormControl<number | null>(null, Validators.required),
    neighbour: new FormControl<number | null>(null, Validators.required),
  });

  add() {
    this.editing.set(null);
    this.form.reset({
      date: new Date().toISOString().slice(0, 10),
      mainConsumed: null,
      mainFedToGrid: null,
      own: null,
      neighbour: null,
    });
    this.dialog().nativeElement.showModal();
  }

  edit(entry: MeterReadingEntry) {
    this.editing.set(entry);
    this.form.setValue({
      date: entry.date,
      mainConsumed: entry.mainConsumed,
      mainFedToGrid: entry.mainFedToGrid,
      own: entry.own,
      neighbour: entry.neighbour,
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
      await this.#energy.saveMeterReading({
        date: v.date!,
        mainConsumed: v.mainConsumed!,
        mainFedToGrid: v.mainFedToGrid!,
        own: v.own!,
        neighbour: v.neighbour!,
      });
      this.dialog().nativeElement.close();
    } finally {
      this.busy.set(false);
    }
  }

  async remove(entry: MeterReadingEntry, event: Event) {
    event.stopPropagation();
    await this.#energy.deleteMeterReading(entry.date);
  }

  onSelectionChange(items: readonly MeterReadingEntry[]) {
    this.selection.set([...items]);
  }
}
