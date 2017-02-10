using AH.Control.Api.Business;
using AH.Control.Api.Entities;
using AH.Control.Api.Models.Area;
using AH.Control.Api.Protocol;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Controllers
{
    [Route("api/[controller]")]
    public class AreaController : Controller
    {
        private AreaComponent _area;
        private AutoHomeProtocol _autoHome;

        public AreaController(AreaComponent area, AutoHomeProtocol autoHome)
        {
            _area = area;
            _autoHome = autoHome;
        }

        [HttpGet]
        public IndexViewModel Index()
        {
            var areas = _area.Get();
            return new IndexViewModel
            {
                List = areas.Select(a => new IndexArea
                {
                    AreaId = a.AreaId,
                    Name = a.Name,
                    ModuleCount = a.ModuleContent.Count
                }).ToArray()
            };
        }

        [HttpDelete("{id}")]
        public void Delete(string id)
        {
            _area.Delete(id);
        }

        [HttpGet("edit/{id}")]
        public EditViewModel GetEdit(string id)
        {
            var avaiable = _area.LoadModuleAvaiables();
            if (id == "create")
            {
                return new EditViewModel
                {
                    AreaId = id,
                    Name = "",
                    Belong = new EditModule[] { },
                    Avaliable = avaiable.Select(a => new EditModule { ModuleId = a.ModuleId, Alias = a.Alias }).ToArray()
                };
            }
            else
            {
                var area = _area.Get(id);
                var belong = _area.LoadModule(area.ModuleContent);

                return new EditViewModel
                {
                    AreaId = area.AreaId,
                    Name = area.Name,
                    Belong = belong.Select(b => new EditModule { ModuleId = b.ModuleId, Alias = b.Alias }).ToArray(),
                    Avaliable = avaiable.Select(a => new EditModule { ModuleId = a.ModuleId, Alias = a.Alias }).ToArray()
                };
            }
        }

        [HttpPost("edit")]
        public void PostEdit([FromBody] EditViewModel model)
        {
            var area = new AreaEntity
            {
                AreaId = model.AreaId,
                Name = model.Name,
                ModuleContent = model.Belong.Select(b => b.ModuleId).ToList()
            };

            if (area.AreaId == "create")
            {
                _area.Create(area);
            }
            else
            {
                _area.Update(area);
            }
        }

        [HttpGet("area")]
        public AreaViewModel GetArea()
        {
            var areas = _area.Get();
            return new AreaViewModel
            {
                List = areas.Select(a => new AreaItem
                {
                    Name = a.Name,
                    Modules = _area.LoadModule(a.ModuleContent).Select(m => new ModuleItem
                    {
                        ModuleId = m.ModuleId,
                        Alias = m.Alias,
                        Type = m.Type
                    }).ToArray()
                }).ToArray()
            };
        }
    }
}