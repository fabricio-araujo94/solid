import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FormBuilder, 
  FormGroup, 
  ReactiveFormsModule, 
  Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PartsService } from '../../services/parts.service';

@Component({
  selector: 'app-part-add',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './part-add.component.html',
  styleUrl: './part-add.component.css'
})
export class PartAddComponent {
  private fb = inject(FormBuilder);
  private partServices = inject(PartsService);
  private router = inject(Router);

  partForm: FormGroup = this.fb.group({
    name: ["", Validators.required],
    sku: ["", Validators.required],
    input_side_image: [null, Validators.required],
    input_front_image: [null, Validators.required],
  });

  onFileSelected(event: Event, controlName: "input_side_image" | "input_front_image"): void {
    const input = event.target as HTMLInputElement;
    if(input.files && input.files.length > 0) {
      const file = input.files[0];
      this.partForm.patchValue({ [controlName]: file });
      this.partForm.get(controlName)?.markAsTouched();
    }

    console.log(this.partForm.value);
  }

  onSubmit(): void {
    if(this.partForm.invalid) {
      this.partForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();

    formData.append("name", this.partForm.get("name")?.value);
    formData.append("sku", this.partForm.get("sku")?.value);
    formData.append("input_side_image", this.partForm.get("inputSideImage")?.value);
    formData.append("input_front_image", this.partForm.get("inputFrontImage")?.value);

    this.partServices.addPart(formData).subscribe({
      next: () => {
        console.log(FormData);
        console.log("Peça cadastrada com sucesso!");
        this.router.navigate(['/list-models']);
      },
      error: (err) => {
        console.error("Erro ao cadastrar peça: ", err);
      }
    })

  }

}
