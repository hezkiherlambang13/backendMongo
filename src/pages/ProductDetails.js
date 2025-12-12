import { useParams } from "react-router-dom";
export default function ProductsDetails() {
const { id } = useParams();
return (
<section className="page-section">
    <h2>Detail Produk #{id}</h2>
    <p>Informasi lengkap produk akan tampil di sini.</p>
</section>
);
}