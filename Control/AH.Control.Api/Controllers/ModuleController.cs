using AH.Control.Api.Business;
using AH.Control.Api.Entities;
using AH.Control.Api.Protocol;
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
        private AutoHomeProtocol _autoHome;

        public ModuleController(ModuleComponent module, AutoHomeProtocol autoHome)
        {
            _module = module;
            _autoHome = autoHome;
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

        [HttpGet("broadcastinforequest")]
        public void BroadcastInfoRequest()
        {
            _autoHome.BroadcastInfoRequest();
        }
    }
}