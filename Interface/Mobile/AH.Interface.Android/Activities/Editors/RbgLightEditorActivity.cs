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
using Android.Graphics;

namespace AH.Interface.Android.Activities.Editors
{
    [Activity(Label = "Auto Home - Editor")]
    public class RbgLightEditorActivity : Activity
    {
        private string ModuleId;
        private MobileEditorViewModel Model;
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

        protected override void OnCreate(Bundle savedInstanceState)
        {
            base.OnCreate(savedInstanceState);

            ModuleId = Intent.GetStringExtra("ModuleId");
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

            Model = ModuleApi.Instance.GetMobileEditor(ModuleId);

            tabHost.Setup();
            rgbeHeader.Text = $"{Model.Area} - {Model.Alias}";

            tabManual = tabHost.NewTabSpec("manual");
            tabManual.SetContent(Resource.Id.rgbeManualLayout);
            tabManual.SetIndicator("Manual");

            tabStandard = tabHost.NewTabSpec("standard");
            tabStandard.SetContent(Resource.Id.rgbeStandardLayout);
            tabStandard.SetIndicator("Standard");

            tabHost.AddTab(tabManual);
            tabHost.AddTab(tabStandard);
            tabHost.TabChanged += TabHost_TabChanged;

            rgbeSeekR.Max = 255;

            //rgbeSeekR.SetProgress(Model.LedRibbonRgbState.Value.Red, true);
            rgbeSeekR.Progress = Model.LedRibbonRgbState.Value.Red;
            rgbeSeekR.SetBackgroundColor(new Color(rgbeSeekR.Progress, 0, 0));
            rgbeSeekR.ProgressChanged += RgbeSeek_ProgressChanged;
            rgbeSeekG.Max = 255;
            //rgbeSeekG.SetProgress(Model.LedRibbonRgbState.Value.Green, true);
            rgbeSeekG.Progress = Model.LedRibbonRgbState.Value.Green;
            rgbeSeekG.SetBackgroundColor(new Color(0, rgbeSeekG.Progress, 0));
            rgbeSeekG.ProgressChanged += RgbeSeek_ProgressChanged;
            rgbeSeekB.Max = 255;
            //rgbeSeekB.SetProgress(Model.LedRibbonRgbState.Value.Blue, true);
            rgbeSeekB.Progress = Model.LedRibbonRgbState.Value.Blue;
            rgbeSeekB.SetBackgroundColor(new Color(0, 0, rgbeSeekB.Progress));

            rgbeSeekR.ProgressChanged += RgbeSeek_ProgressChanged;
            rgbeSeekG.Max = 255;
            rgbeSeekG.ProgressChanged += RgbeSeek_ProgressChanged;
            rgbeSeekB.Max = 255;

            rgbeSeekB.ProgressChanged += RgbeSeek_ProgressChanged;

            RefreshValue();

            tabHost.SetCurrentTabByTag(Model.LedRibbonRgbState.IsStandard ?
                "standard" : "manual");

            rgbLightAdapter = new RgbLightStandardAdapter(this, Model.StandardList);
            rgbeStandardList.Adapter = rgbLightAdapter;
        }

        private void RefreshValue()
        {
            //rgbeSeekR.SetProgress(Model.LedRibbonRgbState.Value.Red, true);
            rgbeSeekR.Progress = Model.LedRibbonRgbState.Value.Red;
            rgbeSeekR.SetBackgroundColor(new Color(rgbeSeekR.Progress, 0, 0));
            //rgbeSeekG.SetProgress(Model.LedRibbonRgbState.Value.Green, true);
            rgbeSeekG.Progress = Model.LedRibbonRgbState.Value.Green;
            rgbeSeekG.SetBackgroundColor(new Color(0, rgbeSeekG.Progress, 0));
            //rgbeSeekB.SetProgress(Model.LedRibbonRgbState.Value.Blue, true);
            rgbeSeekB.Progress = Model.LedRibbonRgbState.Value.Blue;
            rgbeSeekB.SetBackgroundColor(new Color(0, 0, rgbeSeekB.Progress));
            rgbePanel.SetBackgroundColor(new Color(rgbeSeekR.Progress, rgbeSeekG.Progress, rgbeSeekB.Progress));
        }

        private void RgbeStandardList_ItemClick(object sender, AdapterView.ItemClickEventArgs e)
        {
            var item = rgbLightAdapter.Standard[e.Position];
            Model.LedRibbonRgbState.StandardId = item.StandardId;
            Model.LedRibbonRgbState.Value = item.RgbLightValue;
            ModuleApi.Instance.PostMobileEditor(Model);
            RefreshValue();
        }

        private void TabHost_TabChanged(object sender, TabHost.TabChangeEventArgs e)
        {
            Model.LedRibbonRgbState.IsStandard = tabHost.CurrentTabTag == "standard";
        }

        private void RgbeSeek_ProgressChanged(object sender, SeekBar.ProgressChangedEventArgs e)
        {
            Model.LedRibbonRgbState.Value.Red = (byte)rgbeSeekR.Progress;
            Model.LedRibbonRgbState.Value.Green = (byte)rgbeSeekG.Progress;
            Model.LedRibbonRgbState.Value.Blue = (byte)rgbeSeekB.Progress;
            rgbeSeekR.SetBackgroundColor(new Color(rgbeSeekR.Progress, 0, 0));
            rgbeSeekG.SetBackgroundColor(new Color(0, rgbeSeekG.Progress, 0));
            rgbeSeekB.SetBackgroundColor(new Color(0, 0, rgbeSeekB.Progress));
            rgbePanel.SetBackgroundColor(new Color(rgbeSeekR.Progress, rgbeSeekG.Progress, rgbeSeekB.Progress));
        }

        private void RgbeApply_Click(object sender, EventArgs e)
        {
            ModuleApi.Instance.PostMobileEditor(Model);
        }
    }

    class RgbLightStandardAdapter : ArrayAdapter
    {
        public StandardListViewModel[] Standard { get; set; }

        public RgbLightStandardAdapter(Context context, StandardListViewModel[] standard)
            : base(context, Resource.Layout.AreaItems, standard)
        {
            Standard = standard;
        }

        public override View GetView(int position, View convertView, ViewGroup parent)
        {
            var inflater = (LayoutInflater)Context.GetSystemService(Context.LayoutInflaterService);
            if (convertView == null)
            {
                convertView = inflater.Inflate(Resource.Layout.AreaItems, parent, false);
            }

            var item = Standard[position];
            var itemText = convertView.FindViewById<TextView>(Resource.Id.areaItemText);

            itemText.Text = item.Name;

            return convertView;
        }
    }
}