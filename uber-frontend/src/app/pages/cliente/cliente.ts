import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import {
  ApiService,
  SolicitudViaje
} from '../../../services/api.services';
import { Mapa, PuntoMapa } from './mapa';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [FormsModule, JsonPipe, Mapa],
  template: `
    <h1>¿A dónde vamos?</h1>
    <p>Solicita tu viaje con el servidor del profesor.</p>

    <app-mapa (punto)="seleccionarPunto($event)"></app-mapa>

    <form #formulario="ngForm" (ngSubmit)="solicitar()">
      <label>
        Punto de recogida
        <input name="origen" [(ngModel)]="viaje.origin_name" required>
      </label>

      <label>
        Destino
        <input name="destino" [(ngModel)]="viaje.destination_name" required>
      </label>

      <div class="coordenadas">
        <label>
          Latitud del origen
          <input type="number" step="any" min="-90" max="90"
            name="latOrigen" [(ngModel)]="viaje.origin_latitude" required>
        </label>

        <label>
          Longitud del origen
          <input type="number" step="any" min="-180" max="180"
            name="lngOrigen" [(ngModel)]="viaje.origin_longitude" required>
        </label>

        <label>
          Latitud del destino
          <input type="number" step="any" min="-90" max="90"
            name="latDestino"
            [(ngModel)]="viaje.destination_latitude" required>
        </label>

        <label>
          Longitud del destino
          <input type="number" step="any" min="-180" max="180"
            name="lngDestino"
            [(ngModel)]="viaje.destination_longitude" required>
        </label>
      </div>

      <p>Usa las coordenadas de los lugares reales del viaje.</p>

      <div class="acciones">
        <button type="button"
          [disabled]="formulario.invalid || ocupado()"
          (click)="estimar()">
          Calcular tarifa
        </button>

        <button type="submit"
          [disabled]="formulario.invalid || ocupado()
            || !viaje.origin_name.trim()
            || !viaje.destination_name.trim()">
          Solicitar viaje real
        </button>
      </div>
    </form>

    <div class="acciones">
      <button type="button" [disabled]="ocupado()" (click)="verActivo()">
        Consultar viaje activo
      </button>
      <button type="button" [disabled]="ocupado()" (click)="verHistorial()">
        Ver historial
      </button>
    </div>

    <p role="status">{{ mensaje() }}</p>

    @if (resultado() !== null) {
      <section>
        <h2>{{ titulo() }}</h2>
        <pre>{{ resultado() | json }}</pre>
      </section>
    }
  `,
  styles: [`
    :host {
      display: block;
      max-width: 720px;
      margin: auto;
      padding: 24px;
      font-family: Arial, sans-serif;
      color: #171717;
    }

    form, section {
      background: white;
      border: 1px solid #ddd;
      border-radius: 16px;
      padding: 24px;
    }

    label {
      display: grid;
      gap: 8px;
      margin-bottom: 18px;
      font-weight: 600;
    }

    input {
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      padding: 13px;
      border: 1px solid #aaa;
      border-radius: 8px;
      font: inherit;
      background: white;
      color: #171717;
    }

    input:focus {
      outline: 2px solid #171717;
      outline-offset: 2px;
    }

    .coordenadas {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0 16px;
    }

    .acciones {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 20px 0;
    }

    button {
      padding: 14px 18px;
      border: 0;
      border-radius: 8px;
      background: #111;
      color: white;
      cursor: pointer;
      font: inherit;
    }

    button:disabled {
      opacity: .45;
      cursor: not-allowed;
    }

    pre {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    @media (max-width: 540px) {
      .coordenadas { grid-template-columns: 1fr; }
      :host { padding: 12px; }
    }
  `]
})
export class Cliente {
  private api = inject(ApiService);

  ocupado = signal(false);
  mensaje = signal('');
  titulo = signal('');
  resultado = signal<unknown>(null);

  viaje = {
    origin_name: '',
    destination_name: '',
    origin_latitude: null as number | null,
    origin_longitude: null as number | null,
    destination_latitude: null as number | null,
    destination_longitude: null as number | null
  };

  private datos(): SolicitudViaje | null {
    const v = this.viaje;
    const coordenadas = [
      v.origin_latitude,
      v.origin_longitude,
      v.destination_latitude,
      v.destination_longitude
    ];

    if (coordenadas.some(n => n === null || !Number.isFinite(n))) {
      this.mensaje.set('Completa las cuatro coordenadas.');
      return null;
    }

    if (
      Math.abs(v.origin_latitude!) > 90 ||
      Math.abs(v.destination_latitude!) > 90 ||
      Math.abs(v.origin_longitude!) > 180 ||
      Math.abs(v.destination_longitude!) > 180
    ) {
      this.mensaje.set('Las coordenadas están fuera del rango permitido.');
      return null;
    }

    return {
      origin_name: v.origin_name.trim(),
      destination_name: v.destination_name.trim(),
      origin_latitude: v.origin_latitude!,
      origin_longitude: v.origin_longitude!,
      destination_latitude: v.destination_latitude!,
      destination_longitude: v.destination_longitude!
    };
  }

  seleccionarPunto(punto: PuntoMapa) {
  if (punto.tipo === 'origen') {
    this.viaje.origin_latitude = punto.latitud;
    this.viaje.origin_longitude = punto.longitud;

    if (!this.viaje.origin_name.trim()) {
      this.viaje.origin_name = 'Origen seleccionado en el mapa';
    }
  } else {
    this.viaje.destination_latitude = punto.latitud;
    this.viaje.destination_longitude = punto.longitud;

    if (!this.viaje.destination_name.trim()) {
      this.viaje.destination_name = 'Destino seleccionado en el mapa';
    }
  }

  this.resultado.set(null);
  this.mensaje.set('');
}
  estimar() {
    const datos = this.datos();
    if (!datos) return;

    const {
      origin_name,
      destination_name,
      ...coordenadas
    } = datos;

    void this.ejecutar(
      'Estimación de tarifa',
      this.api.estimarTarifa(coordenadas)
    );
  }

  solicitar() {
    const datos = this.datos();
    if (!datos) return;

    if (!datos.origin_name || !datos.destination_name) {
      this.mensaje.set('Escribe el origen y el destino.');
      return;
    }

    void this.ejecutar(
      'Respuesta de la solicitud',
      this.api.solicitarViaje(datos)
    );
  }

  verActivo() {
    void this.ejecutar('Viaje activo', this.api.viajeActivo());
  }

  verHistorial() {
    void this.ejecutar('Historial de viajes', this.api.historialCliente());
  }

  private async ejecutar(titulo: string, peticion: Observable<unknown>) {
    if (this.ocupado()) return;

    this.ocupado.set(true);
    this.mensaje.set('Consultando el servidor...');
    this.resultado.set(null);
    this.titulo.set(titulo);

    try {
      const respuesta = await firstValueFrom(peticion);
      this.resultado.set(respuesta);
      this.mensaje.set('Respuesta recibida del servidor.');
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.mensaje.set(
          error.status === 0
            ? 'No se pudo conectar al servidor. Revisa la red.'
            : error.error?.message || `Error del servidor (${error.status}).`
        );
      } else {
        this.mensaje.set(
          error instanceof Error ? error.message : 'Ocurrió un error.'
        );
      }
    } finally {
      this.ocupado.set(false);
    }
  }
}