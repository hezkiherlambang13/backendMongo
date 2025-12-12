import ProductCard from "./components/productCard";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Header from "./components/header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetails";
import Cart from "./pages/Cart";
function App() {
    return (
        <BrowserRouter>
            <Header />
{/* Ganti anchor <a> di Header menjadi Link agar SPA (lihat catatan di bawah) */}
<main>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
             </Routes>
            </main>
         <Footer />
    </BrowserRouter>
);
}
export default App;
// const mock = [
// { id:1, title:"Sneakers", price:499000, image:"https://picsum.photos/seed/1/600/400" },
// { id:2, title:"Backpack", price:349000, image:"https://picsum.photos/seed/2/600/400" },
// ];
// function App() {
// return (
// <>
// <Header />
// <main style={{ padding:"20px" }}>
// <h2>Produk Unggulan</h2>
// <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px, 1fr))", gap:"16px" }}>
// {mock.map(p => (
// <ProductCard
// key={p.id}
// title={p.title}
// price={p.price}
// image={p.image}
// onClick={() => alert(`Detail: ${p.title}`)}
// />
// ))}
// </div>
// </main>
// <Footer />
// </>
// );
// }
// export default App;
