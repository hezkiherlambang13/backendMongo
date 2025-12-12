import React from "react";
import "./productCard.css";
export default function ProductCard({ image, title, price, onClick }) {
return (
<article className="product-card" onClick={onClick} role="button"
    tabIndex={0}>
     <img src={image} alt={title} className="product-image" />
         <div className="product-info">
            <h3 className="product-title">{title}</h3>
            <p className="product-price">Rp {price.toLocaleString("id-ID")}</p>
                <button className="btn">Lihat Detail</button>
        </div>
</article>
);
}
