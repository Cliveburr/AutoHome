using AH.Control.Api.Entities;
using AH.Protocol.Library.Module;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Business
{
    public class ModuleVersionComponent : ComponentBase
    {
        public ModuleVersionComponent(AutoHomeDatabase db)
            : base(db)
        {
        }

        public IEnumerable<ModuleVersionEntity> Get()
        {
            return Db.ModuleVersion.Get();
        }

        public ModuleVersionEntity Get(string moduleVersionId)
        {
            return Db.ModuleVersion
                .Get(moduleVersionId);
        }

        public string Create(ModuleVersionEntity entity)
        {
            entity.ModuleVersionId = null;
            return Db.ModuleVersion.Create(entity);
        }

        public void Update(ModuleVersionEntity entity)
        {
            var model = Db.ModuleVersion.Get(entity.ModuleVersionId);
            if (model == null)
                throw new Exception();

            model.Name = entity.Name;
            model.Version = entity.Version;
            model.Type = entity.Type;

            if (entity.User1Blob != null)
            {
                if (entity.User1Blob.Length == 0)
                {
                    model.User1File = null;
                    model.User1Blob = null;
                }
                else
                {
                    model.User1File = entity.User1File;
                    model.User1Blob = entity.User1Blob;
                }
            }

            if (entity.User2Blob != null)
            {
                if (entity.User2Blob.Length == 0)
                {
                    model.User2File = null;
                    model.User2Blob = null;
                }
                else
                {
                    model.User2File = entity.User2File;
                    model.User2Blob = entity.User2Blob;
                }
            }

            Db.ModuleVersion.Update(model.ModuleVersionId, model);
        }

        public string Delete(string moduleVersionId)
        {
            var entity = Get(moduleVersionId);
            if (entity == null)
                return string.Empty;

            return Db.ModuleVersion.Delete(entity.ModuleVersionId);
        }

        public IEnumerable<ModuleVersionEntity> GetFilter(ModuleType type)
        {
            return Db.ModuleVersion
                .Filter(new { Type = type });
        }
    }
}
