using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AH.Interfaces.Api.Controllers.User
{
    [Route("user")]
    public class UserController : ApiControllerBase
    {
        private readonly IConfiguration _config;

        public UserController(IConfiguration config)
        {
            _config = config;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
        {
            var userLogin = _config.GetValue<string>("UserLogin");
            var adminLogin = _config.GetValue<string>("AdminLogin");

            if (!(request.Password == userLogin || request.Password == adminLogin))
            {
                return BadRequest(); ;
            }

            var isAdmin = request.Password == adminLogin;

            var token = GenerateToken(request.UniqueId, isAdmin);

            return new LoginResponse
            {
                Token = token,
                IsAdmin = isAdmin
            };
        }

        private string GenerateToken(string uniqueId, bool isAdmin)
        {
            var key = Encoding.ASCII.GetBytes(_config.GetSection("SecurityKey").Value);

            var claims = new Claim[]
            {
                new Claim(ClaimTypes.NameIdentifier, uniqueId),
                new Claim("AH_ISADMIN", isAdmin.ToString())
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenDescription = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(30),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescription);

            return tokenHandler.WriteToken(token);
        }
    }
}
