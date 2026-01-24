using Microsoft.AspNetCore.Mvc;

namespace StoxAPI.Controllers
{
    public class AdminPagesController : Controller
    {
        public IActionResult Dashboard() => View();      // Views/AdminPages/Dashboard.cshtml
        public IActionResult See_Users() => View();      // Views/AdminPages/See_Users.cshtml
        public IActionResult See_Messages() => View();   // Views/AdminPages/See_Messages.cshtml
    }
}
