import { Component, effect, input, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-spinner',
  imports: [],
  templateUrl: './spinner.html',
  styleUrl: './spinner.css',
})
export class Spinner implements OnDestroy {
  readonly message = input('');
  readonly isLoading = input(false);

  private readonly cursorEffect = effect(() => {
    document.body.style.cursor = this.isLoading() ? 'wait' : 'default';
  });

  ngOnDestroy(): void {
    document.body.style.cursor = 'default';
  }
}
