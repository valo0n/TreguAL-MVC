using Microsoft.AspNetCore.Mvc;

namespace StoxAPI.Controllers
{
    public class StockPagesController : Controller
    {
        public IActionResult Product() => View();        // Views/StockPages/Product.cshtml
        public IActionResult AddProduct() => View();     // Views/StockPages/AddProduct.cshtml
        public IActionResult EditProduct() => View();    // Views/StockPages/EditProduct.cshtml

        public IActionResult Sale() => View();           // Views/StockPages/Sale.cshtml
        public IActionResult AddSale() => View();        // Views/StockPages/AddSale.cshtml

        public IActionResult Purchase() => View();       // Views/StockPages/Purchase.cshtml
        public IActionResult AddPurchase() => View();    // Views/StockPages/AddPurchase.cshtml

        public IActionResult Income() => View();         // Views/StockPages/Income.cshtml
    }
}
