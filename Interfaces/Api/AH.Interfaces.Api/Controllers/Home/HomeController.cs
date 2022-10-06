using AH.Interfaces.Api.Controllers.Home;
using AH.Interfaces.Api.Controllers.Module;
using AH.Interfaces.Api.Service;
using AH.Protocol.Library.Messages.CellingFan;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel;
using System.IO;
using System.Text.Json;

namespace AH.Interfaces.Api.Controllers.HomeProject
{
    [Route("home")]
    public class HomeController : ApiControllerBase
    {
        private static InitResponse? _initResponseCache;
     
        private readonly IWebHostEnvironment _webHostEnvironment;

        public HomeController(IWebHostEnvironment webHostEnvironment)
        {
            _webHostEnvironment = webHostEnvironment;
        }

        [HttpPost("init")]
        public ActionResult<InitResponse?> Init(InitRequest request)
        {
            if (_initResponseCache == null)
            {
                _initResponseCache = BuildInitResponse();
            }

            if (!request.CacheDate.HasValue || (request.CacheDate.HasValue && request.CacheDate.Value < _initResponseCache.CacheDate))
            {
                return Ok(_initResponseCache);
            }
            else
            {
                return Ok(null);
            }
        }

        private InitResponse BuildInitResponse()
        {
            var imageDescriptionPath = Path.Combine(_webHostEnvironment.ContentRootPath, "Images", "home", "home_description.json");
            var imageFullPath = Path.Combine(_webHostEnvironment.ContentRootPath, "Images", "home", "home_full.png");

            var imageDescriptionContent = System.IO.File.ReadAllText(imageDescriptionPath);
            var imageDescription = JsonSerializer.Deserialize<HomeImageDescription>(imageDescriptionContent)!;

            using (var fileStream = new FileStream(imageFullPath, FileMode.Open))
            using (var memoryStream = new MemoryStream())
            {
                fileStream.CopyTo(memoryStream);

                return new InitResponse
                {
                    CacheDate = DateTime.Now,
                    FullImage = memoryStream.ToArray(),
                    GlobalMargin = imageDescription.GlobalMargin,
                    Areas = imageDescription.Areas
                        .Select(a => new InitResponseArea
                        {
                            UID = a.UID,
                            Name = a.Name,
                            Image = a.Image,
                            X = a.PointX,
                            Y = a.PointY,
                            Width = a.Width,
                            Height = a.Height
                        })
                        .ToList()
                };
            }
        }
    }
}
