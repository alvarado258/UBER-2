import { Component } from '@angular/core';
import { IonButton } from '@ionic/angular';

@Component({
  selector: 'app-conductor',
  standalone: true,
  imports: [IonButton],
  template: `
    <h1>Panel conductor</h1>
    <p>Gestiona tus servicios · Datos de demostración</p>

    <section class="bloque">
      <h2>Tu disponibilidad</h2>
      <p>{{ disponible ? 'En línea' : 'Desconectado' }}</p>

      <ion-button
        color="dark"
        [disabled]="estado !== 'Sin viaje'"
        (click)="disponible = !disponible"
      >
        {{ disponible ? 'Desconectarme' : 'Ponerme disponible' }}
      </ion-button>
    </section>

    @if (disponible) {
      <section class="bloque">
        <h2>
          {{ estado === 'Sin viaje' ? 'Solicitud de ejemplo' : 'Viaje actual' }}
        </h2>

        <p><b>Cliente:</b> Laura Gómez</p>
        <p><b>Origen:</b> Parque Santander</p>
        <p><b>Destino:</b> Centro Comercial San Pedro Plaza</p>
        <p><b>Tarifa estimada:</b> $8.500</p>
        <p><b>Estado:</b> {{ estado }}</p>

        @switch (estado) {
          @case ('Sin viaje') {
            <ion-button color="dark" (click)="estado = 'Asignado'">
              Aceptar viaje
            </ion-button>
          }
          @case ('Asignado') {
            <ion-button color="dark" (click)="estado = 'En el origen'">
              Llegué al origen
            </ion-button>
          }
          @case ('En el origen') {
            <ion-button color="dark" (click)="estado = 'En curso'">
              Iniciar viaje
            </ion-button>
          }
          @case ('En curso') {
            <ion-button color="dark" (click)="estado = 'Finalizado'">
              Finalizar viaje
            </ion-button>
          }
          @case ('Finalizado') {
            <p>Viaje de demostración finalizado.</p>
            <ion-button color="dark" (click)="estado = 'Sin viaje'">
              Reiniciar demostración
            </ion-button>
          }
        }
      </section>
    }
  `
})
export class Conductor {
  disponible = false;
  estado = 'Sin viaje';
}