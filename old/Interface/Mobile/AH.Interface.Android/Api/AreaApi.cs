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
    public class AreaApi : BaseApi<AreaApi>
    {
        protected override string GetApiName()
        {
            return "area";
        }

        public IndexViewModel Get()
        {
            return Get<IndexViewModel>();
        }
    }

    public class IndexViewModel
    {
        public IndexArea[] List { get; set; }
    }

    public class IndexArea
    {
        public string AreaId { get; set; }
        public string Name { get; set; }
        public int ModuleCount { get; set; }
    }
}