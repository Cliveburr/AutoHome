using AH.Control.Api.Entities;
using AH.Control.Api.Models.Standard;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AH.Protocol.Library.Value;

namespace AH.Control.Api.Business
{
    public class StandardComponent : ComponentBase
    {
        public StandardComponent(AutoHomeDatabase db)
            : base(db)
        {
        }

        public IEnumerable<StandardEntity> Get()
        {
            return Db.Standard.Get();
        }

        public StandardEntity Get(string id)
        {
            return Db.Standard
                .Get(id);
        }

        public IEnumerable<StandardListViewModel> GetListByType(StandardType type)
        {
            return Db.Standard
                .Filter(new { Type = type })
                .Select(s => new StandardListViewModel
                {
                    StandardId = s.StandardId,
                    Name = s.Name
                });
        }

        public string Delete(string id)
        {
            return Db.Standard.Delete(id);
        }

        public string Create(StandardEntity entity)
        {
            entity.StandardId = null;
            return Db.Standard.Create(entity);
        }

        public string Update(string standardId, string name, StandardType type)
        {
            var entity = Get(standardId);
            if (entity == null)
                throw new Exception();

            entity.Name = name;
            entity.Type = type;

            return Db.Standard.Update(entity.StandardId, entity);
        }

        public StandardEntity UpdateRbgLightValue(string standardId, RgbLightValue rgbLightValue)
        {
            var entity = Get(standardId);
            if (entity == null)
                throw new Exception();

            entity.RgbLightValue = rgbLightValue;

            Db.Standard.Update(entity.StandardId, entity);
            return entity;
        }
    }
}