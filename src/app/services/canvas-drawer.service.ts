import { Injectable, ElementRef } from '@angular/core';
import { DefectBox } from './comparison.service';

@Injectable({
    providedIn: 'root'
})
export class CanvasDrawerService {
    draw(
        canvasRef: ElementRef<HTMLCanvasElement>,
        imageFile: File,
        defects: DefectBox[]
    ): void {
        if (!canvasRef) return;

        const canvas = canvasRef.nativeElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const reader = new FileReader();

        reader.onload = (e: any) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                this.renderCanvas(canvas, ctx, img, defects);
            };
        };

        if (imageFile) {
            reader.readAsDataURL(imageFile);
        }
    }

    private renderCanvas(
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        img: HTMLImageElement,
        defects: DefectBox[]
    ): void {
        const displayWidth = 300;
        const ratio = displayWidth / img.width;

        canvas.width = displayWidth;
        canvas.height = (img.height * ratio) || 150;

        // Draw Image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Draw Bounding Boxes
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';

        (defects || []).forEach(defect => {
            const x = defect.x * ratio;
            const y = defect.y * ratio;
            const w = defect.width * ratio;
            const h = defect.height * ratio;

            ctx.strokeRect(x, y, w, h);
            ctx.fillRect(x, y, w, h);

            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.fillText(defect.type.toUpperCase(), x + 2, y + 10);
        });
    }
}
