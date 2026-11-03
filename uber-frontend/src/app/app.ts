import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonApp, IonContent, IonInput, IonButton } from '@ionic/angular';

import { API_URL } from '../api.config';
import { Administrador } from './pages/administrador/administrador';
import { Conductor } from './pages/conductor/conductor';
import { Cliente } from './pages/cliente/cliente';

type Rol = 'admin' | 'driver' | 'client';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    FormsModule,
    IonApp,
    IonContent,
    IonInput,
    IonButton,
    Administrador,
    Conductor,
    Cliente
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  login = '';
  password = '';

  vista = signal<'login' | Rol>('login');
  mensaje = signal('');
  cargando = signal(false);

  abrirDemo(rol: Rol) {
    if (this.cargando()) return;
    this.mensaje.set('');
    this.vista.set(rol);
  }

  async ingresar() {
    if (this.cargando()) return;

    if (!this.login.trim() || !this.password) {
      this.mensaje.set('Ingresa tu correo o teléfono y tu contraseña.');
      return;
    }

    this.cargando.set(true);
    this.mensaje.set('Conectando...');

    try {
      const respuesta = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          login: this.login.trim(),
          password: this.password
        })
      });

      if (respuesta.status >= 500) {
        throw new Error(`Error del servidor (${respuesta.status}).`);
      }

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.message || 'No se pudo iniciar sesión.');
      }

      if (!datos.access_token || !datos.user) {
        throw new Error('El servidor devolvió una respuesta incompleta.');
      }

     sessionStorage.setItem('token', datos.access_token);

if (datos.user.role === 'client') {
  this.vista.set('client');
}

this.password = '';

      this.mensaje.set(
        `Conexión exitosa. Bienvenido ${datos.user.name}. ` +
        `Tu rol es: ${datos.user.role}.`
      );
    } catch (error) {
      this.mensaje.set(
        error instanceof TypeError
          ? 'No se pudo conectar. Revisa la red, la IP y CORS del backend.'
          : error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado.'
      );
    } finally {
      this.cargando.set(false);
    }
  }
}