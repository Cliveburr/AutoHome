using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Android.App;
using Android.Content;
using Android.OS;
using System.Net;
using Android.Views;
using Android.Widget;
using AH.Protocol.Library;
using AH.Protocol.Library.Messages;
using AH.Interface.Android.Model;

namespace AH.Interface.Android.Activities
{
    [Activity(Label = "Auto Home")]
    public class ModuleActivity : Activity
    {
        private Button Refresh;
        private ListView ListItems;
        private ModuleAdapter listItemsAdpter;

        protected override void OnCreate(Bundle savedInstanceState)
        {
            base.OnCreate(savedInstanceState);

            SetContentView(Resource.Layout.Module);

            App.AutoHome.OnUdpReceived += AutoHome_OnUdpReceived;

            Refresh = FindViewById<Button>(Resource.Id.refresh);
            Refresh.Click += Refresh_Click;

            ListItems = FindViewById<ListView>(Resource.Id.moduleListItems);
            ListItems.ItemClick += ListItems_ItemClick;

            listItemsAdpter = new ModuleAdapter(this, new List<ModuleModel>());
            ListItems.Adapter = listItemsAdpter;

            RefreshList();
        }

        private void AutoHome_OnUdpReceived(IPAddress address, Protocol.Library.Message message)
        {
            if (message.Type != MessageType.Pong)
                return;

            var content = message.ReadContent<PongReceiveMessage>();

            if (!content.IsValid)
                return;

            RunOnUiThread(() =>
            {
                listItemsAdpter.Add(new ModuleModel
                {
                    UID = message.UID,
                    Alias = content.Alias,
                    Address = address,
                    Type = content.ModuleType
                });
                listItemsAdpter.NotifyDataSetChanged();
            });
        }

        private void Refresh_Click(object sender, EventArgs e)
        {
            RefreshList();
        }

        private void ListItems_ItemClick(object sender, AdapterView.ItemClickEventArgs e)
        {
            var item = listItemsAdpter.GetItem(e.Position);

            switch (item.Type)
            {
                case ModuleType.LedRibbonRgb:
                    App.ShowRgbLightEditor(this, item);
                    break;
                default:
                    Toast.MakeText(this, "Unsuported Module Type", ToastLength.Short).Show();
                    break;
            }
        }

        private void RefreshList()
        {
            listItemsAdpter.Clear();

            App.AutoHome.SendUdp(IPAddress.Broadcast, new Protocol.Library.Message(0, new PingSendMessage()));
        }
    }

    class ModuleAdapter : ArrayAdapter<ModuleModel>
    {
        public ModuleAdapter(Context context, IList<ModuleModel> modules)
            : base(context, Resource.Layout.ModuleItems, modules)
        {
        }

        public override View GetView(int position, View convertView, ViewGroup parent)
        {
            var inflater = (LayoutInflater)Context.GetSystemService(Context.LayoutInflaterService);
            if (convertView == null)
            {
                convertView = inflater.Inflate(Resource.Layout.ModuleItems, parent, false);
            }

            var item = GetItem(position);
            var itemText = convertView.FindViewById<TextView>(Resource.Id.moduleItemText);

            itemText.Text = item.Alias;

            return convertView;
        }
    }
}