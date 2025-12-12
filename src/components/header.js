import React from "react";
import "./header.css";
import { Link } from "react-router-dom";
export default function header() {
return (
<header className="header">
<div className="brand"> Online Shop</div>
<nav className="nav">

<nav className="nav">
    <Link to="/">Home</Link>
    <Link to="/products">Products</Link>
    <Link to="/cart">Cart</Link>
</nav>
</nav>
</header>
);
}
