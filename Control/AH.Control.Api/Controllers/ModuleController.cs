using AH.Control.Api.Business;
using AH.Control.Api.Entities;
using AH.Control.Api.Models.Module;
using AH.Control.Api.Protocol;
using AH.Protocol.Library.Module;
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
        private AreaComponent _area;
        private StandardComponent _standard;
        private AutoHomeProtocol _autoHome;

        public ModuleController(ModuleComponent module, AreaComponent area, StandardComponent standard, AutoHomeProtocol autoHome)
        {
            _module = module;
            _area = area;
            _standard = standard;
            _autoHome = autoHome;
        }

        [HttpGet]
        public IndexViewModel Index()
        {
            var modules = _module.Get();
            return new IndexViewModel
            {
                List = modules.Select(m => new IndexModule
                {
                    ModuleId = m.ModuleId,
                    UID = m.UID,
                    Alias = m.Alias,
                    Type = m.Type,
                    AreaBelong = string.IsNullOrEmpty(m.AreaBelong) ? "" : _area.Get(m.AreaBelong)?.Name
                }).ToArray()
            };
        }

        [HttpGet("broadcastinforequest")]
        public void BroadcastInfoRequest()
        {
            _autoHome.BroadcastInfoRequest();
        }

        [HttpDelete("{id}")]
        public void Delete(string id)
        {
            _module.Delete(id);
        }

        [HttpGet("edit/{id}")]
        public EditViewModel GetEdit(string id)
        {
            var module = _module.Get(id);
            return new EditViewModel
            {
                ModuleId = module.ModuleId,
                UID = module.UID,
                Alias = module.Alias
            };
        }

        [HttpPost("edit")]
        public void PostEdit([FromBody] EditViewModel model)
        {
            _module.Update(model.ModuleId, model.Alias);
        }

        [HttpGet("editor/{id}")]
        public EditorViewModel GetEditor(string id)
        {
            var module = _module.Get(id);
            return new EditorViewModel
            {
                ModuleId = module.ModuleId,
                Alias = module.Alias,
                Type = module.Type,
                LedRibbonRgbState = module.LedRibbonRgbState,
                StandardList = GetStandardList(module.Type)
            };
        }

        [HttpPost("editor")]
        public void PostEditor([FromBody] EditorViewModel model)
        {
            switch (model.Type)
            {
                case ModuleType.LedRibbonRgb:
                    {
                        var module = _module.UpdateLedRibbonRgbState(model.ModuleId, model.LedRibbonRgbState);
                        _autoHome.SendValue(module);
                        break;
                    }
                default:
                    throw new Exception();
            }
        }

        [HttpGet("byarea/{areaId}")]
        public ByAreaViewModel[] GetModuleByArea(string areaId)
        {
            var modules = _module.GetByArea(areaId);
            return modules.Select(m => new ByAreaViewModel
            {
                ModuleId = m.ModuleId,
                Alias = m.Alias,
                Type = m.Type
            }).ToArray();
        }

        [HttpGet("mobileeditor/{id}")]
        public MobileEditorViewModel GetMobileEditor(string id)
        {
            var module = _module.Get(id);
            if (module == null)
                return null;

            var area = _area.Get(module.AreaBelong);
            if (area == null)
                return null;

            return new MobileEditorViewModel
            {
                ModuleId = module.ModuleId,
                Alias = module.Alias,
                Type = module.Type,
                Area = area.Name,
                LedRibbonRgbState = module.LedRibbonRgbState,
                StandardList = GetStandardList(module.Type, true)
            };
        }

        [HttpPost("mobileeditor")]
        public void PostMobileEditor([FromBody] MobileEditorViewModel model)
        {
            switch (model.Type)
            {
                case ModuleType.LedRibbonRgb:
                    {
                        var module = _module.UpdateLedRibbonRgbState(model.ModuleId, model.LedRibbonRgbState);
                        _autoHome.SendValue(module);
                        break;
                    }
                default:
                    throw new Exception();
            }
        }

        [HttpPost("wificonfiguration/{id}")]
        public void WifiConfiguration(string id, [FromBody]WifiConfigurationModel model)
        {
            var module = _module.Get(id);
            if (module == null)
                throw new Exception($"Module Id: {id} not found!");

            _autoHome.SendWifiConfiguration(module, model);
        }

        //[HttpGet("discoveryforconfiguration")]
        //public ConfigurationViewModel GetDiscoveryForConfiguration()
        //{
        //    var module = _module.Get(id);
        //    if (module == null)
        //        return null;

        //    var area = _area.Get(module.AreaBelong);
        //    if (area == null)
        //        return null;

        //    return new ConfigurationViewModel
        //    {
        //        ModuleId = module.ModuleId,
        //        Alias = module.Alias,
        //        Type = module.Type,
        //        Area = area.Name,
        //        LedRibbonRgbState = module.LedRibbonRgbState,
        //        StandardList = GetStandardList(module.Type, true)
        //    };
        //}

        private Models.Standard.StandardListViewModel[] GetStandardList(ModuleType type, bool withValue = false)
        {
            switch (type)
            {
                case ModuleType.LedRibbonRgb:
                    {
                        return _standard.GetListByType(StandardType.RbgLight)
                            .Select(s => new Models.Standard.StandardListViewModel
                            {
                                StandardId = s.StandardId,
                                Name = s.Name,
                                RgbLightValue = withValue ? s.RgbLightValue : null
                            }).ToArray();

                    }
                //case ModuleType.IncandescentLamp: standardType = StandardType.BlackWhiteLight; break;
                default:
                    throw new Exception("Invalid ModuleType! Type: " + type.ToString());
            }
        }
    }
}