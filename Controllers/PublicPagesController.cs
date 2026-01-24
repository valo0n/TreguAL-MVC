using Microsoft.AspNetCore.Mvc;

namespace StoxAPI.Controllers
{
    public class PublicPagesController : Controller
    {
        public IActionResult Landingpage() => View();    // Views/PublicPages/Landingpage.cshtml
        public IActionResult Contact() => View();        // Views/PublicPages/Contact.cshtml
    }
}
