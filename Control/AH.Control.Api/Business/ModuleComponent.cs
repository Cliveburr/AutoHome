using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AH.Control.Api.Entities;

namespace AH.Control.Api.Business
{
    public class ModuleComponent : ComponentBase
    {
        public ModuleComponent(AutoHomeDatabase db)
            : base(db)
        {
        }

        public IEnumerable<ModuleEntity> Get()
        {
            return Db.Module.GetAll();
        }

        public string Create(ModuleEntity entity)
        {
            return Db.Module.Create(entity);
        }

        public string Update(string id, ModuleEntity entity)
        {
            return Db.Module.Update(id, entity);
        }

        public string Delete(string id)
        {
            return Db.Module.Delete(id);
        }
    }
}