using AH.Control.Api.Entities;
using RethinkDb.Driver.Net;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Business
{
    public class AreaComponent : ComponentBase
    {
        public AreaComponent(AutoHomeDatabase db)
            : base(db)
        {
        }

        public Cursor<AreaEntity> Get()
        {
            return Db.Area.Get();
        }

        public AreaEntity Get(string id)
        {
            return Db.Area
                .Get(id);
        }

        public string Create(AreaEntity entity)
        {
            entity.AreaId = null;
            var areaId = Db.Area.Create(entity);
            AdjustModuleContent(areaId, entity.ModuleContent, null);
            return areaId;
        }

        public string Delete(string id)
        {
            var entity = Get(id);
            if (entity == null)
                throw new Exception($"Area not found, AreaId: {id}");

            AdjustModuleContent(entity.AreaId, null, entity.ModuleContent);

            return Db.Area.Delete(entity.AreaId);
        }

        public string Update(AreaEntity model)
        {
            var entity = Get(model.AreaId);
            if (entity == null)
                throw new Exception($"Area not found, AreaId: {model.AreaId}");

            AdjustModuleContent(entity.AreaId, model.ModuleContent, entity.ModuleContent);
            entity.ModuleContent = model.ModuleContent;
            entity.Name = model.Name;

            return Db.Area.Update(entity.AreaId, entity);
        }

        private void AdjustModuleContent(string areaId, List<string> newsModule, List<string> oldModule)
        {
            if (newsModule != null)
            {
                var modules = newsModule
                    .Select(m => Db.Module.Get(m))
                    .Where(m => m != null);

                foreach (var module in modules)
                {
                    module.AreaBelong = areaId;
                    Db.Module.Update(module.ModuleId, module);
                }
            }

            if (oldModule != null)
            {
                var modulesRemove = oldModule
                    .Where(m => newsModule == null ? true : !newsModule.Contains(m))
                    .Select(m => Db.Module.Get(m))
                    .Where(m => m != null);

                foreach (var module in modulesRemove)
                {
                    module.AreaBelong = null;
                    Db.Module.Update(module.ModuleId, module);
                }
            }
        }

        public ModuleEntity[] LoadModuleContent(List<string> moduleIds)
        {
            return moduleIds
                .Select(id => Db.Module.Get(id))
                .ToArray();
        }

        public ModuleEntity[] LoadModuleAvaiables()
        {
            return Db.Module
                .Get()
                .Where(m => string.IsNullOrEmpty(m.AreaBelong))
                .ToArray();
        }
    }
}