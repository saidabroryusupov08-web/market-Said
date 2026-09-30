import { Navigate, Route, Routes } from 'react-router-dom'
import Footer from './components/Footer/Footer'
import Header from './components/Header/Header'
import Main from './components/Main/Main'
import { CartProvider } from './context/CartContext'
import { CatalogFilterProvider } from './context/CatalogFilterContext'
import { ProductsProvider } from './context/ProductsContext'
import { SearchProvider } from './context/SearchContext'
import { WishlistProvider } from './context/WishlistContext'

function App() {
  return (
    <ProductsProvider>
      <CartProvider>
        <WishlistProvider>
          <SearchProvider>
            <CatalogFilterProvider>
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
                {/* admin panel endi alohida sayt (admin/ papkasi); boshqa manzillar bosh sahifaga */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </CatalogFilterProvider>
          </SearchProvider>
        </WishlistProvider>
      </CartProvider>
    </ProductsProvider>
  )
}

export default App
