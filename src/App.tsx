import { Route, Routes } from 'react-router-dom'
import Footer from './components/Footer/Footer'
import Header from './components/Header/Header'
import Main from './components/Main/Main'
import { CartProvider } from './context/CartContext'
import { ProductsProvider } from './context/ProductsContext'
import { SearchProvider } from './context/SearchContext'
import { WishlistProvider } from './context/WishlistContext'
import Admin from './pages/Admin'

function App() {
  return (
    <ProductsProvider>
      <CartProvider>
        <WishlistProvider>
          <SearchProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <Header />
                    <Main />
                    <Footer />
                  </>
                }
              />
              {/* admin alohida sahifa, header va footer'siz */}
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </SearchProvider>
        </WishlistProvider>
      </CartProvider>
    </ProductsProvider>
  )
}

export default App
