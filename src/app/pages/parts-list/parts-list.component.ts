import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Part, PartsService } from '../../services/parts.service';
import { Observable, BehaviorSubject, switchMap } from 'rxjs';

@Component({
  selector: 'app-parts-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './parts-list.component.html',
  styleUrls: ['./parts-list.component.css']
})
export class PartsListComponent implements OnInit {
  private partsService = inject(PartsService);

  private refreshList = new BehaviorSubject<void>(undefined);

  public parts$!: Observable<Part[]>;

  ngOnInit(): void {
    this.parts$ = this.refreshList.pipe(
      switchMap(() => this.partsService.getParts())
    );
  }

  onDelete(part: Part): void {
    const confirmDelete = confirm(`Você tem certeza que deseja excluir a peça "${part.name}" (SKU: ${part.sku})?`);

    if (confirmDelete) {
      this.partsService.deletePart(part.id).subscribe({
        next: () => {
          console.log('Peça excluída com sucesso!');
          this.refreshList.next();
        },
        error: (err) => console.error('Erro ao excluir peça:', err)
      });
    }
  }
}