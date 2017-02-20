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
    [Activity(Label = "Auto Home - Area")]
    public class AreaActivity : Activity
    {
        private ListView listItems;
        private AreaAdapter listItemsAdpter;

        protected override void OnCreate(Bundle savedInstanceState)
        {
            base.OnCreate(savedInstanceState);

            SetContentView(Resource.Layout.Area);

            listItems = FindViewById<ListView>(Resource.Id.areaListItems);
            listItems.ItemClick += ListItems_ItemClick;

            var areas = AreaApi.Instance.Get();
            listItemsAdpter = new AreaAdapter(this, areas.List);
            listItems.Adapter = listItemsAdpter;
        }

        private void ListItems_ItemClick(object sender, AdapterView.ItemClickEventArgs e)
        {
            var item = listItemsAdpter.Areas[e.Position];
            App.ShowModule(this, item);
        }
    }

    class AreaAdapter : ArrayAdapter
    {
        public IndexArea[] Areas { get; set; }

        public AreaAdapter(Context context, IndexArea[] areas)
            : base(context, Resource.Layout.AreaItems, areas)
        {
            Areas = areas;
        }

        public override View GetView(int position, View convertView, ViewGroup parent)
        {
            var inflater = (LayoutInflater)Context.GetSystemService(Context.LayoutInflaterService);
            if (convertView == null)
            {
                convertView = inflater.Inflate(Resource.Layout.AreaItems, parent, false);
            }

            var item = Areas[position];
            var itemText = convertView.FindViewById<TextView>(Resource.Id.areaItemText);

            itemText.Text = item.Name;

            return convertView;
        }
    }
}