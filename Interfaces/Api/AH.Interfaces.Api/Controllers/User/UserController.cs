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

        [HttpGet("test")]
        public async Task<ActionResult<string>> Test()
        {
            return Ok("testando");
        }

        [AllowAnonymous]
        [HttpPost("enter")]
        public async Task<ActionResult<EnterResponse>> Enter(EnterRequest request)
        {
            var globalPassword = _config.GetValue<string>("GlobalPassword");
            if (request.Password != globalPassword)
            {
                return BadRequest();
            }

            var token = GenerateToken();

            return new EnterResponse
            {
                Token = token
            };
        }

        private string GenerateToken()
        {
            var key = Encoding.ASCII.GetBytes(_config.GetSection("SecurityKey").Value);

            var claims = new Claim[]
            {
                new Claim(ClaimTypes.NameIdentifier, "TRUE")
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
