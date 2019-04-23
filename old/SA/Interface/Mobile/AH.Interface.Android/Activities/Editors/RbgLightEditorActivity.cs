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
using AH.Interface.Android.Model;
using AH.Protocol.Library.Messages;
using Android.Graphics;

namespace AH.Interface.Android.Activities.Editors
{
    [Activity(Label = "Auto Home - Editor")]
    public class RbgLightEditorActivity : Activity
    {
        private ModuleModel module;
        private Helpers.ColorTransform state;

        private TextView rgbeHeader;
        private Button rgbeApply;
        private SeekBar rgbeSeekR;
        private SeekBar rgbeSeekG;
        private SeekBar rgbeSeekB;
        private TextView rgbePanel;
        private ListView rgbeStandardList;
        private TabHost.TabSpec tabManual;
        private TabHost.TabSpec tabStandard;
        private TabHost tabHost;
        private RgbLightStandardAdapter rgbLightAdapter;

        private RgbLightStandardList[] standardList = new RgbLightStandardList[]
        {
            new RgbLightStandardList { Name = "On", RgbLightValue = new RgbLightValue { Red = 255, Green = 255, Blue = 255 } },
            new RgbLightStandardList { Name = "Off", RgbLightValue = new RgbLightValue { Red = 0, Green = 0, Blue = 0 } }
        };

        protected override void OnCreate(Bundle savedInstanceState)
        {
            base.OnCreate(savedInstanceState);

            module = App.GetArg<ModuleModel>("module");

            SetContentView(Resource.Layout.RgbLightEditor);

            rgbeApply = FindViewById<Button>(Resource.Id.rgbeApply);
            rgbeApply.Click += RgbeApply_Click;
            rgbeSeekR = FindViewById<SeekBar>(Resource.Id.rgbeSeekR);
            rgbeSeekG = FindViewById<SeekBar>(Resource.Id.rgbeSeekG);
            rgbeSeekB = FindViewById<SeekBar>(Resource.Id.rgbeSeekB);
            rgbeHeader = FindViewById<TextView>(Resource.Id.rgbeHeader);
            rgbePanel = FindViewById<TextView>(Resource.Id.rgbePanel);
            rgbeStandardList = FindViewById<ListView>(Resource.Id.rgbeStandardList);
            rgbeStandardList.ItemClick += RgbeStandardList_ItemClick;
            tabHost = FindViewById<TabHost>(Resource.Id.tabHost1);

            using (var tcp = App.AutoHome.Connect(module.Address))
            {
                var receive = tcp.SendAndReceive(new Protocol.Library.Message(module.UID, new RGBLedRibbonReadStateRequest()));

                var content = receive.ReadContent<RGBLedRibbonReadStateResponse>();

                state = Helpers.ColorTransform.FromValues(
                    content.RedHigh,
                    content.RedLow,
                    content.GreenHigh,
                    content.GreenLow,
                    content.BlueHigh,
                    content.BlueLow);
            }

            tabHost.Setup();
            rgbeHeader.Text = $"{module.Alias}";

            tabManual = tabHost.NewTabSpec("manual");
            tabManual.SetContent(Resource.Id.rgbeManualLayout);
            tabManual.SetIndicator("Manual");

            tabStandard = tabHost.NewTabSpec("standard");
            tabStandard.SetContent(Resource.Id.rgbeStandardLayout);
            tabStandard.SetIndicator("Standard");

            tabHost.AddTab(tabManual);
            tabHost.AddTab(tabStandard);

            rgbeSeekR.Max = 255;
            rgbeSeekR.ProgressChanged += RgbeSeek_ProgressChanged;
            rgbeSeekG.Max = 255;
            rgbeSeekG.ProgressChanged += RgbeSeek_ProgressChanged;
            rgbeSeekB.Max = 255;
            rgbeSeekB.ProgressChanged += RgbeSeek_ProgressChanged;

            RefreshValue();

            tabHost.SetCurrentTabByTag("manual");

            rgbLightAdapter = new RgbLightStandardAdapter(this, standardList);
            rgbeStandardList.Adapter = rgbLightAdapter;
        }

        private void RefreshValue()
        {
            rgbeSeekR.Progress = state.Color.R;
            rgbeSeekR.SetBackgroundColor(new Color(rgbeSeekR.Progress, 0, 0));
            rgbeSeekG.Progress = state.Color.G;
            rgbeSeekG.SetBackgroundColor(new Color(0, rgbeSeekG.Progress, 0));
            rgbeSeekB.Progress = state.Color.B;
            rgbeSeekB.SetBackgroundColor(new Color(0, 0, rgbeSeekB.Progress));

            rgbePanel.SetBackgroundColor(new Color(rgbeSeekR.Progress, rgbeSeekG.Progress, rgbeSeekB.Progress));
        }

        private void RgbeStandardList_ItemClick(object sender, AdapterView.ItemClickEventArgs e)
        {
            var item = rgbLightAdapter.Standard[e.Position];

            state = Helpers.ColorTransform.FromColor(new Color(item.RgbLightValue.Red, item.RgbLightValue.Green, item.RgbLightValue.Blue), 10000, 10000, 10000);

            SendState();

            RefreshValue();
        }

        private void RgbeSeek_ProgressChanged(object sender, SeekBar.ProgressChangedEventArgs e)
        {
            rgbeSeekR.SetBackgroundColor(new Color(rgbeSeekR.Progress, 0, 0));
            rgbeSeekG.SetBackgroundColor(new Color(0, rgbeSeekG.Progress, 0));
            rgbeSeekB.SetBackgroundColor(new Color(0, 0, rgbeSeekB.Progress));
            rgbePanel.SetBackgroundColor(new Color(rgbeSeekR.Progress, rgbeSeekG.Progress, rgbeSeekB.Progress));
        }

        private void RgbeApply_Click(object sender, EventArgs e)
        {
            state = Helpers.ColorTransform.FromColor(new Color(rgbeSeekR.Progress, rgbeSeekG.Progress, rgbeSeekB.Progress), 10000, 10000, 10000);

            SendState();
        }

        private void SendState()
        {
            using (var tcp = App.AutoHome.Connect(module.Address))
            {
                tcp.Send(new Protocol.Library.Message(module.UID, new RGBLedRibbonChangeRequest
                {
                    RedHigh = state.RedHigh,
                    RedLow = state.RedLow,
                    GreenHigh = state.GreenHigh,
                    GreenLow = state.GreenLow,
                    BlueHigh = state.BlueHigh,
                    BlueLow = state.BlueLow
                }));
            }
        }
    }

    class RgbLightStandardAdapter : ArrayAdapter
    {
        public RgbLightStandardList[] Standard { get; set; }

        public RgbLightStandardAdapter(Context context, RgbLightStandardList[] standard)
            : base(context, Resource.Layout.RgbLightEditorStandartItem, standard)
        {
            Standard = standard;
        }

        public override View GetView(int position, View convertView, ViewGroup parent)
        {
            var inflater = (LayoutInflater)Context.GetSystemService(Context.LayoutInflaterService);
            if (convertView == null)
            {
                convertView = inflater.Inflate(Resource.Layout.RgbLightEditorStandartItem, parent, false);
            }

            var item = Standard[position];
            var itemText = convertView.FindViewById<TextView>(Resource.Id.rgbStandardItemText);

            itemText.Text = item.Name;

            return convertView;
        }
    }
}