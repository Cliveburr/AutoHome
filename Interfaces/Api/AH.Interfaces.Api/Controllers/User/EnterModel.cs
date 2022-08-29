namespace AH.Interfaces.Api.Controllers.User
{
    public class EnterRequest
    {
        public string Password { get; set; }
    }

    public class EnterResponse
    {
        public string Token { get; set; }
    }
}
