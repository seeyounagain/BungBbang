import type { IngredientType } from './ingredients';

export const MENU_DEFS = {
  red_bean:     { name: '단팥 붕어빵',     price: 150, unlockLevel: 1, ingredient: 'red_bean'     as IngredientType },
  cream_cheese: { name: '크림치즈 붕어빵', price: 280, unlockLevel: 2, ingredient: 'cream_cheese' as IngredientType },
  choux:        { name: '슈크림 붕어빵',   price: 450, unlockLevel: 3, ingredient: 'choux'        as IngredientType },
} as const;

export type MenuItem = keyof typeof MENU_DEFS;
