import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const duplicatedCart = [...cart]
      const productExistsOnCart = duplicatedCart.find(product => product.id === productId);
      const stock = await api.get(`/stock/${productId}`)
      const newProduct = await api.get(`/products/${productId}`)
      const currentAmount = productExistsOnCart? productExistsOnCart.amount : 0;
      const amount = currentAmount + 1

      if(amount > stock.data.amount){
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if(productExistsOnCart){
        productExistsOnCart.amount = amount;
      }else{
        duplicatedCart.push({
          ...newProduct.data, 
          amount: amount
        })
      }      
      setCart(duplicatedCart)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(duplicatedCart))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {  
      const duplicatedCart = [...cart]
      const product = duplicatedCart.find(product => product.id === productId)
      if(product){
        const index = duplicatedCart.indexOf(product)
        if(index > -1){
          duplicatedCart.splice(index, 1)
        }
      }else if(!product){
        throw new Error
      }

      setCart(duplicatedCart)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(duplicatedCart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock = await api.get(`/stock/${productId}`)
      if(amount > stock.data.amount){
        toast.error('Quantidade solicitada fora de estoque');
        return
      }
      
      if(amount <= 0){
        throw new Error
      }
      
      const duplicatedCart = [...cart]
      const product = duplicatedCart.find(product => product.id === productId)
      if(product){
        product.amount = amount;
      }

      setCart(duplicatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
