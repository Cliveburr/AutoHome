using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AH.Control.Api.Entities;
using System.Net;
using AH.Protocol.Lan;
using AH.Protocol.Library.Module;
using AH.Protocol.Library.Value;
using AH.Protocol.Library.Module.LedRibbonRGB;
using AH.Control.Api.Entities.State;

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

        public ModuleEntity GetByID(string id)
        {
            return Db.Module
                .Get(id);
        }

        public ModuleEntity GetByUID(ushort uid)
        {
            return Db.Module
                .Filter(new { UID = uid })
                .FirstOrDefault();
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

        public void UpdateAddressForUID(ushort uid, IPAddress address, InfoMessage info)
        {
            var entity = Db.Module
                .Filter(new { UID = uid })
                .FirstOrDefault();

            if (entity == null)
            {
                entity = new ModuleEntity
                {
                    UID = uid,
                    Address = address.GetAddressBytes(),
                    Type = info.ModuleType
                };
                Db.Module.Create(entity);
            }
            else
            {
                entity.Address = address.GetAddressBytes();
                entity.Type = info.ModuleType;
                Db.Module.Update(entity.ModuleId, entity);
            }
        }

        internal void UpdateState(ModuleEntity entity)
        {
            var model = GetByID(entity.ModuleId);

            switch (entity.Type)
            {
                case ModuleType.LedRibbonRgb: UpdateLedRibbonRgbState(model, entity.LedRibbonRgbState); break;
            }
        }

        private void UpdateLedRibbonRgbState(ModuleEntity model, LedRibbonRgbState state)
        {
            if (state.IsStandard)
            {
                var standard = Db.Standard.Get(state.StandardId);
                if (standard == null)
                    return; //TODO: throw error

                state.Value = standard.Value;

            }

            //send state.Value

            model.LedRibbonRgbState = state;
            Db.Module.Update(model.ModuleId, model);
        }

        public void UpdateForUID(ushort uid, ModuleEntity entity)
        {
            var model = Db.Module
                .Filter(new { UID = uid })
                .FirstOrDefault();

            if (model == null)
                throw new Exception();

            model.Alias = entity.Alias;

            Db.Module.Update(model.ModuleId, model);
        }
    }
}