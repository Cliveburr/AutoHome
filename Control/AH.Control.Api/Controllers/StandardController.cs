using AH.Control.Api.Business;
using AH.Control.Api.Entities;
using AH.Control.Api.Models.Standard;
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
        public IndexViewModel Index()
        {
            var standard = _standard.Get();
            return new IndexViewModel
            {
                List = standard.Select(s => new IndexStandard
                {
                    StandardId = s.StandardId,
                    Name = s.Name,
                    Type = s.Type,
                    ModuleCount = s.ModuleUse.Count
                }).ToArray()
            };
        }

        [HttpDelete("{id}")]
        public string Delete(string id)
        {
            return _standard.Delete(id);
        }

        [HttpGet("edit/{id}")]
        public EditViewModel GetEdit(string id)
        {
            if (id == "create")
            {
                return new EditViewModel
                {
                    StandardId = id,
                    Name = "",
                    Type = StandardType.BlackWhiteLight
                };
            }
            else
            {
                var standard = _standard.Get(id);

                return new EditViewModel
                {
                    StandardId = standard.StandardId,
                    Name = standard.Name,
                    Type = standard.Type
                };
            }
        }

        [HttpPost("edit")]
        public void PostEdit([FromBody] EditViewModel model)
        {
            if (model.StandardId == "create")
            {
                var area = new StandardEntity
                {
                    StandardId = model.StandardId,
                    Name = model.Name,
                    Type = model.Type
                };
                _standard.Create(area);
            }
            else
            {
                _standard.Update(model.StandardId, model.Name, model.Type);
            }
        }

        [HttpGet("editor/{id}")]
        public EditorViewModel GetEditor(string id)
        {
            var standard = _standard.Get(id);
            return new EditorViewModel
            {
                StandardId = standard.StandardId,
                Name = standard.Name,
                Type = standard.Type,
                RgbLightValue = standard.RgbLightValue
            };
        }

        [HttpPost("editor")]
        public void PostEditor([FromBody] EditorViewModel model)
        {
            switch (model.Type)
            {
                case StandardType.RbgLight:
                    {
                        var standard = _standard.UpdateRbgLightValue(model.StandardId, model.RgbLightValue);
                        //_autoHome.SendValue(module);
                        break;
                    }
                default:
                    throw new Exception();
            }
        }
    }
}