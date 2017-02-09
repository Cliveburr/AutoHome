using AH.Control.Api.Entities;
using AH.Control.Api.Models.Standard;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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

        public StandardEntity GetByID(string id)
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

        public string Create(StandardEntity entity)
        {
            entity.StandardId = null;
            return Db.Standard.Create(entity);
        }

        public string Update(StandardEntity entity)
        {
            return Db.Standard.Update(entity.StandardId, entity);
        }

        public string UpdateValue(StandardEntity entity)
        {
            var model = GetByID(entity.StandardId);
            model.Value = entity.Value;
            return Update(entity);
        }

        public string Delete(string id)
        {
            return Db.Standard.Delete(id);
        }
    }
}