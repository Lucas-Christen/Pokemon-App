import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonButtons,
  IonBackButton,
  IonSelect,
  IonSelectOption,
  AlertController
} from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { FavoritesService } from '../../services/favorites.service';
import { PokemonService } from '../../services/pokemon.service';
import { FavoritePokemon } from '../../models/pokemon.interface';
import { heartOutline, heart, trashOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-favorites',
  templateUrl: 'favorites.page.html',
  styleUrls: ['favorites.pages.css'],
  imports: [
    NgIf,
    NgFor,
    FormsModule,
    RouterLink,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
    IonButtons,
    IonBackButton,
    IonSelect,
    IonSelectOption
  ],
})
export class FavoritesPage implements OnInit, OnDestroy {
  favorites: FavoritePokemon[] = [];
  sortedFavorites: FavoritePokemon[] = [];
  sortBy: 'name' | 'dateAdded' = 'dateAdded';
  private favoritesSubscription?: Subscription;
  private imageCache: Map<number, string> = new Map();

  constructor(
    private favoritesService: FavoritesService,
    private pokemonService: PokemonService,
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({ heartOutline, heart, trashOutline });
  }

  ngOnInit() {
    // Inscrever-se nas mudanças dos favoritos
    this.favoritesSubscription = this.favoritesService.getFavorites().subscribe(
      favorites => {
        this.favorites = favorites;
        this.sortFavorites();
      }
    );
  }

  ngOnDestroy() {
    if (this.favoritesSubscription) {
      this.favoritesSubscription.unsubscribe();
    }
  }

  onSortChange() {
    this.sortFavorites();
  }

  private sortFavorites() {
    this.sortedFavorites = this.favoritesService.getFavoritesSorted(this.sortBy);
  }

  async removeFavorite(event: Event, pokemonId: number) {
    event.stopPropagation(); // Previne navegação ao clicar no botão
    
    const alert = await this.alertController.create({
      header: 'Remover Favorito',
      message: 'Tem certeza que deseja remover este Pokémon dos favoritos?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Remover',
          role: 'destructive',
          handler: () => {
            this.favoritesService.removeFromFavorites(pokemonId);
          }
        }
      ]
    });

    await alert.present();
  }

  async clearAllFavorites() {
    const alert = await this.alertController.create({
      header: 'Limpar Favoritos',
      message: 'Tem certeza que deseja remover TODOS os Pokémons dos favoritos? Esta ação não pode ser desfeita.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Remover Todos',
          role: 'destructive',
          handler: () => {
            this.favoritesService.clearAllFavorites();
          }
        }
      ]
    });

    await alert.present();
  }

  viewPokemonDetail(pokemonId: number) {
    this.router.navigate(['/pokemon', pokemonId]);
  }

  getPokemonImage(favorite: FavoritePokemon): string {
    // Verificar se já temos a imagem em cache
    if (this.imageCache.has(favorite.id)) {
      return this.imageCache.get(favorite.id)!;
    }
    
    // Verificar se a imagem armazenada existe
    if (favorite.image && favorite.image.length > 0) {
      this.imageCache.set(favorite.id, favorite.image);
      return favorite.image;
    }
    
    // Fallback para a API oficial
    const imageUrl = this.pokemonService.getPokemonImageUrl(favorite.id);
    this.imageCache.set(favorite.id, imageUrl);
    return imageUrl;
  }

  handleImageError(event: Event, pokemonId: number) {
    // Se a imagem falhar, usar a URL oficial da API
    const img = event.target as HTMLImageElement;
    const fallbackUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
    
    console.log(`Imagem para Pokémon #${pokemonId} falhou, usando fallback: ${fallbackUrl}`);
    
    // Definir a URL de fallback
    img.src = fallbackUrl;
    
    // Atualizar o cache
    this.imageCache.set(pokemonId, fallbackUrl);
  }

  formatPokemonName(name: string): string {
    return this.pokemonService.formatPokemonName(name);
  }

  getTypeColor(type: string): string {
    return this.pokemonService.getPokemonTypeColor(type);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }
}