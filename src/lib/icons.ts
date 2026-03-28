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

export const iconCategories: { category: string; icons: { name: string; icon: IconType }[] }[] = [
  {
    category: "Food & Drink",
    icons: [
      { name: "restaurant", icon: MdRestaurant },
      { name: "utensils", icon: FaUtensils },
      { name: "cafe", icon: MdLocalCafe },
      { name: "coffee", icon: FaCoffee },
      { name: "bar", icon: MdLocalBar },
      { name: "wine", icon: FaWineGlassAlt },
      { name: "wine-bar", icon: MdWineBar },
      { name: "cocktail", icon: FaCocktail },
      { name: "beer", icon: FaBeer },
      { name: "pizza", icon: FaPizzaSlice },
      { name: "burger", icon: FaHamburger },
      { name: "fastfood", icon: MdFastfood },
      { name: "bakery", icon: MdBakeryDining },
      { name: "ramen", icon: MdRamenDining },
      { name: "ice-cream", icon: FaIceCream },
      { name: "fish", icon: FaFish },
      { name: "birthday-cake", icon: FaBirthdayCake },
      { name: "cheers", icon: FaGlassCheers },
    ]
  },
  {
    category: "Beach & Outdoors",
    icons: [
      { name: "beach", icon: FaUmbrellaBeach },
      { name: "beach-access", icon: MdBeachAccess },
      { name: "water", icon: FaWater },
      { name: "swimmer", icon: FaSwimmer },
      { name: "pool", icon: MdPool },
      { name: "surfing", icon: MdSurfing },
      { name: "kayaking", icon: MdKayaking },
      { name: "sailing", icon: MdSailing },
      { name: "boat", icon: MdDirectionsBoat },
      { name: "sun", icon: FaSun },
      { name: "sunny", icon: MdSunny },
      { name: "cloud", icon: FaCloud },
      { name: "mountain", icon: FaMountain },
      { name: "tree", icon: FaTree },
      { name: "park", icon: MdPark },
      { name: "forest", icon: MdForest },
      { name: "nature", icon: MdNature },
      { name: "landscape", icon: MdLandscape },
    ]
  },
  {
    category: "Activities & Sports",
    icons: [
      { name: "bicycle", icon: FaBicycle },
      { name: "running", icon: FaRunning },
      { name: "golf", icon: MdSportsGolf },
      { name: "tennis", icon: MdSportsTennis },
      { name: "soccer", icon: MdSportsSoccer },
      { name: "football", icon: FaFootballBall },
      { name: "basketball", icon: FaBasketballBall },
      { name: "baseball", icon: MdSportsBaseball },
      { name: "volleyball", icon: MdSportsVolleyball },
      { name: "dumbbell", icon: FaDumbbell },
      { name: "spa", icon: FaSpa },
      { name: "gamepad", icon: FaGamepad },
    ]
  },
  {
    category: "Arts & Culture",
    icons: [
      { name: "palette", icon: FaPalette },
      { name: "theater", icon: FaTheaterMasks },
      { name: "museum", icon: MdMuseum },
      { name: "theaters", icon: MdTheaters },
      { name: "guitar", icon: FaGuitar },
      { name: "microphone", icon: FaMicrophone },
      { name: "music", icon: FaMusic },
      { name: "book", icon: FaBook },
      { name: "graduation", icon: FaGraduationCap },
      { name: "camera", icon: FaCamera },
      { name: "attractions", icon: MdAttractions },
    ]
  },
  {
    category: "Nightlife & Events",
    icons: [
      { name: "moon", icon: FaMoon },
      { name: "nightlife", icon: MdNightlife },
      { name: "casino", icon: MdCasino },
      { name: "celebration", icon: MdCelebration },
      { name: "events", icon: MdEmojiEvents },
      { name: "ticket", icon: FaTicketAlt },
      { name: "calendar", icon: FaCalendarAlt },
      { name: "fire", icon: FaFireAlt },
    ]
  },
  {
    category: "Shopping & Services",
    icons: [
      { name: "shopping-bag", icon: FaShoppingBag },
      { name: "shopping-cart", icon: FaShoppingCart },
      { name: "store", icon: FaStore },
      { name: "mall", icon: MdLocalMall },
      { name: "grocery", icon: MdLocalGroceryStore },
      { name: "gift", icon: FaGift },
      { name: "tshirt", icon: FaTshirt },
      { name: "gem", icon: FaGem },
      { name: "ring", icon: FaRing },
      { name: "crown", icon: FaCrown },
      { name: "glasses", icon: FaGlasses },
      { name: "florist", icon: MdLocalFlorist },
      { name: "pharmacy", icon: MdLocalPharmacy },
      { name: "laundry", icon: MdLocalLaundryService },
    ]
  },
  {
    category: "Accommodation & Amenities",
    icons: [
      { name: "home", icon: FaHome },
      { name: "bed", icon: FaBed },
      { name: "couch", icon: FaCouch },
      { name: "building", icon: FaBuilding },
      { name: "city", icon: FaCity },
      { name: "house", icon: FaHouseUser },
      { name: "wifi", icon: FaWifi },
      { name: "tv", icon: FaTv },
      { name: "swimming-pool", icon: FaSwimmingPool },
      { name: "hot-tub", icon: FaHotTub },
    ]
  },
  {
    category: "Transport",
    icons: [
      { name: "car", icon: FaCar },
      { name: "bus", icon: FaBus },
      { name: "train", icon: FaTrain },
      { name: "plane", icon: FaPlane },
      { name: "ship", icon: FaShip },
      { name: "anchor", icon: FaAnchor },
      { name: "parking", icon: FaParking },
      { name: "gas", icon: FaGasPump },
    ]
  },
  {
    category: "Family & Pets",
    icons: [
      { name: "baby", icon: FaBaby },
      { name: "child", icon: FaChild },
      { name: "family", icon: MdFamilyRestroom },
      { name: "childcare", icon: MdChildCare },
      { name: "puzzle", icon: FaPuzzlePiece },
      { name: "teddy-bear", icon: FaChild },
      { name: "stroller", icon: FaBabyCarriage },
      { name: "dog", icon: FaDog },
      { name: "cat", icon: FaCat },
      { name: "paw", icon: FaPaw },
      { name: "pets", icon: MdPets },
    ]
  },
  {
    category: "Health & Wellness",
    icons: [
      { name: "hospital", icon: FaHospital },
      { name: "medkit", icon: FaMedkit },
      { name: "stethoscope", icon: FaStethoscope },
      { name: "pills", icon: FaPills },
      { name: "tooth", icon: FaTooth },
      { name: "heartbeat", icon: FaHeartbeat },
      { name: "accessible", icon: MdAccessible },
    ]
  },
  {
    category: "Places & Landmarks",
    icons: [
      { name: "landmark", icon: FaLandmark },
      { name: "church", icon: FaChurch },
      { name: "compass", icon: FaCompass },
      { name: "map-marker", icon: FaMapMarkerAlt },
      { name: "warehouse", icon: FaWarehouse },
      { name: "industry", icon: FaIndustry },
    ]
  },
  {
    category: "General",
    icons: [
      { name: "star", icon: FaStar },
      { name: "heart", icon: FaHeart },
      { name: "favorite", icon: MdFavorite },
      { name: "thumbs-up", icon: MdThumbUp },
      { name: "lightbulb", icon: FaLightbulb },
      { name: "folder", icon: FaFolder },
    ]
  },
];

export const allIcons = iconCategories.flatMap(cat => cat.icons);

export const iconMap: Record<string, IconType> = Object.fromEntries(
  allIcons.map(icon => [icon.name, icon.icon])
);

export function getIconByName(name: string | null | undefined): IconType {
  if (!name) return FaFolder;
  return iconMap[name] || FaFolder;
}
