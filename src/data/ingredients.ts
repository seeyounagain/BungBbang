export const INGREDIENT_DEFS = {
  flour:        { name: '밀가루',    pricePerBatch:  60, batchSize: 50 },
  red_bean:     { name: '단팥',      pricePerBatch: 100, batchSize: 40 },
  cream_cheese: { name: '크림치즈',  pricePerBatch: 150, batchSize: 20 },
  choux:        { name: '슈크림',    pricePerBatch: 200, batchSize: 20 },
} as const;

export type IngredientType = keyof typeof INGREDIENT_DEFS;
