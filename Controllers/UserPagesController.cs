using Microsoft.AspNetCore.Mvc;

namespace StoxAPI.Controllers
{
    public class UserPagesController : Controller
    {
        public IActionResult UserDashboard() => View();      // Views/UserPages/UserDashboard.cshtml
        public IActionResult Customer() => View();           // Views/UserPages/Customer.cshtml
        public IActionResult ContactDashboard() => View();   // Views/UserPages/ContactDashboard.cshtml
        public IActionResult SettingsPage() => View();       // Views/UserPages/SettingsPage.cshtml
    
         public IActionResult AddCustomer() => View();   // ✅ SHTO KËTË

    }
}
