import React, { createContext, useContext, useState } from 'react';
import { Product, CartItem } from '../types';

interface CartContextData {
  items: CartItem[];
  addToCart: (product: Product, selectedSize: string, selectedColor: string) => void;
  removeFromCart: (item: CartItem) => void;
  updateQuantity: (item: CartItem, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

function sameVariant(a: CartItem, b: CartItem): boolean {
  return a.product.id === b.product.id && a.selectedSize === b.selectedSize && a.selectedColor === b.selectedColor;
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product, selectedSize: string, selectedColor: string) => {
    const variant = { product, selectedSize, selectedColor, quantity: 1 };
    setItems((currentItems) => {
      if (!currentItems.some((item) => sameVariant(item, variant))) return [...currentItems, variant];
      return currentItems.map((item) => sameVariant(item, variant)
        ? { ...item, quantity: item.quantity + 1 }
        : item);
    });
  };

  const removeFromCart = (variant: CartItem) => {
    setItems((currentItems) => currentItems.filter(item => !sameVariant(item, variant)));
  };

  const updateQuantity = (variant: CartItem, delta: number) => {
    setItems((currentItems) => currentItems.map(item => sameVariant(item, variant)
      ? { ...item, quantity: Math.max(1, item.quantity + delta) }
      : item));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
