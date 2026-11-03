import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { throwError } from 'rxjs';
import { API_URL } from '../api.config';

export type Rol = 'admin' | 'client' | 'driver';

export interface Usuario {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Rol;
  status: string;
}

export interface RespuestaLogin {
  success: boolean;
  message: string;
  access_token: string;
  token_type: string;
  expires_in: number;
  user: Usuario;
}

export interface RegistroCliente {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'client';
}

export interface RegistroConductor {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'driver';
  license_number: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  capacity: number;
  color: string;
}

export interface Coordenadas {
  origin_latitude: number;
  origin_longitude: number;
  destination_latitude: number;
  destination_longitude: number;
}

export interface SolicitudViaje extends Coordenadas {
  origin_name: string;
  destination_name: string;
}

export interface Tarifa {
  name: string;
  base_fare: number;
  price_per_km: number;
  price_per_minute: number;
  minimum_fare: number;
  surge_multiplier: number;
  active: boolean;
}

export interface Ubicacion {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  trip_id?: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  private solicitar<T>(
    metodo: string,
    ruta: string,
    cuerpo?: unknown,
    protegido = true,
    parametros: Record<string, string> = {}
  ) {
    if (!API_URL.trim()) {
      return throwError(
        () => new Error('Falta configurar la dirección del servidor del profesor.')
      );
    }

    let headers = new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json'
    });

    if (protegido) {
      const token = sessionStorage.getItem('token');

      if (!token) {
        return throwError(
          () => new Error('Debes iniciar sesión para continuar.')
        );
      }

      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.request<T>(
      metodo,
      `${API_URL.replace(/\/+$/, '')}${ruta}`,
      {
        body: cuerpo,
        headers,
        params: parametros
      }
    );
  }

  // AUTENTICACIÓN

  login(login: string, password: string) {
    return this.solicitar<RespuestaLogin>(
      'POST',
      '/auth/login',
      { login, password },
      false
    );
  }

  registrar(datos: RegistroCliente | RegistroConductor) {
    return this.solicitar<RespuestaLogin>(
      'POST',
      '/auth/register',
      datos,
      false
    );
  }

  miPerfil() {
    return this.solicitar<{ success: boolean; user: Usuario }>(
      'GET',
      '/auth/me'
    );
  }

  logout() {
    return this.solicitar<{ success: boolean; message: string }>(
      'POST',
      '/auth/logout'
    );
  }

  recuperarPassword(email: string, new_password: string) {
    return this.solicitar<{ success: boolean; message: string }>(
      'POST',
      '/auth/forgot-password',
      { email, new_password },
      false
    );
  }

  // TARIFA PÚBLICA

  tarifaActiva() {
    return this.solicitar<{ success: boolean; fare: Tarifa }>(
      'GET',
      '/fares/active',
      undefined,
      false
    );
  }

  // CLIENTE

  estimarTarifa(datos: Coordenadas) {
    return this.solicitar<unknown>(
      'POST',
      '/client/estimate-fare',
      datos
    );
  }

  solicitarViaje(datos: SolicitudViaje) {
    return this.solicitar<unknown>(
      'POST',
      '/client/ride-requests',
      datos
    );
  }

  viajeActivo() {
    return this.solicitar<unknown>('GET', '/client/active');
  }

  cancelarViaje(id: number, reason: string) {
    return this.solicitar<unknown>(
      'POST',
      `/client/cancel/${id}`,
      { reason }
    );
  }

  historialCliente(page = 1) {
    return this.solicitar<unknown>(
      'GET',
      '/client/trips',
      undefined,
      true,
      { page: String(page) }
    );
  }

  calificarViaje(
    id: number,
    score: number,
    comment: string,
    has_incident: boolean
  ) {
    return this.solicitar<unknown>(
      'POST',
      `/client/trips/${id}/rating`,
      { score, comment, has_incident }
    );
  }

  // CONDUCTOR

  cambiarDisponibilidad(status: 'available' | 'unavailable') {
    return this.solicitar<unknown>(
      'PUT',
      '/driver/availability',
      { status }
    );
  }

  solicitudesPendientes() {
    return this.solicitar<unknown>('GET', '/driver/ride-requests');
  }

  aceptarViaje(id: number) {
    return this.solicitar<unknown>(
      'POST',
      `/driver/ride-requests/${id}/accept`
    );
  }

  marcarLlegada(id: number) {
    return this.solicitar<unknown>(
      'POST',
      `/driver/trips/${id}/arrive`
    );
  }

  iniciarViaje(id: number) {
    return this.solicitar<unknown>(
      'POST',
      `/driver/trips/${id}/start`
    );
  }

  finalizarViaje(
    id: number,
    actual_distance_km: number,
    actual_duration_min: number
  ) {
    return this.solicitar<unknown>(
      'POST',
      `/driver/trips/${id}/complete`,
      { actual_distance_km, actual_duration_min }
    );
  }

  actualizarUbicacion(datos: Ubicacion) {
    return this.solicitar<unknown>(
      'POST',
      '/driver/location',
      datos
    );
  }

  // ADMINISTRADOR

  dashboard() {
    return this.solicitar<unknown>('GET', '/admin/dashboard');
  }

  conductores(approval_status?: string) {
    const filtros: Record<string, string> = {};

    if (approval_status) {
      filtros['approval_status'] = approval_status;
    }

    return this.solicitar<unknown>(
      'GET',
      '/admin/drivers',
      undefined,
      true,
      filtros
    );
  }

  cambiarAprobacion(
    id: number,
    approval_status: string,
    admin_notes: string
  ) {
    return this.solicitar<unknown>(
      'PATCH',
      `/admin/drivers/${id}/approval`,
      { approval_status, admin_notes }
    );
  }

  tarifas() {
    return this.solicitar<unknown>('GET', '/admin/fares');
  }

  crearTarifa(datos: Tarifa) {
    return this.solicitar<unknown>('POST', '/admin/fares', datos);
  }

  viajesAdministrador(filtros: Record<string, string> = {}) {
    return this.solicitar<unknown>(
      'GET',
      '/admin/trips',
      undefined,
      true,
      filtros
    );
  }

  reportes() {
    return this.solicitar<unknown>('GET', '/admin/reports');
  }

  auditoria() {
    return this.solicitar<unknown>('GET', '/admin/audit-logs');
  }
}