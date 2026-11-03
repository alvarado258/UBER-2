import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  inject,
  output,
  signal
} from '@angular/core';
import * as L from 'leaflet';

export interface PuntoMapa {
  tipo: 'origen' | 'destino';
  latitud: number;
  longitud: number;
}

@Component({
  selector: 'app-mapa',
  standalone: true,
  template: `
    <div class="acciones">
      <button type="button" (click)="ubicar()" [disabled]="buscando()">
        {{ buscando() ? 'Buscando ubicación...' : 'Usar mi ubicación' }}
      </button>

      <button type="button" (click)="modo.set('origen')"
        [attr.aria-pressed]="modo() === 'origen'">
        Marcar origen
      </button>

      <button type="button" (click)="modo.set('destino')"
        [attr.aria-pressed]="modo() === 'destino'">
        Marcar destino
      </button>
    </div>

    <p>Haz clic en el mapa para elegir el {{ modo() }}.</p>
    <div #contenedor class="mapa" aria-label="Mapa de origen y destino"></div>
    <p role="status">{{ mensaje() }}</p>
  `,
  styles: [`
    :host { display: block; margin-bottom: 24px; }

    .mapa {
      height: 380px;
      width: 100%;
      border-radius: 14px;
      border: 1px solid #ccc;
      z-index: 0;
    }

    .acciones {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    button {
      padding: 12px 16px;
      border: 1px solid #aaa;
      border-radius: 8px;
      background: white;
      color: #111;
      cursor: pointer;
      font: inherit;
    }

    button[aria-pressed="true"] {
      background: #111;
      color: white;
    }

    button:disabled { opacity: .5; }
  `]
})
export class Mapa implements AfterViewInit, OnDestroy {
  @ViewChild('contenedor', { static: true })
  contenedor!: ElementRef<HTMLDivElement>;

  punto = output<PuntoMapa>();
  modo = signal<'origen' | 'destino'>('origen');
  buscando = signal(false);
  mensaje = signal('');

  private zona = inject(NgZone);
  private mapa?: L.Map;
  private origen?: L.CircleMarker;
  private destino?: L.CircleMarker;
  private observador?: ResizeObserver;
  private destruido = false;

  ngAfterViewInit() {
    this.mapa = L.map(this.contenedor.nativeElement)
      .setView([2.9273, -75.2819], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.mapa);

    this.mapa.on('click', (evento: L.LeafletMouseEvent) => {
      this.zona.run(() => {
        this.marcar(
          this.modo(),
          evento.latlng.lat,
          evento.latlng.lng
        );
      });
    });

    this.observador = new ResizeObserver(() => {
      this.mapa?.invalidateSize();
    });

    this.observador.observe(this.contenedor.nativeElement);
  }

  ubicar() {
    if (!navigator.geolocation) {
      this.mensaje.set('Tu navegador no ofrece ubicación. Marca el origen en el mapa.');
      return;
    }

    this.buscando.set(true);
    this.mensaje.set('Acepta el permiso de ubicación del navegador.');

    navigator.geolocation.getCurrentPosition(
      posicion => {
        if (this.destruido) return;

        this.zona.run(() => {
          const { latitude, longitude, accuracy } = posicion.coords;

          this.marcar('origen', latitude, longitude);
          this.mapa?.setView([latitude, longitude], 16);
          this.modo.set('destino');
          this.buscando.set(false);
          this.mensaje.set(
            `Ubicación obtenida. Precisión aproximada: ${Math.round(accuracy)} metros. ` +
            'Revisa el origen y marca tu destino.'
          );
        });
      },
      error => {
        if (this.destruido) return;

        this.zona.run(() => {
          this.buscando.set(false);
          this.mensaje.set(
            error.code === 1
              ? 'Permiso denegado. Puedes marcar el origen en el mapa.'
              : 'No se pudo obtener la ubicación. Puedes marcar el origen en el mapa.'
          );
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }

  private marcar(
    tipo: 'origen' | 'destino',
    latitud: number,
    longitud: number
  ) {
    if (!this.mapa) return;

    const anterior = tipo === 'origen' ? this.origen : this.destino;
    anterior?.remove();

    const marcador = L.circleMarker([latitud, longitud], {
      radius: 10,
      color: tipo === 'origen' ? '#087f5b' : '#c92a2a',
      fillOpacity: 1,
      weight: 3
    })
      .addTo(this.mapa)
      .bindTooltip(tipo === 'origen' ? 'Origen' : 'Destino');

    if (tipo === 'origen') {
      this.origen = marcador;
    } else {
      this.destino = marcador;
    }

    this.punto.emit({
      tipo,
      latitud: Number(latitud.toFixed(6)),
      longitud: Number(longitud.toFixed(6))
    });

    this.mensaje.set(
      `${tipo === 'origen' ? 'Origen' : 'Destino'} seleccionado.`
    );
  }

  ngOnDestroy() {
    this.destruido = true;
    this.observador?.disconnect();
    this.mapa?.remove();
  }
}