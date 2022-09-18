namespace AH.Interfaces.Api.Controllers.User
{
    public class LoginRequest
    {
        public string Password { get; set; }
        public string UniqueId { get; set; }
    }

    public class LoginResponse
    {
        public string Token { get; set; }
        public bool IsAdmin { get; set; }
    }
}
