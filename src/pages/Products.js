import React from "react";
import ProductCard from "../components/productCard";
import "./product.css";
import { useNavigate } from "react-router-dom";
const data = Array.from({ length: 8 }).map((_, i) => ({
    id: i + 1,
    title: `Product ${i + 1}`,
    price: 100000 + i * 25000,
    image: `https://picsum.photos/seed/prod${i}/600/400`,
}));
export default function Products() {
return (
<section className="page-section">
     <div className="toolbar">
        <h2>Semua Produk</h2>
            <input className="search" placeholder="Cari produk…" />
    </div>
 <div className="products-grid">
{data.map(p => (
    // const navigate = useNavigate();
<ProductCard   
    key={p.id} 
            {...p} 
                 onClick={() => {}} />
                        ))}
                    </div>
            </section>
    );
}
