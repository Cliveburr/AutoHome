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
using System.Net;
using AH.Interface.Android.Activities;
using AH.Interface.Android.Api;
using AH.Interface.Android.Activities.Editors;

namespace AH.Interface.Android
{
    public static class App
    {
        public static string ApiAddress { get; set; }
        public static DiscoveryCallbak DiscoveryCallbak { get; set; }

        public static bool IsConnected()
        {
            return !string.IsNullOrEmpty(ApiAddress);
        }

        public static void ShowArea(Activity activity)
        {
            var intent = new Intent(activity, typeof(AreaActivity));
            activity.StartActivity(intent);
        }

        public static void ShowDiscovery(Activity activity, DiscoveryCallbak callBack)
        {
            var intent = new Intent(activity, typeof(DiscoveryApiActivity));
            //intent.PutExtra("callBack", callBack);
            DiscoveryCallbak = callBack;
            activity.StartActivity(intent);
        }

        public static void ShowModule(Activity activity, IndexArea area)
        {
            var intent = new Intent(activity, typeof(ModuleActivity));
            intent.PutExtra("AreaId", area.AreaId);
            activity.StartActivity(intent);
        }

        public static void ShowRgbLightEditor(Activity activity, ByAreaViewModel module)
        {
            var intent = new Intent(activity, typeof(RbgLightEditorActivity));
            intent.PutExtra("ModuleId", module.ModuleId);
            activity.StartActivity(intent);
        }
    }
}