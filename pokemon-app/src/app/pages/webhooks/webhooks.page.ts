import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardTitle,
  IonCardSubtitle,
  IonBadge,
  IonAlert,
  IonChip,
  IonBackButton,
  IonButtons,
  IonModal,
  IonFab,
  IonFabButton,
  IonSpinner,
  IonText,
  IonItemDivider,
  IonItemGroup,
  AlertController,
  ToastController,
  ModalController
} from '@ionic/angular/standalone';
import { WebhookService, Webhook } from '../../services/webhook.service';
import { addCircleOutline, trashOutline, createOutline, checkmarkCircleOutline, closeCircleOutline, refreshOutline, linkOutline, closeOutline, add } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-webhooks',
  templateUrl: './webhooks.page.html',
  styleUrls: ['./webhooks.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonCardTitle,
    IonCardSubtitle,
    IonBadge,
    IonAlert,
    IonChip,
    IonBackButton,
    IonButtons,
    IonModal,
    IonFab,
    IonFabButton,
    IonSpinner,
    IonText,
    IonItemDivider,
    IonItemGroup
  ]
})
export class WebhooksPage implements OnInit {
  webhooks: Webhook[] = [];
  isLoading = true;
  isModalOpen = false;
  isEditing = false;
  isTesting = false;
  
  // Novo webhook ou webhook em edição
  currentWebhook: Partial<Webhook> = {
    name: '',
    url: '',
    events: [],
    secret: '',
    active: true
  };
  
  // Todos os tipos de eventos disponíveis
  availableEvents: { id: string, name: string }[] = [
    { id: 'pokemon.favorite.added', name: 'Pokémon adicionado aos favoritos' },
    { id: 'pokemon.favorite.removed', name: 'Pokémon removido dos favoritos' },
    { id: 'pokemon.viewed', name: 'Pokémon visualizado' },
    { id: 'search.performed', name: 'Busca realizada' }
  ];

  constructor(
    private webhookService: WebhookService,
    private alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController
  ) {
    addIcons({ 
      addCircleOutline, 
      trashOutline, 
      createOutline, 
      checkmarkCircleOutline, 
      closeCircleOutline,
      refreshOutline,
      linkOutline,
      closeOutline,
      add
    });
  }

  ngOnInit() {
    this.loadWebhooks();
  }

  loadWebhooks() {
    this.isLoading = true;
    this.webhookService.getWebhooks().subscribe({
      next: (webhooks) => {
        console.log('Webhooks carregados:', webhooks);
        this.webhooks = webhooks;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar webhooks:', error);
        this.isLoading = false;
      }
    });
  }

  openAddModal() {
    this.resetCurrentWebhook();
    this.isEditing = false;
    this.isModalOpen = true;
  }

  openEditModal(webhook: Webhook) {
    this.currentWebhook = { ...webhook };
    this.isEditing = true;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.resetCurrentWebhook();
  }

  resetCurrentWebhook() {
    this.currentWebhook = {
      name: '',
      url: '',
      events: [],
      secret: '',
      active: true
    };
  }

  saveWebhook() {
    console.log('Salvando webhook:', this.currentWebhook);
    
    if (!this.validateWebhook()) {
      return;
    }

    if (this.isEditing && this.currentWebhook.id) {
      const id = this.currentWebhook.id;
      const updates = { ...this.currentWebhook };
      delete updates.id;
      delete updates.createdAt;
      delete updates.lastTriggered;
      
      this.webhookService.updateWebhook(id, updates).subscribe({
        next: (updatedWebhook) => {
          console.log('Webhook atualizado:', updatedWebhook);
          this.loadWebhooks(); // Recarregar a lista após atualização
          this.showToast('Webhook atualizado com sucesso');
          this.closeModal();
        },
        error: (error) => {
          console.error('Erro ao atualizar webhook:', error);
          this.showToast('Erro ao atualizar webhook', 'danger');
        }
      });
    } else {
      this.webhookService.addWebhook(this.currentWebhook as Omit<Webhook, 'id' | 'createdAt'>).subscribe({
        next: (newWebhook) => {
          console.log('Webhook adicionado:', newWebhook);
          this.loadWebhooks(); // Recarregar a lista após adição
          this.showToast('Webhook adicionado com sucesso');
          this.closeModal();
        },
        error: (error) => {
          console.error('Erro ao adicionar webhook:', error);
          this.showToast('Erro ao adicionar webhook', 'danger');
        }
      });
    }
  }

  validateWebhook(): boolean {
    if (!this.currentWebhook.name?.trim()) {
      this.showToast('Nome é obrigatório', 'warning');
      return false;
    }

    if (!this.currentWebhook.url?.trim()) {
      this.showToast('URL é obrigatória', 'warning');
      return false;
    }

    try {
      new URL(this.currentWebhook.url);
    } catch (error) {
      this.showToast('URL inválida', 'warning');
      return false;
    }

    if (!this.currentWebhook.events?.length) {
      this.showToast('Selecione pelo menos um evento', 'warning');
      return false;
    }

    return true;
  }

  async confirmDelete(webhook: Webhook) {
    const alert = await this.alertController.create({
      header: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir o webhook "${webhook.name}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.deleteWebhook(webhook.id);
          }
        }
      ]
    });

    await alert.present();
  }

  deleteWebhook(id: string) {
    this.webhookService.deleteWebhook(id).subscribe({
      next: (success) => {
        if (success) {
          this.loadWebhooks(); // Recarregar a lista após exclusão
          this.showToast('Webhook excluído com sucesso');
        } else {
          this.showToast('Webhook não encontrado', 'warning');
        }
      },
      error: (error) => {
        console.error('Erro ao excluir webhook:', error);
        this.showToast('Erro ao excluir webhook', 'danger');
      }
    });
  }

  toggleWebhookStatus(webhook: Webhook) {
    this.webhookService.updateWebhook(webhook.id, { active: !webhook.active }).subscribe({
      next: () => {
        webhook.active = !webhook.active; // Atualizar o estado localmente
        this.showToast(`Webhook ${webhook.active ? 'ativado' : 'desativado'} com sucesso`);
      },
      error: (error) => {
        console.error('Erro ao atualizar status do webhook:', error);
        this.showToast('Erro ao atualizar status do webhook', 'danger');
      }
    });
  }

  testWebhook(webhook: Webhook) {
    this.isTesting = true;
    this.webhookService.testWebhook(webhook).subscribe({
      next: (success) => {
        this.isTesting = false;
        if (success) {
          this.showToast('Teste enviado com sucesso');
        } else {
          this.showToast('Falha ao enviar teste', 'warning');
        }
      },
      error: (error) => {
        this.isTesting = false;
        console.error('Erro ao testar webhook:', error);
        this.showToast('Erro ao testar webhook', 'danger');
      }
    });
  }

  getEventName(eventId: string): string {
    const event = this.availableEvents.find(e => e.id === eventId);
    return event ? event.name : eventId;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleString();
  }

  async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
} 