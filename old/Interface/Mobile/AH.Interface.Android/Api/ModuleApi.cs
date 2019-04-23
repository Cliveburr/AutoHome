using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Android.App;
using Android.Content;
using Android.OS;
using Android.Runtime;
using Android.Views;
using Android.Widget;

namespace AH.Interface.Android.Api
{
    public class ModuleApi : BaseApi<ModuleApi>
    {
        protected override string GetApiName()
        {
            return "module";
        }

        public ByAreaViewModel[] GetByArea(string areaId)
        {
            return Get<ByAreaViewModel[]>("byarea/" + areaId);
        }

        public MobileEditorViewModel GetMobileEditor(string mobileId)
        {
            return Get<MobileEditorViewModel>("mobileeditor/" + mobileId);
        }

        public void PostMobileEditor(MobileEditorViewModel model)
        {
            Post<MobileEditorViewModel, MobileEditorViewModel>("mobileeditor", model);
        }
    }

    public class ByAreaViewModel
    {
        public string ModuleId { get; set; }
        public string Alias { get; set; }
        public ModuleType Type { get; set; }
    }

    public enum ModuleType : byte
    {
        Invalid = 0,
        LedRibbonRgb = 1,
        IncandescentLamp = 2
    }

    public class MobileEditorViewModel
    {
        public string ModuleId { get; set; }
        public string Alias { get; set; }
        public ModuleType Type { get; set; }
        public string Area { get; set; }
        public LedRibbonRgbState LedRibbonRgbState { get; set; }
        public StandardListViewModel[] StandardList { get; set; }
    }

    public class LedRibbonRgbState
    {
        public bool IsStandard { get; set; }
        public string StandardId { get; set; }
        public RgbLightValue Value { get; set; }
    }

    public class RgbLightValue
    {
        public byte Red { get; set; }
        public byte Green { get; set; }
        public byte Blue { get; set; }
    }

    public class StandardListViewModel
    {
        public string StandardId { get; set; }
        public string Name { get; set; }
        public RgbLightValue RgbLightValue { get; set; }
    }
}