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
using AH.Control.Api.Protocol;

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
            return Db.Module.Get();
        }

        public ModuleEntity Get(string id)
        {
            return Db.Module
                .Get(id);
        }

        public ModuleEntity GetByUID(ushort uid)
        {
            return Db.Module
                .FilterFirst(new { UID = uid });
        }

        public IEnumerable<ModuleEntity> GetByArea(string areaId)
        {
            var area = Db.Area.Get(areaId);
            if (area == null)
                return null;

            if (area.ModuleContent == null)
                return null;

            return area.ModuleContent
                .Select(m => Db.Module.Get(m));
        }

        public string Delete(string moduleId)
        {
            var entity = Get(moduleId);
            if (entity == null)
                return string.Empty;

            AdjustAreaRelationShip(entity.ModuleId, entity.AreaBelong);

            return Db.Module.Delete(entity.ModuleId);
        }

        private void AdjustAreaRelationShip(string id, string parentId)
        {
            if (string.IsNullOrEmpty(parentId))
                return;

            var parent = Db.Area.Get(parentId);
            if (parent == null)
                return;

            if (!parent.ModuleContent.Contains(id))
                return;

            parent.ModuleContent.Remove(id);

            Db.Area.Update(parent.AreaId, parent);
        }

        public void UpdateAddressForUID(ushort uid, IPAddress address, InfoMessage info)
        {
            var entity = Db.Module
                .FilterFirst(new { UID = uid });

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

        public void UpdateLedRibbonRgbValue(string moduleId, RgbLightValue value)
        {
            var entity = Get(moduleId);
            if (entity == null)
                return;

            if (entity.LedRibbonRgbState == null)
            {
                entity.LedRibbonRgbState = new LedRibbonRgbState
                {
                    IsStandard = false,
                    StandardId = null,
                    Value = value
                };
            }
            else
            {
                entity.LedRibbonRgbState.Value = value;
            }

            Db.Module.Update(entity.ModuleId, entity);
        }

        public ModuleEntity UpdateLedRibbonRgbState(string moduleId, LedRibbonRgbState state)
        {
            var entity = Get(moduleId);
            if (entity == null)
                return null;

            if (state.IsStandard)
            {
                var standard = Db.Standard.Get(state.StandardId);
                if (standard == null)
                    throw new Exception();

                state.Value = standard.RgbLightValue;
            }

            entity.LedRibbonRgbState = state;
            Db.Module.Update(entity.ModuleId, entity);

            return entity;
        }

        public void Update(string moduleId, string alias)
        {
            var model = Db.Module.Get(moduleId);
            if (model == null)
                throw new Exception();

            model.Alias = alias;

            Db.Module.Update(model.ModuleId, model);
        }
    }
}