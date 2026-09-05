import React, { createContext, useContext, useState } from 'react';
import { Product, CartItem } from '../types';

interface CartContextData {
  items: CartItem[];
  addToCart: (product: Product, selectedSize: string, selectedColor: string) => void;
  removeFromCart: (productId: string, selectedSize: string) => void;
  updateQuantity: (productId: string, selectedSize: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product, selectedSize: string, selectedColor: string) => {
    setItems((currentItems) => {
      const existingIndex = currentItems.findIndex(
        (item) => item.product.id === product.id && item.selectedSize === selectedSize
      );

      if (existingIndex > -1) {
        const updated = [...currentItems];
        updated[existingIndex].quantity += 1;
        return updated;
      }

      return [...currentItems, { product, selectedSize, selectedColor, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string, selectedSize: string) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => !(item.product.id === productId && item.selectedSize === selectedSize)
      )
    );
  };

  const updateQuantity = (productId: string, selectedSize: string, delta: number) => {
    setItems((currentItems) => {
      return currentItems
        .map((item) => {
          if (item.product.id === productId && item.selectedSize === selectedSize) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
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
