using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Server.Data;
using Server.Models;
using System;
using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContactController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly ILogger<ContactController> _logger;

        public ContactController(
            AppDbContext context,
            IConfiguration config,
            ILogger<ContactController> logger)
        {
            _context = context;
            _config = config;
            _logger = logger;
        }

        // ============================
        // POST: api/contact
        // ============================
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Submit([FromBody] ContactRequest request)
        {
            // 1️⃣ Safety: request null
            if (request == null)
                return BadRequest("Request body is missing.");

            // 2️⃣ Model validation (DataAnnotations)
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            try
            {
                // 3️⃣ Persist to database
                var contact = new Contact
                {
                    Email = request.Email.Trim(),
                    Message = request.Message.Trim(),
                    Date = DateTime.UtcNow
                };

                await _context.Contact.AddAsync(contact);
                await _context.SaveChangesAsync();

                // 4️⃣ Send notification email
                var emailSent = await SendEmailAsync(contact.Email, contact.Message);

                if (!emailSent)
                {
                    _logger.LogWarning("Contact saved but email sending failed for {Email}", contact.Email);
                    return StatusCode(
                        StatusCodes.Status500InternalServerError,
                        new { message = "Message saved, but email failed to send." }
                    );
                }

                return Ok(new { message = "Message submitted successfully." });
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while saving contact message.");
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new { message = "Database error occurred." }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in ContactController.");
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new { message = "Unexpected server error." }
                );
            }
        }

        // ============================
        // EMAIL SENDER
        // ============================
        private async Task<bool> SendEmailAsync(string userEmail, string message)
        {
            try
            {
                var smtpServer = _config["EmailSettings:SmtpServer"];
                var senderEmail = _config["EmailSettings:SenderEmail"];
                var senderPassword = _config["EmailSettings:SenderPassword"];
                var adminEmail = _config["EmailSettings:AdminEmail"];

                if (string.IsNullOrWhiteSpace(smtpServer) ||
                    string.IsNullOrWhiteSpace(senderEmail) ||
                    string.IsNullOrWhiteSpace(senderPassword) ||
                    string.IsNullOrWhiteSpace(adminEmail))
                {
                    _logger.LogError("EmailSettings are not properly configured.");
                    return false;
                }

                var email = new MimeMessage();
                email.From.Add(new MailboxAddress("STOX Contact Form", senderEmail));
                email.To.Add(MailboxAddress.Parse(adminEmail));
                email.Subject = $"📩 New Contact Message from {userEmail}";

                var senderIp = HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? "Unknown";

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = $@"
<div style='font-family:Arial,sans-serif;max-width:600px;margin:auto'>
  <h2>New Contact Message</h2>
  <p><strong>From:</strong> {WebUtility.HtmlEncode(userEmail)}</p>
  <p><strong>Message:</strong></p>
  <div style='padding:10px;background:#f4f4f4;border-left:4px solid #3ABEF9'>
    {WebUtility.HtmlEncode(message).Replace("\n", "<br/>")}
  </div>
  <hr/>
  <p style='font-size:12px;color:#777'>
    Submitted: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC<br/>
    IP: {senderIp}
  </p>
</div>"
                };

                email.Body = bodyBuilder.ToMessageBody();

                using var smtp = new SmtpClient();

                await smtp.ConnectAsync(
                    smtpServer,
                    587,
                    SecureSocketOptions.StartTls
                );

                await smtp.AuthenticateAsync(senderEmail, senderPassword);
                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send contact email.");
                return false;
            }
        }

        // ============================
        // REQUEST MODEL
        // ============================
        public class ContactRequest
        {
            [Required]
            [EmailAddress]
            public string Email { get; set; }

            [Required]
            [MinLength(5)]
            [MaxLength(2000)]
            public string Message { get; set; }
        }
    }
}
