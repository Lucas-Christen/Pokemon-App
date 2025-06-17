import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  createdAt: Date;
  lastTriggered?: Date;
  active: boolean;
}

export interface WebhookEvent {
  type: string;
  payload: any;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class WebhookService {
  private readonly STORAGE_KEY = 'pokemon_webhooks';
  private webhooksSubject = new BehaviorSubject<Webhook[]>([]);
  public webhooks$ = this.webhooksSubject.asObservable();
  
  // Tipos de eventos suportados
  public readonly EVENT_TYPES = {
    FAVORITE_ADDED: 'pokemon.favorite.added',
    FAVORITE_REMOVED: 'pokemon.favorite.removed',
    POKEMON_VIEWED: 'pokemon.viewed',
    SEARCH_PERFORMED: 'search.performed'
  };

  constructor(private http: HttpClient) {
    this.loadWebhooks();
  }

  // Carregar webhooks do localStorage
  private loadWebhooks(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const webhooks = JSON.parse(stored).map((webhook: any) => ({
          ...webhook,
          createdAt: new Date(webhook.createdAt),
          lastTriggered: webhook.lastTriggered ? new Date(webhook.lastTriggered) : undefined
        }));
        this.webhooksSubject.next(webhooks);
        console.log('Webhooks carregados do localStorage:', webhooks);
      } else {
        console.log('Nenhum webhook encontrado no localStorage');
        this.webhooksSubject.next([]);
      }
    } catch (error) {
      console.error('Erro ao carregar webhooks:', error);
      this.webhooksSubject.next([]);
    }
  }

  // Salvar webhooks no localStorage
  private saveWebhooks(webhooks: Webhook[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(webhooks));
      this.webhooksSubject.next([...webhooks]); // Criar uma nova cópia do array
      console.log('Webhooks salvos no localStorage:', webhooks);
    } catch (error) {
      console.error('Erro ao salvar webhooks:', error);
    }
  }

  // Obter lista de webhooks
  getWebhooks(): Observable<Webhook[]> {
    return this.webhooks$;
  }

  // Obter webhook por ID
  getWebhookById(id: string): Observable<Webhook | undefined> {
    return this.webhooks$.pipe(
      map(webhooks => webhooks.find(webhook => webhook.id === id))
    );
  }

  // Adicionar novo webhook
  addWebhook(webhook: Omit<Webhook, 'id' | 'createdAt'>): Observable<Webhook> {
    const currentWebhooks = this.webhooksSubject.value;
    
    const newWebhook: Webhook = {
      ...webhook,
      id: this.generateId(),
      createdAt: new Date(),
      active: webhook.active !== undefined ? webhook.active : true
    };
    
    console.log('Adicionando novo webhook:', newWebhook);
    const updatedWebhooks = [...currentWebhooks, newWebhook];
    this.saveWebhooks(updatedWebhooks);
    
    return of(newWebhook);
  }

  // Atualizar webhook existente
  updateWebhook(id: string, updates: Partial<Webhook>): Observable<Webhook | undefined> {
    const currentWebhooks = this.webhooksSubject.value;
    const index = currentWebhooks.findIndex(webhook => webhook.id === id);
    
    if (index === -1) {
      console.warn('Webhook não encontrado para atualização:', id);
      return of(undefined);
    }
    
    const updatedWebhook = {
      ...currentWebhooks[index],
      ...updates
    };
    
    console.log('Atualizando webhook:', updatedWebhook);
    const updatedWebhooks = [
      ...currentWebhooks.slice(0, index),
      updatedWebhook,
      ...currentWebhooks.slice(index + 1)
    ];
    
    this.saveWebhooks(updatedWebhooks);
    return of(updatedWebhook);
  }

  // Remover webhook
  deleteWebhook(id: string): Observable<boolean> {
    const currentWebhooks = this.webhooksSubject.value;
    const updatedWebhooks = currentWebhooks.filter(webhook => webhook.id !== id);
    
    if (updatedWebhooks.length !== currentWebhooks.length) {
      console.log('Removendo webhook:', id);
      this.saveWebhooks(updatedWebhooks);
      return of(true);
    }
    
    console.warn('Webhook não encontrado para exclusão:', id);
    return of(false);
  }

  // Disparar evento para todos os webhooks registrados
  triggerEvent(eventType: string, payload: any): void {
    const webhooks = this.webhooksSubject.value.filter(
      webhook => webhook.active && webhook.events.includes(eventType)
    );
    
    if (webhooks.length === 0) {
      return;
    }
    
    const event: WebhookEvent = {
      type: eventType,
      payload,
      timestamp: new Date()
    };
    
    webhooks.forEach(webhook => {
      this.sendWebhookRequest(webhook, event)
        .subscribe({
          next: () => {
            this.updateWebhook(webhook.id, { lastTriggered: new Date() }).subscribe();
            console.log(`Webhook ${webhook.name} disparado com sucesso para ${eventType}`);
          },
          error: error => {
            console.error(`Erro ao disparar webhook ${webhook.name}:`, error);
          }
        });
    });
  }

  // Enviar requisição para o endpoint do webhook
  private sendWebhookRequest(webhook: Webhook, event: WebhookEvent): Observable<any> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    // Se houver um secret, adicionar como header de autenticação
    if (webhook.secret) {
      headers = headers.set('X-Webhook-Secret', webhook.secret);
    }
    
    // Adicionar informações sobre o aplicativo
    const payload = {
      ...event,
      app: {
        name: 'Pokemon App',
        version: '1.0.0'
      }
    };
    
    return this.http.post(webhook.url, payload, { headers }).pipe(
      catchError(error => {
        console.error(`Erro ao enviar webhook para ${webhook.url}:`, error);
        return of(null);
      })
    );
  }

  // Testar webhook
  testWebhook(webhook: Webhook): Observable<boolean> {
    const testEvent: WebhookEvent = {
      type: 'webhook.test',
      payload: {
        message: 'Este é um evento de teste.',
        webhook: webhook.name
      },
      timestamp: new Date()
    };
    
    return this.sendWebhookRequest(webhook, testEvent).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  // Gerar ID único para webhook
  private generateId(): string {
    return 'wh_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
} 