import accBackpack from '../assets/acc-backpack-navy.png'
import accPouch from '../assets/acc-leather-pouch.png'
import accPhoneCase from '../assets/acc-phone-case-wallet.png'
import dressKhimar from '../assets/dress-khimar-abaya.png'
import hoodieBurgundy from '../assets/hoodie-zip-burgundy.png'
import hoodieNavy from '../assets/hoodie-zip-navy.png'
import jacketSuede from '../assets/jacket-suede-brown.png'
import pantsCargo from '../assets/pants-cargo-olive.png'
import shirtLayered from '../assets/shirt-layered-blue.png'
import shoesSneakers from '../assets/shoes-suede-sneakers.png'
import shortsCargo from '../assets/shorts-cargo-olive.png'
import shortsNylon from '../assets/shorts-nylon-navy.png'
import sweaterHalfZip from '../assets/sweater-half-zip-taupe.png'
import sweaterTurtleneck from '../assets/sweater-turtleneck-grey.png'
import teeCanyon from '../assets/tee-canyon-black.png'
import teeCaucasus from '../assets/tee-caucasus-white.png'
import teeClassicCar from '../assets/tee-classic-car-black.png'
import teeCoteDazur from '../assets/tee-cote-dazur-black.png'
import teeDancersWhite from '../assets/tee-dancers-white.png'
import teeMountain from '../assets/tee-mountain-black.png'
import teeRenaissance from '../assets/tee-renaissance-black.png'
import teeSheep from '../assets/tee-sheep-black.png'

export type Product = {
  id: number
  name: string
  category: string
  price: number
  description: string
  sizes: string[]
  colors: string[]
  image?: string
}

export const categories = [
  'All',
  'T-Shirts',
  'Jackets',
  'Dresses',
  'Shoes',
  'Sweaters',
  'Hoodies',
  'Pants',
  'Shirts',
  'Shorts',
  'Accessories',
]

const clothingSizes = ['XS', 'S', 'M', 'L', 'XL']

// Rasmi yo'q mahsulot qo'shilsa, kulrang placeholder ko'rinadi
export const products: Product[] = [
  {
    id: 9,
    name: 'Mountain Sheep Tee',
    category: 'T-Shirts',
    price: 32.99,
    description: 'Black cotton tee with a scenic mountain photo print.',
    sizes: clothingSizes,
    colors: ['Black'],
    image: teeSheep,
  },
  {
    id: 10,
    name: 'River Canyon Tee',
    category: 'T-Shirts',
    price: 34.99,
    description: 'Black tee with a hand-drawn river canyon illustration.',
    sizes: clothingSizes,
    colors: ['Black'],
    image: teeCanyon,
  },
  {
    id: 11,
    name: "Côte d'Azur Tee",
    category: 'T-Shirts',
    price: 36.99,
    description: 'Oversized black tee with a vintage Riviera sports club print.',
    sizes: clothingSizes,
    colors: ['Black', 'White'],
    image: teeCoteDazur,
  },
  {
    id: 12,
    name: 'Caucasus Heritage Tee',
    category: 'T-Shirts',
    price: 36.99,
    description: 'White cotton tee with a colorful Caucasus mountain village print.',
    sizes: clothingSizes,
    colors: ['White'],
    image: teeCaucasus,
  },
  {
    id: 13,
    name: 'Minimal Mountain Tee',
    category: 'T-Shirts',
    price: 29.99,
    description: 'Black tee with a clean line-art mountain in a triangle.',
    sizes: clothingSizes,
    colors: ['Black'],
    image: teeMountain,
  },
  {
    id: 14,
    name: 'Renaissance Art Tee',
    category: 'T-Shirts',
    price: 38.99,
    description: 'Black tee with a modern twist on a classic Renaissance painting.',
    sizes: clothingSizes,
    colors: ['Black'],
    image: teeRenaissance,
  },
  {
    id: 15,
    name: 'Classic Car Oversized Tee',
    category: 'T-Shirts',
    price: 39.99,
    description: 'Oversized black tee with a cinematic vintage car photo print.',
    sizes: clothingSizes,
    colors: ['Black'],
    image: teeClassicCar,
  },
  {
    id: 16,
    name: 'Leather Phone Case Wallet',
    category: 'Accessories',
    price: 79.99,
    description: 'Premium leather folio phone case with card slots and a detachable magnetic wallet.',
    sizes: ['One Size'],
    colors: ['Brown'],
    image: accPhoneCase,
  },
  {
    id: 17,
    name: 'Urban Backpack',
    category: 'Accessories',
    price: 129.99,
    description: 'Water-resistant rubberized fabric backpack with a padded laptop compartment.',
    sizes: ['One Size'],
    colors: ['Navy'],
    image: accBackpack,
  },
  {
    id: 18,
    name: 'Leather Snap Pouch',
    category: 'Accessories',
    price: 24.99,
    description: 'Compact faux-leather pouch with a spring snap closure for everyday essentials.',
    sizes: ['One Size'],
    colors: ['Black'],
    image: accPouch,
  },
  {
    id: 1,
    name: 'Nylon Drawstring Shorts',
    category: 'Shorts',
    price: 34.99,
    description: 'Lightweight crinkle-nylon shorts with an elastic drawstring waist and zip pockets.',
    sizes: clothingSizes,
    colors: ['Navy'],
    image: shortsNylon,
  },
  {
    id: 22,
    name: 'Cargo Shorts',
    category: 'Shorts',
    price: 39.99,
    description: 'Relaxed cotton cargo shorts with a side flap pocket.',
    sizes: clothingSizes,
    colors: ['Olive'],
    image: shortsCargo,
  },
  {
    id: 2,
    name: 'Belted Cargo Pants',
    category: 'Pants',
    price: 89.99,
    description: 'Wide-leg cotton cargo pants with pleats, flap pockets and a matching belt.',
    sizes: clothingSizes,
    colors: ['Olive'],
    image: pantsCargo,
  },
  {
    id: 3,
    name: 'Classic White T-Shirt',
    category: 'T-Shirts',
    price: 29.99,
    description: 'A timeless white cotton tee with a traditional dancers print.',
    sizes: clothingSizes,
    colors: ['White', 'Black', 'Grey'],
    image: teeDancersWhite,
  },
  {
    id: 4,
    name: 'Suede Jacket',
    category: 'Jackets',
    price: 189.99,
    description: 'Soft suede jacket with a stand collar, snap front and elastic hem.',
    sizes: clothingSizes,
    colors: ['Brown'],
    image: jacketSuede,
  },
  {
    id: 5,
    name: 'Layered Cotton Shirt',
    category: 'Shirts',
    price: 119.99,
    description: 'Crisp cotton poplin shirt with a layered placket, white collar and cuffs.',
    sizes: clothingSizes,
    colors: ['Light Blue'],
    image: shirtLayered,
  },
  {
    id: 6,
    name: 'Shearling Suede Sneakers',
    category: 'Shoes',
    price: 149.99,
    description: 'Suede sneakers lined with cozy shearling on a gum rubber sole.',
    sizes: ['37', '38', '39', '40', '41', '42'],
    colors: ['Beige'],
    image: shoesSneakers,
  },
  {
    id: 7,
    name: 'Khimar & Abaya Set',
    category: 'Dresses',
    price: 99.99,
    description: 'Long flowing khimar paired with a classic black abaya.',
    sizes: ['S/M', 'L/XL'],
    colors: ['Taupe', 'Black'],
    image: dressKhimar,
  },
  {
    id: 8,
    name: 'Wool Turtleneck Sweater',
    category: 'Sweaters',
    price: 129.99,
    description: 'Relaxed wool turtleneck with wide sleeves and ribbed trims.',
    sizes: clothingSizes,
    colors: ['Grey'],
    image: sweaterTurtleneck,
  },
  {
    id: 21,
    name: 'Half-Zip Knit Sweater',
    category: 'Sweaters',
    price: 139.99,
    description: 'Ribbed knit sweater with a spread collar and half-zip neckline.',
    sizes: clothingSizes,
    colors: ['Taupe'],
    image: sweaterHalfZip,
  },
  {
    id: 19,
    name: 'Zip-Up Hoodie',
    category: 'Hoodies',
    price: 89.99,
    description: 'Oversized cotton fleece hoodie with a full zip and leather zip pull.',
    sizes: clothingSizes,
    colors: ['Burgundy'],
    image: hoodieBurgundy,
  },
  {
    id: 20,
    name: 'Cashmere Blend Zip Hoodie',
    category: 'Hoodies',
    price: 159.99,
    description: 'Soft cashmere-blend hoodie with gold-tone zip and drawstring tips.',
    sizes: clothingSizes,
    colors: ['Navy'],
    image: hoodieNavy,
  },
]
