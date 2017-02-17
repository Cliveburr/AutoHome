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
using AH.Interface.Android.Api;

namespace AH.Interface.Android.Activities
{
    [Activity(Label = "Auto Home")]
    public class AreaActivity : Activity
    {
        protected override void OnCreate(Bundle savedInstanceState)
        {
            base.OnCreate(savedInstanceState);

            SetContentView(Resource.Layout.Area);

            var a = AreaApi.Instance.Get();
        }
    }
}