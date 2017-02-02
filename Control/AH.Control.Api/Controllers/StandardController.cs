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
    public class StandardController : ControllerBase
    {
        private StandardComponent _standard;

        public StandardController(StandardComponent standard)
        {
            _standard = standard;
        }

        [HttpGet]
        public IEnumerable<StandardEntity> Get()
        {
            return _standard.Get();
        }

        [HttpGet("{id}")]
        public StandardEntity GetByUID(string id)
        {
            return _standard.GetByID(id);
        }

        [HttpGet("listByType/{type}")]
        public IEnumerable<StandardList> GetListByType(StandardType type)
        {
            return _standard.GetListByType(type);
        }

        [HttpPut]
        public string Put([FromBody] StandardEntity entity)
        {
            return _standard.Create(entity);
        }

        [HttpPost]
        public void Post([FromBody] StandardEntity entity)
        {
            _standard.Update(entity);
        }

        [HttpPost("value")]
        public void PostValue([FromBody] StandardEntity entity)
        {
            _standard.UpdateValue(entity);
        }

        [HttpDelete("{id}")]
        public string Delete(string id)
        {
            return _standard.Delete(id);
        }
    }
}