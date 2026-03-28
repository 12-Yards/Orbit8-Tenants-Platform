"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { defaultArticleCategories, type ArticleCategory, type ArticleCategoryRecord } from "@shared/schema";
import { type IconType } from "react-icons";
import { 
  FaUtensils, FaCompass, FaWater, FaMoon, FaLandmark, FaLightbulb, FaShoppingBag, FaBaby, FaFolder, FaMusic, FaCamera, FaCoffee, FaHeart, FaStar, FaMapMarkerAlt,
  FaHome, FaTree, FaBeer, FaWineGlassAlt, FaCocktail, FaIceCream, FaPizzaSlice, FaHamburger, FaFish, FaDog, FaCat, FaPaw,
  FaUmbrellaBeach, FaSwimmer, FaSun, FaCloud, FaMountain, FaBicycle, FaRunning, FaFootballBall, FaGolfBall, FaBasketballBall,
  FaPalette, FaTheaterMasks, FaGuitar, FaMicrophone, FaBook, FaGraduationCap, FaChurch, FaCross, FaPray,
  FaCar, FaBus, FaTrain, FaPlane, FaShip, FaAnchor, FaParking, FaGasPump,
  FaShoppingCart, FaStore, FaGift, FaTshirt, FaGem, FaRing, FaCrown, FaGlasses,
  FaHospital, FaMedkit, FaStethoscope, FaPills, FaTooth, FaHeartbeat,
  FaBuilding, FaCity, FaHouseUser, FaWarehouse, FaIndustry,
  FaWifi, FaTv, FaBed, FaCouch, FaSwimmingPool, FaHotTub, FaDumbbell, FaSpa,
  FaChild, FaGamepad, FaPuzzlePiece, FaBabyCarriage,
  FaBirthdayCake, FaGlassCheers, FaCalendarAlt, FaTicketAlt, FaFireAlt
} from "react-icons/fa";
import { 
  MdRestaurant, MdLocalCafe, MdLocalBar, MdLocalPizza, MdFastfood, MdBakeryDining, MdRamenDining,
  MdBeachAccess, MdPool, MdSurfing, MdKayaking, MdSailing, MdDirectionsBoat,
  MdPark, MdForest, MdNature, MdTerrain, MdLandscape,
  MdMuseum, MdTheaters, MdCasino, MdNightlife, MdAttractions,
  MdSportsGolf, MdSportsTennis, MdSportsSoccer, MdSportsBaseball, MdSportsVolleyball,
  MdPets, MdCrueltyFree, MdChildCare, MdFamilyRestroom, MdAccessible,
  MdLocalFlorist, MdLocalPharmacy, MdLocalLaundryService, MdLocalGroceryStore, MdLocalMall,
  MdWineBar, MdNightlight, MdSunny, MdWbSunny, MdCloud,
  MdFavorite, MdStarRate, MdThumbUp, MdCelebration, MdEmojiEvents
} from "react-icons/md";

interface CategoryFilterProps {
  selected: ArticleCategory | null;
  onSelect: (category: ArticleCategory | null) => void;
  categories?: ArticleCategoryRecord[];
}

const iconMap: Record<string, IconType> = {
  "restaurant": MdRestaurant,
  "utensils": FaUtensils,
  "cafe": MdLocalCafe,
  "coffee": FaCoffee,
  "bar": MdLocalBar,
  "wine": FaWineGlassAlt,
  "wine-bar": MdWineBar,
  "cocktail": FaCocktail,
  "beer": FaBeer,
  "pizza": FaPizzaSlice,
  "burger": FaHamburger,
  "fastfood": MdFastfood,
  "bakery": MdBakeryDining,
  "ramen": MdRamenDining,
  "ice-cream": FaIceCream,
  "fish": FaFish,
  "birthday-cake": FaBirthdayCake,
  "cheers": FaGlassCheers,
  "beach": FaUmbrellaBeach,
  "beach-access": MdBeachAccess,
  "water": FaWater,
  "swimmer": FaSwimmer,
  "pool": MdPool,
  "surfing": MdSurfing,
  "kayaking": MdKayaking,
  "sailing": MdSailing,
  "boat": MdDirectionsBoat,
  "sun": FaSun,
  "sunny": MdSunny,
  "cloud": FaCloud,
  "mountain": FaMountain,
  "tree": FaTree,
  "park": MdPark,
  "forest": MdForest,
  "nature": MdNature,
  "landscape": MdLandscape,
  "bicycle": FaBicycle,
  "running": FaRunning,
  "golf": MdSportsGolf,
  "tennis": MdSportsTennis,
  "soccer": MdSportsSoccer,
  "football": FaFootballBall,
  "basketball": FaBasketballBall,
  "baseball": MdSportsBaseball,
  "volleyball": MdSportsVolleyball,
  "dumbbell": FaDumbbell,
  "spa": FaSpa,
  "gamepad": FaGamepad,
  "palette": FaPalette,
  "theater": FaTheaterMasks,
  "museum": MdMuseum,
  "theaters": MdTheaters,
  "guitar": FaGuitar,
  "microphone": FaMicrophone,
  "music": FaMusic,
  "book": FaBook,
  "graduation": FaGraduationCap,
  "camera": FaCamera,
  "attractions": MdAttractions,
  "moon": FaMoon,
  "nightlife": MdNightlife,
  "casino": MdCasino,
  "celebration": MdCelebration,
  "events": MdEmojiEvents,
  "ticket": FaTicketAlt,
  "calendar": FaCalendarAlt,
  "fire": FaFireAlt,
  "shopping-bag": FaShoppingBag,
  "shopping-cart": FaShoppingCart,
  "store": FaStore,
  "mall": MdLocalMall,
  "grocery": MdLocalGroceryStore,
  "gift": FaGift,
  "tshirt": FaTshirt,
  "gem": FaGem,
  "ring": FaRing,
  "crown": FaCrown,
  "glasses": FaGlasses,
  "florist": MdLocalFlorist,
  "pharmacy": MdLocalPharmacy,
  "laundry": MdLocalLaundryService,
  "home": FaHome,
  "bed": FaBed,
  "couch": FaCouch,
  "building": FaBuilding,
  "city": FaCity,
  "house": FaHouseUser,
  "wifi": FaWifi,
  "tv": FaTv,
  "swimming-pool": FaSwimmingPool,
  "hot-tub": FaHotTub,
  "car": FaCar,
  "bus": FaBus,
  "train": FaTrain,
  "plane": FaPlane,
  "ship": FaShip,
  "anchor": FaAnchor,
  "parking": FaParking,
  "gas": FaGasPump,
  "baby": FaBaby,
  "child": FaChild,
  "family": MdFamilyRestroom,
  "childcare": MdChildCare,
  "puzzle": FaPuzzlePiece,
  "teddy-bear": FaChild,
  "stroller": FaBabyCarriage,
  "dog": FaDog,
  "cat": FaCat,
  "paw": FaPaw,
  "pets": MdPets,
  "hospital": FaHospital,
  "medkit": FaMedkit,
  "stethoscope": FaStethoscope,
  "pills": FaPills,
  "tooth": FaTooth,
  "heartbeat": FaHeartbeat,
  "accessible": MdAccessible,
  "landmark": FaLandmark,
  "church": FaChurch,
  "compass": FaCompass,
  "map-marker": FaMapMarkerAlt,
  "warehouse": FaWarehouse,
  "industry": FaIndustry,
  "star": FaStar,
  "heart": FaHeart,
  "favorite": MdFavorite,
  "thumbs-up": MdThumbUp,
  "lightbulb": FaLightbulb,
  "folder": FaFolder,
};

const categoryIcons: Record<string, IconType> = {
  "Restaurants": FaUtensils,
  "Things to Do": FaCompass,
  "Beaches": FaUmbrellaBeach,
  "Nightlife": FaMoon,
  "History": FaLandmark,
  "Local Tips": FaLightbulb,
  "Shopping": FaShoppingBag,
  "Family": FaBaby,
};

export function CategoryFilter({ selected, onSelect, categories }: CategoryFilterProps) {
  const getIcon = (category: ArticleCategoryRecord | string): IconType => {
    if (typeof category === 'string') {
      return categoryIcons[category] || FaFolder;
    }
    if (category.icon) {
      return iconMap[category.icon.toLowerCase()] || FaFolder;
    }
    return categoryIcons[category.name] || FaFolder;
  };

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 py-2">
        <Button
          variant={selected === null ? "secondary" : "outline"}
          size="sm"
          onClick={() => onSelect(null)}
          data-testid="filter-all"
        >
          All
        </Button>
        {categories ? (
          categories.map((category) => {
            const Icon = getIcon(category);
            return (
              <Button
                key={category.id}
                variant={selected === category.name ? "secondary" : "outline"}
                size="sm"
                onClick={() => onSelect(category.name)}
                data-testid={`filter-${category.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className="h-4 w-4 mr-1" />
                {category.name}
              </Button>
            );
          })
        ) : (
          defaultArticleCategories.map((categoryName) => {
            const Icon = getIcon(categoryName);
            return (
              <Button
                key={categoryName}
                variant={selected === categoryName ? "secondary" : "outline"}
                size="sm"
                onClick={() => onSelect(categoryName)}
                data-testid={`filter-${categoryName.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className="h-4 w-4 mr-1" />
                {categoryName}
              </Button>
            );
          })
        )}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
