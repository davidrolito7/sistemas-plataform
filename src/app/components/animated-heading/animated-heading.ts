import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

interface AnimatedWord {
  characters: string[];
}

@Component({
  selector: 'app-animated-heading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './animated-heading.html'
})
export class AnimatedHeadingComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) text = '';
  @Input() charDelay = 30;
  @Input() initialDelay = 200;
  @Input() duration = 500;

  lines: AnimatedWord[][] = [];
  visible = false;

  private timeoutId: number | undefined;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['text']) {
      this.lines = this.text.split('\n').map((line) =>
        line.split(' ').map((word) => ({
          characters: Array.from(word)
        }))
      );

      this.restartAnimation();
    }
  }

  ngOnDestroy(): void {
    if (this.timeoutId !== undefined) {
      window.clearTimeout(this.timeoutId);
    }
  }

  getCharacterDelay(lineIndex: number, wordIndex: number, charIndex: number): number {
    return this.initialDelay + (lineIndex * 10 + wordIndex * 5 + charIndex) * this.charDelay;
  }

  trackByIndex(index: number): number {
    return index;
  }

  private restartAnimation(): void {
    this.visible = false;

    if (this.timeoutId !== undefined) {
      window.clearTimeout(this.timeoutId);
    }

    this.timeoutId = window.setTimeout(() => {
      this.visible = true;
    }, 25);
  }
}
