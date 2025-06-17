import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonFab,
  IonFabButton
} from '@ionic/angular/standalone';
import { FavoritesService } from '../services/favorites.service';
import { PokemonService } from '../services/pokemon.service';
import { Pokemon, FavoritePokemon } from '../models/pokemon.interface';
import { heart, heartOutline, shuffle } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    NgIf,
    NgFor,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
    IonSpinner,
    IonFab,
    IonFabButton
  ],
})
export class HomePage implements OnInit {
  pokemons: Pokemon[] = [];
  loading = false;
  offset = 0;
  limit = 20;

  constructor(
    public favoritesService: FavoritesService,
    public pokemonService: PokemonService
  ) {
    addIcons({ heart, heartOutline, shuffle });
    
    // Para testes no console (pode remover depois)
    (window as any).favoritesService = this.favoritesService;
    (window as any).pokemonService = this.pokemonService;
  }

  ngOnInit() {
    this.loadPokemons();
  }

  loadPokemons() {
    this.loading = true;
    
    this.pokemonService.getPokemonList(this.limit, this.offset).subscribe({
      next: (response) => {
        // Buscar detalhes de cada pokemon
        this.pokemonService.getMultiplePokemons(response.results).subscribe({
          next: (detailedPokemons) => {
            this.pokemons = [...this.pokemons, ...detailedPokemons];
            this.loading = false;
          },
          error: (error) => {
            console.error('Erro ao carregar detalhes:', error);
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('Erro ao carregar lista:', error);
        this.loading = false;
      }
    });
  }

  loadMore() {
    this.offset += this.limit;
    this.loadPokemons();
  }

  toggleFavorite(pokemon: Pokemon) {
    const favoritePokemon: FavoritePokemon = {
      id: pokemon.id,
      name: pokemon.name,
      image: pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default || '',
      types: pokemon.types.map(t => t.type.name),
      dateAdded: new Date()
    };

    this.favoritesService.toggleFavorite(favoritePokemon);
  }

  isFavorite(pokemonId: number): boolean {
    return this.favoritesService.isFavorite(pokemonId);
  }

  getRandomPokemon() {
    this.loading = true;
    this.pokemonService.getRandomPokemon().subscribe({
      next: (pokemon) => {
        // Adicionar no início da lista se não existir
        if (!this.pokemons.find(p => p.id === pokemon.id)) {
          this.pokemons.unshift(pokemon);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao buscar pokemon aleatório:', error);
        this.loading = false;
      }
    });
  }

  getPokemonImage(pokemon: Pokemon): string {
    return pokemon.sprites.other['official-artwork'].front_default || 
           pokemon.sprites.front_default || 
           this.pokemonService.getPokemonImageUrl(pokemon.id);
  }

  formatPokemonName(name: string): string {
    return this.pokemonService.formatPokemonName(name);
  }

  getTypeColor(type: string): string {
    return this.pokemonService.getPokemonTypeColor(type);
  }
}