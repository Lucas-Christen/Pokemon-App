import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  IonFabButton,
  IonButtons,
  IonSearchbar,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel
} from '@ionic/angular/standalone';
import { FavoritesService } from '../services/favorites.service';
import { PokemonService } from '../services/pokemon.service';
import { Pokemon, FavoritePokemon } from '../models/pokemon.interface';
import { heart, heartOutline, shuffle, searchOutline, linkOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    NgIf,
    NgFor,
    RouterLink,
    FormsModule,
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
    IonFabButton,
    IonButtons,
    IonSearchbar,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel
  ],
})
export class HomePage implements OnInit, OnDestroy {
  pokemons: Pokemon[] = [];
  loading = false;
  offset = 0;
  limit = 10; // Reduzido para melhor performance inicial
  searchTerm = '';
  searchResult: Pokemon | null = null;
  searchPerformed = false;
  
  // Novas propriedades para busca em tempo real
  filteredPokemon: {name: string, id: number}[] = [];
  isSearching = false;
  searchInput$ = new Subject<string>();
  showSearchResults = false;
  
  // Para gerenciar inscrições
  private destroy$ = new Subject<void>();
  private searchSubscription?: Subscription;

  constructor(
    public favoritesService: FavoritesService,
    public pokemonService: PokemonService,
    private router: Router
  ) {
    addIcons({ heart, heartOutline, shuffle, searchOutline, linkOutline });
    
    // Para testes no console (pode remover depois)
    (window as any).favoritesService = this.favoritesService;
    (window as any).pokemonService = this.pokemonService;
  }

  ngOnInit() {
    this.loadPokemons();
    this.setupSearch();
  }
  
  ngOnDestroy() {
    // Cancelar todas as inscrições ao destruir o componente
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  // Configurar busca em tempo real
  setupSearch() {
    this.searchSubscription = this.searchInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length === 0) {
          return Promise.resolve([]);
        }
        this.isSearching = true;
        return this.pokemonService.filterPokemonByName(term);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: results => {
        this.filteredPokemon = results;
        this.isSearching = false;
        this.showSearchResults = this.searchTerm.length > 0;
      },
      error: err => {
        console.error('Erro na busca:', err);
        this.isSearching = false;
      }
    });
  }

  // Método chamado quando o usuário digita na busca
  onSearchInput(event: any) {
    const query = event.target.value.trim();
    this.searchTerm = query;
    this.searchInput$.next(query);
    
    if (!query) {
      this.resetSearch();
    }
  }

  // Resetar busca
  resetSearch() {
    this.searchTerm = '';
    this.filteredPokemon = [];
    this.searchResult = null;
    this.searchPerformed = false;
    this.showSearchResults = false;
  }

  // Selecionar um Pokémon da lista de resultados
  selectPokemon(id: number) {
    this.goToPokemonDetail(id);
  }

  loadPokemons() {
    if (this.loading) return;
    
    this.loading = true;
    
    this.pokemonService.getPokemonList(this.limit, this.offset)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Buscar detalhes de cada pokemon
          this.pokemonService.getMultiplePokemons(response.results)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
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

  // Método antigo de busca (mantido para compatibilidade)
  searchPokemon() {
    if (!this.searchTerm || this.searchTerm.trim().length < 3) {
      this.searchResult = null;
      this.searchPerformed = false;
      return;
    }
    
    this.loading = true;
    this.searchPerformed = true;
    
    this.pokemonService.searchPokemon(this.searchTerm).subscribe({
      next: (pokemon) => {
        this.searchResult = pokemon;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro na busca:', error);
        this.searchResult = null;
        this.loading = false;
      }
    });
  }

  toggleFavorite(pokemon: Pokemon, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
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
    if (this.loading) return;
    
    this.loading = true;
    this.pokemonService.getRandomPokemon()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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

  goToPokemonDetail(pokemonId: number) {
    this.router.navigate(['/pokemon', pokemonId]);
  }
}