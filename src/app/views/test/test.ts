import { Component } from '@angular/core';
import { Header } from "src/app/core/layout/header/header";

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [Header],
  templateUrl: './test.html',
  styleUrl: './test.css',
})
export class Test {

}
