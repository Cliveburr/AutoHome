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
using AH.Interface.Android.Activities;
using AH.Interface.Android.Model;
using AH.Interface.Android.Activities.Editors;

namespace AH.Interface.Android
{
    public static class App
    {
        public static Protocol.Library.AutoHome AutoHome { get; set; }
        private static IDictionary<string, object> _intentArgs;

        public static T GetArg<T>(string name)
        {
            if (_intentArgs != null)
            {
                if (_intentArgs.ContainsKey(name))
                {
                    return (T)_intentArgs[name];
                }
            }
            return default(T);
        }

        public static void ShowModule(Activity activity)
        {
            var intent = new Intent(activity, typeof(ModuleActivity));
            activity.StartActivity(intent);
        }

        public static void ShowRgbLightEditor(Activity activity, ModuleModel module)
        {
            var intent = new Intent(activity, typeof(RbgLightEditorActivity));
            _intentArgs = new Dictionary<string, object>
            {
                { "module", module }
            };
            activity.StartActivity(intent);
        }
    }
}