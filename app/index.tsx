import { Link } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Pokemon {
  name: string;
  image: string;
  type: string;
}

const typeColors: Record<string, string> = {
  electric: "#FFD700",
  normal: "#A8A878",
  fire: "#FF6347",
  water: "#4169E1",
  bug: "#A3D977",
  grass: "#78C850",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  rock: "#B8A038",
  ice: "#98D8D8",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
  fighting: "#D64545",
  ghost: "#705898",
};

function getTypeColor(type: string): string {
  return typeColors[type.toLowerCase()] || "#f5f5f5";
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function Index() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [allPokemons, setAllPokemons] = useState<Pokemon[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showGoToTop, setShowGoToTop] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const lastFetchedOffset = useRef(-10);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollPositionRef = useRef(0);
  const scrollPositionBeforeSearchRef = useRef(0);

  async function fetchPokemons(startOffset: number) {
    if (loading || lastFetchedOffset.current === startOffset) return;
    lastFetchedOffset.current = startOffset;
    setLoading(true);
    try {
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon?limit=20&offset=${startOffset}`
      );
      const data = await response.json();

      const detailedPokemons = await Promise.all(
        data.results.map(async (pokemon: { name: string; url: string }) => {
          const res = await fetch(pokemon.url);
          const details = await res.json();
          return {
            name: pokemon.name,
            image: details.sprites.front_default,
            type: details.types[0].type.name,
          };
        })
      );

      if (startOffset === 0) {
        setPokemons(detailedPokemons);
        setAllPokemons(detailedPokemons);
      } else {
        setPokemons((prev) => [...prev, ...detailedPokemons]);
        setAllPokemons((prev) => [...prev, ...detailedPokemons]);
      }
      setOffset(startOffset + 20);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPokemons(0);
    // Restore scroll position when component mounts
    const timer = setTimeout(() => {
      if (scrollPositionRef.current > 0 && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: scrollPositionRef.current,
          animated: false,
        });
      }
    }, 100);

    // Check if we need to load more after restoring scroll position
    const checkBottomTimer = setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: scrollPositionRef.current,
          animated: false,
        });
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      clearTimeout(checkBottomTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const performSearch = async () => {
    if (searchQuery.trim() === "") {
      return;
    }

    setIsSearching(true);
    scrollPositionBeforeSearchRef.current = scrollPositionRef.current;
    setLoading(true);

    try {
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${searchQuery.toLowerCase()}`
      );

      if (!response.ok) {
        console.log("Pokemon not found");
        setPokemons([]);
        setLoading(false);
        return;
      }

      const details = await response.json();
      const searchResult: Pokemon = {
        name: details.name,
        image: details.sprites.front_default,
        type: details.types[0].type.name,
      };

      setPokemons([searchResult]);
      setLoading(false);
    } catch (e) {
      console.log(e);
      setPokemons([]);
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setIsSearching(false);
    setPokemons(allPokemons);
    setOffset(lastFetchedOffset.current + 20);

    // Restore scroll position after clearing search
    const timer = setTimeout(() => {
      if (scrollPositionBeforeSearchRef.current > 0 && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: scrollPositionBeforeSearchRef.current,
          animated: false,
        });
      }
    }, 50);

    return () => clearTimeout(timer);
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    setShowGoToTop(false);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.customHeader}>
        <Text style={styles.headerTitle}>Pokédex</Text>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Pokemon..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
          onSubmitEditing={performSearch}
          returnKeyType="search"
        />
        {searchQuery !== "" && (
          <TouchableOpacity style={styles.searchButton} onPress={performSearch}>
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        )}
        {searchQuery !== "" && isSearching && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{
          flexDirection: "row",
          flexWrap: "wrap",
          padding: 16,
          paddingBottom: 8,
          justifyContent: "center",
        }}
        onScroll={({ nativeEvent }: any) => {
          scrollPositionRef.current = nativeEvent.contentOffset.y;
          setShowGoToTop(nativeEvent.contentOffset.y > 300);
          const contentHeight = nativeEvent.contentSize.height;
          const layoutHeight = nativeEvent.layoutMeasurement.height;
          const currentOffset = nativeEvent.contentOffset.y;

          // Trigger load when the bottom of visible area is within the content
          // Minimal threshold to trigger at exact bottom
          const isCloseToBottom =
            currentOffset + layoutHeight >= contentHeight - 8;

          if (isCloseToBottom && !loading && !isSearching) {
            fetchPokemons(offset);
          }
        }}
        scrollEventThrottle={10}
      >
        {pokemons.map((pokemon: Pokemon, index) => (
          <View key={index} style={styles.cardWrapper}>
            <Link
              href={{ pathname: "/details", params: { name: pokemon.name } }}
              style={styles.linkContainer}
            >
              <View
                style={[
                  styles.PokemonContainer,
                  {
                    backgroundColor: hexToRgba(getTypeColor(pokemon.type), 0.3),
                  },
                ]}
              >
                <Image
                  source={{ uri: pokemon.image }}
                  style={{ width: 100, height: 100 }}
                />
                <Text style={styles.pokemonText}>{pokemon.name}</Text>
                <Text style={styles.pokemonTypeText}>{pokemon.type}</Text>
              </View>
            </Link>
          </View>
        ))}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      </ScrollView>
      {showGoToTop && (
        <TouchableOpacity
          style={styles.goToTopButton}
          onPress={scrollToTop}
          activeOpacity={0.7}
        >
          <Text style={styles.goToTopText}>↑</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  customHeader: {
    backgroundColor: "#4169E1",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 20,
    color: "#fff",
    textAlign: "center",
  },
  searchContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  searchButton: {
    marginLeft: 12,
    width: 50,
    height: 50,
    backgroundColor: "#4169E1",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4169E1",
  },
  searchButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  clearButton: {
    marginLeft: 12,
    width: 50,
    height: 50,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  clearButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
  },
  cardWrapper: {
    width: "50%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  linkContainer: {
    width: "100%",
  },
  PokemonContainer: {
    alignItems: "center",
    paddingVertical: 20,
    borderRadius: 8,
    width: "100%",
  },
  pokemonText: {
    textAlign: "center",
    fontSize: 18,
    textTransform: "capitalize",
    fontWeight: "bold",
    marginTop: 10,
  },
  pokemonTypeText: {
    textAlign: "center",
    fontSize: 14,
    textTransform: "capitalize",
    marginTop: 4,
    color: "#666",
    fontWeight: "500",
  },
  loadingContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  goToTopButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#4169E1",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  goToTopText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
});
