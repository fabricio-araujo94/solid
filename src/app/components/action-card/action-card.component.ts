import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-action-card',
  imports: [CommonModule],
  templateUrl: './action-card.component.html',
  styleUrl: './action-card.component.css'
})
export class ActionCardComponent {
  @Input() title: string = "";
  @Input() description: string = "";
  @Input() colorClass: "green" | "blue" | "purple" = "blue";
}
