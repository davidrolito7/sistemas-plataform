import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren, inject, signal } from '@angular/core';
import confetti from 'canvas-confetti';
import { AnimatedHeadingComponent } from '../../components/animated-heading/animated-heading';
import { FadeInComponent } from '../../components/fade-in/fade-in';
import { BirthdayCard, buildBirthdayCards } from '../../interface/birthdays';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [AnimatedHeadingComponent, FadeInComponent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  private readonly apiService = inject(ApiService);
  readonly placeholderPhoto = 'placeholder-avatar.svg';
  readonly birthdayCardSkeletons = Array.from({ length: 4 });
  readonly confettiColors = ['#ff6f61', '#4a90e2', '#50c878', '#ffd166', '#9b5de5'];

  birthdayCards = signal<BirthdayCard[]>([]);
  loadingBirthdays = signal(true);
  private birthdaySectionObserver?: IntersectionObserver;
  private birthdaySectionVisible = false;
  private confettiPassCount = 0;

  @ViewChild('birthdayCarousel') birthdayCarousel?: ElementRef<HTMLDivElement>;
  @ViewChild('birthdaySection') birthdaySection?: ElementRef<HTMLElement>;
  @ViewChildren('autoVideo') autoVideos?: QueryList<ElementRef<HTMLVideoElement>>;

  readonly videoUrl = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4';
  readonly heroTitle = 'Poder Judicial de Estado de Oaxaca.';

  ngOnInit(): void {
    this.getBirthdayInfo();
  }

  ngAfterViewInit(): void {
    this.setupBirthdaySectionObserver();
    this.ensureVideoPlayback();
  }

  ngOnDestroy(): void {
    this.birthdaySectionObserver?.disconnect();
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (!document.hidden) {
      this.ensureVideoPlayback();
    }
  }

  scrollCarousel(direction: 'previous' | 'next'): void {
    const carousel = this.birthdayCarousel?.nativeElement;

    if (!carousel) {
      return;
    }

    const firstCard = carousel.querySelector<HTMLElement>('[data-birthday-card]');
    const scrollAmount = (firstCard?.offsetWidth ?? 320) + 24;

    carousel.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
  }

  get nextBirthday(): BirthdayCard | undefined {
    const cards = this.birthdayCards();
    return cards.find((person) => person.isNext) ?? cards[0];
  }

  getBirthdayInfo(): void {
    this.apiService.getBirthdays().subscribe({
      next: (response) => {
        if (!response?.success || !Array.isArray(response.data)) {
          this.birthdayCards.set([]);
          this.loadingBirthdays.set(false);
          this.triggerConfettiIfReady();
          return;
        }

        this.birthdayCards.set(buildBirthdayCards(response.data));
        this.loadingBirthdays.set(false);
        this.triggerConfettiIfReady();
      },
      error: () => {
        this.birthdayCards.set([]);
        this.loadingBirthdays.set(false);
        this.triggerConfettiIfReady();
      }
    });
  }

  setFallbackPhoto(card: BirthdayCard): void {
    if (!card || card.photoUrl === this.placeholderPhoto) {
      return;
    }

    card.photoUrl = this.placeholderPhoto;
  }

  ensureVideoPlayback(): void {
    this.autoVideos?.forEach((videoRef) => {
      const video = videoRef.nativeElement;

      video.muted = true;
      video.playsInline = true;
      video.loop = true;

      void video.play().catch(() => {
        // Si el navegador bloquea autoplay, el video se reintenta cuando cambia la visibilidad.
      });
    });
  }

  private setupBirthdaySectionObserver(): void {
    const section = this.birthdaySection?.nativeElement;

    if (!section || typeof IntersectionObserver === 'undefined') {
      this.triggerConfettiIfReady(true);
      return;
    }

    this.birthdaySectionObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        this.birthdaySectionVisible = true;
        this.triggerConfettiIfReady();
        return;
      }

      this.birthdaySectionVisible = false;
    }, {
      threshold: 0.35
    });

    this.birthdaySectionObserver.observe(section);
  }

  private triggerConfettiIfReady(forceVisibleCheck = false): void {
    if (this.loadingBirthdays() || this.birthdayCards().length === 0) {
      return;
    }

    const section = this.birthdaySection?.nativeElement;
    if (!forceVisibleCheck && section && typeof IntersectionObserver !== 'undefined') {
      const rect = section.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight * 0.75 && rect.bottom > 0;

      if (!isVisible || !this.birthdaySectionVisible) {
        return;
      }
    }

    this.confettiPassCount += 1;

    if (this.isMobileDevice()) {
      this.launchRealisticLookConfetti();
      return;
    }

    if (this.confettiPassCount === 1) {
      this.launchSchoolPrideConfetti();
      return;
    }

    this.launchRealisticLookConfetti();
  }

  private launchSchoolPrideConfetti(): void {
    const end = Date.now() + 15_000;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: this.confettiColors
      });

      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: this.confettiColors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }

  private launchRealisticLookConfetti(): void {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    const fire = (particleRatio: number, opts: confetti.Options): void => {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    };

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: this.confettiColors
    });
    fire(0.2, {
      spread: 60,
      colors: this.confettiColors
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: this.confettiColors
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: this.confettiColors
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      colors: this.confettiColors
    });
  }

  private isMobileDevice(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia('(max-width: 768px)').matches || navigator.maxTouchPoints > 0;
  }
}
