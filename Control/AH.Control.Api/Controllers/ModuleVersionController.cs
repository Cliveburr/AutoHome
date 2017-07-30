using AH.Control.Api.Business;
using AH.Control.Api.Entities;
using AH.Control.Api.Models.ModuleVersion;
using AH.Protocol.Library.Module;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Controllers
{
    [Route("api/[controller]")]
    public class ModuleVersionController : ControllerBase
    {
        private ModuleVersionComponent _moduleVersion;

        public ModuleVersionController(ModuleVersionComponent moduleVersion)
        {
            _moduleVersion = moduleVersion;
        }

        [HttpGet]
        public IndexViewModel Index()
        {
            var moduleVersion = _moduleVersion.Get();
            return new IndexViewModel
            {
                List = moduleVersion.Select(v => new IndexModuleVersion
                {
                    ModuleVersionId = v.ModuleVersionId,
                    Name = v.Name,
                    Version = v.Version,
                    Type = v.Type
                }).ToArray()
            };
        }

        [HttpDelete("{id}")]
        public string Delete(string id)
        {
            return _moduleVersion.Delete(id);
        }

        [HttpGet("edit/{id}")]
        public EditViewModel GetEdit(string id)
        {
            if (id == "create")
            {
                return new EditViewModel
                {
                    ModuleVersionId = id,
                    Name = "",
                    Version = "",
                    Type = AH.Protocol.Library.Module.ModuleType.IncandescentLamp,
                    User1File = "",
                    User1Blob = null,
                    User2File = "",
                    User2Blob = null
                };
            }
            else
            {
                var version = _moduleVersion.Get(id);

                return new EditViewModel
                {
                    ModuleVersionId = version.ModuleVersionId,
                    Name = version.Name,
                    Version = version.Version,
                    Type = version.Type,
                    User1File = version.User1File,
                    User1Blob = version.User1Blob == null ? "" :  Convert.ToBase64String(version.User1Blob),
                    User2File = version.User2File,
                    User2Blob = version.User2Blob == null ? "" : Convert.ToBase64String(version.User2Blob)
                };
            }
        }

        [HttpPost("edit")]
        public void PostEdit([FromBody] EditViewModel model)
        {
            var moduleVersion = new ModuleVersionEntity
            {
                ModuleVersionId = model.ModuleVersionId,
                Name = model.Name,
                Version = model.Version,
                Type = model.Type,
                User1File = model.User1File,
                User1Blob = Convert.FromBase64String(model.User1Blob),
                User2File = model.User2File,
                User2Blob = Convert.FromBase64String(model.User2Blob)
            };


            if (model.ModuleVersionId == "create")
            {
                _moduleVersion.Create(moduleVersion);
            }
            else
            {
                _moduleVersion.Update(moduleVersion);
            }
        }

        [HttpGet("filter/{type}")]
        public IndexModuleVersion[] GetFilter(ModuleType type)
        {
            var moduleVersion = _moduleVersion.GetFilter(type);
            return moduleVersion.Select(v => new IndexModuleVersion
            {
                ModuleVersionId = v.ModuleVersionId,
                Name = v.Name,
                Version = v.Version,
                Type = v.Type
            }).ToArray();
        }
    }
}
