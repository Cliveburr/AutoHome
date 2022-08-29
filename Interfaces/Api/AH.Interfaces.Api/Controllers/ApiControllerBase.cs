using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AH.Interfaces.Api.Controllers
{
    [EnableCors]
    [Authorize]
    [ApiController]
    public class ApiControllerBase : ControllerBase
    {
    }
}
