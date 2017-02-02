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

        [HttpGet("{id}")]
        public ModuleEntity GetByID(string id)
        {
            return _module.GetByID(id);
        }

        [HttpGet("uid/{uid}")]
        public ModuleEntity GetByUID(ushort uid)
        {
            return _module.GetByUID(uid);
        }

        [HttpPut]
        public string Put([FromBody] ModuleEntity entity)
        {
            return _module.Create(entity);
        }

        [HttpPost("{uid}")]
        public void Post(string uid, [FromBody] ModuleEntity entity)
        {
            _module.UpdateForUID(ushort.Parse(uid), entity);
        }

        [HttpPost("state")]
        public void PostValue([FromBody] ModuleEntity entity)
        {
            _module.UpdateState(entity);
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