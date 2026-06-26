import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-fade-in',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fade-in.html'
})
export class FadeInComponent implements OnInit, OnDestroy {
  @Input() delay = 0;
  @Input() duration = 1000;
  @Input() containerClass = '';

  visible = false;
  private timeoutId: number | undefined;

  ngOnInit(): void {
    this.timeoutId = window.setTimeout(() => {
      this.visible = true;
    }, this.delay);
  }

  ngOnDestroy(): void {
    if (this.timeoutId !== undefined) {
      window.clearTimeout(this.timeoutId);
    }
  }
}
