import { Component } from '@angular/core';
import { IonButton } from '@ionic/angular';

@Component({
  selector: 'app-administrador',
  standalone: true,
  imports: [IonButton],
  template: `
    <h1>Panel administrador</h1>
    <p>Resumen de la plataforma · Datos de demostración</p>

    <div class="resumen">
      <article><strong>12</strong><span>Clientes</span></article>
      <article><strong>4</strong><span>Conductores</span></article>
      <article><strong>8</strong><span>Viajes completados</span></article>
    </div>

    <section class="bloque">
      <h2>Conductores pendientes</h2>
      <p><b>Carlos Pérez</b></p>
      <p>Chevrolet Onix · ABC123</p>
      <p>Estado: {{ estado }}</p>

      <ion-button
        color="dark"
        [disabled]="estado !== 'Pendiente'"
        (click)="estado = 'Aprobado'"
      >
        Aprobar
      </ion-button>

      <ion-button
        color="dark"
        fill="outline"
        [disabled]="estado !== 'Pendiente'"
        (click)="estado = 'Rechazado'"
      >
        Rechazar
      </ion-button>
    </section>

    <section class="bloque">
      <h2>Tarifa de ejemplo</h2>
      <p>Base: $3.800 · Kilómetro: $1.250</p>
      <p>Minuto: $250 · Mínima: $6.500</p>
    </section>
  `
})
export class Administrador {
  estado = 'Pendiente';
}