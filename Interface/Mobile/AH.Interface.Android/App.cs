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
    }
}