import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonSpinner,
  IonIcon,
  IonButton,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/angular/standalone';
import { PokemonService } from '../../services/pokemon.service';
import { FavoritesService } from '../../services/favorites.service';
import { Pokemon, PokemonSpecies, FavoritePokemon, PokemonMove } from '../../models/pokemon.interface';
import { heart, heartOutline, arrowBack } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Subject, takeUntil } from 'rxjs';

// Interface local para os movimentos simplificados
interface SimplifiedMove {
  name: string;
  url: string;
}

@Component({
  selector: 'app-pokemon-detail',
  templateUrl: './pokemon-detail.page.html',
  styleUrls: ['./pokemon-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonBackButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonBadge,
    IonSpinner,
    IonIcon,
    IonButton,
    IonGrid,
    IonRow,
    IonCol
  ]
})
export class PokemonDetailPage implements OnInit, OnDestroy {
  pokemonId: number = 0;
  pokemon: Pokemon | null = null;
  species: PokemonSpecies | null = null;
  loading: boolean = true;
  evolutionChain: any[] = [];
  moves: SimplifiedMove[] = [];
  
  // Para gerenciar inscrições
  private destroy$ = new Subject<void>();
  
  constructor(
    private route: ActivatedRoute,
    private pokemonService: PokemonService,
    public favoritesService: FavoritesService
  ) {
    addIcons({ heart, heartOutline, arrowBack });
  }

  ngOnInit() {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const idParam = params.get('id');
        if (idParam) {
          this.pokemonId = parseInt(idParam, 10);
          this.loadPokemonDetails();
        }
      });
  }
  
  ngOnDestroy() {
    // Cancelar todas as inscrições ao destruir o componente
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPokemonDetails() {
    this.loading = true;
    
    this.pokemonService.getPokemonWithSpecies(this.pokemonId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.pokemon = data.pokemon;
          this.species = data.species;
          
          console.log('Pokemon carregado:', this.pokemon);
          console.log('Estatísticas:', this.pokemon?.stats);
          console.log('Movimentos:', this.pokemon?.moves);
          
          // Carregar movimentos (limitado a 20 para performance)
          if (this.pokemon && this.pokemon.moves) {
            this.moves = this.pokemon.moves
              .slice(0, 20)
              .map(m => ({
                name: this.formatName(m.move.name),
                url: m.move.url
              }));
            
            console.log('Movimentos processados:', this.moves);
          }
          
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar detalhes do Pokémon:', error);
          this.loading = false;
        }
      });
  }

  toggleFavorite() {
    if (!this.pokemon) return;
    
    const favoritePokemon: FavoritePokemon = {
      id: this.pokemon.id,
      name: this.pokemon.name,
      image: this.getPokemonImage(),
      types: this.pokemon.types.map(t => t.type.name),
      dateAdded: new Date()
    };

    this.favoritesService.toggleFavorite(favoritePokemon);
  }

  isFavorite(): boolean {
    return this.pokemon ? this.favoritesService.isFavorite(this.pokemon.id) : false;
  }

  getPokemonImage(): string {
    if (!this.pokemon) return '';
    
    return this.pokemon.sprites.other['official-artwork'].front_default || 
           this.pokemon.sprites.front_default || 
           this.pokemonService.getPokemonImageUrl(this.pokemon.id);
  }

  formatName(name: string): string {
    return this.pokemonService.formatPokemonName(name);
  }

  getTypeColor(type: string): string {
    return this.pokemonService.getPokemonTypeColor(type);
  }

  getDescription(): string {
    if (!this.species) return 'Informação não disponível';
    
    const flavorTexts = this.species.flavor_text_entries.filter(
      entry => entry.language.name === 'en'
    );
    
    return flavorTexts.length > 0 
      ? flavorTexts[0].flavor_text.replace(/\f/g, ' ')
      : 'Informação não disponível';
  }

  getCategory(): string {
    if (!this.species) return 'Desconhecido';
    
    const genus = this.species.genera.find(
      g => g.language.name === 'en'
    );
    
    return genus ? genus.genus : 'Desconhecido';
  }

  getStatColor(value: number): string {
    if (value < 50) return '#ff4961'; // vermelho (danger)
    if (value < 80) return '#ffce00'; // amarelo (warning)
    if (value < 100) return '#2dd36f'; // verde (success)
    return '#6a64ff'; // roxo (tertiary)
  }

  getStatPercentage(value: number): number {
    return Math.min(value / 255 * 100, 100);
  }

  formatStatName(name: string): string {
    // Mapeamento de nomes de estatísticas para nomes mais amigáveis
    const statNames: { [key: string]: string } = {
      'hp': 'HP',
      'attack': 'Attack',
      'defense': 'Defense',
      'special-attack': 'Special-attack',
      'special-defense': 'Special-defense',
      'speed': 'Speed'
    };
    
    return statNames[name] || this.formatName(name);
  }
}
