using AH.Control.Api.Business;
using AH.Control.Api.Entities;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Controllers
{
    [Route("api/[controller]")]
    public class ModuleController : Controller
    {
        private ModuleComponent _module;

        public ModuleController(ModuleComponent module)
        {
            _module = module;
        }

        [HttpGet]
        public IEnumerable<ModuleEntity> Get()
        {
            return _module.Get();
        }

        [HttpPut]
        public string Put([FromBody] ModuleEntity entity)
        {
            return _module.Create(entity);
        }

        [HttpPost("{id}")]
        public string Post(string id, [FromBody] ModuleEntity entity)
        {
            return _module.Update(id, entity);
        }

        [HttpDelete("{id}")]
        public string Delete(string id)
        {
            return _module.Delete(id);
        }
    }
}