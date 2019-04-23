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
    [Activity(Label = "Auto Home - Module")]
    public class ModuleActivity : Activity
    {
        private ListView ListItems;
        private ModuleAdapter listItemsAdpter;
        private string AreaId;

        protected override void OnCreate(Bundle savedInstanceState)
        {
            base.OnCreate(savedInstanceState);

            AreaId = Intent.GetStringExtra("AreaId");
            SetContentView(Resource.Layout.Module);
            ListItems = FindViewById<ListView>(Resource.Id.moduleListItems);
            ListItems.ItemClick += ListItems_ItemClick;

            var modules = ModuleApi.Instance.GetByArea(AreaId);
            listItemsAdpter = new ModuleAdapter(this, modules);
            ListItems.Adapter = listItemsAdpter;
        }

        private void ListItems_ItemClick(object sender, AdapterView.ItemClickEventArgs e)
        {
            var item = listItemsAdpter.Modules[e.Position];
            App.ShowRgbLightEditor(this, item);
        }
    }

    class ModuleAdapter : ArrayAdapter
    {
        public ByAreaViewModel[] Modules { get; set; }

        public ModuleAdapter(Context context, ByAreaViewModel[] modules)
            : base(context, Resource.Layout.ModuleItems, modules)
        {
            Modules = modules;
        }

        public override View GetView(int position, View convertView, ViewGroup parent)
        {
            var inflater = (LayoutInflater)Context.GetSystemService(Context.LayoutInflaterService);
            if (convertView == null)
            {
                convertView = inflater.Inflate(Resource.Layout.ModuleItems, parent, false);
            }

            var item = Modules[position];
            var itemText = convertView.FindViewById<TextView>(Resource.Id.moduleItemText);

            itemText.Text = item.Alias;

            return convertView;
        }
    }
}