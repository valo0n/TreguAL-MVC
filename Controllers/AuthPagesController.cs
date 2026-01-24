using Microsoft.AspNetCore.Mvc;

namespace StoxAPI.Controllers
{
    public class AuthPagesController : Controller
    {
        public IActionResult Login() => View();          // Views/AuthPages/Login.cshtml
        public IActionResult SignUpForm() => View();     // Views/AuthPages/SignUpForm.cshtml
        public IActionResult StepTwo() => View();        // Views/AuthPages/StepTwo.cshtml
        public IActionResult ForgotLink() => View();     // Views/AuthPages/ForgotLink.cshtml
        public IActionResult ResetPassword() => View();  // Views/AuthPages/ResetPassword.cshtml
    }
}
